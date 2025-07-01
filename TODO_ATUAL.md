# TODO ATUAL - Ferreiras Me E-commerce

## 🔴 URGENTE - Erro em Produção

### Problema: "Cannot access 'z' before initialization"
- **Status**: Em resolução
- **Páginas afetadas**: 
  - /admin/products/new
  - /admin/consultants/[id]/edit
  - Qualquer página que usa Zod
- **Soluções já aplicadas**:
  1. ✅ Mudança de imports de `import * as z` para `import { z }`
  2. ✅ Adicionado `transpilePackages: ['zod']` no next.config.ts
  3. ✅ Criado arquivo central em lib/zod.ts
- **Próximo passo se persistir**: Mudar TODOS os imports para usar `@/lib/zod`

## 🟡 PENDÊNCIAS IMPORTANTES

### 1. Migrations do Banco de Dados
- [ ] Executar migrations para adicionar colunas faltantes
- [ ] Adicionar campos odoo_id, odoo_image em produtos
- [ ] Adicionar campos odoo_id em consultoras
- **Como fazer**: Acessar https://ferreirasme-ecommerce.vercel.app/api/run-migrations

### 2. Importação de Fotos
- [ ] Importar fotos de consultoras do Odoo
- [ ] Importar fotos de produtos do Odoo
- **Páginas**: /admin/import-photos

### 3. Testes em Produção
- [ ] Verificar se erro do Zod foi resolvido
- [ ] Testar criação de nova consultora
- [ ] Testar edição de consultora
- [ ] Testar criação de produto
- [ ] Testar importação do Odoo
- [ ] Testar importação do Excel

## 🟢 CONCLUÍDO RECENTEMENTE

### Área Administrativa
- ✅ Página de gestão de pedidos
- ✅ Página de detalhes do pedido
- ✅ Página de categorias
- ✅ Página de criação de produtos
- ✅ Página de configurações
- ✅ Página de relatórios com gráficos

### Correções de Bugs
- ✅ Erro "column products.odoo_image does not exist"
- ✅ Erro "column products.main_image_url does not exist" 
- ✅ Erro "column products.status does not exist"
- ✅ Erro "Consultora não encontrada" (async params)
- ✅ Campo de upload de foto em consultoras
- ✅ Erros de TypeScript no build
- ✅ Import do Zod corrigido

## 📋 BACKLOG

### Funcionalidades
- [ ] Sistema de busca global no admin
- [ ] Envio automático de email de boas-vindas
- [ ] Otimização de códigos postais (cache)
- [ ] Dashboard de vendas para consultoras
- [ ] Sistema de metas e rankings

### Integrações
- [ ] Sincronização automática com Odoo
- [ ] Webhook para atualização de estoque
- [ ] Integração com transportadoras
- [ ] Sistema de notificações push

## 📝 NOTAS IMPORTANTES

1. **Sempre fazer push após modificações** para testar em produção
2. **Build local antes do push**: `npm run build`
3. **Limpar cache se necessário**: `rm -rf .next`
4. **Verificar logs do Vercel** se houver erros em produção

## 🔗 LINKS ÚTEIS

- **Produção**: https://ferreirasme-ecommerce.vercel.app
- **Admin**: https://ferreirasme-ecommerce.vercel.app/admin/dashboard
- **Migrations**: https://ferreirasme-ecommerce.vercel.app/api/run-migrations
- **GitHub**: https://github.com/ferreirasme/ferreirasme-ecommerce