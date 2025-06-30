# 📱 Configuração de Acesso Mobile - Ferreira's Me E-commerce

## 🚀 Início Rápido

### Para iniciar o servidor com acesso mobile:

```bash
# No WSL/Ubuntu:
npm run dev

# Para acesso externo (opcional):
./cloudflared-linux-amd64 tunnel --url http://localhost:3005
```

## ✅ O que já está configurado

1. **Next.js** está configurado para aceitar conexões de qualquer IP (`-H 0.0.0.0`)
2. **Content Security Policy** foi ajustada para permitir CSS em IPs locais
3. **Port Proxy** do Windows está configurado para redirecionar porta 3005

## 🔧 Configuração Permanente (já feita)

### 1. Port Proxy do Windows
```powershell
# PowerShell como Admin (JÁ EXECUTADO):
netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=3005 connectaddress=172.18.59.172 connectport=3005
```

### 2. Firewall do Windows
```powershell
# PowerShell como Admin (JÁ EXECUTADO):
netsh advfirewall firewall add rule name="WSL2 Port 3005" dir=in action=allow protocol=TCP localport=3005
```

### 3. Kaspersky
- ✅ Configurado para permitir porta 3005
- ✅ vEthernet (WSL) marcado como rede confiável

## 📱 Como acessar

### Na mesma rede WiFi:
- **No PC:** `http://localhost:3005`
- **No celular:** `http://192.168.131.99:3005`

### De qualquer lugar (usando CloudFlare):
1. Execute: `./cloudflared-linux-amd64 tunnel --url http://localhost:3005`
2. Use a URL gerada (ex: `https://example.trycloudflare.com`)

## 🛠️ Solução de Problemas

### Se o localhost parar de funcionar:
```powershell
# PowerShell como Admin:
# 1. Verificar regras atuais
netsh interface portproxy show v4tov4

# 2. Se não mostrar a regra, recriar:
netsh interface portproxy delete v4tov4 listenport=3005
netsh interface portproxy add v4tov4 listenaddress=0.0.0.0 listenport=3005 connectaddress=172.18.59.172 connectport=3005
```

### Se o IP do WSL mudar:
```bash
# No WSL, descubra o novo IP:
ip addr show eth0 | grep -oP '(?<=inet\s)\d+(\.\d+){3}'

# Atualize o port proxy com o novo IP
```

### Se o celular não conseguir acessar:
1. Verifique se está na mesma rede WiFi
2. Confirme que o Kaspersky não está bloqueando
3. Use o CloudFlare tunnel como alternativa

## 📄 Scripts Auxiliares

### `start.sh` - Inicia servidor com informações de acesso
```bash
./start.sh
```

### `setup-local-access.ps1` - Reconfigura acesso local (Windows)
```powershell
.\setup-local-access.ps1
```

## 🔐 Notas de Segurança

- As configurações de firewall são apenas para desenvolvimento
- Em produção, use HTTPS e configurações apropriadas
- O CloudFlare tunnel é temporário e muda a cada execução

## 💡 Dicas

1. **Para desenvolvimento diário:** Use apenas `npm run dev` e `localhost:3005`
2. **Para testes no celular:** O IP local (192.168.131.99:3005) é mais rápido
3. **Para cliente testar remotamente:** Use CloudFlare tunnel

---
Documentação criada em: 30/06/2025
IP do Windows: 192.168.131.99
IP do WSL: 172.18.59.172