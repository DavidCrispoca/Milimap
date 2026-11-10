# Milimap — Cloudflare quick tunnel (Phase 9 / demo).
#
# Exposes the local dev server through a temporary https://<random>.trycloudflare.com
# URL so you can show the app to someone without deploying. Quick tunnels are
# ephemeral: every run gives a new random URL and needs no Cloudflare account or
# login. This is exactly the "temporary demo link" the plan calls for.
#
# Usage:
#   powershell -File tools/tunnel.ps1            # dev server on :5173 (default)
#   powershell -File tools/tunnel.ps1 -Port 4173 # a custom port (e.g. `npm run preview`)
#
# The dev server is started for you if the port is not answering yet. Stop it
# later with `npm run dev`'s terminal or by closing that window.

param(
  [int]$Port = 5173
)

$ErrorActionPreference = 'Stop'

# --- 1. Ensure cloudflared exists (downloaded once, cached in ~/.local/bin). ---
$binDir = Join-Path $HOME '.local\bin'
$cloudflared = Join-Path $binDir 'cloudflared.exe'

if (-not (Test-Path $cloudflared)) {
  Write-Host "Descargando cloudflared (una sola vez)…" -ForegroundColor Cyan
  New-Item -ItemType Directory -Force -Path $binDir | Out-Null
  $progressPreference = 'SilentlyContinue'
  Invoke-WebRequest `
    -Uri 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe' `
    -OutFile $cloudflared -UseBasicParsing
}
else {
  Write-Host "cloudflared listo: $(& $cloudflared --version)" -ForegroundColor DarkGray
}

# --- 2. Make sure something answers on the port; start the dev server if not. ---
$target = "http://localhost:$Port"
$listening = $false
try {
  $null = Invoke-WebRequest -Uri $target -UseBasicParsing -TimeoutSec 2
  $listening = $true
}
catch {
  $listening = $false
}

if (-not $listening) {
  Write-Host "El puerto $Port no responde. Arrancando el servidor de desarrollo…" -ForegroundColor Yellow
  Start-Process -FilePath 'npm' -ArgumentList 'run','dev' -WorkingDirectory (Split-Path $PSScriptRoot) -WindowStyle Minimized
  # Wait up to 30s for the server to come up.
  $deadline = (Get-Date).AddSeconds(30)
  while ((Get-Date) -lt $deadline) {
    Start-Sleep -Seconds 1
    try {
      $null = Invoke-WebRequest -Uri $target -UseBasicParsing -TimeoutSec 1
      break
    }
    catch { }
  }
}

# --- 3. Open the quick tunnel. Ctrl+C to stop. ---
Write-Host ""
Write-Host "Abriendo túnel temporal hacia $target …" -ForegroundColor Cyan
Write-Host "Copiá la URL https://…trycloudflare.com que aparece abajo." -ForegroundColor Green
Write-Host "Para cortar: Ctrl+C." -ForegroundColor DarkGray
Write-Host ""

& $cloudflared tunnel --url $target --no-autoupdate
