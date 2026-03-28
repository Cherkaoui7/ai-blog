Add-Type -AssemblyName System.Drawing
$ErrorActionPreference = 'Stop'

function Get-Color([string]$Hex) {
  return [System.Drawing.ColorTranslator]::FromHtml($Hex)
}

function New-RoundedPath(
  [float]$X,
  [float]$Y,
  [float]$Width,
  [float]$Height,
  [float]$Radius
) {
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $diameter = $Radius * 2

  $path.AddArc($X, $Y, $diameter, $diameter, 180, 90)
  $path.AddArc($X + $Width - $diameter, $Y, $diameter, $diameter, 270, 90)
  $path.AddArc($X + $Width - $diameter, $Y + $Height - $diameter, $diameter, $diameter, 0, 90)
  $path.AddArc($X, $Y + $Height - $diameter, $diameter, $diameter, 90, 90)
  $path.CloseFigure()
  return $path
}

function Draw-RoundedBox(
  [System.Drawing.Graphics]$Graphics,
  [float]$X,
  [float]$Y,
  [float]$Width,
  [float]$Height,
  [float]$Radius,
  [System.Drawing.Color]$FillColor,
  [System.Drawing.Color]$BorderColor,
  [float]$BorderWidth = 2
) {
  $path = New-RoundedPath -X $X -Y $Y -Width $Width -Height $Height -Radius $Radius
  $brush = New-Object System.Drawing.SolidBrush($FillColor)
  $pen = New-Object System.Drawing.Pen($BorderColor, $BorderWidth)

  $Graphics.FillPath($brush, $path)
  $Graphics.DrawPath($pen, $path)

  $pen.Dispose()
  $brush.Dispose()
  $path.Dispose()
}

function Measure-TextHeight(
  [System.Drawing.Graphics]$Graphics,
  [string]$Text,
  [System.Drawing.Font]$Font,
  [float]$Width
) {
  $layout = New-Object System.Drawing.SizeF($Width, 10000)
  $height = $Graphics.MeasureString($Text, $Font, $layout).Height
  return [math]::Ceiling($height)
}

function Draw-WrappedText(
  [System.Drawing.Graphics]$Graphics,
  [string]$Text,
  [System.Drawing.Font]$Font,
  [System.Drawing.Brush]$Brush,
  [float]$X,
  [float]$Y,
  [float]$Width
) {
  $height = Measure-TextHeight -Graphics $Graphics -Text $Text -Font $Font -Width $Width
  $rect = [System.Drawing.RectangleF]::new([float]$X, [float]$Y, [float]$Width, [float]($height + 2))
  $Graphics.DrawString($Text, $Font, $Brush, $rect)
  return $height
}

function Measure-BulletListHeight(
  [System.Drawing.Graphics]$Graphics,
  [string[]]$Items,
  [System.Drawing.Font]$Font,
  [float]$Width,
  [float]$Gap
) {
  $total = 0
  foreach ($item in $Items) {
    $total += Measure-TextHeight -Graphics $Graphics -Text ("- " + $item) -Font $Font -Width $Width
    $total += $Gap
  }
  if ($Items.Count -gt 0) {
    $total -= $Gap
  }
  return $total
}

function Draw-BulletList(
  [System.Drawing.Graphics]$Graphics,
  [string[]]$Items,
  [System.Drawing.Font]$Font,
  [System.Drawing.Brush]$Brush,
  [float]$X,
  [float]$Y,
  [float]$Width,
  [float]$Gap
) {
  $cursor = $Y
  foreach ($item in $Items) {
    $height = Draw-WrappedText -Graphics $Graphics -Text ("- " + $item) -Font $Font -Brush $Brush -X $X -Y $cursor -Width $Width
    $cursor += $height + $Gap
  }
  return $cursor
}

function Draw-CardHeading(
  [System.Drawing.Graphics]$Graphics,
  [string]$Title,
  [System.Drawing.Font]$Font,
  [System.Drawing.Brush]$Brush,
  [float]$X,
  [float]$Y,
  [float]$Width
) {
  return Draw-WrappedText -Graphics $Graphics -Text $Title.ToUpper() -Font $Font -Brush $Brush -X $X -Y $Y -Width $Width
}

