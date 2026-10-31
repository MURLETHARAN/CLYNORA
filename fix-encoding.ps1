$root = (Get-Location).Path
$backup = Join-Path $root "encoding-backup"

New-Item -ItemType Directory -Path $backup -Force | Out-Null

$files = Get-ChildItem $root -Recurse -File |
    Where-Object {
        $_.Extension -in ".html", ".js", ".css" -and
        $_.FullName -notlike "$backup*"
    }

foreach ($file in $files) {
    $content = [System.IO.File]::ReadAllText($file.FullName)
    $original = $content

    $content = $content.Replace("??", "&#10003;")
    $content = $content.Replace("???", "&#9889;")
    $content = $content.Replace("???", "&#8212;")
    $content = $content.Replace("???", "&#8211;")
    $content = $content.Replace("???", "&#8217;")
    $content = $content.Replace("???", "&#8220;")
    $content = $content.Replace("???", "&#8230;")

    if ($content -ne $original) {
        $relative = $file.FullName.Substring($root.Length + 1)
        $backupFile = Join-Path $backup $relative

        New-Item -ItemType Directory `
            -Path (Split-Path $backupFile) -Force | Out-Null

        Copy-Item $file.FullName $backupFile -Force

        [System.IO.File]::WriteAllText(
            $file.FullName,
            $content,
            [System.Text.UTF8Encoding]::new($false)
        )

        Write-Host "Repaired: $relative"
    }
}

Write-Host "Repair complete. Backups saved in encoding-backup."
