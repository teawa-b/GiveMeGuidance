# Give Me Guidance - App Store Assets Preparation Script
# Run this script to prepare your assets for App Store Connect

# Create directory structure
$storeAssetsDir = ".\assets\store"
$screenshotsDir = "$storeAssetsDir\screenshots"

# Create screenshot directories for each device size
$deviceDirs = @(
    "$screenshotsDir\iphone-67",
    "$screenshotsDir\iphone-65", 
    "$screenshotsDir\iphone-55",
    "$screenshotsDir\ipad-129"
)

foreach ($dir in $deviceDirs) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force
        Write-Host "Created: $dir" -ForegroundColor Green
    }
}

# Copy the main icon as the store icon (should be 1024x1024)
$sourceIcon = ".\assets\icon.png"
$storeIcon = "$storeAssetsDir\app-icon-1024.png"

if (Test-Path $sourceIcon) {
    Copy-Item $sourceIcon $storeIcon -Force
    Write-Host "Copied app icon to store assets" -ForegroundColor Green
} else {
    Write-Host "Warning: icon.png not found at $sourceIcon" -ForegroundColor Yellow
}

# Copy the logo as well
$sourceLogo = ".\assets\NewLogo.png"
$storeLogo = "$storeAssetsDir\logo.png"

if (Test-Path $sourceLogo) {
    Copy-Item $sourceLogo $storeLogo -Force
    Write-Host "Copied logo to store assets" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "App Store Assets Directory Structure" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Display the structure
Get-ChildItem -Path $storeAssetsDir -Recurse | ForEach-Object {
    $indent = "  " * ($_.FullName.Split('\').Count - $storeAssetsDir.Split('\').Count)
    if ($_.PSIsContainer) {
        Write-Host "$indent[DIR] $($_.Name)" -ForegroundColor Yellow
    } else {
        Write-Host "$indent$($_.Name)" -ForegroundColor White
    }
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Next Steps:" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Verify app-icon-1024.png is exactly 1024x1024 pixels" -ForegroundColor White
Write-Host "2. Ensure the icon has NO transparency (alpha channel)" -ForegroundColor White
Write-Host "3. Take screenshots on each device size simulator:" -ForegroundColor White
Write-Host "   - iPhone 14 Pro Max (6.7 inch): 1290x2796" -ForegroundColor Gray
Write-Host "   - iPhone 11 Pro Max (6.5 inch): 1242x2688" -ForegroundColor Gray
Write-Host "   - iPhone 8 Plus (5.5 inch): 1242x2208" -ForegroundColor Gray
Write-Host "   - iPad Pro 12.9 inch: 2048x2732" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Save screenshots to the appropriate folders" -ForegroundColor White
Write-Host "5. Upload to App Store Connect" -ForegroundColor White
Write-Host ""
Write-Host "Tip: Use Cmd+S in iOS Simulator to capture screenshots" -ForegroundColor Magenta
