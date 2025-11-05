# ✅ Instruções Finais - Rodar no Windows

Tudo foi corrigido! Agora é só seguir estes passos:

---

## 📥 Passo 1: Baixar o Código Atualizado

No Replit:
1. Clique em **Files** (menu lateral)
2. Clique nos **3 pontos (⋮)** ao lado de "workspace"
3. Selecione **Download as ZIP**
4. Extraia na sua máquina

---

## 🔧 Passo 2: Instalar Dependências

Abra o terminal (CMD ou PowerShell) na pasta do projeto:

```bash
npm install
```

---

## 🔐 Passo 3: Criar e Configurar o .env

### 3.1 - Criar o arquivo

```bash
# Windows (CMD ou PowerShell)
copy .env.example .env
```

### 3.2 - Editar com suas credenciais

Abra `.env` com Notepad ou VS Code e preencha:

```env
ORACLE_HOST=192.168.2.15
ORACLE_PORT=1521
ORACLE_USER=SEU_USUARIO_REAL
ORACLE_PASSWORD=SUA_SENHA_REAL
ORACLE_SERVICE=outros.sameldm.com
PORT=5000
SESSION_SECRET=qualquer-texto-aleatorio-123
```

**⚠️ Substitua:**
- `SEU_USUARIO_REAL` → Usuário do Oracle
- `SUA_SENHA_REAL` → Senha do Oracle

**Importante:**
- ❌ NÃO coloque aspas
- ❌ NÃO deixe espaços ao redor do `=`

---

## 🪟 Passo 4: Corrigir package.json (Windows)

Abra `package.json` e adicione `cross-env` antes de `NODE_ENV`:

**Antes:**
```json
"scripts": {
  "dev": "NODE_ENV=development tsx server/index.ts",
  "start": "NODE_ENV=production node dist/index.js"
}
```

**Depois:**
```json
"scripts": {
  "dev": "cross-env NODE_ENV=development tsx server/index.ts",
  "start": "cross-env NODE_ENV=production node dist/index.js"
}
```

---

## ▶️ Passo 5: Rodar!

```bash
npm run dev
```

---

## ✅ O Que Você Deve Ver

```
✅ Pool de conexões Oracle criado com sucesso
📊 Conectado ao Oracle: 192.168.2.15:1521/outros.sameldm.com
[express] serving on 127.0.0.1:5000
```

**Pronto!** API rodando em: **http://localhost:5000** 🎉

---

## 🧪 Passo 6: Testar

Abra o navegador:

```
http://localhost:5000/api/health
```

Você deve ver:

```json
{
  "status": "healthy",
  "oracle": "connected",
  "timestamp": "2025-11-05T...",
  "message": "API e banco de dados Oracle funcionando corretamente"
}
```

---

## 🌐 Passo 7: Expor para Lovable (Opcional)

Se quiser acessar do Lovable:

```bash
# Instalar Ngrok (uma vez só)
npm install -g ngrok

# Expor a API (em outro terminal, deixe a API rodando)
ngrok http 5000
```

Use a URL gerada (ex: `https://abc123.ngrok-free.app`) no Lovable!

---

## 🔍 Checklist Final

Antes de rodar, verifique:

- [ ] Executou `npm install`
- [ ] Criou arquivo `.env` (com `copy .env.example .env`)
- [ ] Preencheu credenciais REAIS no `.env`
- [ ] Credenciais sem aspas e sem espaços
- [ ] Editou `package.json` adicionando `cross-env`
- [ ] Oracle está acessível (ping 192.168.2.15)

---

## 🆘 Problemas Comuns

### ❌ Erro: `NJS-101: no credentials specified`

**Solução:** Arquivo `.env` não existe ou está vazio. Volte ao Passo 3.

### ❌ Erro: `NODE_ENV não é reconhecido`

**Solução:** Faltou adicionar `cross-env` no `package.json`. Volte ao Passo 4.

### ❌ Erro: `ENOTSUP: operation not supported on socket`

**Solução:** Já corrigido! Baixe a versão mais recente do código.

### ❌ Erro: `ORA-12154: TNS:could not resolve`

**Solução:** Verifique `ORACLE_SERVICE` no `.env`. Deve ser: `outros.sameldm.com`

### ❌ Erro: `Connection refused`

**Solução:** Oracle não está acessível. Verifique:

```bash
# Windows PowerShell
Test-NetConnection -ComputerName 192.168.2.15 -Port 1521
```

---

## 📚 Documentação Adicional

- `QUICK_START_LOCAL.md` - Guia rápido
- `INSTALACAO_LOCAL.md` - Instalação detalhada (Oracle Instant Client)
- `SOLUCAO_NJS101.md` - Resolver problemas de credenciais
- `replit.md` - Documentação completa da API

---

## ✨ Mudanças Feitas (Você não precisa fazer nada)

✅ Instalado pacote `dotenv` para ler arquivo `.env`  
✅ Instalado pacote `cross-env` para compatibilidade Windows  
✅ Corrigido bind do servidor para usar `127.0.0.1` no Windows  
✅ Removido `reusePort` que não funciona no Windows  
✅ Código detecta automaticamente Replit vs Windows  

---

**Siga os 5 passos acima e tudo vai funcionar!** 🚀
