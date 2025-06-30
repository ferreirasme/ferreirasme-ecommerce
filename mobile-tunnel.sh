#!/bin/bash
# Mobile Testing Tunnel Setup Script

echo "Mobile Testing Tunnel Setup"
echo "=========================="
echo ""
echo "Choose a tunneling method:"
echo "1) Local Network (Same WiFi)"
echo "2) Bore.pub (Free, No signup)"
echo "3) Serveo.net (SSH-based)"
echo "4) Cloudflare (Quick tunnel)"
echo ""
read -p "Enter your choice (1-4): " choice

# Start Next.js server in background
echo "Starting Next.js server on port 3005..."
npm run dev &
SERVER_PID=$!
sleep 5

case $choice in
    1)
        IP=$(hostname -I | awk '{print $1}')
        echo ""
        echo "================================================"
        echo "Access your site at:"
        echo ""
        echo "  http://$IP:3005"
        echo ""
        echo "Make sure:"
        echo "- Mobile device is on the same WiFi network"
        echo "- Windows Firewall allows port 3005"
        echo "- No VPN is active on either device"
        echo "================================================"
        echo ""
        echo "Press Ctrl+C to stop the server"
        wait $SERVER_PID
        ;;
    2)
        # Check if bore is installed
        if ! command -v bore &> /dev/null; then
            echo "Bore not found. Installing..."
            curl -L https://github.com/ekzhang/bore/releases/download/v0.5.1/bore-v0.5.1-x86_64-unknown-linux-musl.tar.gz -o /tmp/bore.tar.gz
            tar -xzf /tmp/bore.tar.gz -C /tmp/
            chmod +x /tmp/bore
            sudo mv /tmp/bore /usr/local/bin/
            rm /tmp/bore.tar.gz
        fi
        echo ""
        echo "Creating Bore tunnel..."
        echo "Your public URL will appear below:"
        echo ""
        bore local 3005 --to bore.pub
        ;;
    3)
        echo ""
        echo "Creating Serveo tunnel..."
        echo "Your public URL will appear below:"
        echo ""
        ssh -o StrictHostKeyChecking=no -R 80:localhost:3005 serveo.net
        ;;
    4)
        # Check if cloudflared is installed
        if ! command -v cloudflared &> /dev/null; then
            echo "Cloudflared not found. Installing..."
            wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb -O /tmp/cloudflared.deb
            sudo dpkg -i /tmp/cloudflared.deb
            rm /tmp/cloudflared.deb
        fi
        echo ""
        echo "Creating Cloudflare tunnel..."
        echo "Your public URL will appear below:"
        echo ""
        cloudflared tunnel --url http://localhost:3005
        ;;
    *)
        echo "Invalid choice"
        kill $SERVER_PID 2>/dev/null
        exit 1
        ;;
esac

# Cleanup on exit
trap "kill $SERVER_PID 2>/dev/null" EXIT