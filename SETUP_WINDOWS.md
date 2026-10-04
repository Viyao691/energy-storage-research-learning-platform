# Windows setup

Install and start Docker Desktop, clone the public repository, and follow the current [installation guide](docs/github/SETUP.md#windows).

```powershell
git clone https://github.com/Viyao691/energy-storage-research-learning-platform.git
cd energy-storage-research-learning-platform
Copy-Item .env.example .env
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\start.ps1 -Rebuild
```

Open the URL printed by `start.ps1`. The first build downloads sizable CPU document-processing dependencies; model weights are not included. Details for optional npm mirrors, local development, models, data volumes, backup, and shutdown are in [docs/github/SETUP.md](docs/github/SETUP.md).
