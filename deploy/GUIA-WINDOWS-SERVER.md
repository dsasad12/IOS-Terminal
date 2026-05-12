# Guía: HackTerm en Windows Server 2022 + IIS + Dominio + iPhone

## REQUISITOS PREVIOS

- Windows Server 2022 (funciona también en 2019)
- Acceso de Administrador
- Un dominio (ej: `hackterm.tudominio.com`)
- IP pública del servidor (estática recomendada)
- Puerto 80 y 443 abiertos en el router/firewall externo

---

## PASO 1 — Configurar el DNS del dominio

En el panel de tu registrador de dominios (Namecheap, GoDaddy, Cloudflare, etc.):

```
Tipo    Nombre              Valor
────────────────────────────────────────────────
A       hackterm            [IP-PUBLICA-SERVIDOR]
A       www.hackterm        [IP-PUBLICA-SERVIDOR]
```

> Si usas **Cloudflare**: desactiva el proxy (nube naranja → nube gris) durante la emisión del certificado SSL. Luego puedes activarlo.

Comprueba que el DNS propaga con:
```
nslookup hackterm.tudominio.com
```

---

## PASO 2 — Abrir puertos en el router

En la interfaz de tu router (normalmente 192.168.1.1):

| Puerto externo | Puerto interno | Protocolo | Destino (IP del server) |
|---------------|----------------|-----------|------------------------|
| 80            | 80             | TCP       | 192.168.X.X            |
| 443           | 443            | TCP       | 192.168.X.X            |

---

## PASO 3 — Ejecutar el script de despliegue

En el servidor Windows, abre **PowerShell como Administrador** y ejecuta:

```powershell
# Clonar o copiar el proyecto al servidor primero
# Luego:

cd C:\ruta\al\proyecto\deploy

.\deploy-iis.ps1 -Domain "hackterm.tudominio.com"
```

El script hace **automáticamente**:
1. Instala IIS y todos los módulos necesarios
2. Instala URL Rewrite Module
3. Verifica/instala Node.js
4. Compila el proyecto (`npm run build`)
5. Copia los archivos a `C:\inetpub\hackterm`
6. Crea el sitio en IIS con el dominio
7. Abre puertos 80 y 443 en el Firewall de Windows
8. Descarga e instala win-acme (Let's Encrypt)
9. Emite el certificado SSL gratuito
10. Reinicia IIS

---

## PASO 4 — SSL manual (si el script falla)

Si el script automático no consigue el SSL, hazlo manualmente:

### Opción A: win-acme (recomendado, gratuito)

```powershell
# Descargar win-acme
Invoke-WebRequest -Uri "https://github.com/win-acme/win-acme/releases/download/v2.2.9.1701/win-acme.v2.2.9.1701.x64.pluggable.zip" -OutFile "$env:TEMP\wacme.zip"
Expand-Archive "$env:TEMP\wacme.zip" -DestinationPath "C:\win-acme"

# Ejecutar (modo interactivo, sigue las instrucciones)
C:\win-acme\wacs.exe
```

En el asistente interactivo:
```
N  → Crear nuevo certificado (simple)
1  → IIS
[número del sitio HackTerm]
1  → Usar todos los bindings del sitio
I  → IIS Central Certificate Store
```

### Opción B: Certbot (alternativa)

```powershell
winget install certbot
certbot certonly --webroot -w C:\inetpub\hackterm -d hackterm.tudominio.com
```

### Opción C: Cloudflare Proxy

Si tu dominio está en Cloudflare con el proxy activo (nube naranja), Cloudflare pone HTTPS automáticamente.  
Solo necesitas el certificado origen de Cloudflare (gratuito en su dashboard).

---

## PASO 5 — Verificar en IIS Manager

1. Abre **IIS Manager** (busca "IIS" en el menú de inicio)
2. En el panel izquierdo, expande el servidor → **Sites** → **HackTerm**
3. Verifica que el estado sea **Started**
4. En **Bindings** deberías ver:
   - `http  *:80  hackterm.tudominio.com`
   - `https *:443 hackterm.tudominio.com` (con certificado)

---

## PASO 6 — Verificar desde el navegador

```
http://hackterm.tudominio.com      → debe redirigir a HTTPS
https://hackterm.tudominio.com     → página de instalación
https://hackterm.tudominio.com/terminal.html → terminal
```

En el servidor mismo:
```powershell
# Probar localmente
Invoke-WebRequest -Uri "https://hackterm.tudominio.com" -UseBasicParsing
```

---

## PASO 7 — Instalar en iPhone

1. Abre **Safari** (no Chrome ni Firefox)
2. Ve a `https://hackterm.tudominio.com`
3. Toca el botón **⎋ Compartir** (abajo al centro)
4. Desplázate y toca **"Añadir a pantalla de inicio"**
5. Nombre: `HackTerm` → toca **Añadir**
6. El icono aparece en tu home screen

Al abrirlo: **pantalla completa**, sin barra de Safari, como app nativa.

---

## SOLUCIÓN DE PROBLEMAS

### La web carga pero no se puede instalar en iPhone
- Verifica que sea **HTTPS** (HTTP no permite PWA en iOS)
- Comprueba que el `manifest.webmanifest` carga con `Content-Type: application/manifest+json`

```powershell
# Probar headers
(Invoke-WebRequest "https://hackterm.tudominio.com/manifest.webmanifest").Headers
```

### Error 403 Forbidden
```powershell
# Dar permisos a IIS
icacls "C:\inetpub\hackterm" /grant "IIS_IUSRS:(OI)(CI)RX" /T
```

### Error 500 en el web.config
```powershell
# Verificar que URL Rewrite está instalado
Get-WebConfiguration -Filter "//rewrite/rules" -PSPath "IIS:\"
```

### El Service Worker no actualiza
El SW se cachea agresivamente. Forzar actualización:
```
Safari → Ajustes → Safari → Avanzado → Datos del sitio web → Eliminar todos los datos
```

### Puerto 443 bloqueado por el router
- Entra al router, NAT/Port Forwarding
- Añade regla: TCP 443 → [IP del servidor Windows]
- Reinicia el router

---

## ESTRUCTURA EN EL SERVIDOR

```
C:\inetpub\hackterm\
├── index.html          ← Página de instalación
├── terminal.html       ← App terminal
├── web.config          ← Configuración IIS
├── manifest.webmanifest
├── sw.js               ← Service Worker
├── workbox-*.js
├── registerSW.js
└── assets\
    ├── terminal-*.js
    └── terminal-*.css
```

---

## ACTUALIZAR LA APP

Cuando hagas cambios al código:

```powershell
# En el servidor, desde la carpeta del proyecto:
cd C:\ruta\proyecto\web
npm run build
Copy-Item -Path "dist\*" -Destination "C:\inetpub\hackterm" -Recurse -Force
iisreset /noforce
```

O re-ejecuta el script con `-SkipSSL`:
```powershell
.\deploy-iis.ps1 -Domain "hackterm.tudominio.com" -SkipSSL
```

---

## RENOVACIÓN SSL AUTOMÁTICA

El certificado Let's Encrypt dura 90 días. Configurar renovación automática:

```powershell
.\ssl-renovar.ps1
```

Esto crea una tarea programada que renueva el certificado cada 60 días a las 3:00 AM.
