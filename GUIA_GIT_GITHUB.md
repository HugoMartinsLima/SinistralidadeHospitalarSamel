# 🚀 Guia: Como Subir seu Projeto para o GitHub

Este guia mostra como versionar seu código no GitHub para evitar perder alterações.

---

## 📋 PRÉ-REQUISITOS

### 1. Instalar Git no Windows

**Baixar Git:**
- Acesse: https://git-scm.com/download/win
- Baixe o instalador para Windows
- Execute o instalador (mantenha as opções padrão)
- Abra o CMD ou PowerShell e teste:

```cmd
git --version
```

Deve aparecer algo como: `git version 2.43.0`

### 2. Criar Conta no GitHub

- Acesse: https://github.com
- Crie uma conta gratuita
- Verifique seu email

---

## 🔧 CONFIGURAÇÃO INICIAL (Fazer UMA VEZ)

Abra o **Git Bash** ou **CMD** no Windows:

```bash
# Configure seu nome (aparecerá nos commits)
git config --global user.name "Seu Nome"

# Configure seu email (use o mesmo do GitHub)
git config --global user.email "seu.email@exemplo.com"

# Verificar configurações
git config --list
```

---

## 📁 PASSO A PASSO: Subir Projeto para GitHub

### **PASSO 1: Criar Repositório no GitHub**

1. Entre no GitHub: https://github.com
2. Clique no **"+"** no canto superior direito
3. Selecione **"New repository"**
4. Preencha:
   - **Repository name:** `sinistralidade-hospitalar`
   - **Description:** `API REST Node.js/Express com Oracle para gestão de sinistralidade hospitalar`
   - **Visibility:** Private (recomendado - credenciais sensíveis)
   - ⚠️ **NÃO marque** "Add a README file"
5. Clique em **"Create repository"**
6. **Copie a URL** que aparece (exemplo):
   ```
   https://github.com/seu-usuario/sinistralidade-hospitalar.git
   ```

---

### **PASSO 2: Preparar Projeto Localmente**

No Windows, abra o **Git Bash** ou **CMD** na pasta do projeto:

```cmd
cd C:\Users\Mateus\Desktop\SinistralidadeHospitalar
```

---

### **PASSO 3: Criar arquivo .gitignore**

⚠️ **IMPORTANTE:** Nunca subir senhas e dados sensíveis para o GitHub!

Crie um arquivo chamado `.gitignore` na raiz do projeto com este conteúdo:

```
# Dependências
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Variáveis de ambiente - NUNCA SUBIR!
.env
.env.local
.env.development
.env.production
*.env

# Build
dist/
build/
.cache/

# Logs
logs/
*.log

# Sistema operacional
.DS_Store
Thumbs.db

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# Replit
.replit
replit.nix

# Ngrok
ngrok.yml

# Temporários
*.tmp
temp/
tmp/
```

**Como criar o .gitignore no Windows:**

**Opção 1 - Bloco de Notas:**
1. Abra o Bloco de Notas
2. Cole o conteúdo acima
3. Salvar Como → Nome: `.gitignore` (COM O PONTO NO INÍCIO)
4. Tipo: "Todos os arquivos (*.*)"
5. Salvar na pasta do projeto

**Opção 2 - CMD:**
```cmd
echo node_modules/ > .gitignore
echo .env >> .gitignore
notepad .gitignore
```
(Depois adicione o resto do conteúdo)

---

### **PASSO 4: Inicializar Git e Fazer Primeiro Commit**

```bash
# Inicializar repositório Git
git init

# Verificar arquivos que serão adicionados (deve ignorar node_modules e .env)
git status

# Adicionar todos os arquivos (exceto os do .gitignore)
git add .

# Criar primeiro commit
git commit -m "Initial commit: API de sinistralidade hospitalar com Oracle"

# Renomear branch para 'main' (padrão moderno)
git branch -M main

# Conectar ao repositório do GitHub (substitua pela SUA URL)
git remote add origin https://github.com/seu-usuario/sinistralidade-hospitalar.git

# Enviar código para o GitHub
git push -u origin main
```

---

### **PASSO 5: Autenticação no GitHub**

Quando você rodar `git push`, o Git vai pedir:
- **Username:** Seu usuário do GitHub
- **Password:** ⚠️ NÃO use sua senha! Use um **Personal Access Token**

#### **Como Criar Personal Access Token (PAT):**

1. GitHub → Clique na sua foto (canto superior direito)
2. **Settings**
3. No menu esquerdo, vá em **Developer settings** (último item)
4. **Personal access tokens** → **Tokens (classic)**
5. **Generate new token** → **Generate new token (classic)**
6. Configurações:
   - **Note:** `SinistralidadeHospitalar`
   - **Expiration:** 90 days (ou No expiration)
   - **Select scopes:** Marque ✅ **repo** (todos os itens abaixo)
7. **Generate token**
8. ⚠️ **COPIE O TOKEN!** (Não aparecerá novamente)
   - Exemplo: `ghp_abc123xyz789...`

#### **Usar o Token:**

Quando `git push` pedir senha, cole o **token** no lugar da senha!

---

## 🔄 COMANDOS DO DIA A DIA

