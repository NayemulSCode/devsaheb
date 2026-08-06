# Generates every DevSaheb brand asset from one geometry definition.
# Run:  powershell -ExecutionPolicy Bypass -File build-brand.ps1
# Editing geometry here keeps all colourways in sync - never hand-edit the SVGs.

$ErrorActionPreference = 'Stop'
$dir = Split-Path -Parent $MyInvocation.MyCommand.Path

# ---- Mark geometry --------------------------------------------------------
# Canvas 120x120. Diamond vertices inset to 9/111 so the r6.5 node dots
# stay inside the viewBox.
$diamond = 'M60 9 111 60 60 111 9 60Z'

# Code brackets, pushed out toward the vertices to clear the letters.
$bracketL = 'M40 40 24 60 40 80'
$bracketR = 'M80 40 96 60 80 80'

# D - filled. Stem x42-49 (w7). Outer bowl: elliptical arc rx11 ry17,
# y44-78. Counter: rx5 ry10, y51-71. Even-odd cuts the counter.
$dPath = 'M42 44H51A11 17 0 0 1 51 78H42ZM49 51H51A5 10 0 0 1 51 71H49Z'

# S - stroked, weight 7 to match the D stem. Two tangent circles:
# C1 (69,54) r7 and C2 (69,68) r7, meeting exactly at (69,61).
$sPath = 'M74.36 49.5A7 7 0 1 0 69 61A7 7 0 1 1 63.64 72.5'

# Breathing room: shrink the bracket+letter group inside the diamond.
$inner = 'translate(60,60) scale(0.94) translate(-60,-60)'
$gapStroke = 12

# ---- Wordmark -------------------------------------------------------------
# Outlined from Geist v1.7.2 (SIL OFL): DEV in Black (-2% tracking),
# SAHEB in Medium (+6% tracking). Each line was normalised so its INK width
# is exactly 300 units, which is what justifies the two-line block.
# These are static outlines - no font file is needed to rebuild.
# DEV   ink box 288.55 x 101.62 -> scale 1.039681, cap height 105.65
# SAHEB ink box 290.57 x  61.90 -> scale 1.032453, cap height  62.54
# Block measures 300 x 183.56.
$devPath = 'M47.09 0L8.87 0L8.87-101.62L46.23-101.62Q71.85-101.62 85.59-88.38Q99.33-75.14 99.33-50.67L99.33-50.67Q99.33-26.34 85.81-13.17Q72.28 0 47.09 0L47.09 0ZM36.93-79.15L36.93-22.47L46.23-22.47Q58.97-22.47 64.77-29.34Q70.56-36.21 70.56-50.81L70.56-50.81Q70.56-65.41 64.77-72.28Q58.97-79.15 46.23-79.15L46.23-79.15L36.93-79.15ZM186.93 0L110.50 0L110.50-101.62L185.78-101.62L185.78-79.15L138.55-79.15L138.55-62.12L184.06-62.12L184.06-39.79L138.55-39.79L138.55-22.47L186.93-22.47L186.93 0ZM260.50 0L228.72 0L192.08-101.62L220.71-101.62L244.75-31.77L268.80-101.62L297.42-101.62L260.50 0Z'
$sahebPath = 'M28.53 1.33L28.53 1.33Q21.44 1.33 16.23-1.25Q11.01-3.84 8.01-8.43Q5.01-13.01 4.51-19.10L4.51-19.10L13.77-19.69Q14.60-13.52 18.31-10.18Q22.02-6.84 28.70-6.84L28.70-6.84Q34.45-6.84 37.63-9.01Q40.80-11.18 40.80-15.35L40.80-15.35Q40.80-17.85 39.59-19.81Q38.38-21.77 35.00-23.40Q31.62-25.03 25.11-26.61L25.11-26.61Q18.02-28.28 13.77-30.41Q9.51-32.54 7.63-35.66Q5.76-38.79 5.76-43.38L5.76-43.38Q5.76-48.47 8.22-52.35Q10.68-56.23 15.27-58.40Q19.86-60.57 26.28-60.57L26.28-60.57Q33.04-60.57 37.88-58.06Q42.71-55.56 45.47-51.22Q48.22-46.89 48.89-41.30L48.89-41.30L39.63-40.80Q38.96-45.88 35.58-49.14Q32.20-52.39 26.11-52.39L26.11-52.39Q20.94-52.39 17.98-50.01Q15.02-47.64 15.02-43.72L15.02-43.72Q15.02-41.13 16.23-39.46Q17.44-37.79 20.56-36.50Q23.69-35.21 29.45-33.87L29.45-33.87Q37.12-32.12 41.63-29.57Q46.13-27.03 48.10-23.61Q50.06-20.19 50.06-15.85L50.06-15.85Q50.06-10.60 47.34-6.72Q44.63-2.84 39.79-0.75Q34.96 1.33 28.53 1.33ZM70.83 0L61.23 0L82.59-59.23L94.02-59.23L115.38 0L105.78 0L100.36-15.43L76.17-15.43L70.83 0ZM88.26-50.64L79.00-23.61L97.61-23.61L88.26-50.64ZM138.24 0L129.23 0L129.23-59.23L138.24-59.23L138.24-33.87L165.60-33.87L165.60-59.23L174.61-59.23L174.61 0L165.60 0L165.60-25.70L138.24-25.70L138.24 0ZM233.18 0L193.97 0L193.97-59.23L232.51-59.23L232.51-50.97L202.98-50.97L202.98-33.70L231.51-33.70L231.51-25.70L202.98-25.70L202.98-8.26L233.18-8.26L233.18 0ZM274.22 0L249.78 0L249.78-59.23L271.05-59.23Q281.73-59.23 287.15-55.39Q292.58-51.56 292.58-43.21L292.58-43.21Q292.58-38.13 289.66-34.75Q286.74-31.37 281.56-30.62L281.56-30.62Q287.99-29.87 291.53-26.03Q295.08-22.19 295.08-16.27L295.08-16.27Q295.08-8.18 289.66-4.09Q284.23 0 274.22 0L274.22 0ZM258.79-51.14L258.79-33.95L270.88-33.95Q276.81-33.95 280.06-36.21Q283.31-38.46 283.31-42.55L283.31-42.55Q283.31-51.14 270.88-51.14L270.88-51.14L258.79-51.14ZM258.79-26.28L258.79-8.09L273.97-8.09Q279.56-8.09 282.69-10.39Q285.82-12.68 285.82-17.10L285.82-17.10Q285.82-21.44 282.69-23.86Q279.56-26.28 273.97-26.28L273.97-26.28L258.79-26.28Z'

