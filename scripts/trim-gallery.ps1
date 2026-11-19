$lines = Get-Content 'f:\Memory-Rooms\components\MasonryGallery.tsx'
$trimmed = $lines[0..352]
Set-Content 'f:\Memory-Rooms\components\MasonryGallery.tsx' -Value $trimmed
Write-Host "Done. Lines: $($trimmed.Count)"