function Save-Jpeg(
  [System.Drawing.Bitmap]$Bitmap,
  [string]$Path,
  [long]$Quality = 94
) {
  $codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
    Where-Object { $_.MimeType -eq 'image/jpeg' } |
    Select-Object -First 1
  $encoder = [System.Drawing.Imaging.Encoder]::Quality
  $params = New-Object System.Drawing.Imaging.EncoderParameters 1
  $params.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter($encoder, $Quality)
  $Bitmap.Save($Path, $codec, $params)
  $params.Dispose()
}

$previewPng = Join-Path $PSScriptRoot 'ai-blog-app-summary-preview.png'
$previewJpg = Join-Path $PSScriptRoot 'ai-blog-app-summary-preview.jpg'

$width = 1654
$height = 2339
$margin = 92
$gutter = 44
$columnWidth = [int](($width - ($margin * 2) - $gutter) / 2)
$footerHeight = 118

$ink = Get-Color '#102127'
$muted = Get-Color '#55666d'
$line = Get-Color '#d7e0e3'
$surface = Get-Color '#ffffff'
$panel = Get-Color '#f7fafb'
$accent = Get-Color '#0b7a75'
$accentSoft = Get-Color '#dff3f0'
$darkPanel = Get-Color '#13272f'
$darkText = Get-Color '#eff7f8'
$noteFill = Get-Color '#fff8e8'
$noteText = Get-Color '#7a5a00'

$whatItIs = 'Local-first MDX publishing app built with Next.js 16, React 19, and Ollama. It generates posts into local files and serves them through a public blog plus protected admin and pipeline views, without a paid AI API in the generation path.'
$whoItsFor = 'Primary user: a local-first publisher, solo creator, or small team that wants to generate, review, and ship blog content from its own machine, then optionally push the resulting MDX to GitHub or a hosted Next.js site.'
$features = @(
  'Generates new MDX posts locally from scripts/generate-post.ts, with --count, --topic, and --dry-run support.',
  'Uses local Ollama generation and falls back to built-in markdown templates if Ollama is unavailable.',
  'Renders a public homepage, article index, and dynamic article pages from local MDX content.',
  'Enriches posts with frontmatter, read time, related reading links, tags, and affiliate or recommended-tool sections.',
  'Provides a protected content manager with article list, preview mode, and raw MDX view.',
  'Provides a protected pipeline dashboard showing output folder, recent runs, topic usage, and GitHub publish status.',
  'Supports email capture via Mailchimp or local placeholder storage, plus optional AdSense slots and sitemap generation.'
)
$architecture = @(
  'data/topic-clusters.json and data/products.json guide topic rotation and review-style matches; scripts/generate-post.ts calls local Ollama at http://localhost:11434/api/generate, writes MDX to posts/, and logs runs to .tmp-generated/.',
  'lib/posts.ts reads posts/ and legacy app/blog/posts/, parses frontmatter with gray-matter, derives descriptions, tags, and read time, then injects related links and affiliate monetization from data/affiliate-links.json.',
  'app/page.tsx, app/blog/page.tsx, and app/blog/[slug]/page.tsx render the public site; article pages use MDXRemote and per-page metadata.',
  'app/api/admin/posts/route.ts feeds app/admin/page.tsx; lib/middleware.ts and app/api/auth/login/route.ts gate /admin and /pipeline with ADMIN_SECRET.',
  'lib/content-engine.ts reads generation logs for app/pipeline/page.tsx; app/actions/email-capture.ts stores signups locally or posts them to Mailchimp; app/sitemap.ts builds sitemap entries.'
)
$steps = @(
  'npm install',
  'Create .env.local with NEXT_PUBLIC_SITE_URL=http://localhost:3000 and ADMIN_SECRET=change-this.',
  'Start Ollama. Repo docs show ollama pull llama3 then ollama serve.',
  'Generate content with npm run generate.',
  'Run npm run dev and open http://localhost:3000.'
)
$note = 'Repo note: docs say pull llama3; the generator script requests llama3.1:8b. The current generation path does not show a remote database or paid AI API requirement.'
$evidence = 'Evidence sampled from README.md, architecture.md, SETUP_STEP_BY_STEP.md, scripts/generate-post.ts, lib/posts.ts, lib/content-engine.ts, app/page.tsx, app/blog/[slug]/page.tsx, app/admin/page.tsx, app/pipeline/page.tsx, app/actions/email-capture.ts, and related route/data files.'

