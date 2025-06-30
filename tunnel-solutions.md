# Alternative Tunneling Solutions for Mobile Testing

This document provides multiple solutions to expose your local Next.js development server to mobile devices for testing. Each solution is ranked by ease of use and reliability.

## Solution 1: Local Network Access (Simplest - No External Tools)

This is the most reliable solution if your mobile device is on the same network as your development machine.

### Setup Instructions:

1. **Find your local IP address:**
   ```bash
   # On WSL/Linux
   hostname -I | awk '{print $1}'
   
   # Alternative method
   ip addr show | grep -oP '(?<=inet\s)\d+(\.\d+){3}' | grep -v 127.0.0.1 | head -1
   ```

2. **Start your Next.js server with host binding:**
   ```bash
   npm run dev
   # The package.json already has: "dev": "next dev -p 3005 -H 0.0.0.0"
   ```

3. **For WSL users, set up port forwarding:**
   
   Run PowerShell as Administrator:
   ```powershell
   # Get WSL IP
   $wslIp = (wsl hostname -I).Trim().Split()[0]
   
   # Add port forwarding
   netsh interface portproxy add v4tov4 listenport=3005 listenaddress=0.0.0.0 connectport=3005 connectaddress=$wslIp
   
   # Allow through Windows Firewall
   New-NetFirewallRule -DisplayName "Next.js Dev Server" -Direction Inbound -Protocol TCP -LocalPort 3005 -Action Allow
   ```

4. **Access from mobile:**
   - Connect mobile to same WiFi network
   - Open browser and navigate to: `http://YOUR_COMPUTER_IP:3005`
   - Example: `http://192.168.1.100:3005`

### Troubleshooting:
- Ensure both devices are on the same network
- Check firewall settings
- Try disabling VPN if active

## Solution 2: Bore.pub (Free, No Signup Required)

Bore is a free TCP tunnel that doesn't require authentication.

### Installation and Usage:

1. **Install bore:**
   ```bash
   # Download bore
   curl -L https://github.com/ekzhang/bore/releases/download/v0.5.1/bore-v0.5.1-x86_64-unknown-linux-musl.tar.gz -o bore.tar.gz
   tar -xzf bore.tar.gz
   chmod +x bore
   sudo mv bore /usr/local/bin/
   ```

2. **Create a tunnel script:**
   ```bash
   #!/bin/bash
   # Save as: tunnel-bore.sh
   
   echo "Starting Next.js server..."
   npm run dev &
   SERVER_PID=$!
   
   sleep 5
   
   echo "Creating tunnel with bore.pub..."
   bore local 3005 --to bore.pub
   
   # Clean up on exit
   trap "kill $SERVER_PID" EXIT
   ```

3. **Make it executable and run:**
   ```bash
   chmod +x tunnel-bore.sh
   ./tunnel-bore.sh
   ```

4. **Access your site:**
   - Bore will provide a URL like: `https://bore.pub:XXXXX`
   - Share this URL with your mobile device

## Solution 3: Serveo.net (SSH-based, No Installation)

Serveo provides SSH-based tunneling without requiring any installation.

### Usage:

1. **Create tunnel with single command:**
   ```bash
   ssh -R 80:localhost:3005 serveo.net
   ```

2. **For persistent subdomain:**
   ```bash
   ssh -R yourapp:80:localhost:3005 serveo.net
   # Access at: https://yourapp.serveo.net
   ```

3. **Create a convenient script:**
   ```bash
   #!/bin/bash
   # Save as: tunnel-serveo.sh
   
   echo "Starting Next.js server..."
   npm run dev &
   SERVER_PID=$!
   
   sleep 5
   
   echo "Creating Serveo tunnel..."
   echo "Your URL will be displayed below:"
   ssh -R 80:localhost:3005 serveo.net
   
   # Clean up on exit
   trap "kill $SERVER_PID" EXIT
   ```

## Solution 4: VS Code Port Forwarding (If Using VS Code)

VS Code has built-in port forwarding capabilities.

### Setup:

1. **In VS Code:**
   - Open Command Palette (Ctrl+Shift+P)
   - Type "Forward a Port"
   - Enter port 3005
   - Choose visibility (Public for mobile access)

2. **Access the forwarded URL:**
   - VS Code will provide a URL
   - This works through Microsoft's infrastructure

## Solution 5: Cloudflare Tunnel (Free Tier Available)

More complex but very reliable and feature-rich.

### Quick Setup:

1. **Install cloudflared:**
   ```bash
   # Download and install
   wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
   sudo dpkg -i cloudflared-linux-amd64.deb
   ```

2. **Create quick tunnel:**
   ```bash
   cloudflared tunnel --url http://localhost:3005
   ```

3. **You'll get a URL like:**
   ```
   https://random-name-here.trycloudflare.com
   ```

## Solution 6: LocalXpose (Free Tier)

Alternative to ngrok with free tier.

### Setup:

1. **Download LocalXpose:**
   ```bash
   wget https://api.localxpose.io/api/v2/downloads/loclx-linux-amd64.zip
   unzip loclx-linux-amd64.zip
   chmod +x loclx
   sudo mv loclx /usr/local/bin/
   ```

2. **Create tunnel:**
   ```bash
   loclx tunnel http --to localhost:3005
   ```

## Recommended Approach for Your Client

Based on ease of use and reliability, I recommend:

1. **First try:** Local Network Access (Solution 1)
   - Most reliable
   - No external dependencies
   - Best performance

2. **If local network doesn't work:** Bore.pub (Solution 2)
   - No signup required
   - Simple to use
   - Free

3. **Alternative:** Serveo.net (Solution 3)
   - No installation needed
   - Uses SSH (already available)

## Universal Script for Testing

Here's a comprehensive script that tries multiple solutions:

```bash
#!/bin/bash
# Save as: mobile-tunnel.sh

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
        echo "Access your site at:"
        echo "http://$IP:3005"
        echo ""
        echo "Make sure:"
        echo "- Mobile is on same WiFi"
        echo "- Firewall allows port 3005"
        wait $SERVER_PID
        ;;
    2)
        echo "Creating Bore tunnel..."
        bore local 3005 --to bore.pub
        ;;
    3)
        echo "Creating Serveo tunnel..."
        ssh -R 80:localhost:3005 serveo.net
        ;;
    4)
        echo "Creating Cloudflare tunnel..."
        cloudflared tunnel --url http://localhost:3005
        ;;
    *)
        echo "Invalid choice"
        kill $SERVER_PID
        exit 1
        ;;
esac

# Cleanup on exit
trap "kill $SERVER_PID 2>/dev/null" EXIT
```

Make the script executable:
```bash
chmod +x mobile-tunnel.sh
```

## Important Notes

1. **Security:** These tunnels expose your local server to the internet. Only use for testing and close when done.

2. **Environment Variables:** Update your `.env.local` with the appropriate `NEXTAUTH_URL` when using external tunnels.

3. **HTTPS:** Some features might require HTTPS. Tunneling services like Cloudflare and Serveo provide HTTPS by default.

4. **Performance:** Local network access will always be faster than tunneling services.

5. **Mobile Debugging:** For Chrome mobile debugging, use `chrome://inspect` on desktop Chrome while mobile is connected via USB.