param(
  [Parameter(Mandatory)][string]$AssetPath,
  [Parameter(Mandatory)][string]$NotesPath,
  [string]$Tag = 'v0.1.0-windows-portable',
  [Parameter(Mandatory)][string]$TargetCommit,
  [string]$Owner = 'Viyao691',
  [string]$Repo = 'energy-storage-research-learning-platform'
)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Net.Http
$assetFile = Get-Item -LiteralPath $AssetPath
$notes = [IO.File]::ReadAllText((Resolve-Path -LiteralPath $NotesPath), [Text.Encoding]::UTF8)
$handler = [Net.Http.HttpClientHandler]::new()
$handler.UseProxy = $true
$handler.Proxy = [Net.WebRequest]::GetSystemWebProxy()
$client = [Net.Http.HttpClient]::new($handler)
$client.Timeout = [Threading.Timeout]::InfiniteTimeSpan
$client.DefaultRequestHeaders.UserAgent.ParseAdd('Energy-Research-Copilot-Release')
$client.DefaultRequestHeaders.Accept.ParseAdd('application/vnd.github+json')
$client.DefaultRequestHeaders.Add('X-GitHub-Api-Version', '2022-11-28')
$uploadStream = $null
$basic = $null
$credentialText = $null
function Invoke-Api([string]$Method, [string]$Uri, $Body = $null) {
  $request = [Net.Http.HttpRequestMessage]::new([Net.Http.HttpMethod]::new($Method), $Uri)
  $request.Headers.Authorization = [Net.Http.Headers.AuthenticationHeaderValue]::new('Basic', $basic)
  if ($null -ne $Body) { $json = ConvertTo-Json -InputObject $Body -Depth 10 -Compress; $request.Content = [Net.Http.StringContent]::new($json, [Text.Encoding]::UTF8, 'application/json') }
  try { $response = $client.SendAsync($request).GetAwaiter().GetResult(); $text = $response.Content.ReadAsStringAsync().GetAwaiter().GetResult(); return @{ Status = [int]$response.StatusCode; Text = $text } }
  finally { if ($response) { $response.Dispose() }; $request.Dispose() }
}
try {
  $start = [Diagnostics.ProcessStartInfo]::new('git', 'credential fill')
  $start.UseShellExecute = $false; $start.RedirectStandardInput = $true; $start.RedirectStandardOutput = $true; $start.RedirectStandardError = $true; $start.CreateNoWindow = $true
  $git = [Diagnostics.Process]::Start($start); $git.StandardInput.Write("protocol=https`nhost=github.com`nusername=$Owner`n`n"); $git.StandardInput.Close(); $credentialText = $git.StandardOutput.ReadToEnd(); $git.WaitForExit()
  $fields = @{}; foreach ($line in ($credentialText -split "`r?`n")) { if ($line -match '^([^=]+)=(.*)$') { $fields[$Matches[1]] = $Matches[2] } }
  if (-not $fields.password) { throw 'Git Credential Manager did not return a GitHub credential.' }
  $basic = [Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes("$($fields.username):$($fields.password)"))
  $base = "https://api.github.com/repos/$Owner/$Repo"
  $identity = Invoke-Api GET 'https://api.github.com/user'
  if ($identity.Status -ne 200 -or (ConvertFrom-Json $identity.Text).login -ne $Owner) { throw 'The authenticated GitHub account does not match Owner.' }
  $lookup = Invoke-Api GET "$base/releases/tags/$([Uri]::EscapeDataString($Tag))"
  if ($lookup.Status -eq 404) {
    $created = Invoke-Api POST "$base/releases" @{ tag_name = $Tag; target_commitish = $TargetCommit; name = 'Windows x64便携版'; body = $notes; draft = $true }
    if ($created.Status -ne 201) { throw "Draft release creation failed (HTTP $($created.Status))." }; $release = ConvertFrom-Json $created.Text
  } elseif ($lookup.Status -eq 200) { $release = ConvertFrom-Json $lookup.Text; if (-not $release.draft) { throw 'A published release already uses this tag; it will not be overwritten.' } }
  else { throw "Release lookup failed (HTTP $($lookup.Status))." }
  $assetReply = Invoke-Api GET "$base/releases/$($release.id)/assets?per_page=100"
  if ($assetReply.Status -ne 200) { throw "Release asset lookup failed (HTTP $($assetReply.Status))." }
  $asset = @((ConvertFrom-Json $assetReply.Text) | Where-Object name -eq $assetFile.Name) | Select-Object -First 1
  if ($asset -and $asset.state -eq 'uploaded' -and $asset.size -eq $assetFile.Length) { }
  elseif ($asset -and $asset.state -eq 'uploaded') { throw 'A same-name uploaded asset has a different size; it was preserved.' }
  else {
    if ($asset) { $deleted = Invoke-Api DELETE "$base/releases/assets/$($asset.id)"; if ($deleted.Status -ne 204) { throw 'Could not remove the incomplete same-name asset.' } }
    $uploadUrl = $release.upload_url -replace '\{.*$', ''
    $uri = "$uploadUrl`?name=$([Uri]::EscapeDataString($assetFile.Name))"
    $uploadRequest = [Net.Http.HttpRequestMessage]::new([Net.Http.HttpMethod]::Post, $uri)
    $uploadRequest.Headers.Authorization = [Net.Http.Headers.AuthenticationHeaderValue]::new('Basic', $basic)
    $uploadStream = [IO.File]::OpenRead($assetFile.FullName); $content = [Net.Http.StreamContent]::new($uploadStream); $content.Headers.ContentType = [Net.Http.Headers.MediaTypeHeaderValue]::new('application/zip'); $content.Headers.ContentLength = $assetFile.Length; $uploadRequest.Content = $content
    try {
      $send = $client.SendAsync($uploadRequest, [Net.Http.HttpCompletionOption]::ResponseHeadersRead)
      while (-not $send.IsCompleted) { $null = [Threading.Tasks.Task]::WhenAny($send, [Threading.Tasks.Task]::Delay([TimeSpan]::FromSeconds(20))).GetAwaiter().GetResult(); if (-not $send.IsCompleted) { [Console]::Out.WriteLine(('Asset upload {0:N1}/{1:N1} MiB' -f ($uploadStream.Position / 1MB), ($assetFile.Length / 1MB))) } }
      $uploaded = $send.GetAwaiter().GetResult(); if (-not $uploaded.IsSuccessStatusCode) { throw "Asset upload failed (HTTP $([int]$uploaded.StatusCode))." }
      $asset = ConvertFrom-Json $uploaded.Content.ReadAsStringAsync().GetAwaiter().GetResult()
    } finally { if ($uploaded) { $uploaded.Dispose() }; $uploadRequest.Dispose(); $uploadStream.Dispose(); $uploadStream = $null }
    $assetReply = Invoke-Api GET "$base/releases/$($release.id)/assets?per_page=100"
    if ($assetReply.Status -ne 200) { throw 'Could not verify the uploaded asset.' }
    $asset = @((ConvertFrom-Json $assetReply.Text) | Where-Object name -eq $assetFile.Name) | Select-Object -First 1
    if (-not $asset -or $asset.state -ne 'uploaded' -or $asset.size -ne $assetFile.Length) { throw 'GitHub did not confirm the complete uploaded asset.' }
  }
  if (-not $release.draft) { throw 'The release is no longer a draft; publication stopped.' }
  $published = Invoke-Api PATCH "$base/releases/$($release.id)" @{ draft = $false; make_latest = 'true' }
  if ($published.Status -ne 200) { throw "Release publication failed (HTTP $($published.Status))." }
  $result = ConvertFrom-Json $published.Text
  $publishedAsset = @($result.assets | Where-Object name -eq $assetFile.Name) | Select-Object -First 1
  if (-not $publishedAsset) { throw 'The published release response did not include the uploaded asset.' }
  [Console]::Out.WriteLine("releaseURL=$($result.html_url) assetdownloadURL=$($publishedAsset.browser_download_url) id=$($result.id) size=$($publishedAsset.size)")
} finally {
  if ($uploadStream) { $uploadStream.Dispose() }; if ($git) { $git.Dispose() }; $client.Dispose(); $handler.Dispose(); $basic = $null; $credentialText = $null; $fields = $null; $start = $null; $git = $null
}