$bitmap = New-Object System.Drawing.Bitmap $width, $height
$bitmap.SetResolution(200, 200)
$graphics = [System.Drawing.Graphics]::FromImage($bitmap)
$graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
$graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$graphics.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
$graphics.Clear((Get-Color '#ffffff'))

$backgroundBrush = New-Object System.Drawing.SolidBrush((Get-Color '#fbfdfd'))
$graphics.FillRectangle($backgroundBrush, 0, 0, $width, 420)
$backgroundBrush.Dispose()

$topGlow = New-Object System.Drawing.SolidBrush((Get-Color '#eef8f7'))
$graphics.FillEllipse($topGlow, $width - 420, -110, 520, 400)
$topGlow.Dispose()

$titleFont = New-Object System.Drawing.Font('Segoe UI', 28, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Point)
$subtitleFont = New-Object System.Drawing.Font('Segoe UI', 10.2, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Point)
$stampTitleFont = New-Object System.Drawing.Font('Segoe UI', 9.2, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Point)
$stampBodyFont = New-Object System.Drawing.Font('Segoe UI', 8.6, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Point)
$eyebrowFont = New-Object System.Drawing.Font('Segoe UI', 8.1, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Point)
$sectionFont = New-Object System.Drawing.Font('Segoe UI', 8.1, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Point)
$bodyFont = New-Object System.Drawing.Font('Segoe UI', 9.15, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Point)
$smallFont = New-Object System.Drawing.Font('Segoe UI', 8.25, [System.Drawing.FontStyle]::Regular, [System.Drawing.GraphicsUnit]::Point)

$inkBrush = New-Object System.Drawing.SolidBrush($ink)
$mutedBrush = New-Object System.Drawing.SolidBrush($muted)
$accentBrush = New-Object System.Drawing.SolidBrush($accent)
$darkTextBrush = New-Object System.Drawing.SolidBrush($darkText)
$noteBrush = New-Object System.Drawing.SolidBrush($noteText)

$pillX = $margin
$pillY = 78
$pillWidth = 270
$pillHeight = 34
Draw-RoundedBox -Graphics $graphics -X $pillX -Y $pillY -Width $pillWidth -Height $pillHeight -Radius 17 -FillColor $accentSoft -BorderColor $accentSoft
[void](Draw-WrappedText -Graphics $graphics -Text 'ONE-PAGE REPO SUMMARY' -Font $eyebrowFont -Brush $accentBrush -X ($pillX + 18) -Y ($pillY + 8) -Width ($pillWidth - 36))

$stampWidth = 266
$stampHeight = 124
$headerGap = 24
$headerTextWidth = $width - ($margin * 2) - $stampWidth - $headerGap
$headerTextX = $margin
$headerTextY = $pillY + $pillHeight + 22

$titleHeight = Draw-WrappedText -Graphics $graphics -Text 'AI Blog' -Font $titleFont -Brush $inkBrush -X $headerTextX -Y $headerTextY -Width $headerTextWidth
$whatItIsLabelY = $headerTextY + $titleHeight + 14
[void](Draw-CardHeading -Graphics $graphics -Title 'What It Is' -Font $sectionFont -Brush $accentBrush -X $headerTextX -Y $whatItIsLabelY -Width 180)
$subtitleY = $whatItIsLabelY + 28
$subtitleHeight = Draw-WrappedText -Graphics $graphics -Text $whatItIs -Font $subtitleFont -Brush $mutedBrush -X $headerTextX -Y $subtitleY -Width 640

