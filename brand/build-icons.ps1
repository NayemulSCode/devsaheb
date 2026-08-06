# Rasterises favicon.svg and og-default.html into shippable PNGs, then packs
# a legacy favicon.ico. Requires Chrome or Edge.
# Run:  powershell -ExecutionPolicy Bypass -File build-icons.ps1

$ErrorActionPreference = 'Stop'
$dir = Split-Path -Parent $MyInvocation.MyCommand.Path
$out = Join-Path $dir 'raster'
New-Item -ItemType Directory -Force -Path $out | Out-Null

$chrome = @(
  "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
  "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe",
  "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1

if (-not $chrome) { throw 'No Chrome or Edge found.' }

function Render {
  param([string]$Url, [string]$File, [int]$W, [int]$H)
  $target = Join-Path $out $File
  if (Test-Path $target) { Remove-Item $target -Force }
  # Start-Process, not the call operator: redirecting a native exe's stderr
  # inside PS 5.1 raises NativeCommandError even on a clean exit.
  # Not $args - that is an automatic variable and assigning to it breaks the call.
  $cargs = @(
    '--headless=new', '--disable-gpu', '--hide-scrollbars',
    '--allow-file-access-from-files', '--force-device-scale-factor=1',
    # Inner quotes are required - Start-Process does not quote paths with spaces.
    "--screenshot=`"$target`"", "--window-size=$W,$H", $Url
  )
  Start-Process -FilePath $chrome -ArgumentList $cargs -Wait -NoNewWindow `
                -RedirectStandardError ([System.IO.Path]::GetTempFileName())
  Start-Sleep -Milliseconds 250
  if (Test-Path $target) { "  $File  ${W}x${H}" } else { "  $File FAILED" }
}

$iconUrl = 'file:///' + (Join-Path $dir '_icon.html').Replace('\','/').Replace(' ','%20')
$ogUrl   = 'file:///' + (Join-Path $dir 'og-default.html').Replace('\','/').Replace(' ','%20')

'icons:'
foreach ($s in 16, 32, 48, 180, 192, 512) {
  Render -Url $iconUrl -File "icon-$s.png" -W $s -H $s
}

'open graph:'
Render -Url $ogUrl -File 'og-default.png' -W 1200 -H 630

# ---- Pack favicon.ico (PNG-in-ICO, supported since Vista) ------------------
'ico:'
$sizes = 16, 32, 48
$pngs = $sizes | ForEach-Object { [System.IO.File]::ReadAllBytes((Join-Path $out "icon-$_.png")) }

$ms = New-Object System.IO.MemoryStream
$bw = New-Object System.IO.BinaryWriter($ms)
$bw.Write([uint16]0); $bw.Write([uint16]1); $bw.Write([uint16]$sizes.Count)

$offset = 6 + (16 * $sizes.Count)
for ($i = 0; $i -lt $sizes.Count; $i++) {
  $s = $sizes[$i]
  $bw.Write([byte]$(if ($s -ge 256) { 0 } else { $s }))   # width
  $bw.Write([byte]$(if ($s -ge 256) { 0 } else { $s }))   # height
  $bw.Write([byte]0)                                       # palette
  $bw.Write([byte]0)                                       # reserved
  $bw.Write([uint16]1)                                     # colour planes
  $bw.Write([uint16]32)                                    # bits per pixel
  $bw.Write([uint32]$pngs[$i].Length)
  $bw.Write([uint32]$offset)
  $offset += $pngs[$i].Length
}
foreach ($p in $pngs) { $bw.Write($p) }
$bw.Flush()
[System.IO.File]::WriteAllBytes((Join-Path $out 'favicon.ico'), $ms.ToArray())
$bw.Dispose(); $ms.Dispose()
"  favicon.ico  $($sizes -join '/')"
