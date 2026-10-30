#requires -Version 5.1
[CmdletBinding()]
param(
    [string]$InstallDir = "",
    [string]$ConfigPath = "",
    [switch]$SkipVerify,
    [switch]$NoNodeDownload
)

$ErrorActionPreference = "Stop"
try { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8 } catch { }
$script:LogFile = Join-Path $env:TEMP "prompt-coach-install.log"
$script:InstallerRoot = $PSScriptRoot
$script:Payload = Join-Path $PSScriptRoot "payload"

function Write-Log {
    param(
        [string]$Message,
        [ValidateSet("INFO", "OK", "WARN", "ERROR")]
        [string]$Level = "INFO"
    )
    $line = "[{0}] [{1}] {2}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $Level, $Message
    try { Add-Content -Path $script:LogFile -Value $line -Encoding UTF8 } catch { }
    switch ($Level) {
        "ERROR" { Write-Host $Message -ForegroundColor Red }
        "WARN"  { Write-Host $Message -ForegroundColor Yellow }
        "OK"    { Write-Host $Message -ForegroundColor Green }
        default { Write-Host $Message }
    }
}

function Fail {
    param([string]$Message)
    Write-Log $Message "ERROR"
    Write-Log "Установка прервана. Лог: $script:LogFile" "ERROR"
    exit 1
}

function Test-AsciiPath {
    param([string]$Path)
    if ([string]::IsNullOrWhiteSpace($Path)) { return $false }
    foreach ($ch in $Path.ToCharArray()) {
        if ([int]$ch -gt 127) { return $false }
    }
    return $true
}

function Test-WritableDir {
    param([string]$Path)
    try {
        if (-not (Test-Path $Path)) {
            New-Item -ItemType Directory -Path $Path -Force | Out-Null
        }
        $probe = Join-Path $Path (".write-test-" + [Guid]::NewGuid().ToString("N") + ".tmp")
        Set-Content -Path $probe -Value "ok" -Encoding ASCII
        Remove-Item $probe -Force
        return $true
    } catch {
        return $false
    }
}

function Find-OpenCodeCli {
    $names = @("opencode-cli.exe", "opencode.exe", "opencode.cmd", "opencode")
    foreach ($name in $names) {
        $cmd = Get-Command $name -ErrorAction SilentlyContinue
        if ($cmd -and $cmd.Source) {
            if ($cmd.Source -match "OpenCode\.exe$") { continue }
            return $cmd.Source
        }
    }
    $candidates = @(
        (Join-Path $env:LOCALAPPDATA "Programs\@opencode-aidesktop\resources\opencode-cli.exe"),
        (Join-Path $env:LOCALAPPDATA "Programs\@opencode-aidesktop\opencode-cli.exe"),
        (Join-Path $env:LOCALAPPDATA "Programs\opencode\opencode-cli.exe"),
        (Join-Path $env:LOCALAPPDATA "Programs\opencode\opencode.exe"),
        (Join-Path $env:ProgramFiles "OpenCode\opencode-cli.exe"),
        (Join-Path $env:ProgramFiles "OpenCode\opencode.exe")
    )
    foreach ($c in $candidates) {
        if ($c -and (Test-Path $c)) { return $c }
    }
    return $null
}

function Find-Npm {
    $candidates = @(
        (Join-Path $env:ProgramFiles "nodejs\npm.cmd"),
        (Join-Path $env:LOCALAPPDATA "Programs\nodejs\npm.cmd")
    )
    foreach ($c in $candidates) {
        if (Test-Path $c) { return $c }
    }
    $cmd = Get-Command npm.cmd -ErrorAction SilentlyContinue
    if ($cmd -and $cmd.Source) { return $cmd.Source }
    $nodeCmd = Get-Command node.exe -ErrorAction SilentlyContinue
    if ($nodeCmd -and $nodeCmd.Source) {
        $npmNextToNode = Join-Path (Split-Path $nodeCmd.Source) "npm.cmd"
        if (Test-Path $npmNextToNode) { return $npmNextToNode }
    }
    $cmd = Get-Command npm -ErrorAction SilentlyContinue
    if ($cmd -and $cmd.Source -and $cmd.Source.ToLower().EndsWith(".cmd")) { return $cmd.Source }
    return $null
}

