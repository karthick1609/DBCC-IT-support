# PowerShell script to install deps and run vercel dev
param(
  [switch]$InstallOnly
)

Write-Host "Installing npm dependencies..."
npm install
if($LASTEXITCODE -ne 0){ Write-Error "npm install failed"; exit $LASTEXITCODE }

if($InstallOnly){ Write-Host "Install complete."; exit 0 }

Write-Host "Starting Vercel dev..."
npx vercel dev
