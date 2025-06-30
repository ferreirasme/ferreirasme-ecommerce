#!/bin/bash

echo "📱 Iniciando servidor para acesso mobile..."
echo ""

# Pega o IP do WSL
WSL_IP=$(ip addr show eth0 | grep -oP '(?<=inet\s)\d+(\.\d+){3}')

# Pega o IP do Windows (assumindo que está na mesma rede)
WIN_IP="192.168.131.99"

echo "🔧 Configurando variáveis de ambiente..."
export NEXTAUTH_URL="http://$WIN_IP:3005"

echo ""
echo "📍 Acesse o site em:"
echo ""
echo "   No Windows:"
echo "   → http://localhost:3005"
echo ""
echo "   No celular/tablet:"
echo "   → http://$WIN_IP:3005"
echo ""
echo "   IP do WSL: $WSL_IP"
echo ""
echo "💡 Certifique-se de que:"
echo "   1. O PowerShell foi executado como admin com:"
echo "      netsh interface portproxy add v4tov4 listenport=3005 connectport=3005 connectaddress=$WSL_IP"
echo "   2. O firewall permite conexões na porta 3005"
echo "   3. O celular está na mesma rede Wi-Fi"
echo ""
echo "Pressione Ctrl+C para parar o servidor"
echo "-------------------------------------------"

# Inicia o servidor com configurações especiais
npm run dev