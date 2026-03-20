# ELDROS Requirements Webhook - One-click startup
# ------------------------------------------------
# What this script does:
#   1. Reads all settings from .env (no manual $env: commands needed)
#   2. Installs npm deps if missing
#   3. Takes a baseline snapshot if one does not exist yet
#   4. Starts ngrok to create a public HTTPS tunnel to localhost:9000
#   5. Waits for ngrok and fetches the public URL automatically
#   6. Prints the exact URL to paste into GitHub Settings > Webhooks
#   7. Starts the watcher (node watcher.js)
#
# HOW TO RUN:
#   Right-click start.ps1 then "Run with PowerShell"
#   OR open PowerShell in this folder and type:  .\start.ps1

Set-Location $PSScriptRoot

Write-Host ""
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "  ELDROS Requirements Webhook  -  startup          " -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host ""

# -------------------------------------------------------
# 1. Load .env file
# -------------------------------------------------------
$envFile = Join-Path $PSScriptRoot ".env"
if (Test-Path $envFile) {
    Write-Host "  Loading settings from .env ..." -ForegroundColor DarkGray
    Get-Content $envFile | ForEach-Object {
        $rawLine = $_.Trim()
        if ($rawLine -and -not $rawLine.StartsWith("#")) {
            $parts = $rawLine -split "=", 2
            if ($parts.Length -eq 2) {
                $k = $parts[0].Trim()
                $v = $parts[1].Trim()
                [System.Environment]::SetEnvironmentVariable($k, $v, "Process")
            }
        }
    }
    Write-Host "  [OK] .env loaded" -ForegroundColor Green
} else {
    Write-Host "  [ERROR] .env file not found." -ForegroundColor Red
    Write-Host "  Please create requirements-webhook/.env" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Read the values we care about
$webhookPort = $env:WEBHOOK_PORT
if (-not $webhookPort) { $webhookPort = "9000" }

$webhookSecret = $env:WEBHOOK_SECRET
if (-not $webhookSecret) { $webhookSecret = "" }

# -------------------------------------------------------
# 2. Install npm deps if node_modules is missing
# -------------------------------------------------------
$nodeModulesPath = Join-Path $PSScriptRoot "node_modules"
if (-not (Test-Path $nodeModulesPath)) {
    Write-Host ""
    Write-Host "  Installing npm dependencies ..." -ForegroundColor Yellow
    npm install --silent
    Write-Host "  [OK] npm install done" -ForegroundColor Green
} else {
    Write-Host "  [OK] node_modules already present" -ForegroundColor DarkGray
}

# -------------------------------------------------------
# 3. Take baseline snapshot if .snapshots folder is missing
# -------------------------------------------------------
$snapshotsDir = Join-Path $PSScriptRoot ".snapshots"
if (-not (Test-Path $snapshotsDir)) {
    Write-Host ""
    Write-Host "  Taking baseline snapshots (first-time setup) ..." -ForegroundColor Yellow
    node snapshot.js
    Write-Host "  [OK] Snapshots saved" -ForegroundColor Green
} else {
    Write-Host "  [OK] Snapshots already exist" -ForegroundColor DarkGray
}

# -------------------------------------------------------
# 4. Check ngrok is installed
# -------------------------------------------------------
Write-Host ""
$ngrokCmd = Get-Command ngrok -ErrorAction SilentlyContinue
if (-not $ngrokCmd) {
    Write-Host "  [ERROR] ngrok not found on PATH." -ForegroundColor Red
    Write-Host ""
    Write-Host "  Install ngrok (one-time, free):" -ForegroundColor Yellow
    Write-Host "    1. Go to https://ngrok.com/download" -ForegroundColor White
    Write-Host "    2. Download the Windows ZIP, extract ngrok.exe" -ForegroundColor White
    Write-Host "    3. Move ngrok.exe to C:\Windows\System32\" -ForegroundColor White
    Write-Host "    4. Sign up free at https://dashboard.ngrok.com" -ForegroundColor White
    Write-Host "    5. Run:  ngrok config add-authtoken YOUR_TOKEN" -ForegroundColor White
    Write-Host "    6. Re-run this script" -ForegroundColor White
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}
Write-Host "  [OK] ngrok found" -ForegroundColor Green

# -------------------------------------------------------
# 5. Kill any existing ngrok, then start a fresh tunnel
# -------------------------------------------------------
Write-Host ""
Write-Host "  Starting ngrok tunnel on port $webhookPort ..." -ForegroundColor Yellow

Get-Process -Name ngrok -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Milliseconds 600

$ngrokProcess = Start-Process -FilePath "ngrok" -ArgumentList "http $webhookPort" -WindowStyle Hidden -PassThru

# -------------------------------------------------------
# 6. Wait for ngrok API and grab the public URL
# -------------------------------------------------------
Write-Host "  Waiting for ngrok to initialise ..." -ForegroundColor DarkGray
$ngrokUrl = $null
$attempts  = 0

while ((-not $ngrokUrl) -and ($attempts -lt 20)) {
    Start-Sleep -Milliseconds 800
    $attempts++
    try {
        $response   = Invoke-RestMethod -Uri "http://localhost:4040/api/tunnels" -ErrorAction Stop
        $httpsTunnel = $response.tunnels | Where-Object { $_.proto -eq "https" } | Select-Object -First 1
        if ($httpsTunnel) {
            $ngrokUrl = $httpsTunnel.public_url
        }
    } catch {
        # ngrok not ready yet, keep waiting
    }
}

if (-not $ngrokUrl) {
    Write-Host ""
    Write-Host "  [ERROR] Could not get ngrok URL after $attempts attempts." -ForegroundColor Red
    Write-Host "  Try running 'ngrok http $webhookPort' manually to check for errors." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

$githubWebhookUrl = "$ngrokUrl/webhook"

# -------------------------------------------------------
# 7. Print the GitHub Webhook setup instructions
# -------------------------------------------------------
Write-Host ""
Write-Host "====================================================" -ForegroundColor Green
Write-Host "  ngrok is running! Paste this URL into GitHub:    " -ForegroundColor Green
Write-Host ""
Write-Host "  >> $githubWebhookUrl <<" -ForegroundColor Yellow
Write-Host ""
Write-Host "====================================================" -ForegroundColor Green
Write-Host ""
Write-Host "  GitHub setup (do this once in your browser):" -ForegroundColor Cyan
Write-Host "    1. Open your GitHub repo" -ForegroundColor White
Write-Host "    2. Go to  Settings > Webhooks > Add webhook" -ForegroundColor White
Write-Host "    3. Payload URL   : $githubWebhookUrl" -ForegroundColor White
Write-Host "    4. Content type  : application/json" -ForegroundColor White
Write-Host "    5. Secret        : $webhookSecret" -ForegroundColor White
Write-Host "    6. Which events  : Just the push event" -ForegroundColor White
Write-Host "    7. Click  Add webhook" -ForegroundColor White
Write-Host ""
Write-Host "  After that, every push that changes" -ForegroundColor DarkGray
Write-Host "  deposit/requirements.md or display/requirements.md" -ForegroundColor DarkGray
Write-Host "  will write REQUIREMENTS_CHANGES.md into BOTH folders." -ForegroundColor DarkGray
Write-Host ""
Write-Host "  Starting watcher now ... (press Ctrl+C to stop)" -ForegroundColor Yellow
Write-Host ""

# -------------------------------------------------------
# 8. Free the webhook port if something else is already using it
# -------------------------------------------------------
$portInUse = netstat -ano | Select-String ":$webhookPort\s" | Select-Object -First 1
if ($portInUse) {
    $pid_ = ($portInUse -split '\s+')[-1]
    Write-Host "  Port $webhookPort in use by PID $pid_ - stopping it ..." -ForegroundColor Yellow
    Stop-Process -Id $pid_ -Force -ErrorAction SilentlyContinue
    Start-Sleep -Milliseconds 500
    Write-Host "  [OK] Port $webhookPort is now free" -ForegroundColor Green
}

# -------------------------------------------------------
# 9. Start the watcher (blocks until Ctrl+C)
# -------------------------------------------------------
node watcher.js

# -------------------------------------------------------
# 10. Cleanup ngrok when watcher exits
# -------------------------------------------------------
Write-Host ""
Write-Host "  Watcher stopped. Closing ngrok ..." -ForegroundColor DarkGray
$ngrokProcess | Stop-Process -Force -ErrorAction SilentlyContinue
Write-Host "  Done." -ForegroundColor Green