function Ensure-Npm {
    $npm = Find-Npm
    if ($npm) { return $npm }

    if ($NoNodeDownload) {
        Fail "Node.js/npm не найден. Установите Node.js LTS с https://nodejs.org и запустите установщик снова."
    }

    Write-Log "Node.js не найден. Скачиваю portable Node.js..." "WARN"
    try {
        [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
        $arch = switch ($env:PROCESSOR_ARCHITECTURE) {
            "AMD64" { "x64" }
            "ARM64" { "arm64" }
            "x86"   { "x86" }
            default { "x64" }
        }
        $index = Invoke-RestMethod -Uri "https://nodejs.org/dist/index.json" -UseBasicParsing -TimeoutSec 30
        $lts = $index | Where-Object { $_.lts -ne $false } | Select-Object -First 1
        if (-not $lts) { throw "Не удалось определить LTS-версию Node.js." }
        $ver = $lts.version
        $nodeRoot = Join-Path $env:LOCALAPPDATA "OpenCodePlugins\node"
        $nodeDir = Join-Path $nodeRoot "node-$ver-win-$arch"
        $npmCmd = Join-Path $nodeDir "npm.cmd"
        if (-not (Test-Path $npmCmd)) {
            $zip = Join-Path $env:TEMP "node-$ver-win-$arch.zip"
            $url = "https://nodejs.org/dist/$ver/node-$ver-win-$arch.zip"
            Write-Log "Скачиваю $url"
            Invoke-WebRequest -Uri $url -OutFile $zip -UseBasicParsing -TimeoutSec 300
            New-Item -ItemType Directory -Path $nodeRoot -Force | Out-Null
            Expand-Archive -Path $zip -DestinationPath $nodeRoot -Force
            Remove-Item $zip -Force -ErrorAction SilentlyContinue
        }
        if (-not (Test-Path $npmCmd)) {
            $found = Get-ChildItem $nodeRoot -Recurse -Filter npm.cmd -ErrorAction SilentlyContinue | Select-Object -First 1
            if ($found) { $npmCmd = $found.FullName }
        }
        if (-not (Test-Path $npmCmd)) { throw "Не удалось найти npm.cmd после распаковки Node.js." }
        Write-Log "Portable Node.js готов: $nodeDir" "OK"
        return $npmCmd
    } catch {
        Fail "Не удалось скачать Node.js: $($_.Exception.Message)"
    }
}

function Find-NodeExe {
    param([string]$NpmPath)
    if ($NpmPath) {
        $candidate = Join-Path (Split-Path $NpmPath) "node.exe"
        if (Test-Path $candidate) { return $candidate }
    }
    $cmd = Get-Command node.exe -ErrorAction SilentlyContinue
    if ($cmd -and $cmd.Source) { return $cmd.Source }
    return "node"
}

function Resolve-InstallDir {
    if ($InstallDir) {
        if (-not (Test-WritableDir $InstallDir)) { Fail "Нет прав на запись в $InstallDir" }
        return (Resolve-Path $InstallDir).Path
    }

    $candidates = @(
        "C:\Users\Public\OpenCodePlugins\prompt-coach",
        (Join-Path $env:LOCALAPPDATA "OpenCodePlugins\prompt-coach"),
        (Join-Path $env:USERPROFILE ".config\opencode\plugins\prompt-coach"),
        (Join-Path $env:ProgramData "OpenCodePlugins\prompt-coach")
    )

    foreach ($c in $candidates) {
        if (-not $c) { continue }
        if ((Test-AsciiPath $c) -and (Test-WritableDir $c)) {
            return (Resolve-Path $c).Path
        }
    }
    foreach ($c in $candidates) {
        if (-not $c) { continue }
        if (Test-WritableDir $c) {
            Write-Log "ВНИМАНИЕ: путь содержит не-ASCII символы: $c. Desktop может не загрузить плагин." "WARN"
            return (Resolve-Path $c).Path
        }
    }
    Fail "Не удалось найти папку для установки. Укажите её вручную: -InstallDir C:\OpenCodePlugins\prompt-coach"
}

function Get-OpenCodeConfigDir {
    param([string]$CliPath)
    if ($CliPath) {
        try {
            $out = & $CliPath debug paths 2>&1
            foreach ($line in $out) {
                if ($line -match "^\s*config\s+(.+)$") {
                    return $Matches[1].Trim()
                }
            }
        } catch { }
    }
    return (Join-Path $env:USERPROFILE ".config\opencode")
}

function Resolve-ConfigFile {
    param([string]$ConfigDir)
    if ($ConfigPath) { return $ConfigPath }
    $jsonc = Join-Path $ConfigDir "opencode.jsonc"
    $json = Join-Path $ConfigDir "opencode.json"
    if (Test-Path $jsonc) { return $jsonc }
    if (Test-Path $json) { return $json }
    return $jsonc
}

try {
    Write-Log "=== Prompt Coach installer ==="
    Write-Log "Лог: $script:LogFile"

    if (-not (Test-Path (Join-Path $script:Payload "package.json"))) {
        Fail "Не найден payload\package.json. Распакуйте архив полностью и запустите install.cmd из корня папки."
    }

    $cli = Find-OpenCodeCli
    if ($cli) {
        Write-Log "OpenCode CLI: $cli"
    } else {
        Write-Log "OpenCode CLI не найден. Установка продолжится, но проверка через CLI будет пропущена." "WARN"
    }

    $target = Resolve-InstallDir
    Write-Log "Папка установки: $target"
    if (-not (Test-AsciiPath $target)) {
        Write-Log "ВНИМАНИЕ: путь установки содержит не-ASCII символы. OpenCode Desktop может не загрузить плагин." "WARN"
    }

    Write-Log "Копирую файлы плагина..."
    New-Item -ItemType Directory -Path $target -Force | Out-Null
    Get-ChildItem -Path $script:Payload -Force | ForEach-Object {
        Copy-Item -Path $_.FullName -Destination $target -Recurse -Force
    }

    $guiBundle = Join-Path $target "dist\gui-experimental.cjs"
    if (-not (Test-Path $guiBundle)) {
        Fail "Не найден dist\gui-experimental.cjs. Архив повреждён или собран неправильно."
    }

    $npm = Ensure-Npm
    $nodeExe = Find-NodeExe -NpmPath $npm
    Write-Log "npm: $npm"
    Write-Log "node: $nodeExe"

    Write-Log "Устанавливаю зависимости (нужен интернет, может занять несколько минут)..."
    Push-Location $target
    try {
        $env:npm_config_audit = "false"
        $env:npm_config_fund = "false"
        $env:Path = "$(Split-Path $npm);$env:Path"
        $oldEap = $ErrorActionPreference
        $ErrorActionPreference = "Continue"
        try {
            & $npm install --omit=dev --legacy-peer-deps --no-audit --no-fund --no-progress 2>&1 |
                ForEach-Object {
                    $text = $_.ToString()
                    if ($text.Trim()) {
                        Write-Host $text
                        try { Add-Content -Path $script:LogFile -Value $text -Encoding UTF8 } catch { }
                    }
                }
            $npmExit = $LASTEXITCODE
        } finally {
            $ErrorActionPreference = $oldEap
        }
        if ($npmExit -ne 0) {
            Fail "npm install завершился с ошибкой (код $npmExit). См. лог: $script:LogFile"
        }
    } finally {
        Pop-Location
    }

    $pluginPkg = Join-Path $target "node_modules\@opencode\plugin\package.json"
    if (-not (Test-Path $pluginPkg)) {
        Fail "Зависимости не установились: нет node_modules\@opencode\plugin. Проверьте интернет и лог."
    }

    $configDir = Get-OpenCodeConfigDir -CliPath $cli
    $configFile = Resolve-ConfigFile -ConfigDir $configDir
    $mergeScript = Join-Path $script:InstallerRoot "merge-config.mjs"
    if (-not (Test-Path $mergeScript)) {
        Fail "Не найден merge-config.mjs. Распакуйте архив полностью."
    }

    Write-Log "Прописываю плагин в конфиг: $configFile"
    & $nodeExe $mergeScript $configFile $target
    if ($LASTEXITCODE -ne 0) {
        Fail "Не удалось обновить конфиг OpenCode. См. лог: $script:LogFile"
    }

    if (-not $SkipVerify) {
        Write-Log "Проверяю установку..."

        Push-Location $target
        try {
            $resolve = & $nodeExe --input-type=module -e "await import('@opencode/plugin'); await import('@opencode/plugin/gui'); await import('solid-js'); console.log('ESM OK')" 2>&1
            if ($LASTEXITCODE -ne 0) {
                Write-Log "Не удалось проверить зависимости: $resolve" "WARN"
            } else {
                Write-Log "Зависимости на месте." "OK"
            }
        } finally {
            Pop-Location
        }

        if ($cli) {
            try {
                & $cli reload 2>&1 | Out-Null
            } catch { }

            try {
                $list = & $cli plugin list 2>&1
                if (($list | Out-String) -match "prompt-coach") {
                    Write-Log "OpenCode видит плагин prompt-coach." "OK"
                } else {
                    Write-Log "OpenCode пока не показывает плагин. Перезапустите OpenCode." "WARN"
                }
            } catch {
                Write-Log "Не удалось выполнить 'opencode plugin list': $($_.Exception.Message)" "WARN"
            }
        }
    }

    Write-Log "ГОТОВО. Плагин установлен в: $target" "OK"
    Write-Log "Конфиг: $configFile" "OK"
    Write-Log "Запустите OpenCode и введите /coach."
    Write-Log "Если OpenCode уже открыт, перезапустите его или выполните /reload."
    Write-Log "Лог: $script:LogFile"
    exit 0
} catch {
    Fail "Непредвиденная ошибка: $($_.Exception.Message)"
}
