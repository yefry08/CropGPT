# Build ChannelForge for Windows. Run in PowerShell from the channelforge\ folder:
#   powershell -ExecutionPolicy Bypass -File packaging\build_windows.ps1
$ErrorActionPreference = "Stop"
py -3.11 -m venv .venv-build
.\.venv-build\Scripts\python -m pip install --upgrade pip
.\.venv-build\Scripts\python -m pip install ".[packaging]"
.\.venv-build\Scripts\pyinstaller --noconfirm --clean packaging\channelforge.spec
.\dist\ChannelForge\channelforge-cli.exe --help
Write-Host "Built dist\ChannelForge\ChannelForge.exe (GUI) and channelforge-cli.exe (CLI)."
Write-Host "Next: dist\ChannelForge\channelforge-cli.exe doctor"
