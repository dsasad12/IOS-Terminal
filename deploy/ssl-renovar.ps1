# ============================================================
#  Renovación automática de SSL con win-acme
#  Añadir al Task Scheduler de Windows para renovar cada 60 días
#  Uso: .\ssl-renovar.ps1
# ============================================================

$wacs = "C:\win-acme\wacs.exe"

if (-not (Test-Path $wacs)) {
    Write-Host "win-acme no encontrado en C:\win-acme\" -ForegroundColor Red
    exit 1
}

Write-Host "Renovando certificados SSL..." -ForegroundColor Cyan
& $wacs --renew --force
Write-Host "Renovación completada: $(Get-Date)" -ForegroundColor Green

# Programar renovación automática cada 60 días
$action  = New-ScheduledTaskAction -Execute "PowerShell.exe" -Argument "-NonInteractive -File `"$PSScriptRoot\ssl-renovar.ps1`""
$trigger = New-ScheduledTaskTrigger -Daily -DaysInterval 60 -At "03:00"
$settings = New-ScheduledTaskSettingsSet -RunOnlyIfNetworkAvailable -StartWhenAvailable

Register-ScheduledTask -TaskName "HackTerm SSL Renew" `
    -Action $action -Trigger $trigger -Settings $settings `
    -RunLevel Highest -Force | Out-Null

Write-Host "Tarea programada: renovación cada 60 días a las 03:00" -ForegroundColor Green