$stampX = $width - $margin - $stampWidth
$stampY = 86
Draw-RoundedBox -Graphics $graphics -X $stampX -Y $stampY -Width $stampWidth -Height $stampHeight -Radius 22 -FillColor $surface -BorderColor $line
[void](Draw-WrappedText -Graphics $graphics -Text 'Workspace Evidence' -Font $stampTitleFont -Brush $inkBrush -X ($stampX + 18) -Y ($stampY + 16) -Width ($stampWidth - 36))
[void](Draw-WrappedText -Graphics $graphics -Text "Repo snapshot reviewed on 2026-03-26`nOutput target: posts/" -Font $stampBodyFont -Brush $mutedBrush -X ($stampX + 18) -Y ($stampY + 42) -Width ($stampWidth - 36))

$headerBottom = [math]::Max($subtitleY + $subtitleHeight, $stampY + $stampHeight)
$columnsTop = $headerBottom + 38
$leftX = $margin
$rightX = $margin + $columnWidth + $gutter
$cardPadding = 26
$innerWidth = $columnWidth - ($cardPadding * 2)
$bulletGap = 10

$personaHeight = 32 + (Measure-TextHeight -Graphics $graphics -Text $whoItsFor -Font $bodyFont -Width $innerWidth) + 42
$featuresHeight = 32 + (Measure-BulletListHeight -Graphics $graphics -Items $features -Font $bodyFont -Width $innerWidth -Gap $bulletGap) + 42
$archHeight = 32 + (Measure-BulletListHeight -Graphics $graphics -Items $architecture -Font $bodyFont -Width $innerWidth -Gap $bulletGap) + 42

$stepTextWidth = $innerWidth - 54
$stepGap = 12
$stepsHeight = 0
foreach ($step in $steps) {
  $stepsHeight += (Measure-TextHeight -Graphics $graphics -Text $step -Font $bodyFont -Width $stepTextWidth) + 26 + $stepGap
}
$stepsHeight -= $stepGap
$noteHeight = (Measure-TextHeight -Graphics $graphics -Text $note -Font $smallFont -Width ($innerWidth - 20)) + 20
$runHeight = 32 + $stepsHeight + 18 + $noteHeight + 40

Draw-RoundedBox -Graphics $graphics -X $leftX -Y $columnsTop -Width $columnWidth -Height $personaHeight -Radius 24 -FillColor $darkPanel -BorderColor $darkPanel
[void](Draw-CardHeading -Graphics $graphics -Title "Who It's For" -Font $sectionFont -Brush $accentBrush -X ($leftX + $cardPadding) -Y ($columnsTop + 22) -Width $innerWidth)
[void](Draw-WrappedText -Graphics $graphics -Text $whoItsFor -Font $bodyFont -Brush $darkTextBrush -X ($leftX + $cardPadding) -Y ($columnsTop + 54) -Width $innerWidth)

$featuresY = $columnsTop + $personaHeight + 28
Draw-RoundedBox -Graphics $graphics -X $leftX -Y $featuresY -Width $columnWidth -Height $featuresHeight -Radius 24 -FillColor $panel -BorderColor $line
[void](Draw-CardHeading -Graphics $graphics -Title 'What It Does' -Font $sectionFont -Brush $accentBrush -X ($leftX + $cardPadding) -Y ($featuresY + 22) -Width $innerWidth)
[void](Draw-BulletList -Graphics $graphics -Items $features -Font $bodyFont -Brush $inkBrush -X ($leftX + $cardPadding) -Y ($featuresY + 54) -Width $innerWidth -Gap $bulletGap)

