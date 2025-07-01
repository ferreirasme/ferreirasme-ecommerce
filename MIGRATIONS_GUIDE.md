# Guia de Execução das Migrations - Ferreiras Me

## 📋 Ordem de Execução

Execute as migrations **nesta ordem exata** no SQL Editor do Supabase:

### 1. ✅ Base do Sistema (Provavelmente já executadas)
- **001_customer_fields.sql** - Campos adicionais para customers
- **002_fix_otp_table.sql** - Correções na tabela OTP

### 2. 🔴 Sistema de Consultoras (NECESSÁRIO)
- **003_consultants_system.sql** - Cria todo o sistema de consultoras
  - Tabela `consultants`
  - Tabela `clients` 
  - Tabela `consultant_commissions`
  - Tabela `consent_records`
  - Tabela `audit_logs`
  - Functions e triggers

### 3. 🔴 Sistema Administrativo (NECESSÁRIO)
- **004_admin_system.sql** - Sistema de administradores
  - Tabela `admins`
  - Tabela `admin_permissions`
  - Tabela `admin_logs`

### 4. 🟡 Helpers de Consultoras (Opcional - melhorias)
- **004_consultant_helpers.sql** - Functions auxiliares
- **005_consultant_increment_function.sql** - Função para código incremental
- **006_consultant_preferences.sql** - Preferências de consultoras

### 5. 🟢 Integrações (Futuro)
- **007_odoo_integration.sql** - Tabelas para integração Odoo
- **008_consultant_commission_period.sql** - Campo de período de 45 dias

## 🚀 Como Executar

1. Acesse o [Dashboard do Supabase](https://app.supabase.com)
2. Vá para **SQL Editor**
3. Clique em **New Query**
4. Cole o conteúdo de cada arquivo SQL
5. Clique em **Run**

## ⚠️ Importante

- **Execute primeiro**: 003 e 004 (essenciais para o sistema funcionar)
- **Depois, se necessário**: 005, 006, 008 (melhorias)
- **Para o futuro**: 007 (quando for integrar com Odoo)

## 🔍 Verificar se já foram executadas

Para verificar quais tabelas já existem, execute:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'consultants', 
  'clients', 
  'consultant_commissions',
  'admins',
  'admin_permissions'
)
ORDER BY table_name;
```

Se retornar as tabelas, elas já foram criadas.