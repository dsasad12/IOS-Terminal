# ============================================================
#  HackTerm — Script de despliegue en IIS (Windows Server 2022)
#  Ejecutar como Administrador en PowerShell
#  Uso: .\deploy-iis.ps1 -Domain "tudominio.com" -SitePath "C:\inetpub\hackterm"
# ============================================================

param(
    [Parameter(Mandatory=$true)]
    [string]$Domain,

    [string]$SitePath = "C:\inetpub\hackterm",
    [string]$SiteName = "HackTerm",
    [int]$HttpPort  = 80,
    [int]$HttpsPort = 443,
    [switch]$SkipBuild,
    [switch]$SkipSSL
)

$ErrorActionPreference = "Stop"

# ── Colores helper ───────────────────────────────────────────
function Log-Info  { param($m) Write-Host "  [INFO] $m"    -ForegroundColor Cyan }
function Log-OK    { param($m) Write-Host "  [ OK ] $m"    -ForegroundColor Green }
function Log-Warn  { param($m) Write-Host "  [WARN] $m"    -ForegroundColor Yellow }
function Log-Error { param($m) Write-Host "  [ERR!] $m"    -ForegroundColor Red }
function Log-Step  { param($m) Write-Host "`n>> $m" -ForegroundColor White }

Write-Host ""
Write-Host "  ██╗  ██╗ █████╗  ██████╗██╗  ██╗████████╗███████╗██████╗ ███╗   ███╗" -ForegroundColor Green
Write-Host "  HackTerm IIS Deploy — Windows Server 2022" -ForegroundColor Cyan
Write-Host "  Dominio: $Domain" -ForegroundColor Yellow
Write-Host ""