Draw-RoundedBox -Graphics $graphics -X $rightX -Y $columnsTop -Width $columnWidth -Height $archHeight -Radius 24 -FillColor $panel -BorderColor $line
[void](Draw-CardHeading -Graphics $graphics -Title 'How It Works' -Font $sectionFont -Brush $accentBrush -X ($rightX + $cardPadding) -Y ($columnsTop + 22) -Width $innerWidth)
[void](Draw-BulletList -Graphics $graphics -Items $architecture -Font $bodyFont -Brush $inkBrush -X ($rightX + $cardPadding) -Y ($columnsTop + 54) -Width $innerWidth -Gap $bulletGap)

$runY = $columnsTop + $archHeight + 28
Draw-RoundedBox -Graphics $graphics -X $rightX -Y $runY -Width $columnWidth -Height $runHeight -Radius 24 -FillColor $panel -BorderColor $line
[void](Draw-CardHeading -Graphics $graphics -Title 'How To Run' -Font $sectionFont -Brush $accentBrush -X ($rightX + $cardPadding) -Y ($runY + 22) -Width $innerWidth)

$stepCursor = $runY + 56
$stepIndex = 1
foreach ($step in $steps) {
  $stepHeight = (Measure-TextHeight -Graphics $graphics -Text $step -Font $bodyFont -Width $stepTextWidth) + 26
  Draw-RoundedBox -Graphics $graphics -X ($rightX + $cardPadding) -Y $stepCursor -Width $innerWidth -Height $stepHeight -Radius 18 -FillColor $surface -BorderColor $line

  $circleSize = 27
  $circleX = $rightX + $cardPadding + 12
  $circleY = $stepCursor + 10
  $circleBrush = New-Object System.Drawing.SolidBrush($accent)
  $graphics.FillEllipse($circleBrush, $circleX, $circleY, $circleSize, $circleSize)
  $circleBrush.Dispose()

  $stepNumberFont = New-Object System.Drawing.Font('Segoe UI', 8.3, [System.Drawing.FontStyle]::Bold, [System.Drawing.GraphicsUnit]::Point)
  [void](Draw-WrappedText -Graphics $graphics -Text $stepIndex.ToString() -Font $stepNumberFont -Brush $darkTextBrush -X ($circleX + 8) -Y ($circleY + 4) -Width 14)
  $stepNumberFont.Dispose()

  [void](Draw-WrappedText -Graphics $graphics -Text $step -Font $bodyFont -Brush $inkBrush -X ($rightX + $cardPadding + 52) -Y ($stepCursor + 11) -Width $stepTextWidth)

  $stepCursor += $stepHeight + $stepGap
  $stepIndex += 1
}

Draw-RoundedBox -Graphics $graphics -X ($rightX + $cardPadding) -Y $stepCursor -Width $innerWidth -Height $noteHeight -Radius 18 -FillColor $noteFill -BorderColor $noteFill
[void](Draw-WrappedText -Graphics $graphics -Text $note -Font $smallFont -Brush $noteBrush -X ($rightX + $cardPadding + 10) -Y ($stepCursor + 10) -Width ($innerWidth - 20))

$footerY = $height - $footerHeight
$footerPen = New-Object System.Drawing.Pen($line, 2)
$graphics.DrawLine($footerPen, $margin, $footerY, $width - $margin, $footerY)
$footerPen.Dispose()
[void](Draw-WrappedText -Graphics $graphics -Text $evidence -Font $smallFont -Brush $mutedBrush -X $margin -Y ($footerY + 18) -Width ($width - ($margin * 2)))

$bitmap.Save($previewPng, [System.Drawing.Imaging.ImageFormat]::Png)
Save-Jpeg -Bitmap $bitmap -Path $previewJpg -Quality 94

$mutedBrush.Dispose()
$inkBrush.Dispose()
$accentBrush.Dispose()
$darkTextBrush.Dispose()
$noteBrush.Dispose()
$titleFont.Dispose()
$subtitleFont.Dispose()
$stampTitleFont.Dispose()
$stampBodyFont.Dispose()
$eyebrowFont.Dispose()
$sectionFont.Dispose()
$bodyFont.Dispose()
$smallFont.Dispose()
$graphics.Dispose()
$bitmap.Dispose()

Write-Output $previewPng
Write-Output $previewJpg
