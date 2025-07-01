#!/bin/bash

# Script de teste rápido para importação Odoo
# Uso: ./test-odoo-import.sh

echo "🚀 Iniciando testes de importação Odoo..."
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar se tsx está instalado
if ! command -v tsx &> /dev/null; then
    echo -e "${RED}❌ tsx não está instalado. Instalando...${NC}"
    npm install -g tsx
fi

# Menu de opções
echo "Escolha uma opção:"
echo "1) Teste rápido de conexão"
echo "2) Listar produtos (primeiros 10)"
echo "3) Listar consultoras (primeiras 10)"
echo "4) Gerar relatório completo"
echo "5) Debug de produto específico"
echo "6) Debug de consultora específica"
echo "7) Simular importação de produtos (dry-run)"
echo "8) Simular importação de consultoras (dry-run)"
echo "9) Executar todos os testes de conexão"
echo ""

read -p "Opção: " choice

case $choice in
    1)
        echo -e "${GREEN}Executando teste rápido...${NC}"
        npm run odoo:quick
        ;;
    2)
        echo -e "${GREEN}Listando produtos...${NC}"
        npm run odoo:list-products
        ;;
    3)
        echo -e "${GREEN}Listando consultoras...${NC}"
        npm run odoo:list-consultants
        ;;
    4)
        echo -e "${GREEN}Gerando relatório completo...${NC}"
        npm run odoo:report all
        ;;
    5)
        read -p "ID do produto: " product_id
        echo -e "${GREEN}Debug do produto ${product_id}...${NC}"
        npm run odoo:test debug-product $product_id
        ;;
    6)
        read -p "Email da consultora: " consultant_email
        echo -e "${GREEN}Debug da consultora ${consultant_email}...${NC}"
        npm run odoo:test debug-consultant "$consultant_email"
        ;;
    7)
        read -p "Quantidade de produtos para simular (padrão 5): " limit
        limit=${limit:-5}
        echo -e "${YELLOW}Simulando importação de ${limit} produtos (DRY-RUN)...${NC}"
        npm run odoo:test import-products -- --limit=$limit
        ;;
    8)
        read -p "Quantidade de consultoras para simular (padrão 5): " limit
        limit=${limit:-5}
        echo -e "${YELLOW}Simulando importação de ${limit} consultoras (DRY-RUN)...${NC}"
        npm run odoo:test import-consultants -- --limit=$limit
        ;;
    9)
        echo -e "${GREEN}Executando todos os testes...${NC}"
        echo ""
        echo "1. Teste de conexão rápido:"
        npm run odoo:quick
        echo ""
        echo "2. Teste de conexão detalhado:"
        npm run odoo:connection
        echo ""
        echo "3. Listando alguns produtos:"
        npm run odoo:test list-products -- --limit=3
        echo ""
        echo "4. Listando algumas consultoras:"
        npm run odoo:test list-consultants -- --limit=3
        ;;
    *)
        echo -e "${RED}Opção inválida!${NC}"
        exit 1
        ;;
esac

echo ""
echo "✅ Teste concluído!"