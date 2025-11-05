# 🔌 Prompt para Integrar API de Contratos no Lovable

Use este prompt para fazer sua tela de contratos buscar dados reais do Oracle via API.

---

## 📋 PROMPT COMPLETO PARA COPIAR:

**⚠️ SUBSTITUA `SUA-URL-NGROK` PELA URL REAL DO SEU NGROK!**

```
Preciso integrar esta página de contratos com minha API REST que está rodando em Node.js + Oracle.

**🔗 URL DA API:**
https://SUA-URL-NGROK.ngrok-free.app

**📡 ENDPOINT:**
GET /api/contratos?search=TEXTO_BUSCA

**📊 ESTRUTURA DE RESPOSTA:**
{
  "data": [
    {
      "nrContrato": 1270,
      "cdCgcEstipulante": "04347163000148",
      "dsEstipulante": "MOTO HONDA DA AMAZONIA LTDA"
    },
    {
      "nrContrato": 2444,
      "cdCgcEstipulante": "08281892000158",
      "dsEstipulante": "2E DESPACHOS ADUANEIROS LTDA"
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 2
  }
}

**🎯 REQUISITOS:**

1. Criar arquivo src/lib/api.ts (se não existir) com:
   - Base URL da API
   - Função para buscar contratos
   - Header 'ngrok-skip-browser-warning': 'true' em TODAS as requisições

2. Na página de contratos existente:
   - Carregar todos os contratos ao abrir a página (useEffect)
   - Implementar busca quando clicar no botão "Buscar"
   - Busca deve filtrar por: número do contrato OU razão social OU CNPJ
   - Limpar busca quando clicar em "Limpar"

3. Exibir cada contrato em um card mostrando:
   - Número do Contrato (nrContrato) - em destaque
   - Razão Social (dsEstipulante) - como título principal
   - CNPJ (cdCgcEstipulante) - formatado com pontos e barras

4. Estados da interface:
   - Loading spinner enquanto carrega
   - Mensagem "Nenhum contrato encontrado" quando vazio
   - Mensagem de erro se a API falhar

5. Tratamento de erros:
   - Try/catch nas chamadas
   - Console.log dos erros
   - Alert ou toast para o usuário

**💡 IMPORTANTE:**
- Use TypeScript
- Formate o CNPJ: XX.XXX.XXX/XXXX-XX
- Cards clicáveis com hover effect
- Responsivo (mobile friendly)

**Exemplo de como deve ficar:**

```typescript
// src/lib/api.ts
const API_BASE_URL = 'https://SUA-URL-NGROK.ngrok-free.app';

export async function buscarContratos(search = '') {
  const url = search 
    ? `${API_BASE_URL}/api/contratos?search=${encodeURIComponent(search)}`
    : `${API_BASE_URL}/api/contratos`;
    
  const response = await fetch(url, {
    headers: {
      'ngrok-skip-browser-warning': 'true',
    },
  });
  
  if (!response.ok) {
    throw new Error('Erro ao buscar contratos');
  }
  
  return await response.json();
}
```

Implemente a integração mantendo o design atual da página.
```

---

## ⚡ VERSÃO RESUMIDA (Alternativa):

```
Integre esta página com minha API de contratos.

API: https://SUA-URL-NGROK.ngrok-free.app/api/contratos

Dados: { nrContrato: number, cdCgcEstipulante: string, dsEstipulante: string }

Requisitos:
- Criar src/lib/api.ts com header 'ngrok-skip-browser-warning': 'true'
- Carregar contratos ao abrir página
- Busca por número/razão social/CNPJ
- Formatar CNPJ como XX.XXX.XXX/XXXX-XX
- Loading state e tratamento de erros

Mantenha o design atual.
```

---

## 🎯 VERSÃO ESPECÍFICA PARA SUA TELA:

Baseado na imagem que você mostrou:

