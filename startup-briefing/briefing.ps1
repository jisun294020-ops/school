# Startup briefing: runs once per day when Windows starts.
# Output folder: Documents\StartupBriefing\YYYY-MM-DD.md
$ErrorActionPreference = 'Continue'
$here   = Split-Path -Parent $MyInvocation.MyCommand.Path
$today  = Get-Date -Format 'yyyy-MM-dd'
$outDir = Join-Path ([Environment]::GetFolderPath('MyDocuments')) 'StartupBriefing'
New-Item -ItemType Directory -Force -Path $outDir | Out-Null
$out = Join-Path $outDir "$today.md"

# Already made today (not the first boot today): just show it again.
if (Test-Path $out) { Start-Process notepad.exe $out; exit }

# Wait a little for the network after boot.
Start-Sleep -Seconds 30

if (Get-Command claude -ErrorAction SilentlyContinue) {
    $utf8 = New-Object System.Text.UTF8Encoding $false
    $OutputEncoding = $utf8
    [Console]::OutputEncoding = $utf8
    $prompt = "Today is $today.`n`n" + (Get-Content (Join-Path $here 'prompt.txt') -Raw -Encoding UTF8)
    $result = $prompt | claude -p --allowedTools "WebSearch" 2>&1 | Out-String
    if ($LASTEXITCODE -eq 0 -and $result.Trim()) {
        [IO.File]::WriteAllText($out, $result, $utf8)
        Start-Process notepad.exe $out
        exit
    }
}

# Fallback: Claude Code not installed or failed -> open the 7:47 AM briefing in Claude.
Start-Process 'https://claude.ai/code'
