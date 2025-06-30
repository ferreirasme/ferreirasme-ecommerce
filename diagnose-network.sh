#!/bin/bash

echo "=== WSL2 Network Diagnostics ==="
echo ""

# Get WSL IP
WSL_IP=$(ip addr show eth0 | grep -oP '(?<=inet\s)\d+(\.\d+){3}')
echo "🔍 WSL2 IP Address: $WSL_IP"
echo ""

# Check if Next.js server is running
echo "🔍 Checking if Next.js is running on port 3005..."
if lsof -i :3005 > /dev/null 2>&1; then
    echo "✅ Next.js server is running on port 3005"
    lsof -i :3005 | grep LISTEN
else
    echo "❌ Next.js server is NOT running on port 3005"
fi
echo ""

# Check netstat for listening ports
echo "🔍 Checking listening ports..."
netstat -tln | grep 3005
echo ""

# Test local connectivity
echo "🔍 Testing local connectivity..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3005 | grep -q "200"; then
    echo "✅ localhost:3005 is accessible"
else
    echo "❌ localhost:3005 is NOT accessible"
fi

if curl -s -o /dev/null -w "%{http_code}" http://$WSL_IP:3005 | grep -q "200"; then
    echo "✅ $WSL_IP:3005 is accessible"
else
    echo "❌ $WSL_IP:3005 is NOT accessible"
fi
echo ""

# Check DNS
echo "🔍 DNS Configuration:"
cat /etc/resolv.conf | grep nameserver
echo ""

# Instructions for Windows checks
echo "=== Instructions for Windows PowerShell (Run as Admin) ==="
echo ""
echo "1. Check existing port proxy rules:"
echo "   netsh interface portproxy show v4tov4"
echo ""
echo "2. Remove old port proxy rule (if exists):"
echo "   netsh interface portproxy delete v4tov4 listenport=3005 listenaddress=0.0.0.0"
echo ""
echo "3. Add new port proxy rule:"
echo "   netsh interface portproxy add v4tov4 listenport=3005 listenaddress=0.0.0.0 connectport=3005 connectaddress=$WSL_IP"
echo ""
echo "4. Check Windows Firewall rules:"
echo "   netsh advfirewall firewall show rule name=all | findstr 3005"
echo ""
echo "5. Add firewall rule if missing:"
echo "   netsh advfirewall firewall add rule name=\"WSL2 Next.js Port 3005\" dir=in action=allow protocol=TCP localport=3005"
echo ""
echo "6. For Kaspersky:"
echo "   - Open Kaspersky settings"
echo "   - Go to Protection → Firewall"
echo "   - Add a new rule for port 3005"
echo "   - Or temporarily disable firewall for testing"
echo ""
echo "7. Test from Windows:"
echo "   curl http://localhost:3005"
echo "   curl http://192.168.131.99:3005"
echo ""
echo "=== Common Issues ==="
echo ""
echo "1. WSL2 IP changes on restart - need to update port proxy"
echo "2. Windows Firewall blocks by default - need explicit rule"
echo "3. Kaspersky may block even with Windows Firewall rule"
echo "4. Next.js must bind to 0.0.0.0, not just localhost"
echo ""
echo "Current Next.js command in package.json:"
grep "\"dev\":" package.json