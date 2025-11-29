# PowerShell Script to Convert Markdown to PDF
# This script converts all AWS documentation markdown files to PDF

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "AWS Documentation Converter" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""

# Check if Pandoc is installed
Write-Host "Checking for Pandoc..." -ForegroundColor Yellow

try {
    $pandocVersion = pandoc --version 2>&1 | Select-Object -First 1
    Write-Host "✓ Pandoc found: $pandocVersion" -ForegroundColor Green
    Write-Host ""
    
    # List of files to convert
    $files = @(
        "INDEX_AWS_DOCS",
        "AWS_MEETING_GUIDE", 
        "AWS_MEETING_SUMMARY",
        "AWS_ARCHITECTURE_DIAGRAMS",
        "AWS_TECHNICAL_SPEC"
    )
    
    Write-Host "Converting files to PDF..." -ForegroundColor Yellow
    Write-Host ""
    
    $successCount = 0
    $failCount = 0
    
    foreach ($file in $files) {
        $inputFile = "$file.md"
        $outputFile = "$file.pdf"
        
        if (Test-Path $inputFile) {
            Write-Host "Converting: $inputFile → $outputFile" -ForegroundColor Cyan
            
            try {
                # Convert using Pandoc with nice formatting
                pandoc $inputFile -o $outputFile -V geometry:margin=1in --pdf-engine=wkhtmltopdf 2>&1 | Out-Null
                
                if (Test-Path $outputFile) {
                    $fileSize = (Get-Item $outputFile).Length / 1KB
                    Write-Host "  ✓ Success! ($([math]::Round($fileSize, 2)) KB)" -ForegroundColor Green
                    $successCount++
                } else {
                    # Try without wkhtmltopdf if it fails
                    pandoc $inputFile -o $outputFile -V geometry:margin=1in 2>&1 | Out-Null
                    if (Test-Path $outputFile) {
                        $fileSize = (Get-Item $outputFile).Length / 1KB
                        Write-Host "  ✓ Success! ($([math]::Round($fileSize, 2)) KB)" -ForegroundColor Green
                        $successCount++
                    } else {
                        Write-Host "  ✗ Failed to create PDF" -ForegroundColor Red
                        $failCount++
                    }
                }
            } catch {
                Write-Host "  ✗ Error: $_" -ForegroundColor Red
                $failCount++
            }
        } else {
            Write-Host "  ✗ File not found: $inputFile" -ForegroundColor Red
            $failCount++
        }
        Write-Host ""
    }
    
    Write-Host "=====================================" -ForegroundColor Cyan
    Write-Host "Conversion Complete!" -ForegroundColor Green
    Write-Host "Success: $successCount files" -ForegroundColor Green
    Write-Host "Failed: $failCount files" -ForegroundColor $(if ($failCount -gt 0) { "Red" } else { "Green" })
    Write-Host "=====================================" -ForegroundColor Cyan
    
} catch {
    Write-Host "✗ Pandoc is not installed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Quick Install Options:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Option 1 - Download Pandoc (Recommended):" -ForegroundColor Cyan
    Write-Host "  1. Visit: https://pandoc.org/installing.html"
    Write-Host "  2. Download Windows installer (.msi)"
    Write-Host "  3. Run installer"
    Write-Host "  4. Restart PowerShell"
    Write-Host "  5. Run this script again"
    Write-Host ""
    Write-Host "Option 2 - Use Chocolatey (if installed):" -ForegroundColor Cyan
    Write-Host "  choco install pandoc"
    Write-Host ""
    Write-Host "Option 3 - Use VS Code Extension:" -ForegroundColor Cyan
    Write-Host "  1. Install 'Markdown PDF' extension in VS Code"
    Write-Host "  2. Open .md file in VS Code"
    Write-Host "  3. Press Ctrl+Shift+P"
    Write-Host "  4. Type: Markdown PDF: Export (pdf)"
    Write-Host ""
}

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