### **Depois de fazer alterações no código:**

```bash
# Ver o que foi modificado
git status

# Adicionar alterações
git add .

# Fazer commit (descreva o que mudou)
git commit -m "Adicionado endpoint de contratos"

# Enviar para GitHub
git push origin main
```

---

### **Baixar alterações do GitHub (se fizer mudanças em outro computador):**

```bash
# Puxar últimas alterações
git pull origin main
```

---

### **Ver histórico de commits:**

```bash
git log

# Formato compacto
git log --oneline
```

---

## 📝 BOAS PRÁTICAS DE COMMIT

### **Mensagens Descritivas:**

✅ **BOM:**
```bash
git commit -m "Corrigido problema de CORS no endpoint de contratos"
git commit -m "Adicionado filtro de busca por nome da empresa"
git commit -m "Atualizada documentação com instruções de Ngrok"
```

❌ **RUIM:**
```bash
git commit -m "fix"
git commit -m "mudanças"
git commit -m "teste"
```

---

## 🔐 SEGURANÇA: O QUE NUNCA SUBIR

⚠️ **NUNCA suba estes arquivos para o GitHub:**

- ❌ `.env` (credenciais do Oracle, senhas)
- ❌ `node_modules/` (muito grande, instala com npm install)
- ❌ Arquivos com senhas, tokens, API keys
- ❌ Backups de banco de dados
- ❌ Certificados SSL/TLS

✅ **SEMPRE:**
- Use `.gitignore` para bloquear arquivos sensíveis
- Use repositório **Private** no GitHub
- Documente no README como configurar `.env`

---

## 🎯 EXEMPLO DE README.md

Crie um arquivo `README.md` para documentar o projeto:

```markdown
# API de Sinistralidade Hospitalar

API REST desenvolvida em Node.js/Express integrada com banco de dados Oracle.

## 🔧 Configuração

### Pré-requisitos
- Node.js 18+
- Oracle Database
- Ngrok (para exposição local)

### Instalação

1. Clone o repositório:
\`\`\`bash
git clone https://github.com/seu-usuario/sinistralidade-hospitalar.git
cd sinistralidade-hospitalar
\`\`\`

2. Instale as dependências:
\`\`\`bash
npm install
\`\`\`

3. Configure as variáveis de ambiente:
Crie um arquivo \`.env\` na raiz com:
\`\`\`
ORACLE_HOST=seu-host
ORACLE_PORT=1521
ORACLE_USER=seu-usuario
ORACLE_PASSWORD=sua-senha
ORACLE_SERVICE=seu-servico
\`\`\`

4. Execute:
\`\`\`bash
npm run dev
\`\`\`

## 📡 Endpoints

- \`GET /api/health\` - Status da API
- \`GET /api/contratos\` - Listar contratos
- \`GET /api/contratos/:id\` - Detalhes de um contrato

Veja documentação completa em [API_CONTRATOS_REAL.md](./API_CONTRATOS_REAL.md)

## 📝 Licença

Privado - Uso interno
```

---

## 🆘 TROUBLESHOOTING

### **Erro: "remote: Support for password authentication was removed"**

**Solução:** Use Personal Access Token em vez da senha do GitHub

---

### **Erro: "fatal: not a git repository"**

**Solução:** Execute `git init` na pasta do projeto

---

### **Erro: "Updates were rejected"**

**Solução:**
```bash
git pull origin main --rebase
git push origin main
```

---

### **Esqueci de criar .gitignore e subi node_modules/**

**Solução:**
```bash
# Criar .gitignore
# Adicionar node_modules/ ao .gitignore

# Remover do Git (mantém no disco)
git rm -r --cached node_modules

# Commit
git commit -m "Removido node_modules do Git"
git push origin main
```

---

### **Preciso remover credenciais que subi por engano**

⚠️ **GRAVE:** Se você subiu senhas/tokens, eles ficam no histórico!

**Solução:**
1. Apague o repositório do GitHub
2. Crie um novo
3. **Mude as senhas/tokens comprometidos**
4. Suba novamente com .gitignore correto

---

## ✅ CHECKLIST ANTES DO PRIMEIRO PUSH

- [ ] Instalou Git no Windows
- [ ] Configurou `git config --global user.name` e `user.email`
- [ ] Criou repositório **Private** no GitHub
- [ ] Criou arquivo `.gitignore` com `node_modules/` e `.env`
- [ ] Verificou que `.env` não será enviado: `git status`
- [ ] Criou Personal Access Token no GitHub
- [ ] Executou `git init`, `git add .`, `git commit -m "Initial commit"`
- [ ] Conectou ao GitHub: `git remote add origin ...`
- [ ] Enviou código: `git push -u origin main`

---

## 📚 RECURSOS ÚTEIS

- [Documentação Git](https://git-scm.com/doc)
- [GitHub Guides](https://guides.github.com/)
- [Git Cheat Sheet](https://education.github.com/git-cheat-sheet-education.pdf)

---

## 💡 DICA FINAL

**Faça commits frequentes!**
- Sempre que terminar uma funcionalidade
- Antes de começar algo novo
- No final do dia de trabalho

Isso garante que você nunca perde seu progresso! 🚀