$devXform   = 'translate(0,105.65) scale(1.039681) translate(-8.87,0)'
$sahebXform = 'translate(0,182.19) scale(1.032453) translate(-4.51,0)'
$blockW = 300.0
$blockH = 183.56

# ---- Builders -------------------------------------------------------------

function Get-MarkDefs { param([string]$MaskId)
@"
    <mask id="$MaskId">
      <rect width="120" height="120" fill="#fff"/>
      <g transform="$inner">
        <path d="$sPath" fill="none" stroke="#000" stroke-width="$gapStroke" stroke-linecap="round"/>
      </g>
    </mask>
"@
}

function Get-MarkShapes { param([string]$Color, [string]$MaskId)
@"
  <path d="$diamond" fill="none" stroke="$Color" stroke-width="4"/>
  <g fill="$Color">
    <circle cx="60" cy="9" r="6.5"/>
    <circle cx="111" cy="60" r="6.5"/>
    <circle cx="60" cy="111" r="6.5"/>
    <circle cx="9" cy="60" r="6.5"/>
  </g>
  <g transform="$inner">
    <g fill="none" stroke="$Color" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="$bracketL"/>
      <path d="$bracketR"/>
    </g>
    <path d="$dPath" mask="url(#$MaskId)" fill="$Color" fill-rule="evenodd"/>
    <path d="$sPath" fill="none" stroke="$Color" stroke-width="7" stroke-linecap="round"/>
  </g>
"@
}

function Get-Wordmark { param([string]$DevColor, [string]$SahebColor)
@"
    <g transform="$devXform"><path fill="$DevColor" d="$devPath"/></g>
    <g transform="$sahebXform"><path fill="$SahebColor" d="$sahebPath"/></g>
"@
}

function New-Mark { param([string]$Color, [string]$MaskId)
@"
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120" role="img" aria-labelledby="$MaskId-t">
  <title id="$MaskId-t">DevSaheb</title>
  <!-- Generated by build-brand.ps1 - do not hand-edit. -->
  <defs>
$(Get-MarkDefs -MaskId $MaskId)
  </defs>
$(Get-MarkShapes -Color $Color -MaskId $MaskId)
</svg>
"@
}

