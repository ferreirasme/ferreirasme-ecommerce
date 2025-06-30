# PowerShell script to setup local network access for WSL Next.js development
# Run this script as Administrator in PowerShell

Write-Host "Setting up local network access for Next.js development" -ForegroundColor Green
Write-Host ""

# Get WSL IP address
$wslIp = (wsl hostname -I).Trim().Split()[0]
Write-Host "WSL IP Address: $wslIp" -ForegroundColor Yellow

# Get Windows IP address
$windowsIp = (Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.InterfaceAlias -notlike "*Loopback*" -and $_.InterfaceAlias -notlike "*WSL*" }).IPAddress | Select-Object -First 1
Write-Host "Windows IP Address: $windowsIp" -ForegroundColor Yellow
Write-Host ""

# Remove existing port proxy rules for port 3005
Write-Host "Removing existing port forwarding rules..." -ForegroundColor Cyan
netsh interface portproxy delete v4tov4 listenport=3005 listenaddress=0.0.0.0 2>$null

# Add new port forwarding rule
Write-Host "Adding port forwarding rule..." -ForegroundColor Cyan
netsh interface portproxy add v4tov4 listenport=3005 listenaddress=0.0.0.0 connectport=3005 connectaddress=$wslIp

# Check if firewall rule exists
$firewallRule = Get-NetFirewallRule -DisplayName "Next.js Dev Server" -ErrorAction SilentlyContinue

if ($firewallRule) {
    Write-Host "Firewall rule already exists" -ForegroundColor Yellow
} else {
    Write-Host "Creating firewall rule..." -ForegroundColor Cyan
    New-NetFirewallRule -DisplayName "Next.js Dev Server" -Direction Inbound -Protocol TCP -LocalPort 3005 -Action Allow
}

# Display current port proxy rules
Write-Host ""
Write-Host "Current port forwarding rules:" -ForegroundColor Green
netsh interface portproxy show v4tov4

Write-Host ""
Write-Host "Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Access your Next.js app from:" -ForegroundColor Yellow
Write-Host "  - Windows: http://localhost:3005" -ForegroundColor White
Write-Host "  - Mobile/Other devices: http://${windowsIp}:3005" -ForegroundColor White
Write-Host ""
Write-Host "Make sure:" -ForegroundColor Yellow
Write-Host "  1. Your mobile device is on the same WiFi network" -ForegroundColor White
Write-Host "  2. Next.js is running with: npm run dev" -ForegroundColor White
Write-Host "  3. No VPN is active on either device" -ForegroundColor White
Write-Host ""
Write-Host "To remove port forwarding later, run:" -ForegroundColor Gray
Write-Host "  netsh interface portproxy delete v4tov4 listenport=3005 listenaddress=0.0.0.0" -ForegroundColor Gray