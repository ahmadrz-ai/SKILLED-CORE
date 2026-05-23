Add-Type -AssemblyName System.Drawing

function Crop-ImageFile-Square {
    param (
        [string]$imagePath
    )

    if (-not (Test-Path $imagePath)) {
        Write-Warning "File not found: $imagePath"
        return
    }

    Write-Host "`n--- Processing image (Centering in Max-Size Square): $imagePath ---"
    
    # Load image using a stream so the file is not locked
    $stream = New-Object System.IO.FileStream($imagePath, [System.IO.FileMode]::Open, [System.IO.FileAccess]::Read)
    $bmp = [System.Drawing.Image]::FromStream($stream)
    $stream.Close()
    $stream.Dispose()

    $width = $bmp.Width
    $height = $bmp.Height
    Write-Host "Original dimensions: $width x $height"

    $minX = $width
    $minY = $height
    $maxX = -1
    $maxY = -1

    # Scan for non-transparent pixels
    Write-Host "Scanning pixels for transparency..."
    for ($x = 0; $x -lt $width; $x++) {
        for ($y = 0; $y -lt $height; $y++) {
            $pixel = $bmp.GetPixel($x, $y)
            if ($pixel.A -gt 5) { # Threshold: Alpha > 5
                if ($x -lt $minX) { $minX = $x }
                if ($x -gt $maxX) { $maxX = $x }
                if ($y -lt $minY) { $minY = $y }
                if ($y -gt $maxY) { $maxY = $y }
            }
        }
    }

    if ($maxX -eq -1 -or $maxY -eq -1) {
        Write-Warning "No non-transparent pixels found!"
        $bmp.Dispose()
        return
    }

    # Add a tiny 2px padding on all sides to make sure no edge pixels are cut off
    $minX = [Math]::Max(0, $minX - 2)
    $minY = [Math]::Max(0, $minY - 2)
    $maxX = [Math]::Min($width - 1, $maxX + 2)
    $maxY = [Math]::Min($height - 1, $maxY + 2)

    $croppedWidth = $maxX - $minX + 1
    $croppedHeight = $maxY - $minY + 1
    Write-Host "Found bounding box: X = $minX to $maxX, Y = $minY to $maxY"
    Write-Host "Cropped dimensions: $croppedWidth x $croppedHeight"

    # Create the cropped bitmap
    $croppedBmp = New-Object System.Drawing.Bitmap($croppedWidth, $croppedHeight)
    $gCrop = [System.Drawing.Graphics]::FromImage($croppedBmp)
    $gCrop.Clear([System.Drawing.Color]::Transparent)

    $srcRect = New-Object System.Drawing.Rectangle($minX, $minY, $croppedWidth, $croppedHeight)
    $destRect = New-Object System.Drawing.Rectangle(0, 0, $croppedWidth, $croppedHeight)
    $gCrop.DrawImage($bmp, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
    $gCrop.Dispose()
    $bmp.Dispose()

    # Now make it a perfect square based on the maximum dimension
    $maxDimension = [Math]::Max($croppedWidth, $croppedHeight)
    Write-Host "Target square dimension: $maxDimension x $maxDimension"

    $squareBmp = New-Object System.Drawing.Bitmap($maxDimension, $maxDimension)
    $gSquare = [System.Drawing.Graphics]::FromImage($squareBmp)
    $gSquare.Clear([System.Drawing.Color]::Transparent)

    # Center the cropped image in the square canvas
    $offsetX = [Math]::Floor(($maxDimension - $croppedWidth) / 2)
    $offsetY = [Math]::Floor(($maxDimension - $croppedHeight) / 2)

    $destRectSquare = New-Object System.Drawing.Rectangle($offsetX, $offsetY, $croppedWidth, $croppedHeight)
    $srcRectSquare = New-Object System.Drawing.Rectangle(0, 0, $croppedWidth, $croppedHeight)
    
    $gSquare.DrawImage($croppedBmp, $destRectSquare, $srcRectSquare, [System.Drawing.GraphicsUnit]::Pixel)
    $gSquare.Dispose()
    $croppedBmp.Dispose()

    # Save backup
    $backupPath = $imagePath + ".bak2"
    if (Test-Path $backupPath) {
        Remove-Item $backupPath -Force
    }
    Copy-Item $imagePath $backupPath
    Write-Host "Backup saved to: $backupPath"

    # Save cropped square image back to original path
    Write-Host "Saving centered square image to: $imagePath"
    $squareBmp.Save($imagePath, [System.Drawing.Imaging.ImageFormat]::Png)
    $squareBmp.Dispose()

    Write-Host "Successfully cropped, centered, and updated image to square format!"
}

# Run on public/logo.png
Crop-ImageFile-Square -imagePath "c:\Users\AhmadRaza\OneDrive - Cloud Surge Solutions Ltd\Documents\SkilledCore\skilled-core\public\logo.png"

# Run on src/app/icon.png
Crop-ImageFile-Square -imagePath "c:\Users\AhmadRaza\OneDrive - Cloud Surge Solutions Ltd\Documents\SkilledCore\skilled-core\src\app\icon.png"
