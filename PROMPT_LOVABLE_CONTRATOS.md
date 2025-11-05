# 🎨 Prompt para o Lovable - Página de Contratos

Copie e cole o prompt abaixo no chat do Lovable para criar a página de contratos automaticamente.

---

## 📋 PROMPT PARA COPIAR:

```
Preciso criar uma página que liste contratos de uma API externa.

**API Base URL:**
https://SUA-URL-NGROK.ngrok-free.app

**Endpoints disponíveis:**
- GET /api/contratos - Lista todos os contratos (com paginação e busca)
- GET /api/contratos/:nrContrato - Busca contrato por número

**Estrutura dos dados retornados:**
```json
{
  "data": [
    {
      "nrContrato": 2444,
      "cdCgcEstipulante": "12.345.678/0001-90",
      "dsEstipulante": "HOSPITAL ABC S/A"
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 2
  }
}
```

**Requisitos da página:**

1. **Campo de busca** no topo da página
   - Permitir buscar por número do contrato ou razão social
   - Botão "Buscar" ao lado do campo
   - Botão "Limpar" para resetar a busca

2. **Lista de contratos** exibindo:
   - Número do contrato (nrContrato) - em destaque
   - Razão social (dsEstipulante) - como título principal
   - CNPJ (cdCgcEstipulante) - em texto menor

3. **Design:**
   - Cards clicáveis com hover
   - Espaçamento adequado entre os cards
   - Estado de loading enquanto carrega
   - Mensagem quando não encontrar resultados

4. **Funcionalidades:**
   - Carregar todos os contratos ao abrir a página
   - Permitir busca dinâmica
   - Adicionar header 'ngrok-skip-browser-warning': 'true' em todas as requisições

5. **Estrutura:**
   - Criar arquivo src/config/api.ts com a configuração da API
   - Criar página Contratos.tsx com os componentes

**Importante:**
- Substituir "SUA-URL-NGROK" pela URL real do ngrok
- Usar TypeScript
- Adicionar tratamento de erros
- Mostrar estado de loading
```

---

## ⚠️ ANTES DE ENVIAR:

**Substitua `SUA-URL-NGROK` pela URL real do seu Ngrok!**

Para obter sua URL do Ngrok:
1. No terminal onde o Ngrok está rodando
2. Procure a linha "Forwarding"
3. Copie a URL que começa com `https://` (exemplo: `https://abc123.ngrok-free.app`)

---

## 📝 PROMPT SIMPLIFICADO (Alternativa):

Se quiser uma versão mais curta:

```
Crie uma página para listar contratos de uma API.

API: https://SUA-URL-NGROK.ngrok-free.app/api/contratos

Estrutura dos dados:
- nrContrato (número)
- cdCgcEstipulante (CNPJ)
- dsEstipulante (razão social)

A página deve ter:
- Campo de busca (por número ou razão social)
- Lista de cards mostrando os contratos
- Estado de loading
- Adicionar header 'ngrok-skip-browser-warning': 'true' nas requisições

Use TypeScript e crie um arquivo api.ts para centralizar as chamadas.
```

---

## 🎯 PROMPT ESPECÍFICO PARA SELECT/DROPDOWN:

Se você só quer um componente dropdown:

```
Crie um componente Select de contratos que busca dados de uma API.

API: https://SUA-URL-NGROK.ngrok-free.app/api/contratos

Retorna array com: { nrContrato: number, dsEstipulante: string }

O select deve:
- Carregar contratos ao montar
- Mostrar "nrContrato - dsEstipulante" como opção
- Ter opção vazia "Selecione um contrato"
- Adicionar header 'ngrok-skip-browser-warning': 'true'
- Receber props value e onChange

Use TypeScript.
```

---

## 💡 DICAS:

1. **Sempre substitua a URL:** Troque `SUA-URL-NGROK` pela sua URL real
2. **Teste primeiro:** Abra a URL no navegador antes de enviar ao Lovable
3. **Seja específico:** Se quiser cores ou layout específico, adicione ao prompt
4. **Iterativo:** Após criar, você pode pedir ajustes: "adicione paginação", "mude a cor", etc.

---

## ✅ EXEMPLO DE PROMPT COMPLETO PRONTO:

```
Preciso criar uma página de contratos integrada com minha API.

**API URL:** https://abc123.ngrok-free.app

**Endpoints:**
- GET /api/contratos (lista todos)
- GET /api/contratos/:numero (busca por número)

**Dados retornados:**
{
  "data": [
    {
      "nrContrato": 2444,
      "cdCgcEstipulante": "12.345.678/0001-90",
      "dsEstipulante": "HOSPITAL ABC S/A"
    }
  ]
}

**Requisitos:**
1. Campo de busca no topo
2. Lista de cards com:
   - Número do contrato (destaque)
   - Razão social (título)
   - CNPJ (subtítulo)
3. Loading state
4. Mensagem "Nenhum contrato encontrado"
5. Adicionar header 'ngrok-skip-browser-warning': 'true' nas requisições

Use TypeScript, crie api.ts para as chamadas, e faça cards clicáveis com hover.
```

---

## 🚀 PRÓXIMOS PASSOS:

1. ✅ Copie um dos prompts acima
2. ✅ Substitua `SUA-URL-NGROK` pela sua URL real
3. ✅ Cole no chat do Lovable
4. ✅ Aguarde o Lovable criar a página
5. ✅ Teste a integração
6. ✅ Peça ajustes se necessário

---

**Boa sorte!** 🎉