function New-LockupH { param([string]$MarkColor, [string]$DevColor, [string]$SahebColor, [string]$MaskId)
  # Mark 120 tall at left, wordmark scaled to 100 tall, 24 unit gap.
  $s = 100.0 / $blockH
  $wmW = [math]::Round($blockW * $s, 2)
  $x = 144
  $total = [math]::Round($x + $wmW, 0)
@"
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 $total 120" width="$total" height="120" role="img" aria-labelledby="$MaskId-t">
  <title id="$MaskId-t">DevSaheb</title>
  <!-- Generated by build-brand.ps1 - do not hand-edit. -->
  <defs>
$(Get-MarkDefs -MaskId $MaskId)
  </defs>
$(Get-MarkShapes -Color $MarkColor -MaskId $MaskId)
  <g transform="translate($x,10) scale($([math]::Round($s,6)))">
$(Get-Wordmark -DevColor $DevColor -SahebColor $SahebColor)
  </g>
</svg>
"@
}

function New-LockupStacked { param([string]$MarkColor, [string]$DevColor, [string]$SahebColor, [string]$MaskId)
  # Mark 120 centred on top, wordmark 200 wide below, 22 unit gap.
  $s = 200.0 / $blockW
  $wmH = $blockH * $s
  $y = 142
  $total = [math]::Ceiling($y + $wmH)
@"
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 $total" width="200" height="$total" role="img" aria-labelledby="$MaskId-t">
  <title id="$MaskId-t">DevSaheb</title>
  <!-- Generated by build-brand.ps1 - do not hand-edit. -->
  <defs>
$(Get-MarkDefs -MaskId $MaskId)
  </defs>
  <g transform="translate(40,0)">
$(Get-MarkShapes -Color $MarkColor -MaskId $MaskId)
  </g>
  <g transform="translate(0,$y) scale($([math]::Round($s,6)))">
$(Get-Wordmark -DevColor $DevColor -SahebColor $SahebColor)
  </g>
</svg>
"@
}

function New-Favicon { param([string]$Color, [string]$Bg)
  $bgRect = if ($Bg) { "  <rect width=`"120`" height=`"120`" rx=`"22`" fill=`"$Bg`"/>`n" } else { '' }
@"
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120" role="img" aria-labelledby="fav-t">
  <title id="fav-t">DevSaheb</title>
  <!-- Generated by build-brand.ps1 - do not hand-edit. -->
$bgRect  <path d="M60 12 108 60 60 108 12 60Z" fill="none" stroke="$Color" stroke-width="7"/>
  <g fill="$Color">
    <circle cx="60" cy="12" r="8"/>
    <circle cx="108" cy="60" r="8"/>
    <circle cx="60" cy="108" r="8"/>
    <circle cx="12" cy="60" r="8"/>
  </g>
  <g fill="none" stroke="$Color" stroke-width="8" stroke-linecap="round" stroke-linejoin="round">
    <path d="M52 44 38 60 52 76"/>
    <path d="M68 44 82 60 68 76"/>
  </g>
</svg>
"@
}

# ---- Emit -----------------------------------------------------------------

$GOLD = '#CCAA50'; $INK = '#0B1020'; $BONE = '#F7F0E6'

function Save-Svg { param([string]$Name, [string]$Content)
  $Content.TrimStart() | Set-Content (Join-Path $dir $Name) -Encoding utf8 -NoNewline
  "wrote $Name"
}

Save-Svg 'ds-mark.svg'         (New-Mark -Color $GOLD          -MaskId 'ds-gold')
Save-Svg 'ds-mark-current.svg' (New-Mark -Color 'currentColor' -MaskId 'ds-current')
Save-Svg 'ds-mark-ink.svg'     (New-Mark -Color $INK           -MaskId 'ds-ink')
Save-Svg 'ds-mark-bone.svg'    (New-Mark -Color $BONE          -MaskId 'ds-bone')

Save-Svg 'ds-lockup-h.svg'            (New-LockupH -MarkColor $GOLD -DevColor $INK  -SahebColor $GOLD -MaskId 'lh-light')
Save-Svg 'ds-lockup-h-dark.svg'       (New-LockupH -MarkColor $GOLD -DevColor $BONE -SahebColor $GOLD -MaskId 'lh-dark')
Save-Svg 'ds-lockup-h-ink.svg'        (New-LockupH -MarkColor $INK  -DevColor $INK  -SahebColor $INK  -MaskId 'lh-ink')
Save-Svg 'ds-lockup-stacked.svg'      (New-LockupStacked -MarkColor $GOLD -DevColor $INK  -SahebColor $GOLD -MaskId 'ls-light')
Save-Svg 'ds-lockup-stacked-dark.svg' (New-LockupStacked -MarkColor $GOLD -DevColor $BONE -SahebColor $GOLD -MaskId 'ls-dark')

Save-Svg 'favicon.svg'      (New-Favicon -Color $GOLD -Bg $INK)
Save-Svg 'favicon-bare.svg' (New-Favicon -Color $GOLD -Bg '')
