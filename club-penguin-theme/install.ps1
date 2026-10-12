# Instalador del tema Club Penguin para Windows.
# Uso: clic derecho -> "Ejecutar con PowerShell"
#   o: powershell -ExecutionPolicy Bypass -File .\install.ps1

$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host ""
Write-Host "  🐧 Instalador Club Penguin Isla" -ForegroundColor Cyan
Write-Host "  ================================" -ForegroundColor Cyan
Write-Host ""

# ---------- 1. Visual Studio Code ----------
Write-Host "[1/2] Instalando extensión para Visual Studio Code..." -ForegroundColor Yellow

$vsix = Get-ChildItem -Path $here -Filter 'club-penguin-isla-*.vsix' | Sort-Object Name | Select-Object -Last 1
$code = Get-Command code -ErrorAction SilentlyContinue
if (-not $code) {
    $candidates = @(
        "$env:LOCALAPPDATA\Programs\Microsoft VS Code\bin\code.cmd",
        "$env:ProgramFiles\Microsoft VS Code\bin\code.cmd"
    )
    $found = $candidates | Where-Object { Test-Path $_ } | Select-Object -First 1
    if ($found) { $code = @{ Source = $found } }
}

if ($code -and $vsix) {
    & $code.Source --install-extension $vsix.FullName --force
    Write-Host "  ✔ Extensión instalada con 'code --install-extension'." -ForegroundColor Green
} else {
    # Respaldo: copiar la carpeta directamente a ~/.vscode/extensions
    $version = (Get-Content "$here\vscode-extension\package.json" -Raw | ConvertFrom-Json).version
    $dest = Join-Path $env:USERPROFILE ".vscode\extensions\pinguino-fan.club-penguin-isla-$version"
    if (Test-Path $dest) { Remove-Item $dest -Recurse -Force }
    Copy-Item "$here\vscode-extension" $dest -Recurse
    Write-Host "  ✔ Extensión copiada a $dest" -ForegroundColor Green
}
Write-Host "  → Reinicia VS Code: el tema 'Club Penguin Isla' se activa solo y tu pingüino" -ForegroundColor Gray
Write-Host "    aparece en el Explorador (panel '🐧 Club Penguin')." -ForegroundColor Gray
Write-Host ""

# ---------- 2. Google Chrome ----------
Write-Host "[2/2] Preparando tema de Halloween para Google Chrome..." -ForegroundColor Yellow

# Chrome necesita que la carpeta del tema se quede en un lugar fijo.
$chromeDest = Join-Path $env:LOCALAPPDATA "ClubPenguinTheme\chrome-theme-halloween"
if (Test-Path $chromeDest) { Remove-Item $chromeDest -Recurse -Force }
New-Item -ItemType Directory -Path (Split-Path $chromeDest) -Force | Out-Null
Copy-Item "$here\chrome-theme-halloween" $chromeDest -Recurse
Set-Clipboard -Value $chromeDest
Write-Host "  ✔ Tema copiado a: $chromeDest  (ruta copiada al portapapeles)" -ForegroundColor Green
Write-Host ""
Write-Host "  Para aplicarlo en Chrome (solo una vez):" -ForegroundColor Cyan
Write-Host "   1. Se abrirá chrome://extensions"
Write-Host "   2. Activa 'Modo de desarrollador' (arriba a la derecha)"
Write-Host "   3. Clic en 'Cargar extensión sin empaquetar' y pega la ruta (Ctrl+V)"
Write-Host ""

$chrome = @(
    "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
    "$env:LOCALAPPDATA\Google\Chrome\Application\chrome.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1
if ($chrome) {
    Start-Process $chrome 'chrome://extensions'
}
Start-Process explorer.exe $chromeDest

Write-Host "🎃 ¡Listo! Waddle on 🐧" -ForegroundColor Magenta
Read-Host "Presiona Enter para cerrar"