# ── 1. Verificar que se ejecuta como Admin ───────────────────
Log-Step "1. Verificando privilegios de administrador"
$currentPrincipal = [Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()
if (-not $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Log-Error "Ejecuta este script como Administrador (clic derecho → Ejecutar con PowerShell como administrador)"
    exit 1
}
Log-OK "Ejecutando como administrador"

# ── 2. Instalar IIS y módulos necesarios ─────────────────────
Log-Step "2. Instalando IIS y módulos"

$features = @(
    "Web-Server",
    "Web-WebServer",
    "Web-Common-Http",
    "Web-Default-Doc",
    "Web-Static-Content",
    "Web-Http-Errors",
    "Web-Http-Redirect",
    "Web-Performance",
    "Web-Stat-Compression",
    "Web-Dyn-Compression",
    "Web-Security",
    "Web-Filtering",
    "Web-Basic-Auth",
    "Web-Url-Auth",
    "Web-Mgmt-Tools",
    "Web-Mgmt-Console",
    "Web-Mgmt-Service"
)

foreach ($f in $features) {
    $state = (Get-WindowsFeature -Name $f).InstallState
    if ($state -ne "Installed") {
        Log-Info "Instalando $f..."
        Install-WindowsFeature -Name $f -WarningAction SilentlyContinue | Out-Null
    }
}
Log-OK "IIS instalado"

# Instalar URL Rewrite Module (necesario para el web.config)
Log-Info "Verificando URL Rewrite Module..."
$rewriteKey = "HKLM:\SOFTWARE\Microsoft\IIS Extensions\URL Rewrite"
if (-not (Test-Path $rewriteKey)) {
    Log-Warn "URL Rewrite no encontrado. Descargando..."
    $rewriteUrl = "https://download.microsoft.com/download/1/2/8/128E2E22-C1B9-44A4-BE2A-5859ED1D4592/rewrite_amd64_en-US.msi"
    $rewriteMsi = "$env:TEMP\rewrite_amd64.msi"
    Invoke-WebRequest -Uri $rewriteUrl -OutFile $rewriteMsi -UseBasicParsing
    Start-Process msiexec.exe -ArgumentList "/i `"$rewriteMsi`" /quiet /norestart" -Wait
    Log-OK "URL Rewrite instalado"
} else {
    Log-OK "URL Rewrite ya instalado"
}

# ── 3. Instalar Node.js si no está ───────────────────────────
Log-Step "3. Verificando Node.js"
try {
    $nodeVersion = node --version 2>$null
    Log-OK "Node.js encontrado: $nodeVersion"
} catch {
    Log-Warn "Node.js no encontrado. Descargando Node.js LTS..."
    $nodeUrl = "https://nodejs.org/dist/v20.11.0/node-v20.11.0-x64.msi"
    $nodeMsi = "$env:TEMP\nodejs.msi"
    Invoke-WebRequest -Uri $nodeUrl -OutFile $nodeMsi -UseBasicParsing
    Start-Process msiexec.exe -ArgumentList "/i `"$nodeMsi`" /quiet /norestart ADDLOCAL=ALL" -Wait
    # Recargar PATH
    $env:PATH = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
    Log-OK "Node.js instalado"
}

# ── 4. Build del proyecto web ─────────────────────────────────
if (-not $SkipBuild) {
    Log-Step "4. Compilando HackTerm PWA"

    # Detectar ruta del proyecto
    $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
    $webDir = Join-Path (Split-Path -Parent $scriptDir) "web"

    if (-not (Test-Path $webDir)) {
        Log-Error "No se encontró el directorio web/ en: $webDir"
        Log-Error "Ejecuta el script desde la carpeta deploy/ del proyecto"
        exit 1
    }

    Log-Info "Instalando dependencias npm..."
    Push-Location $webDir
    npm install --silent 2>&1 | Out-Null

    Log-Info "Compilando para producción..."
    npm run build 2>&1 | ForEach-Object { Log-Info $_ }

    $distDir = Join-Path $webDir "dist"
    if (-not (Test-Path $distDir)) {
        Log-Error "Build falló. No se encontró: $distDir"
        Pop-Location
        exit 1
    }
    Log-OK "Build completado: $distDir"
    Pop-Location
} else {
    Log-Warn "Saltando build (--SkipBuild)"
    $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
    $distDir = Join-Path (Split-Path -Parent $scriptDir) "web\dist"
}

# ── 5. Copiar archivos al sitio ───────────────────────────────
Log-Step "5. Desplegando archivos en $SitePath"

if (-not (Test-Path $SitePath)) {
    New-Item -ItemType Directory -Path $SitePath -Force | Out-Null
}

# Copiar dist/ al directorio del sitio
Copy-Item -Path "$distDir\*" -Destination $SitePath -Recurse -Force
Log-OK "Archivos copiados a $SitePath"

# ── 6. Configurar IIS ────────────────────────────────────────
Log-Step "6. Configurando sitio IIS"

Import-Module WebAdministration

# Eliminar sitio Default si existe en el mismo puerto
$defaultSite = Get-WebSite -Name "Default Web Site" 2>$null
if ($defaultSite) {
    $defaultBindings = $defaultSite.Bindings.Collection | Where-Object { $_.bindingInformation -like "*:80:*" }
    if ($defaultBindings) {
        Log-Warn "Deteniendo Default Web Site para liberar puerto 80"
        Stop-WebSite -Name "Default Web Site" -ErrorAction SilentlyContinue
    }
}

# Crear/actualizar Application Pool
$poolName = "${SiteName}Pool"
if (-not (Test-Path "IIS:\AppPools\$poolName")) {
    Log-Info "Creando Application Pool: $poolName"
    New-WebAppPool -Name $poolName | Out-Null
}

# Configurar el pool
$pool = Get-Item "IIS:\AppPools\$poolName"
$pool.managedRuntimeVersion = ""   # Sin .NET runtime (solo archivos estáticos)
$pool.managedPipelineMode = "Integrated"
$pool.processModel.idleTimeout = [TimeSpan]::FromMinutes(0)  # Nunca inactivo
$pool | Set-Item

Log-OK "Application Pool configurado: $poolName"

# Crear sitio web
$existingSite = Get-WebSite -Name $SiteName 2>$null
if ($existingSite) {
    Log-Info "Actualizando sitio existente: $SiteName"
    Set-ItemProperty "IIS:\Sites\$SiteName" -Name physicalPath -Value $SitePath
} else {
    Log-Info "Creando sitio: $SiteName"
    New-WebSite -Name $SiteName `
                -Port $HttpPort `
                -PhysicalPath $SitePath `
                -ApplicationPool $poolName `
                -HostHeader $Domain | Out-Null
}

# Añadir binding para www
try {
    New-WebBinding -Name $SiteName -Protocol "http" -Port $HttpPort -HostHeader "www.$Domain" -ErrorAction SilentlyContinue
} catch {}

Log-OK "Sitio IIS configurado"

# ── 7. Permisos de carpeta ────────────────────────────────────
Log-Step "7. Configurando permisos"
$acl = Get-Acl $SitePath
$accessRule = New-Object System.Security.AccessControl.FileSystemAccessRule(
    "IIS_IUSRS", "ReadAndExecute", "ContainerInherit,ObjectInherit", "None", "Allow"
)
$acl.SetAccessRule($accessRule)
Set-Acl $SitePath $acl
Log-OK "Permisos configurados para IIS_IUSRS"

# ── 8. Firewall ───────────────────────────────────────────────
Log-Step "8. Reglas de Firewall"

$rules = @(
    @{ Name="HackTerm HTTP";  Port=80;  Proto="TCP" },
    @{ Name="HackTerm HTTPS"; Port=443; Proto="TCP" }
)

foreach ($rule in $rules) {
    $existing = Get-NetFirewallRule -DisplayName $rule.Name -ErrorAction SilentlyContinue
    if (-not $existing) {
        New-NetFirewallRule -DisplayName $rule.Name `
            -Direction Inbound `
            -Protocol $rule.Proto `
            -LocalPort $rule.Port `
            -Action Allow | Out-Null
        Log-OK "Regla creada: $($rule.Name) puerto $($rule.Port)"
    } else {
        Log-Info "Ya existe: $($rule.Name)"
    }
}

# ── 9. SSL con win-acme (Let's Encrypt) ──────────────────────
if (-not $SkipSSL) {
    Log-Step "9. Configurando SSL con Let's Encrypt (win-acme)"

    $wacmePath = "C:\win-acme\wacs.exe"

    if (-not (Test-Path $wacmePath)) {
        Log-Info "Descargando win-acme..."
        $wacmeDir = "C:\win-acme"
        New-Item -ItemType Directory -Path $wacmeDir -Force | Out-Null

        $wacmeZip = "$env:TEMP\win-acme.zip"
        $wacmeUrl = "https://github.com/win-acme/win-acme/releases/download/v2.2.9.1701/win-acme.v2.2.9.1701.x64.pluggable.zip"
        Invoke-WebRequest -Uri $wacmeUrl -OutFile $wacmeZip -UseBasicParsing
        Expand-Archive -Path $wacmeZip -DestinationPath $wacmeDir -Force
        Log-OK "win-acme descargado en $wacmeDir"
    }

    Log-Info "Emitiendo certificado SSL para $Domain y www.$Domain"
    Log-Warn "IMPORTANTE: El dominio debe apuntar a la IP de este servidor ANTES de continuar"
    Log-Warn "Presiona ENTER cuando el DNS esté configurado, o Ctrl+C para saltar..."
    Read-Host | Out-Null

    # Emitir certificado automáticamente
    $wacmeArgs = @(
        "--source", "iis",
        "--siteid", (Get-WebSite -Name $SiteName).id,
        "--host", "$Domain",
        "--host", "www.$Domain",
        "--validation", "selfhosting",
        "--store", "certificatestore",
        "--installation", "iis",
        "--installftp", "false",
        "--accepttos",
        "--emailaddress", "admin@$Domain"
    )

    Log-Info "Ejecutando: wacs.exe $($wacmeArgs -join ' ')"
    & $wacmePath @wacmeArgs

    if ($LASTEXITCODE -eq 0) {
        Log-OK "Certificado SSL instalado para $Domain"
    } else {
        Log-Warn "win-acme no pudo emitir el certificado automáticamente"
        Log-Warn "Ejecuta manualmente: C:\win-acme\wacs.exe --source iis --siteid $(( Get-WebSite -Name $SiteName).id)"
        Log-Warn "O instala el certificado manualmente desde IIS Manager"
    }
} else {
    Log-Warn "Saltando SSL (--SkipSSL). HTTPS es obligatorio para PWA en iPhone."
    Log-Warn "Configura SSL manualmente en IIS Manager."
}

# ── 10. Redirección HTTP → HTTPS ─────────────────────────────
Log-Step "10. Configurando redirección HTTP → HTTPS"

$httpsBinding = Get-WebBinding -Name $SiteName -Protocol "https" 2>$null
if ($httpsBinding) {
    # Configurar redirección en web.config
    $webConfigPath = Join-Path $SitePath "web.config"
    if (Test-Path $webConfigPath) {
        $content = Get-Content $webConfigPath -Raw
        if ($content -notlike "*rewrite*https*") {
            $httpsRule = @"

    <!-- HTTP a HTTPS redirect -->
    <rewrite>
      <rules>
        <rule name="HTTP to HTTPS" stopProcessing="true">
          <match url="(.*)" />
          <conditions>
            <add input="{HTTPS}" pattern="off" ignoreCase="true" />
          </conditions>
          <action type="Redirect" url="https://{HTTP_HOST}/{R:1}" redirectType="Permanent" />
        </rule>
      </rules>
    </rewrite>
"@
            Log-Warn "Añade manualmente la regla HTTP→HTTPS al web.config si es necesario"
        }
    }
    Log-OK "HTTPS ya configurado"
}

# ── 11. Reiniciar IIS ─────────────────────────────────────────
Log-Step "11. Reiniciando IIS"
iisreset /restart /noforce 2>&1 | Out-Null
Start-WebSite -Name $SiteName -ErrorAction SilentlyContinue
Log-OK "IIS reiniciado y sitio iniciado"

# ── Resumen ───────────────────────────────────────────────────
Write-Host ""
Write-Host "  ════════════════════════════════════════════════" -ForegroundColor Green
Write-Host "  DESPLIEGUE COMPLETADO" -ForegroundColor Green
Write-Host "  ════════════════════════════════════════════════" -ForegroundColor Green
Write-Host ""
Write-Host "  Sitio IIS:    $SiteName" -ForegroundColor Cyan
Write-Host "  Directorio:   $SitePath" -ForegroundColor Cyan
Write-Host "  URL HTTP:     http://$Domain" -ForegroundColor Cyan
Write-Host "  URL HTTPS:    https://$Domain" -ForegroundColor Green
Write-Host "  Terminal:     https://$Domain/terminal.html" -ForegroundColor Green
Write-Host ""
Write-Host "  INSTALAR EN iPHONE:" -ForegroundColor Yellow
Write-Host "  1. Safari → https://$Domain" -ForegroundColor White
Write-Host "  2. Icono Compartir (abajo, cuadrado con flecha)" -ForegroundColor White
Write-Host "  3. 'Añadir a pantalla de inicio'" -ForegroundColor White
Write-Host "  4. Confirmar → se instala como app nativa" -ForegroundColor White
Write-Host ""
Write-Host "  PROXIMOS PASOS si falta SSL:" -ForegroundColor Yellow
Write-Host "  C:\win-acme\wacs.exe --source iis" -ForegroundColor Gray
Write-Host ""
