# ⚡ Quick Start - Rodar API Localmente

Guia rápido de 5 minutos para rodar a API na sua máquina.

## 📋 Checklist Rápido

- [ ] Node.js 18+ instalado
- [ ] Oracle Instant Client instalado
- [ ] Código baixado do Replit

---

## 🚀 3 Passos Simples

### 1️⃣ Instalar Dependências

```bash
npm install
```

### 2️⃣ Configurar Variáveis de Ambiente

Copie o arquivo de exemplo:

```bash
# Windows
copy .env.example .env

# Linux/Mac
cp .env.example .env
```

Edite o `.env` e preencha suas credenciais Oracle:

```env
ORACLE_HOST=192.168.2.15
ORACLE_PORT=1521
ORACLE_USER=seu_usuario
ORACLE_PASSWORD=sua_senha
ORACLE_SERVICE=outros.sameldm.com
```

### 3️⃣ Rodar!

```bash
npm run dev
```

Pronto! API rodando em: **http://localhost:5000** 🎉

---

## ✅ Testar

Abra o navegador:

```
http://localhost:5000/api/health
```

Se ver `"oracle": "connected"` → Tudo certo! ✅

---

## 🌐 Conectar ao Lovable

### Opção 1: Usar Ngrok (Recomendado)

```bash
# Instalar ngrok
npm install -g ngrok

# Criar túnel (deixe a API rodando em outro terminal)
ngrok http 5000
```

Copie a URL que aparecer (ex: `https://abc123.ngrok-free.app`) e use no Lovable!

### Opção 2: Desenvolvimento Local

Se seu frontend também rodar localmente, use:
```
http://localhost:5000
```

---

## 🆘 Problemas?

### "Oracle client library not found"
→ Instale o Oracle Instant Client (veja `INSTALACAO_LOCAL.md`)

### "Connection refused"
→ Verifique se o Oracle está acessível:
```bash
telnet 192.168.2.15 1521
```

### "Port 5000 already in use"
→ Altere a porta no `.env`:
```env
PORT=3000
```

---

## 📚 Documentação Completa

- `INSTALACAO_LOCAL.md` - Guia detalhado de instalação
- `replit.md` - Documentação completa da API
- `API_USAGE.md` - Exemplos de integração com Lovable

---

**Boa sorte!** 🚀
