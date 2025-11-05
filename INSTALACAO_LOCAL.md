# 🏠 Guia de Instalação Local - API de Sinistralidade

Este guia explica como rodar a API localmente na sua máquina (sem usar Replit).

## 📋 Pré-requisitos

- **Node.js 18+** instalado ([download](https://nodejs.org))
- **npm** (vem com Node.js)
- **Oracle Database** acessível na rede local (192.168.2.15:1521)
- **Oracle Instant Client** instalado na máquina local

---

## 🔧 Instalação do Oracle Instant Client

### Windows

1. Baixe o Oracle Instant Client:
   - https://www.oracle.com/database/technologies/instant-client/downloads.html
   - Escolha a versão 21.x Basic Package (ZIP)

2. Extraia para `C:\oracle\instantclient_21_x`

3. Adicione ao PATH do Windows:
   - Painel de Controle → Sistema → Configurações avançadas do sistema
   - Variáveis de Ambiente → PATH
   - Adicione: `C:\oracle\instantclient_21_x`

### Linux (Ubuntu/Debian)

```bash
# Criar diretório
sudo mkdir -p /opt/oracle

# Baixar e extrair Instant Client
cd /opt/oracle
sudo wget https://download.oracle.com/otn_software/linux/instantclient/219000/instantclient-basic-linux.x64-21.9.0.0.0dbru.zip
sudo unzip instantclient-basic-linux.x64-21.9.0.0.0dbru.zip

# Configurar LD_LIBRARY_PATH
echo 'export LD_LIBRARY_PATH=/opt/oracle/instantclient_21_9:$LD_LIBRARY_PATH' >> ~/.bashrc
source ~/.bashrc
```

### macOS

```bash
brew install instantclient-basic
```

---

## 📥 Passo 1: Baixar o Código

### Opção A: Baixar do Replit (Mais Fácil)

1. No Replit, clique em **Files** (menu lateral)
2. Clique nos 3 pontos (⋮) ao lado de "workspace"
3. Selecione **Download as ZIP**
4. Extraia o arquivo ZIP na pasta desejada

### Opção B: Baixar Arquivos Manualmente

Ou baixe apenas os arquivos necessários e recrie a estrutura:

```
seu-projeto/
├── server/
│   ├── index.ts
│   ├── routes.ts
│   ├── oracle-db.ts
│   └── vite.ts
├── shared/
│   └── schema.ts
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 🔨 Passo 2: Instalar Dependências

Abra o terminal na pasta do projeto e execute:

```bash
npm install
```

Isso vai instalar todos os pacotes necessários:
- express
- oracledb
- cors
- tsx
- e outros...

---

## 🔐 Passo 3: Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```bash
# Windows (PowerShell)
New-Item .env

# Linux/Mac
touch .env
```

Edite o arquivo `.env` e adicione:

```env
# Configurações do Oracle Database
ORACLE_HOST=192.168.2.15
ORACLE_PORT=1521
ORACLE_USER=seu_usuario
ORACLE_PASSWORD=sua_senha
ORACLE_SERVICE=outros.sameldm.com

# Porta da API (opcional, padrão 5000)
PORT=5000

# Session Secret (pode ser qualquer string longa)
SESSION_SECRET=minha-chave-secreta-super-segura-123
```

**⚠️ Importante:** 
- Substitua `seu_usuario` e `sua_senha` pelas credenciais reais
- Nunca compartilhe este arquivo `.env`
- Adicione `.env` ao `.gitignore`

---

## ▶️ Passo 4: Rodar a API

Execute no terminal:

```bash
npm run dev
```

Você verá:

```
✅ Pool de conexões Oracle criado com sucesso
📊 Conectado ao Oracle: 192.168.2.15:1521/outros.sameldm.com
[express] serving on port 5000
```

---

## 🌐 Passo 5: Testar a API

Abra o navegador e acesse:

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

## 🔍 Endpoints Disponíveis

Com a API rodando localmente, use:

```
http://localhost:5000/api/sinistros
http://localhost:5000/api/pacientes
http://localhost:5000/api/estatisticas
http://localhost:5000/api/health
```

---

## 🎨 Conectar o Lovable à API Local

### Opção 1: Usar Ngrok (Recomendado para Testes)

Se você ainda quiser que o Lovable acesse sua API local:

```bash
# Instalar ngrok
npm install -g ngrok

# Criar túnel HTTP (não TCP, pois agora é HTTP)
ngrok http 5000
```

Ngrok vai gerar uma URL como:
```
https://abc123.ngrok-free.app
```

Use essa URL no Lovable!

### Opção 2: Rodar Lovable Localmente Também

Se o Lovable permitir rodar localmente, você pode usar diretamente:
```
http://localhost:5000
```

---

## 📝 Scripts Disponíveis

```bash
# Rodar em desenvolvimento (com auto-reload)
npm run dev

# Rodar em produção
npm start

# Ver logs
# Os logs aparecem diretamente no terminal
```

---

## 🐛 Troubleshooting

### Erro: "Oracle client library not found"

**Solução:** Verifique se o Oracle Instant Client está instalado e no PATH.

```bash
# Windows
echo %PATH%

# Linux/Mac
echo $LD_LIBRARY_PATH
```

### Erro: "ORA-12154: TNS:could not resolve the connect identifier"

**Solução:** Verifique o `ORACLE_SERVICE` no arquivo `.env`

### Erro: "EADDRINUSE: address already in use"

**Solução:** A porta 5000 já está em uso. Altere no `.env`:

```env
PORT=3000
```

### Erro: "Connection refused"

**Solução:** Verifique se o Oracle está acessível:

```bash
# Windows (CMD)
telnet 192.168.2.15 1521

# Linux/Mac
nc -zv 192.168.2.15 1521
```

---

## 🔄 Atualizações

Para atualizar o código do Replit:

1. Baixe novamente do Replit
2. Copie os arquivos atualizados
3. Execute `npm install` (se houver novos pacotes)
4. Reinicie a API

---

## 🚀 Vantagens de Rodar Localmente

✅ Acesso direto ao Oracle (sem túneis)  
✅ Mais rápido (sem latência de rede)  
✅ Mais seguro (não expõe credenciais)  
✅ Fácil de debugar  
✅ Sem limitações de tempo do Ngrok  

---

## 📚 Estrutura do Projeto

```
api-sinistralidade/
├── server/
│   ├── index.ts          # Servidor Express principal
│   ├── routes.ts         # Todas as rotas da API
│   ├── oracle-db.ts      # Conexão e pool Oracle
│   └── vite.ts           # Configuração Vite (dev)
├── shared/
│   └── schema.ts         # Schemas Zod e tipos
├── .env                  # Variáveis de ambiente (você cria)
├── package.json          # Dependências Node.js
├── tsconfig.json         # Configuração TypeScript
└── vite.config.ts        # Configuração Vite

# Gerados automaticamente:
├── node_modules/         # Pacotes instalados
└── .replit/              # Pode deletar (específico Replit)
```

---

## ✨ Pronto!

Agora você tem a API rodando localmente e pode desenvolver o frontend no Lovable conectando à sua máquina local (via Ngrok) ou desenvolver tudo localmente!

**Dúvidas?** Consulte a documentação completa em `replit.md` e `API_USAGE.md`
