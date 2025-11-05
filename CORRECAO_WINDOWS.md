# 🪟 Correção para Rodar no Windows

## ❌ Problema

Se você está no **Windows** e vê este erro:

```
'NODE_ENV' não é reconhecido como um comando interno
ou externo, um programa operável ou um arquivo em lotes.
```

## ✅ Solução Rápida (1 minuto)

Você só precisa editar **1 arquivo**: `package.json`

### Passo 1: Abrir o package.json

Abra o arquivo `package.json` na raiz do projeto com qualquer editor de texto.

### Passo 2: Encontrar a seção "scripts"

Procure por:

```json
"scripts": {
  "dev": "NODE_ENV=development tsx server/index.ts",
  "start": "NODE_ENV=production node dist/index.js",
  ...
}
```

### Passo 3: Adicionar "cross-env" antes de NODE_ENV

**Antes:**
```json
"scripts": {
  "dev": "NODE_ENV=development tsx server/index.ts",
  "start": "NODE_ENV=production node dist/index.js",
}
```

**Depois:**
```json
"scripts": {
  "dev": "cross-env NODE_ENV=development tsx server/index.ts",
  "start": "cross-env NODE_ENV=production node dist/index.js",
}
```

### Passo 4: Salvar e rodar!

```bash
npm run dev
```

✅ **Pronto!** Agora funciona no Windows! 🎉

---

## 📝 Por que isso funciona?

- **Linux/Mac**: `NODE_ENV=production` funciona nativamente
- **Windows**: Precisa do `cross-env` para definir variáveis de ambiente
- **cross-env**: Já está instalado no projeto! Só precisa usar nos scripts

---

## 🆘 Se ainda der erro

### Opção 1: Verificar se cross-env está instalado

```bash
npm list cross-env
```

Se não aparecer, instale:

```bash
npm install cross-env
```

### Opção 2: Usar scripts específicos do Windows

Se preferir não usar cross-env, crie scripts alternativos:

```json
"scripts": {
  "dev": "tsx server/index.ts",
  "dev:prod": "tsx server/index.ts",
}
```

E configure NODE_ENV no arquivo `.env` em vez dos scripts:

```env
NODE_ENV=development
```

---

## 💡 Recomendação

**Use a correção com cross-env** (Passo 3 acima) porque:

✅ Funciona em Windows, Linux e Mac  
✅ Não precisa alterar o .env toda vez  
✅ É a solução profissional padrão  

---

**Dúvidas?** O pacote `cross-env` já vem instalado no projeto!
