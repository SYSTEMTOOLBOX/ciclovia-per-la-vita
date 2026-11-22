@echo off
setlocal DisableDelayedExpansion
set "CICLOVIA_LAUNCHER=%~f0"
powershell.exe -NoLogo -NoProfile -STA -Command "$t=[IO.File]::ReadAllText($env:CICLOVIA_LAUNCHER); & ([scriptblock]::Create($t.Substring($t.LastIndexOf('# POWERSHELL_BEGIN'))))"
exit /b %errorlevel%
# POWERSHELL_BEGIN
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
[System.Windows.Forms.Application]::EnableVisualStyles()

function Show-Result([string]$Message) {
    [void][System.Windows.Forms.MessageBox]::Show($Message, 'Backup Ciclovia', 'OK', 'Information')
}

function Select-KeyFile {
    $dialog = New-Object System.Windows.Forms.OpenFileDialog
    $dialog.Title = 'Seleziona il JSON del service account Firebase gia presente sul PC'
    $dialog.Filter = 'Credenziale Firebase (*.json)|*.json'
    $dialog.CheckFileExists = $true
    try { if ($dialog.ShowDialog() -eq 'OK') { return $dialog.FileName } }
    finally { $dialog.Dispose() }
    return $null
}

function Select-BackupDirectory {
    $dialog = New-Object System.Windows.Forms.FolderBrowserDialog
    $dialog.Description = 'Scegli Backup_Ciclovia oppure la cartella in cui crearla. Usa una cartella privata, fuori da Git e dalle cartelle condivise.'
    $dialog.ShowNewFolderButton = $true
    try {
        if ($dialog.ShowDialog() -ne 'OK') { return $null }
        $destination = $dialog.SelectedPath
        if ([IO.Path]::GetFileName($destination.TrimEnd('\')) -ine 'Backup_Ciclovia') {
            $destination = Join-Path $destination 'Backup_Ciclovia'
        }
        [void][IO.Directory]::CreateDirectory($destination)
        return $destination
    } finally { $dialog.Dispose() }
}

function Read-PrivatePassword {
    $form = New-Object System.Windows.Forms.Form
    $form.Text = 'Password privata del backup'
    $form.ClientSize = New-Object System.Drawing.Size(490, 230)
    $form.StartPosition = 'CenterScreen'
    $form.FormBorderStyle = 'FixedDialog'
    $form.MaximizeBox = $false
    $label = New-Object System.Windows.Forms.Label
    $label.Text = "Almeno 18 caratteri. Conservala separatamente dal backup.`r`nSenza questa password il backup non e' recuperabile."
    $label.SetBounds(15, 15, 460, 45)
    $first = New-Object System.Windows.Forms.TextBox
    $first.SetBounds(15, 70, 460, 25)
    $first.UseSystemPasswordChar = $true
    $first.ShortcutsEnabled = $true
    $label2 = New-Object System.Windows.Forms.Label
    $label2.Text = 'Ripeti la password:'
    $label2.SetBounds(15, 105, 460, 20)
    $second = New-Object System.Windows.Forms.TextBox
    $second.SetBounds(15, 130, 460, 25)
    $second.UseSystemPasswordChar = $true
    $ok = New-Object System.Windows.Forms.Button
    $ok.Text = 'Crea backup'; $ok.SetBounds(230, 180, 120, 30)
    $ok.Add_Click({
        if ($first.Text.Length -lt 18) { Show-Result 'Password troppo corta: servono almeno 18 caratteri.'; return }
        if ($first.Text -cne $second.Text) { Show-Result 'Le due password non coincidono.'; return }
        $form.DialogResult = 'OK'
    })
    $cancel = New-Object System.Windows.Forms.Button
    $cancel.Text = 'Annulla'; $cancel.SetBounds(360, 180, 115, 30)
    $cancel.DialogResult = 'Cancel'
    $form.AcceptButton = $ok; $form.CancelButton = $cancel
    $form.Controls.AddRange(@($label, $first, $label2, $second, $ok, $cancel))
    try { if ($form.ShowDialog() -eq 'OK') { return $first.Text } }
    finally { $first.Clear(); $second.Clear(); $form.Dispose() }
    return $null
}

function Invoke-PrivateNode([string]$Node, [string]$Arguments, [string]$Directory, [string]$InputJson = '') {
    $info = New-Object System.Diagnostics.ProcessStartInfo
    $info.FileName = $Node; $info.Arguments = $Arguments; $info.WorkingDirectory = $Directory
    $info.UseShellExecute = $false; $info.CreateNoWindow = $true
    $info.RedirectStandardInput = $true; $info.RedirectStandardOutput = $true; $info.RedirectStandardError = $true
    $info.StandardOutputEncoding = [Text.Encoding]::UTF8
    foreach ($name in @('FIREBASE_SERVICE_ACCOUNT_FILE','FIREBASE_SERVICE_ACCOUNT_JSON','GOOGLE_APPLICATION_CREDENTIALS','CICLOVIA_BACKUP_PASSPHRASE','NODE_OPTIONS')) {
        $info.EnvironmentVariables.Remove($name)
    }
    $process = New-Object System.Diagnostics.Process
    $process.StartInfo = $info
    try {
        [void]$process.Start()
        $stdout = $process.StandardOutput.ReadToEndAsync()
        $stderr = $process.StandardError.ReadToEndAsync()
        $inputBytes = [Text.Encoding]::UTF8.GetBytes($InputJson)
        $process.StandardInput.BaseStream.Write($inputBytes, 0, $inputBytes.Length)
        $process.StandardInput.Close()
        [Array]::Clear($inputBytes, 0, $inputBytes.Length)
        $InputJson = ''
        if (!$process.WaitForExit(300000)) { $process.Kill(); throw 'Operazione scaduta. Nessun esito verificato.' }
        $process.WaitForExit()
        # Non mostrare mai stdout/stderr grezzi: potrebbero contenere dettagli SDK.
        return @{Code=$process.ExitCode; Output=$stdout.GetAwaiter().GetResult()}
    } finally { $process.Dispose() }
}

function Find-Node([string]$Root) {
    $command = Get-Command node.exe -ErrorAction SilentlyContinue
    if (!$command) { throw 'Installa Node.js 22 LTS dal sito ufficiale nodejs.org, poi riavvia questo programma.' }
    $node = $command.Source
    $check = Invoke-PrivateNode $node '-e "if(Number(process.versions.node.split(''.'')[0])<22)process.exit(1)"' $Root
    if ($check.Code -ne 0) { throw 'Serve Node.js 22 o successivo. Aggiornalo dal sito ufficiale nodejs.org.' }
    $sdk = Invoke-PrivateNode $node '-e "require(''firebase-admin'')"' $Root
    if ($sdk.Code -ne 0) {
        $npm = Join-Path ([IO.Path]::GetDirectoryName($node)) 'node_modules\npm\bin\npm-cli.js'
        if (!(Test-Path -LiteralPath $npm)) { throw 'Installa Node.js LTS con npm dal sito ufficiale nodejs.org, poi riprova.' }
        Show-Result 'Preparazione iniziale delle dipendenze. Serve Internet. Non sono ancora state richieste credenziali o password.'
        $installed = Invoke-PrivateNode $node ('"' + $npm + '" ci --omit=dev --ignore-scripts --no-audit --no-fund --loglevel=silent') $Root
        if ($installed.Code -ne 0) { throw 'Preparazione non riuscita. Verifica Internet e la presenza di package-lock.json nella cartella del progetto.' }
    }
    return $node
}

function Start-CicloviaBackup {
    $password = $null; $payload = $null
    try {
        $root = [IO.Path]::GetDirectoryName($env:CICLOVIA_LAUNCHER)
        if (!(Test-Path -LiteralPath (Join-Path $root 'scripts\windows-backup.cjs'))) { throw 'Mantieni questo programma nella cartella completa del progetto, accanto alla cartella scripts.' }
        if ($env:FIRESTORE_EMULATOR_HOST -or $env:FIREBASE_AUTH_EMULATOR_HOST) { throw 'Ambiente emulatori rilevato. Avvia il programma da una sessione Windows normale per il backup reale.' }
        $node = Find-Node $root
        $keyFile = Select-KeyFile
        if (!$keyFile) { Show-Result 'Operazione annullata. Nessun backup creato.'; return }
        try { $key = [IO.File]::ReadAllText($keyFile) | ConvertFrom-Json }
        catch { throw 'Il JSON selezionato non e'' valido. Scegli il file service account Firebase.' }
        if ($key.project_id -cne 'ciclovia-per-la-vita' -or $key.type -cne 'service_account' -or !$key.private_key -or !$key.client_email) {
            throw 'Credenziale non valida per il progetto ciclovia-per-la-vita. Nessun accesso a Firebase eseguito.'
        }
        $key = $null
        $directory = Select-BackupDirectory
        if (!$directory) { Show-Result 'Operazione annullata. Nessun backup creato.'; return }
        $password = Read-PrivatePassword
        if ($null -eq $password) { Show-Result 'Operazione annullata. Nessun backup creato.'; return }
        $payload = @{keyFile=$keyFile;directory=$directory;password=$password} | ConvertTo-Json -Compress
        $result = Invoke-PrivateNode $node 'scripts/windows-backup.cjs' $root $payload
        $password = $null; $payload = $null
        if ($result.Code -ne 0) { throw 'Backup NON confermato. Controlla permessi di lettura Firestore, Internet e cartella privata fuori da Git. Un eventuale file .enc non confermato va conservato per verifica.' }
        try { $summary = $result.Output | ConvertFrom-Json } catch { throw 'Esito non riconosciuto. Backup NON confermato.' }
        if ($summary.ok -ne $true -or $null -eq $summary.count -or $summary.count -lt 0 -or $summary.count -ne [math]::Floor($summary.count)) { throw 'Verifica non riuscita. Backup NON confermato.' }
        Show-Result ("Backup cifrato creato e verificato.`r`nAdesioni salvate: " + $summary.count)
    } catch {
        # Solo messaggi controllati; eccezioni di sistema possono contenere percorsi.
        $message = $_.Exception.Message
        if ($_.Exception.GetType() -ne [System.Management.Automation.RuntimeException]) { $message = 'Operazione non completata. Verifica prerequisiti e riprova. Nessun esito confermato.' }
        Show-Result $message
    } finally { $password = $null; $payload = $null; $key = $null }
}
Start-CicloviaBackup
