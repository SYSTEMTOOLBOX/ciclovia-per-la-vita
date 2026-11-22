# Test di integrazione Windows PowerShell 5.1: nessuna credenziale reale o UI modale.
$ErrorActionPreference = 'Stop'
$root = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$launcher = Join-Path $root 'AVVIA_BACKUP_CICLOVIA.cmd'
$text = [IO.File]::ReadAllText($launcher)
$script = $text.Substring($text.LastIndexOf('# POWERSHELL_BEGIN'))
$tokens = $null; $errors = $null
[void][Management.Automation.Language.Parser]::ParseInput($script, [ref]$tokens, [ref]$errors)
if ($errors.Count) { throw 'Sintassi PowerShell non valida' }
$script = $script -replace 'Start-CicloviaBackup\s*$', ''
. ([scriptblock]::Create($script))
function Assert($condition, $message) { if (!$condition) { throw $message } }
$node = (Get-Command node.exe).Source
$unicode = 'Test & ! % " ' + [char]0x00e8 + [char]0x2603
$json = @{password=$unicode} | ConvertTo-Json -Compress
$result = Invoke-PrivateNode $node '-e "let s='''' ;process.stdin.setEncoding(''utf8'');process.stdin.on(''data'',c=>s+=c);process.stdin.on(''end'',()=>process.stdout.write(s));"' $root $json
Assert ($result.Code -eq 0) 'Avvio processo Windows fallito'
Assert (($result.Output | ConvertFrom-Json).password -ceq $unicode) 'Password Unicode non preservata su stdin'
Assert ((Find-Node $root) -eq $node) 'Rilevamento Node/SDK fallito'
Assert (([regex]::Matches($script, 'UseSystemPasswordChar = \$true')).Count -eq 2) 'Campi password non mascherati'

$temporary = Join-Path ([IO.Path]::GetTempPath()) ([guid]::NewGuid().ToString())
[void][IO.Directory]::CreateDirectory($temporary)
$keyFile = Join-Path $temporary 'test.json'
$bootstrap = Join-Path $temporary 'avvio test & privacy.cmd'
[IO.File]::WriteAllText($bootstrap, ($text -replace 'Start-CicloviaBackup\s*$', "Write-Output 'BOOTSTRAP_OK'"), [Text.Encoding]::ASCII)
$boot = Invoke-PrivateNode $env:ComSpec ('/d /s /c ""' + $bootstrap + '""') $root
Assert ($boot.Code -eq 0 -and $boot.Output.Trim() -eq 'BOOTSTRAP_OK') 'Avvio CMD/PowerShell reale fallito'
[IO.File]::WriteAllText($keyFile, '{"project_id":"ciclovia-per-la-vita","type":"service_account","private_key":"SYNTHETIC","client_email":"synthetic@example.test"}')
$env:CICLOVIA_LAUNCHER = $launcher
$script:messages = @(); $script:invocations = 0
function Show-Result([string]$Message) { $script:messages += $Message }
function Find-Node { return $node }
function Select-KeyFile { return $keyFile }
function Select-BackupDirectory { return $temporary }
function Read-PrivatePassword { return 'synthetic-private-password' }
function Invoke-PrivateNode { $script:invocations++; return @{Code=0;Output='{"ok":true,"count":7}'} }
try {
    Start-CicloviaBackup
    Assert ($script:messages[-1] -match 'Adesioni salvate: 7') 'Flusso successo non confermato'
    Assert ($script:invocations -eq 1) 'Numero invocazioni inatteso'
    [IO.File]::WriteAllText($keyFile, '{"project_id":"wrong"}')
    Start-CicloviaBackup
    Assert ($script:invocations -eq 1) 'Progetto errato non bloccato'
    Assert ($script:messages[-1] -match 'Credenziale non valida') 'Esito progetto errato mancante'
    function Select-KeyFile { return $null }
    Start-CicloviaBackup
    Assert ($script:messages[-1] -match 'annullata') 'Annullamento non gestito'
    Assert ($script:invocations -eq 1) 'Annullamento ha avviato backup'
    function Select-KeyFile { throw [System.IO.IOException]::new('SENSITIVE_PATH_SENTINEL') }
    Start-CicloviaBackup
    Assert ($script:messages[-1] -notmatch 'SENSITIVE_PATH_SENTINEL') 'Errore di sistema non sanificato'
    Write-Output 'OK: bootstrap CMD reale, PowerShell 5.1, stdin Unicode, prerequisiti, mascheramento, successo simulato, progetto errato, annullamento, errori sanificati.'
} finally {
    # Solo file sintetici creati in questo test, percorso temp esplicito.
    Remove-Item -LiteralPath $keyFile -Force
    Remove-Item -LiteralPath $bootstrap -Force
    Remove-Item -LiteralPath $temporary -Force
}
