$ErrorActionPreference = "Stop"
$Port = 3000

# 1. Start the server in background
$serverJob = Start-Job -ScriptBlock {
  Set-Location -LiteralPath "$using:PWD"
  npx serve --listen $using:Port
}
Write-Host "✅ Servidor iniciado en http://localhost:$Port"

# 2. Install cloudflared if missing
if (!(Get-Command cloudflared -ErrorAction SilentlyContinue)) {
  Write-Host "📥 Descargando cloudflared..."
  $url = "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe"
  $out = "$env:TEMP\cloudflared.exe"
  Invoke-WebRequest -Uri $url -OutFile $out
  Move-Item -Path $out -Destination "$env:USERPROFILE\cloudflared.exe" -Force
  $env:Path += ";$env:USERPROFILE"
  Write-Host "✅ cloudflared instalado"
}

# 3. Create tunnel
Write-Host "🌐 Creando túnel Cloudflare..."
Write-Host "   Escanea el QR o abre la URL en tu teléfono"
Write-Host "   Presiona Ctrl+C para detener"
cloudflared tunnel --url "http://localhost:$Port"
