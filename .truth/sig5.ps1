$out = "E:\CRM-v01\.truth\sig5.txt"
$sb = New-Object System.Text.StringBuilder
$rows = Get-Content -LiteralPath "E:\CRM-v01\lib\admin\regions.ts"
$n = 0
foreach ($line in $rows) {
  $n++
  $t = $line.Trim()
  if ($t -match "^export async function changeRegionStatus") { [void]$sb.AppendLine("SIG changeRegionStatus @ " + $n) }
  if ($t -match "^export async function updateRegion") { [void]$sb.AppendLine("SIG updateRegion @ " + $n) }
  if ($t -match "^export async function createRegion") { [void]$sb.AppendLine("SIG createRegion @ " + $n) }
  if ($t -match "^export async function renameRegion") { [void]$sb.AppendLine("SIG renameRegion @ " + $n) }
  if ($n -ge 136 -and $n -le 182) { [void]$sb.AppendLine($n.ToString().PadLeft(4) + "  " + $line) }
}
Set-Content -LiteralPath $out -Value $sb.ToString() -Encoding UTF8
Write-Output ("SIG5 LEN:" + $sb.Length)
