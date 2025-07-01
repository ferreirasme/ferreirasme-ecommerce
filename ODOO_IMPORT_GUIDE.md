# Guia de Importação Odoo

Este guia fornece instruções detalhadas sobre como configurar e executar a importação de dados do Odoo para o e-commerce.

## Índice

1. [Pré-requisitos](#pré-requisitos)
2. [Configuração Inicial](#configuração-inicial)
3. [Executando a Importação](#executando-a-importação)
4. [Estrutura de Dados](#estrutura-de-dados)
5. [Troubleshooting](#troubleshooting)
6. [Boas Práticas](#boas-práticas)

## Pré-requisitos

### 1. Dependências do Sistema

```bash
# Python 3.8 ou superior
python --version

# PostgreSQL (para o banco de dados)
psql --version

# Node.js e npm (para o frontend)
node --version
npm --version
```

### 2. Bibliotecas Python Necessárias

```bash
pip install xmlrpc
pip install psycopg2-binary
pip install python-dotenv
pip install requests
pip install pandas  # opcional, para análise de dados
```

### 3. Acesso ao Odoo

- URL do servidor Odoo
- Nome do banco de dados
- Usuário com permissões de leitura
- Senha ou API Key

## Configuração Inicial

### 1. Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Odoo Configuration
ODOO_URL=https://seu-servidor-odoo.com
ODOO_DB=nome_do_banco
ODOO_USERNAME=seu_usuario
ODOO_PASSWORD=sua_senha

# Database Configuration
DATABASE_URL=postgresql://usuario:senha@localhost:5432/seu_banco

# Import Configuration
IMPORT_BATCH_SIZE=100
IMPORT_TIMEOUT=300
IMPORT_RETRY_ATTEMPTS=3
```

### 2. Estrutura de Diretórios

```
projeto/
├── imports/
│   ├── __init__.py
│   ├── odoo_client.py
│   ├── import_products.py
│   ├── import_categories.py
│   └── import_customers.py
├── logs/
│   └── import.log
├── config/
│   └── import_config.py
└── .env
```

### 3. Cliente Odoo Básico

```python
# imports/odoo_client.py
import xmlrpc.client
import os
from dotenv import load_dotenv

load_dotenv()

class OdooClient:
    def __init__(self):
        self.url = os.getenv('ODOO_URL')
        self.db = os.getenv('ODOO_DB')
        self.username = os.getenv('ODOO_USERNAME')
        self.password = os.getenv('ODOO_PASSWORD')
        
        # Autenticação
        self.common = xmlrpc.client.ServerProxy(f'{self.url}/xmlrpc/2/common')
        self.uid = self.common.authenticate(
            self.db, self.username, self.password, {}
        )
        
        # Cliente para operações
        self.models = xmlrpc.client.ServerProxy(f'{self.url}/xmlrpc/2/object')
    
    def search_read(self, model, domain=None, fields=None, limit=None):
        """Busca e lê registros do Odoo"""
        if domain is None:
            domain = []
        
        return self.models.execute_kw(
            self.db, self.uid, self.password,
            model, 'search_read',
            [domain],
            {'fields': fields, 'limit': limit}
        )
```

## Executando a Importação

### 1. Script de Importação de Produtos

```python
# imports/import_products.py
import logging
from datetime import datetime
from odoo_client import OdooClient
import psycopg2
from psycopg2.extras import RealDictCursor

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/import.log'),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

class ProductImporter:
    def __init__(self):
        self.odoo = OdooClient()
        self.db_conn = psycopg2.connect(os.getenv('DATABASE_URL'))
        self.cursor = self.db_conn.cursor(cursor_factory=RealDictCursor)
        self.batch_size = int(os.getenv('IMPORT_BATCH_SIZE', 100))
    
    def import_products(self):
        """Importa produtos do Odoo"""
        try:
            logger.info("Iniciando importação de produtos...")
            
            # Buscar produtos do Odoo
            products = self.odoo.search_read(
                'product.product',
                domain=[('sale_ok', '=', True)],
                fields=['name', 'default_code', 'list_price', 'qty_available', 
                       'categ_id', 'description_sale', 'image_1920']
            )
            
            logger.info(f"Encontrados {len(products)} produtos no Odoo")
            
            # Processar em lotes
            for i in range(0, len(products), self.batch_size):
                batch = products[i:i + self.batch_size]
                self._process_batch(batch)
                logger.info(f"Processados {min(i + self.batch_size, len(products))}/{len(products)} produtos")
            
            self.db_conn.commit()
            logger.info("Importação de produtos concluída com sucesso!")
            
        except Exception as e:
            logger.error(f"Erro na importação: {str(e)}")
            self.db_conn.rollback()
            raise
        finally:
            self.cursor.close()
            self.db_conn.close()
    
    def _process_batch(self, products):
        """Processa um lote de produtos"""
        for product in products:
            try:
                # Preparar dados
                data = {
                    'external_id': product['id'],
                    'name': product['name'],
                    'sku': product.get('default_code', ''),
                    'price': float(product.get('list_price', 0)),
                    'stock': int(product.get('qty_available', 0)),
                    'category_id': product['categ_id'][0] if product.get('categ_id') else None,
                    'description': product.get('description_sale', ''),
                    'updated_at': datetime.now()
                }
                
                # Inserir ou atualizar
                self.cursor.execute("""
                    INSERT INTO products (external_id, name, sku, price, stock, 
                                        category_id, description, updated_at)
                    VALUES (%(external_id)s, %(name)s, %(sku)s, %(price)s, 
                           %(stock)s, %(category_id)s, %(description)s, %(updated_at)s)
                    ON CONFLICT (external_id) DO UPDATE SET
                        name = EXCLUDED.name,
                        sku = EXCLUDED.sku,
                        price = EXCLUDED.price,
                        stock = EXCLUDED.stock,
                        category_id = EXCLUDED.category_id,
                        description = EXCLUDED.description,
                        updated_at = EXCLUDED.updated_at
                """, data)
                
            except Exception as e:
                logger.error(f"Erro ao processar produto {product.get('name')}: {str(e)}")
                continue

if __name__ == "__main__":
    importer = ProductImporter()
    importer.import_products()
```

### 2. Script de Execução Principal

```python
# run_import.py
#!/usr/bin/env python
import sys
import argparse
from imports.import_products import ProductImporter
from imports.import_categories import CategoryImporter
from imports.import_customers import CustomerImporter

def main():
    parser = argparse.ArgumentParser(description='Importar dados do Odoo')
    parser.add_argument('--type', choices=['all', 'products', 'categories', 'customers'],
                       default='all', help='Tipo de importação')
    parser.add_argument('--force', action='store_true', 
                       help='Forçar reimportação completa')
    
    args = parser.parse_args()
    
    try:
        if args.type in ['all', 'categories']:
            print("Importando categorias...")
            CategoryImporter().import_categories()
        
        if args.type in ['all', 'products']:
            print("Importando produtos...")
            ProductImporter().import_products()
        
        if args.type in ['all', 'customers']:
            print("Importando clientes...")
            CustomerImporter().import_customers()
        
        print("Importação concluída com sucesso!")
        
    except Exception as e:
        print(f"Erro durante a importação: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    main()
```

### 3. Executando a Importação

```bash
# Importar tudo
python run_import.py

# Importar apenas produtos
python run_import.py --type products

# Forçar reimportação completa
python run_import.py --force

# Agendar com cron (a cada 6 horas)
0 */6 * * * /usr/bin/python /caminho/para/run_import.py >> /var/log/odoo_import.log 2>&1
```

## Estrutura de Dados

### 1. Mapeamento de Campos Odoo → Banco Local

#### Produtos (product.product)
```
Odoo                    →  Banco Local
id                      →  external_id
name                    →  name
default_code            →  sku
list_price              →  price
qty_available           →  stock
categ_id                →  category_id
description_sale        →  description
image_1920              →  image_url
weight                  →  weight
barcode                 →  barcode
```

#### Categorias (product.category)
```
Odoo                    →  Banco Local
id                      →  external_id
name                    →  name
parent_id               →  parent_id
complete_name           →  full_path
```

#### Clientes (res.partner)
```
Odoo                    →  Banco Local
id                      →  external_id
name                    →  name
email                   →  email
phone                   →  phone
street                  →  address
city                    →  city
state_id                →  state
zip                     →  postal_code
```

### 2. Tabelas do Banco de Dados

```sql
-- Tabela de produtos
CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    external_id INTEGER UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100),
    price DECIMAL(10, 2),
    stock INTEGER DEFAULT 0,
    category_id INTEGER,
    description TEXT,
    image_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de log de importação
CREATE TABLE import_logs (
    id SERIAL PRIMARY KEY,
    import_type VARCHAR(50),
    status VARCHAR(20),
    records_processed INTEGER,
    records_failed INTEGER,
    error_message TEXT,
    started_at TIMESTAMP,
    completed_at TIMESTAMP
);
```

## Troubleshooting

### 1. Erros Comuns de Conexão

#### Erro: "Connection refused"
```python
# Verificar se a URL está correta e inclui o protocolo
ODOO_URL=https://servidor.com  # Correto
ODOO_URL=servidor.com          # Incorreto

# Testar conexão
import xmlrpc.client
try:
    common = xmlrpc.client.ServerProxy(f'{ODOO_URL}/xmlrpc/2/common')
    version = common.version()
    print(f"Conectado ao Odoo versão: {version}")
except Exception as e:
    print(f"Erro de conexão: {e}")
```

#### Erro: "Authentication failed"
```python
# Verificar credenciais
def test_auth():
    common = xmlrpc.client.ServerProxy(f'{ODOO_URL}/xmlrpc/2/common')
    uid = common.authenticate(ODOO_DB, ODOO_USERNAME, ODOO_PASSWORD, {})
    if uid:
        print(f"Autenticado com sucesso! UID: {uid}")
    else:
        print("Falha na autenticação. Verifique usuário e senha.")
```

### 2. Problemas de Performance

#### Importação muito lenta
```python
# Aumentar o tamanho do lote
IMPORT_BATCH_SIZE=500  # Padrão é 100

# Usar campos específicos ao invés de todos
products = odoo.search_read(
    'product.product',
    domain=[('sale_ok', '=', True)],
    fields=['name', 'list_price', 'qty_available']  # Apenas campos necessários
)

# Implementar processamento paralelo
from concurrent.futures import ThreadPoolExecutor

def import_parallel(self, products):
    with ThreadPoolExecutor(max_workers=4) as executor:
        futures = []
        for batch in self.get_batches(products):
            future = executor.submit(self._process_batch, batch)
            futures.append(future)
        
        for future in futures:
            future.result()
```

#### Timeout em requisições
```python
# Aumentar timeout
import socket
socket.setdefaulttimeout(300)  # 5 minutos

# Ou usar timeout específico
import xmlrpc.client
transport = xmlrpc.client.Transport()
transport.timeout = 300
client = xmlrpc.client.ServerProxy(url, transport=transport)
```

### 3. Problemas de Dados

#### Caracteres especiais/encoding
```python
# Configurar encoding UTF-8
import sys
sys.stdout.reconfigure(encoding='utf-8')

# Limpar strings
def clean_string(text):
    if not text:
        return ''
    # Remover caracteres não-ASCII problemáticos
    return text.encode('utf-8', 'ignore').decode('utf-8')
```

#### Campos vazios ou None
```python
# Usar valores padrão
def safe_get(dict_obj, key, default=''):
    value = dict_obj.get(key)
    return value if value is not None else default

# Validar antes de inserir
if product.get('list_price'):
    price = float(product['list_price'])
else:
    price = 0.0
```

### 4. Erros de Banco de Dados

#### Violação de constraint
```sql
-- Verificar constraints existentes
SELECT conname, contype, conrelid::regclass
FROM pg_constraint
WHERE conrelid = 'products'::regclass;

-- Remover duplicados antes de criar unique constraint
DELETE FROM products a
USING products b
WHERE a.id > b.id
AND a.external_id = b.external_id;
```

#### Transações travadas
```python
# Usar timeout em transações
self.cursor.execute("SET statement_timeout = '5min'")

# Commit frequente em lotes grandes
for i, batch in enumerate(batches):
    self._process_batch(batch)
    if i % 10 == 0:  # Commit a cada 10 lotes
        self.db_conn.commit()
```

### 5. Debugging

#### Logs detalhados
```python
# Configurar logging detalhado
import logging

# Para xmlrpc
logging.getLogger('xmlrpc.client').setLevel(logging.DEBUG)

# Handler customizado
class DetailedFormatter(logging.Formatter):
    def format(self, record):
        # Adicionar informações extras
        record.import_type = getattr(record, 'import_type', 'unknown')
        record.record_id = getattr(record, 'record_id', 'N/A')
        return super().format(record)

# Usar no código
logger.info("Processando produto", extra={
    'import_type': 'product',
    'record_id': product['id']
})
```

#### Modo dry-run
```python
class ProductImporter:
    def __init__(self, dry_run=False):
        self.dry_run = dry_run
    
    def _process_batch(self, products):
        for product in products:
            if self.dry_run:
                logger.info(f"[DRY-RUN] Processaria produto: {product['name']}")
            else:
                # Processar normalmente
                self._insert_product(product)
```

## Boas Práticas

### 1. Segurança

```python
# Nunca commitar credenciais
# .gitignore
.env
*.log
config/secrets.py

# Usar variáveis de ambiente
import os
from dotenv import load_dotenv
load_dotenv()

# Validar SSL
import ssl
context = ssl.create_default_context()
context.check_hostname = True
context.verify_mode = ssl.CERT_REQUIRED
```

### 2. Monitoramento

```python
# Implementar health checks
def health_check():
    checks = {
        'odoo_connection': False,
        'database_connection': False,
        'last_import': None
    }
    
    try:
        # Testar Odoo
        odoo = OdooClient()
        odoo.search_read('res.users', limit=1)
        checks['odoo_connection'] = True
    except:
        pass
    
    try:
        # Testar DB
        conn = psycopg2.connect(DATABASE_URL)
        conn.close()
        checks['database_connection'] = True
    except:
        pass
    
    return checks

# Notificações de erro
def send_error_notification(error):
    # Email, Slack, etc
    pass
```

### 3. Backup e Recuperação

```bash
# Backup antes de importação grande
pg_dump -h localhost -U user -d database > backup_$(date +%Y%m%d_%H%M%S).sql

# Script de rollback
#!/bin/bash
if [ -f "backup_latest.sql" ]; then
    psql -h localhost -U user -d database < backup_latest.sql
    echo "Rollback concluído"
else
    echo "Arquivo de backup não encontrado"
fi
```

### 4. Otimizações

```python
# Cache de categorias
class CategoryCache:
    def __init__(self):
        self._cache = {}
    
    def get(self, category_id):
        if category_id not in self._cache:
            # Buscar do banco
            self._cache[category_id] = self._fetch_category(category_id)
        return self._cache[category_id]

# Bulk insert
def bulk_insert_products(self, products):
    values = []
    for product in products:
        values.append((
            product['external_id'],
            product['name'],
            product['price']
        ))
    
    self.cursor.executemany("""
        INSERT INTO products (external_id, name, price)
        VALUES (%s, %s, %s)
        ON CONFLICT (external_id) DO UPDATE SET
            name = EXCLUDED.name,
            price = EXCLUDED.price
    """, values)
```

### 5. Versionamento de Dados

```python
# Manter histórico de mudanças
CREATE TABLE products_history (
    id SERIAL PRIMARY KEY,
    product_id INTEGER,
    field_name VARCHAR(50),
    old_value TEXT,
    new_value TEXT,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    import_batch_id UUID
);

# Trigger para auditoria
CREATE OR REPLACE FUNCTION track_product_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.price != NEW.price THEN
        INSERT INTO products_history (product_id, field_name, old_value, new_value)
        VALUES (NEW.id, 'price', OLD.price::text, NEW.price::text);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## Conclusão

Este guia fornece uma base sólida para implementar a importação de dados do Odoo. Lembre-se de:

1. Sempre testar em ambiente de desenvolvimento primeiro
2. Implementar logs detalhados para troubleshooting
3. Fazer backups antes de importações grandes
4. Monitorar performance e otimizar conforme necessário
5. Manter a documentação atualizada com mudanças

Para suporte adicional, consulte:
- [Documentação oficial do Odoo](https://www.odoo.com/documentation)
- [XML-RPC Documentation](https://www.odoo.com/documentation/master/developer/api/external_api.html)
- Logs de importação em `logs/import.log`