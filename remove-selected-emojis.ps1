$path = ".\js\app.js"
$content = [System.IO.File]::ReadAllText($path)

# Remove icons only from the portal-switcher option labels.
$content = $content.Replace('\u{1FA7A} ', '')
$content = $content.Replace('\u{1F4CB} ', '')
$content = $content.Replace('\u{1F464} ', '')
$content = $content.Replace('\u{1F465} ', '')
$content = $content.Replace('âš™ï¸ ', '')

# Remove sparkle only from the voice-mode buttons.
$content = $content.Replace('âœ¨ ${t(''btn_voice_mode'')}', '${t(''btn_voice_mode'')}')
$content = $content.Replace('âœ¨ ${t(''btn_ask_voice'')}', '${t(''btn_ask_voice'')}')

# Remove icons only from the telemetry start/stop button labels.
$content = $content.Replace('''â¹ï¸ '' + t(''btn_stop_stream'') : ''â–¶ï¸ '' + t(''btn_simulate_stream'')''', '''t(''btn_stop_stream'') : t(''btn_simulate_stream'')''')

[System.IO.File]::WriteAllText($path, $content, [System.Text.UTF8Encoding]::new($false))
