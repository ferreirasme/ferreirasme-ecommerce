#!/bin/bash

echo "🚀 Iniciando servidor Ferreira's Me E-commerce..."
echo ""

# Pega o IP do WSL
WSL_IP=$(ip addr show eth0 | grep -oP '(?<=inet\s)\d+(\.\d+){3}')

echo "📍 Acesse o site em:"
echo ""
echo "   No Windows:"
echo "   → http://localhost:3005"
echo "   → http://$WSL_IP:3005"
echo ""
echo "   No WSL/Linux:"
echo "   → http://localhost:3005"
echo ""
echo "💡 Dica: Se não abrir, execute no PowerShell (como admin):"
echo "   netsh interface portproxy add v4tov4 listenport=3005 connectport=3005 connectaddress=$WSL_IP"
echo ""
echo "Pressione Ctrl+C para parar o servidor"
echo "-------------------------------------------"

# Inicia o servidor
npm run dev