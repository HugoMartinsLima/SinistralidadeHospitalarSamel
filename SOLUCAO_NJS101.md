# 🔧 Solução: Erro NJS-101 no Windows

## ❌ Erro Completo

```
❌ Erro ao criar pool de conexões Oracle: Error: NJS-101: no credentials specified
```

---

## ✅ Causa

O Oracle não conseguiu encontrar as credenciais (usuário e senha) porque o arquivo `.env` não existe ou está vazio/incorreto.

---

## ✅ Solução em 3 Passos

### **Passo 1: Verificar se o arquivo .env existe**

No terminal, dentro da pasta do projeto:

```bash
# Windows (CMD)
dir .env

# Windows (PowerShell)
ls .env
```

**Se der erro "arquivo não encontrado":** O arquivo `.env` não existe!

---

### **Passo 2: Criar o arquivo .env**

```bash
# Windows (CMD)
copy .env.example .env

# Windows (PowerShell)  
copy .env.example .env
```

---

### **Passo 3: Editar o .env com credenciais REAIS**

Abra o arquivo `.env` com Notepad (ou VS Code) e preencha:

```env
ORACLE_HOST=192.168.2.15
ORACLE_PORT=1521
ORACLE_USER=SEU_USUARIO_AQUI
ORACLE_PASSWORD=SUA_SENHA_AQUI
ORACLE_SERVICE=outros.sameldm.com
PORT=5000
SESSION_SECRET=qualquer-texto-longo-e-aleatorio-123
```

**⚠️ CRÍTICO:** 
- Substitua `SEU_USUARIO_AQUI` pelo usuário real do Oracle
- Substitua `SUA_SENHA_AQUI` pela senha real do Oracle
- **Não deixe espaços antes ou depois do `=`**
- **Não coloque as credenciais entre aspas**

**Exemplo correto:**
```env
ORACLE_USER=admin
ORACLE_PASSWORD=minhasenha123
```

**❌ Errado:**
```env
ORACLE_USER = admin
ORACLE_PASSWORD="minhasenha123"
```

---

### **Passo 4: Rodar novamente**

```bash
npm run dev
```

---

## ✅ O que você deve ver

```
✅ Pool de conexões Oracle criado com sucesso
📊 Conectado ao Oracle: 192.168.2.15:1521/outros.sameldm.com
[express] serving on port 5000
```

---

## 🔍 Checklist de Verificação

- [ ] Arquivo `.env` existe na raiz do projeto
- [ ] `.env` tem ORACLE_USER preenchido (sem aspas)
- [ ] `.env` tem ORACLE_PASSWORD preenchido (sem aspas)
- [ ] `.env` tem ORACLE_HOST=192.168.2.15
- [ ] `.env` tem ORACLE_PORT=1521
- [ ] `.env` tem ORACLE_SERVICE=outros.sameldm.com
- [ ] Não há espaços antes ou depois dos `=`
- [ ] As credenciais estão corretas (teste no SQL Developer)

---

## 🆘 Ainda com Erro?

### Verificar se as credenciais estão corretas

Teste no **SQL Developer** ou **SQLPlus**:

```sql
-- Configuração:
Host: 192.168.2.15
Porta: 1521
SID/Service: outros.sameldm.com
Usuário: [seu usuário]
Senha: [sua senha]
```

Se conseguir conectar lá, copie EXATAMENTE as mesmas credenciais para o `.env`.

### Verificar se o Oracle está acessível

```bash
# Windows (CMD)
telnet 192.168.2.15 1521

# Se não tiver telnet instalado, use PowerShell:
Test-NetConnection -ComputerName 192.168.2.15 -Port 1521
```

---

## 📝 Exemplo de .env Completo

```env
# Configurações Oracle
ORACLE_HOST=192.168.2.15
ORACLE_PORT=1521
ORACLE_USER=meu_usuario
ORACLE_PASSWORD=minha_senha_secreta
ORACLE_SERVICE=outros.sameldm.com

# Configurações da API
PORT=5000
NODE_ENV=development

# Session (pode ser qualquer string)
SESSION_SECRET=minha-chave-super-secreta-aleatoria-12345
```

---

**Dica:** Copie o exemplo acima e apenas substitua `meu_usuario` e `minha_senha_secreta` pelas suas credenciais reais!
