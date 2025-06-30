#!/bin/bash

echo "🚀 Iniciando túnel Bore.pub para acesso mobile..."
echo ""

# Instala bore se não existir
if ! command -v bore &> /dev/null; then
    echo "📦 Instalando bore..."
    wget -q https://github.com/ekzhang/bore/releases/download/v0.5.1/bore-v0.5.1-x86_64-unknown-linux-musl.tar.gz
    tar -xzf bore-v0.5.1-x86_64-unknown-linux-musl.tar.gz
    rm bore-v0.5.1-x86_64-unknown-linux-musl.tar.gz
    chmod +x bore
    sudo mv bore /usr/local/bin/
fi

echo "🔗 Criando túnel público..."
echo ""
echo "📱 Em alguns segundos, você receberá uma URL pública"
echo "   que funcionará em qualquer dispositivo!"
echo ""
echo "Pressione Ctrl+C para parar"
echo "----------------------------------------"

bore local 3005 --to bore.pub