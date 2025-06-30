# WSL2 Mobile Device Access Analysis

## Current Situation

- **WSL2 IP**: 172.18.59.172
- **Windows Host IP**: 192.168.131.99
- **Next.js Dev Server Port**: 3005
- **Server Configuration**: `next dev -p 3005 -H 0.0.0.0` (correctly bound to all interfaces)
- **Antivirus**: Kaspersky installed

## Problem Diagnosis

The Next.js dev server works on localhost:3005 but mobile devices cannot access it via the Windows IP (192.168.131.99:3005). This is a common WSL2 networking issue with multiple potential causes.

## Root Causes

### 1. **WSL2 Network Architecture**
- WSL2 runs in a lightweight VM with its own virtual network adapter
- The WSL2 IP (172.18.59.172) is on a different subnet than the Windows host
- Port forwarding is required to bridge this gap

### 2. **Windows Firewall**
- By default, Windows Firewall blocks incoming connections to forwarded ports
- The vEthernet (WSL) adapter is treated as a "Public" network with restrictive rules

### 3. **Kaspersky Firewall**
- Kaspersky adds an additional layer of network filtering
- It may block connections even if Windows Firewall allows them
- The WSL virtual adapter needs to be marked as "trusted" in Kaspersky

### 4. **Port Proxy Configuration**
- The existing netsh port proxy rule may not be properly configured
- WSL2 IP changes on restart, making static rules obsolete

## Solution Steps

### Step 1: Run the PowerShell Fix Script (As Administrator)

```powershell
# In Windows PowerShell (Run as Administrator)
cd C:\path\to\your\wsl\project
.\fix-wsl2-network.ps1
```

This script will:
- Remove old port proxy rules
- Add new rules with the current WSL IP
- Configure Windows Firewall
- Provide Kaspersky configuration instructions

### Step 2: Configure Kaspersky

1. **Add Port Rule**:
   - Open Kaspersky → Settings → Protection → Firewall
   - Click "Configure packet rules"
   - Add new rule:
     - Name: "WSL2 Development Server"
     - Action: Allow
     - Direction: Incoming
     - Protocol: TCP
     - Local port: 3005
     - Remote addresses: Any

2. **Trust WSL Network Adapter**:
   - Go to Settings → Protection → Firewall → Networks
   - Find "vEthernet (WSL)" adapter
   - Set as "Trusted network"

3. **Alternative for Testing**:
   - Temporarily disable Kaspersky Firewall
   - If it works, the issue is confirmed to be Kaspersky

### Step 3: Verify Next.js Configuration

The server is correctly configured with `-H 0.0.0.0` in package.json:
```json
"dev": "next dev -p 3005 -H 0.0.0.0"
```

### Step 4: Start the Server

```bash
# In WSL2
npm run dev
# or
./start-mobile.sh
```

### Step 5: Test Access

1. **From Windows**: http://localhost:3005
2. **From Mobile**: http://192.168.131.99:3005

## Advanced Troubleshooting

### If Still Not Working:

1. **Check Port Binding**:
   ```bash
   # In WSL2
   ss -tln | grep 3005
   ```
   Should show `0.0.0.0:3005` not `127.0.0.1:3005`

2. **Test Without Kaspersky**:
   - Temporarily disable Kaspersky completely
   - If it works, focus on Kaspersky configuration

3. **Router Settings**:
   - Check if AP Isolation is enabled (prevents devices from seeing each other)
   - Ensure mobile device is on same network segment

4. **WSL2 Restart**:
   ```powershell
   # In PowerShell
   wsl --shutdown
   # Then restart WSL2
   ```

5. **Alternative Solutions**:
   - Use ngrok for temporary external access
   - Use Windows native Node.js instead of WSL2
   - Configure a reverse proxy on Windows

## Security Considerations

The current Content Security Policy (CSP) in next.config.ts is quite restrictive. For development with mobile devices, you might need to temporarily adjust:

```typescript
// In next.config.ts, temporarily for development
connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.cttexpresso.pt https://viacep.com.br http://192.168.131.99:3005;
```

## Automated Solution

The `start-mobile.sh` script already exists but needs the Windows-side configuration to work. After running the PowerShell script and configuring Kaspersky, this script should work correctly.

## Common Issues Summary

1. **Port proxy not configured** → Run PowerShell script
2. **Windows Firewall blocking** → Script adds rules automatically
3. **Kaspersky blocking** → Manual configuration required
4. **WSL IP changed** → Re-run PowerShell script
5. **Wrong bind address** → Already fixed with `-H 0.0.0.0`

## Quick Test Commands

```powershell
# Windows PowerShell (check rules)
netsh interface portproxy show v4tov4
netsh advfirewall firewall show rule name="WSL2 Next.js Port 3005"

# WSL2 (check server)
curl http://localhost:3005
curl http://172.18.59.172:3005
```

## Conclusion

The issue is most likely caused by Kaspersky Firewall blocking the forwarded connection. The combination of:
1. Proper port forwarding (netsh rules)
2. Windows Firewall exception
3. Kaspersky Firewall configuration
4. Correct Next.js binding (0.0.0.0)

Should resolve the mobile access issue. The PowerShell script automates steps 1-2, but Kaspersky requires manual configuration due to its security model.