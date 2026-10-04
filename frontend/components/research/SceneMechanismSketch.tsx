import React from "react";

const labels: Record<string, string> = {
  renewable: "风光出力波动与储能平滑示意",
  grid: "储能将低负荷时段电能转移到高峰时段",
  industrial: "园区储能削减用电尖峰示意",
  community: "社区白天储存光伏电能并在夜间使用",
  charging: "储能缓解车辆集中充电的短时功率尖峰",
  hospital: "市电中断后 UPS 电池承接，发电机稳定接替",
  thermal: "储能快速响应 AGC，火电机组随后跟进",
  hydro: "抽水时水流向上，发电时水流向下",
};

export default function SceneMechanismSketch({ sceneId, className }: { sceneId: string; className?: string }) {
  const blue = "#2580a4";
  const gold = "#c99234";
  const ink = "#31566a";
  return <svg className={className} data-mechanism={sceneId} role="img" aria-label={labels[sceneId]} viewBox="0 0 280 96">
    <rect x=".5" y=".5" width="279" height="95" rx="9" fill="#f5f9f8" stroke="#d8e6e7" />
    {sceneId === "renewable" && <>
      <text x="12" y="20" fill={ink}>出力变化</text><path d="M14 65H266" stroke="#b9ced2" />
      <path d="M14 55 38 29 61 65 83 33 107 63 132 26 156 62 178 38 202 61 229 31 263 53" fill="none" stroke={blue} strokeWidth="2.6" />
      <path d="M14 51 Q76 43 132 49 T263 48" fill="none" stroke={gold} strokeWidth="3" />
      <text x="15" y="84" fill={blue}>风光原始出力</text><text x="159" y="84" fill={gold}>储能协同后</text>
    </>}
    {sceneId === "grid" && <>
      <text x="12" y="20" fill={ink}>负荷移时</text><path d="M18 71h246" stroke="#b9ced2" />
      <path d="M32 47h48v24H32ZM117 39h48v32h-48ZM202 22h48v49h-48Z" fill="#b6d5dc" />
      <path d="M52 39h10m-5-5v10M222 31h10" stroke={gold} strokeWidth="3" />
      <path d="M87 46h25m-8-6 8 6-8 6M172 46h25m-8-6 8 6-8 6" fill="none" stroke={gold} strokeWidth="2" />
      <text x="34" y="88" fill={ink}>低负荷充电</text><text x="188" y="88" fill={ink}>高峰放电</text>
    </>}
    {sceneId === "industrial" && <>
      <text x="12" y="20" fill={ink}>园区取电功率</text><path d="M14 72h252" stroke="#b9ced2" />
      <path d="M16 62h45l12-21h48l13 20h53l11-42h28l14 43h23" fill="none" stroke="#92aab5" strokeWidth="3" />
      <path d="M16 62h45l12-21h48l13 20h53l11-21h28l14 22h23" fill="none" stroke={blue} strokeWidth="3" />
      <path d="M212 25v20" stroke={gold} strokeWidth="2.5" /><path d="m206 38 6 7 6-7" fill="none" stroke={gold} strokeWidth="2" />
      <text x="20" y="88" fill={ink}>低谷 / 光伏充电</text><text x="178" y="88" fill={gold}>高峰削减</text>
    </>}
    {sceneId === "community" && <>
      <circle cx="43" cy="38" r="13" fill="#f2c260" /><path d="M43 14v8M43 54v8M18 38h8M60 38h8" stroke={gold} strokeWidth="2" />
      <path d="M92 36h73l-6 34H98Z" fill="#b3d9df" stroke={blue} strokeWidth="2" /><path d="M111 43h35M110 52h34" stroke="#5a9eb0" strokeWidth="2" />
      <path d="M228 26a15 15 0 1 0 17 22 16 16 0 1 1-17-22Z" fill="#6b8da5" />
      <path d="M70 43h20m-7-6 7 6-7 6M168 43h26m-8-6 8 6-8 6" fill="none" stroke={gold} strokeWidth="2.5" />
      <path d="m207 64 23-17 23 17v14h-46Z" fill="#d5e7e8" stroke="#628899" strokeWidth="2" />
      <text x="14" y="87" fill={ink}>白天存光伏</text><text x="186" y="87" fill={ink}>夜间用电</text>
    </>}
    {sceneId === "charging" && <>
      <text x="12" y="20" fill={ink}>多车集中到站</text><path d="M15 72h250" stroke="#b9ced2" />
      <path d="M16 62h70l11-7h38l11-33h28l12 40h78" fill="none" stroke="#9aadb4" strokeWidth="3" />
      <path d="M16 62h70l11-7h38l11-10h28l12 17h78" fill="none" stroke={blue} strokeWidth="3" />
      <path d="M157 27v21m-6-7 6 7 6-7" stroke={gold} strokeWidth="2" fill="none" />
      <text x="20" y="88" fill={ink}>原配电压力</text><text x="166" y="88" fill={gold}>储能分担后</text>
    </>}
    {sceneId === "hospital" && <>
      <rect x="10" y="25" width="76" height="43" rx="7" fill="#dfebec" stroke="#8aabb3" />
      <rect x="102" y="25" width="76" height="43" rx="7" fill="#e2f1ee" stroke={blue} />
      <rect x="194" y="25" width="76" height="43" rx="7" fill="#f8eedb" stroke={gold} />
      <path d="M87 46h13m-6-5 6 5-6 5M179 46h13m-6-5 6 5-6 5" fill="none" stroke={gold} strokeWidth="2.4" />
      <path d="M41 32v10M36 37h10" stroke="#c86b65" strokeWidth="2.4" /><g transform="translate(0 -8)"><path d="M130 33h19v19h-19z" fill="none" stroke={blue} strokeWidth="2" /><path d="M136 30v3m7-3v3m-7 19v3m7-3v3" stroke={blue} strokeWidth="2" /></g>
      <g transform="translate(0 -5)"><circle cx="232" cy="40" r="9" fill="none" stroke={gold} strokeWidth="2" /><path d="M232 33v14M225 40h14" stroke={gold} strokeWidth="1.5" /></g>
      <text x="19" y="60" fill={ink}>市电中断</text><text x="106" y="60" fill={ink}>UPS 承接</text><text x="199" y="60" fill={ink}>发电机接替</text>
      <text x="14" y="87" fill={ink}>先保持关键负荷，再完成稳定供电接力</text>
    </>}
    {sceneId === "thermal" && <>
      <text x="12" y="20" fill={ink}>AGC 功率指令</text><path d="M14 70h251" stroke="#b9ced2" />
      <path d="M16 63h64V30h65v31h53V39h64" fill="none" stroke="#c47b6b" strokeWidth="2.5" />
      <path d="M16 63h64V33h65v28h53V41h64" fill="none" stroke={blue} strokeWidth="2.8" />
      <path d="M16 63h64q20 0 35-11t30-16q26 0 42 12t47 0q14-8 28-9" fill="none" stroke={gold} strokeWidth="2.8" />
      <text x="18" y="87" fill={blue}>储能快速跟随</text><text x="159" y="87" fill={gold}>机组逐步跟进</text>
    </>}
    {sceneId === "hydro" && <>
      <path d="M16 29h93v9H16ZM171 60h93v10h-93Z" fill="#7eb8cb" stroke={blue} strokeWidth="2" />
      <path d="M14 28q12-6 25 0t25 0t25 0M169 59q12-6 25 0t25 0t25 0" fill="none" stroke="#c7eced" strokeWidth="2" />
      <path d="M139 63V28m-7 9 7-9 7 9M154 29v35m-7-9 7 9 7-9" fill="none" stroke={gold} strokeWidth="2.7" />
      <text x="21" y="21" fill={ink}>上水库：势能</text><text x="116" y="20" fill={gold}>抽水</text><text x="154" y="20" fill={gold}>发电</text><text x="204" y="88" fill={ink}>下水库</text>
    </>}
  </svg>;
}
