# 🏥 API de Sinistralidade Hospitalar

API REST Node.js + Express integrada com Oracle Database para gerenciamento de sinistros hospitalares.

---

## 🚀 Rodar Localmente (Recomendado)

Como o Oracle Database está em uma **rede privada** (192.168.2.15), **rode localmente** na sua máquina.

### ⚡ Início Rápido (5 passos)

```bash
# 1. Instalar dependências
npm install

# 2. Criar arquivo .env
copy .env.example .env
# (Linux/Mac: cp .env.example .env)

# 3. Editar .env com suas credenciais REAIS do Oracle
# Abra com Notepad e preencha ORACLE_USER e ORACLE_PASSWORD

# 4. SOMENTE WINDOWS: Editar package.json
# Adicione "cross-env" antes de "NODE_ENV" nos scripts
# Veja: INSTRUCOES_FINAIS_WINDOWS.md

# 5. Rodar!
npm run dev
```

**Pronto!** API em: `http://localhost:5000` 🎉

---

## 📚 Documentação Completa

| Arquivo | Descrição |
|---------|-----------|
| **`INSTRUCOES_FINAIS_WINDOWS.md`** | ✅ **COMECE AQUI** - Guia completo Windows |
| **`QUICK_START_LOCAL.md`** | ⚡ Guia rápido de 5 minutos |
| **`INSTALACAO_LOCAL.md`** | 📖 Instalação detalhada (Oracle Instant Client) |
| **`SOLUCAO_NJS101.md`** | 🔧 Resolver erro de credenciais Oracle |
| **`replit.md`** | 📡 Documentação completa da API |
| **`API_USAGE.md`** | 🎨 Exemplos de integração com Lovable |

---

## 🔐 Variáveis de Ambiente

Crie o arquivo `.env` baseado no `.env.example`:

```env
ORACLE_HOST=192.168.2.15
ORACLE_PORT=1521
ORACLE_USER=seu_usuario
ORACLE_PASSWORD=sua_senha
ORACLE_SERVICE=outros.sameldm.com
PORT=5000
```

---

## 🌐 Expor para Lovable (com Ngrok)

Depois que a API estiver rodando localmente:

```bash
# Instalar Ngrok
npm install -g ngrok

# Expor API (em outro terminal)
ngrok http 5000
```

Use a URL gerada no Lovable: `https://abc123.ngrok-free.app`

---

## 📡 Endpoints Principais

```
GET  /api/health          # Status da API e Oracle
GET  /api/sinistros       # Listar sinistros
POST /api/sinistros       # Criar sinistro
GET  /api/pacientes       # Listar pacientes
GET  /api/estatisticas    # Dashboard de estatísticas
```

**Documentação completa:** Veja `replit.md`

---

## 🛠️ Pré-requisitos

- Node.js 18+ ([download](https://nodejs.org))
- Oracle Instant Client ([guia](INSTALACAO_LOCAL.md))
- Acesso ao Oracle (192.168.2.15:1521)

---

## 🆘 Problemas Comuns

### ❌ Erro: `NODE_ENV não é reconhecido` (Windows)

**Solução:** Veja `CORRECAO_WINDOWS.md`

### ❌ Erro: `Oracle client library not found`

**Solução:** Instale Oracle Instant Client - Veja `INSTALACAO_LOCAL.md`

### ❌ Erro: `Connection refused`

**Solução:** Verifique se o Oracle está acessível:

```bash
telnet 192.168.2.15 1521
```

---

## ✨ Recursos

- ✅ CRUD completo (Sinistros e Pacientes)
- ✅ Validação de dados com Zod
- ✅ Pool de conexões Oracle otimizado
- ✅ CORS habilitado para frontend
- ✅ Estatísticas e Dashboard
- ✅ Tratamento de erros robusto
- ✅ TypeScript
- ✅ Pronto para produção

---

## 📖 Stack Tecnológica

- **Runtime:** Node.js 18+
- **Framework:** Express
- **Banco:** Oracle Database
- **Driver:** oracledb (oficial Oracle)
- **Validação:** Zod
- **TypeScript:** Para type safety

---

## 🎯 Próximos Passos

1. ✅ Baixar código do Replit
2. ✅ Instalar dependências
3. ✅ Configurar .env
4. ✅ Corrigir scripts Windows (se necessário)
5. ✅ Rodar API localmente
6. ✅ Testar endpoints
7. ✅ Expor com Ngrok
8. ✅ Desenvolver frontend no Lovable

---

**Desenvolvido com ❤️ para gestão hospitalar eficiente**