```
Preciso conectar esta tela de contratos com minha API REST.

**API:** https://SUA-URL-NGROK.ngrok-free.app/api/contratos

**Dados retornados:**
- nrContrato (ex: 1270, 2444)
- cdCgcEstipulante (ex: "04347163000148")
- dsEstipulante (ex: "MOTO HONDA DA AMAZONIA LTDA")

**O que fazer:**

1. Criar src/lib/api.ts:
```typescript
const API_URL = 'https://SUA-URL-NGROK.ngrok-free.app';

export async function buscarContratos(search = '') {
  const url = search 
    ? `${API_URL}/api/contratos?search=${search}`
    : `${API_URL}/api/contratos`;
    
  const res = await fetch(url, {
    headers: { 'ngrok-skip-browser-warning': 'true' }
  });
  
  return await res.json();
}
```

2. Na página de contratos:
   - useEffect para carregar ao abrir
   - useState para contratos, loading, busca
   - Botão "Buscar" chama a API com o texto do input
   - Botão "Limpar" reseta busca e recarrega tudo
   - Exibir cards com: Contrato Nº X, Razão Social, CNPJ formatado

3. Substituir "Nenhum contrato encontrado" por:
   - Loading: mostrar spinner
   - Vazio: mostrar a mensagem atual
   - Com dados: mostrar cards

Use TypeScript, formate CNPJ, e mantenha o design azul atual.
```

---

## 🔧 EXEMPLO PRÁTICO DE CÓDIGO:

Se o Lovable não criar automaticamente, você pode pedir:

```
Crie o código exato para esta integração:

// src/lib/api.ts
const API_URL = 'https://abc123.ngrok-free.app';

export async function buscarContratos(search = '') {
  const url = search 
    ? `${API_URL}/api/contratos?search=${encodeURIComponent(search)}`
    : `${API_URL}/api/contratos`;
    
  const response = await fetch(url, {
    headers: {
      'ngrok-skip-browser-warning': 'true',
    },
  });
  
  if (!response.ok) throw new Error('Erro ao buscar contratos');
  return await response.json();
}

// Função auxiliar para formatar CNPJ
export function formatarCNPJ(cnpj: string) {
  return cnpj.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}


E na página de contratos, adicione:

const [contratos, setContratos] = useState([]);
const [loading, setLoading] = useState(true);
const [busca, setBusca] = useState('');

useEffect(() => {
  carregarContratos();
}, []);

async function carregarContratos(search = '') {
  try {
    setLoading(true);
    const data = await buscarContratos(search);
    setContratos(data.data);
  } catch (error) {
    console.error(error);
    alert('Erro ao carregar contratos');
  } finally {
    setLoading(false);
  }
}

function handleBuscar() {
  carregarContratos(busca);
}

function handleLimpar() {
  setBusca('');
  carregarContratos();
}
```

---

## ✅ CHECKLIST ANTES DE ENVIAR:

- [ ] API rodando (`npm run dev` no Replit)
- [ ] Ngrok rodando (`ngrok http 5000`)
- [ ] Copiou a URL do Ngrok (https://...ngrok-free.app)
- [ ] Testou a URL no navegador (/api/contratos)
- [ ] Substituiu SUA-URL-NGROK no prompt
- [ ] Copiou o prompt completo

---

## 🎨 RESULTADO ESPERADO:

Após enviar o prompt, sua tela vai mostrar:

```
┌─────────────────────────────────────────┐
│ 🔍 Buscar por número, razão social...  │
│                              [Buscar]   │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Contrato Nº 1270                        │
│ MOTO HONDA DA AMAZONIA LTDA             │
│ CNPJ: 04.347.163/0001-48                │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Contrato Nº 2444                        │
│ 2E DESPACHOS ADUANEIROS LTDA            │
│ CNPJ: 08.281.892/0001-58                │
└─────────────────────────────────────────┘
```

---

## 🚀 APÓS INTEGRAR:

Se quiser melhorias, peça ao Lovable:

```
"Adicione paginação com 10 itens por página"
"Adicione um botão 'Ver Detalhes' em cada card"
"Ordene por razão social alfabeticamente"
"Adicione filtro por CNPJ"
"Faça o card expandir ao clicar"
```

---

**Cole o prompt no Lovable agora!** 🎉
