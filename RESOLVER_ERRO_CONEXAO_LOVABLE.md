# 🔧 Resolver Erro de Conexão - Lovable + Ngrok

Guia completo para resolver o erro "Não foi possível carregar os contratos. Verifique sua conexão."

---

## 🔍 DIAGNÓSTICO DO PROBLEMA

O erro acontece quando o Lovable não consegue fazer a requisição para a API via Ngrok. Pode ser:

1. ❌ URL do Ngrok incorreta ou não atualizada
2. ❌ Header 'ngrok-skip-browser-warning' faltando ou incorreto
3. ❌ CORS não configurado corretamente
4. ❌ API não está rodando
5. ❌ Ngrok não está rodando

---

## ✅ PASSO A PASSO PARA RESOLVER

### **PASSO 1: Verificar se a API está funcionando**

**No navegador, abra:**
```
https://SUA-URL-NGROK.ngrok-free.app/api/contratos
```

**Você deve ver algo assim:**
```json
{
  "data": [
    {
      "nrContrato": 1270,
      "cdCgcEstipulante": "04347163000148",
      "dsEstipulante": "MOTO HONDA DA AMAZONIA LTDA"
    }
  ]
}
```

**❌ Se não funcionar:**
- Verifique se o Replit está rodando (`npm run dev`)
- Verifique se o Ngrok está rodando (`ngrok http 5000`)
- Copie a URL correta do Ngrok (a que começa com `https://`)

---

### **PASSO 2: Teste com cURL ou Postman**

Abra o terminal e teste:

```bash
curl -H "ngrok-skip-browser-warning: true" https://SUA-URL-NGROK.ngrok-free.app/api/contratos
```

**Se funcionar:** O problema está no código do Lovable  
**Se não funcionar:** O problema está na API ou Ngrok

---

### **PASSO 3: Verificar o Console do Navegador**

No Lovable:
1. Pressione **F12** (ou clique direito > Inspecionar)
2. Vá na aba **Console**
3. Veja se há erros vermelhos

**Erros comuns:**

**Erro de CORS:**
```
Access to fetch at 'https://...' from origin '...' has been blocked by CORS
```
**Solução:** A API já está configurada para CORS. Verifique se está rodando.

**Erro 403 Ngrok:**
```
ERR_NGROK_3200
```
**Solução:** Faltou o header `ngrok-skip-browser-warning`

**Network Error:**
```
Failed to fetch
```
**Solução:** URL incorreta ou API não está rodando

---

### **PASSO 4: Código Correto para o Lovable**

Cole este prompt **EXATO** no Lovable:

```
Preciso corrigir a integração com a API.

**DELETAR** o arquivo src/lib/api.ts atual e criar novamente com este código EXATO:

```typescript
const API_BASE_URL = 'https://SUA-URL-NGROK.ngrok-free.app';

export async function buscarContratos(search = '') {
  try {
    const url = search 
      ? `${API_BASE_URL}/api/contratos?search=${encodeURIComponent(search)}`
      : `${API_BASE_URL}/api/contratos`;
    
    console.log('🔍 Buscando contratos em:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      mode: 'cors',
    });
    
    console.log('📡 Response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('✅ Dados recebidos:', data);
    
    return data;
  } catch (error) {
    console.error('❌ Erro ao buscar contratos:', error);
    throw error;
  }
}

export function formatarCNPJ(cnpj: string) {
  if (!cnpj) return '';
  const numeros = cnpj.replace(/\D/g, '');
  if (numeros.length !== 14) return cnpj;
  return numeros.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
}
```

Agora na página de contratos, substitua a lógica de busca por:

```typescript
const [contratos, setContratos] = useState([]);
const [loading, setLoading] = useState(true);
const [erro, setErro] = useState('');
const [busca, setBusca] = useState('');

useEffect(() => {
  carregarContratos();
}, []);

async function carregarContratos(search = '') {
  try {
    setLoading(true);
    setErro('');
    console.log('🔄 Carregando contratos...');
    
    const resultado = await buscarContratos(search);
    
    console.log('📊 Total de contratos:', resultado.data?.length || 0);
    setContratos(resultado.data || []);
  } catch (error) {
    console.error('❌ Erro:', error);
    setErro('Não foi possível carregar os contratos. Verifique sua conexão.');
  } finally {
    setLoading(false);
  }
}

function handleBuscar() {
  console.log('🔍 Buscando:', busca);
  carregarContratos(busca);
}

function handleLimpar() {
  console.log('🧹 Limpando busca');
  setBusca('');
  carregarContratos();
}
```

E mostrar os cards assim:

```typescript
{loading && (
  <div className="text-center py-8">
    <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
    <p className="mt-2 text-gray-600">Carregando contratos...</p>
  </div>
)}

{erro && !loading && (
  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
    <p className="text-red-600">{erro}</p>
  </div>
)}

{!loading && !erro && contratos.length === 0 && (
  <div className="text-center py-8">
    <p className="text-gray-500">Nenhum contrato encontrado</p>
  </div>
)}

{!loading && !erro && contratos.length > 0 && (
  <div className="space-y-3">
    {contratos.map((contrato) => (
      <div key={contrato.nrContrato} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-sm text-gray-500">Contrato Nº</span>
          <span className="font-bold text-lg text-blue-600">{contrato.nrContrato}</span>
        </div>
        <h3 className="font-semibold text-gray-900 mb-1">{contrato.dsEstipulante}</h3>
        <p className="text-sm text-gray-600">CNPJ: {formatarCNPJ(contrato.cdCgcEstipulante)}</p>
      </div>
    ))}
  </div>
)}
```

Use TypeScript e mantenha o design atual.
```

**⚠️ IMPORTANTE:** Substitua `SUA-URL-NGROK` pela URL real!

---

### **PASSO 5: Verificar Console Após Implementar**

Após o Lovable implementar, abra o Console (F12) e você verá:

```
🔍 Buscando contratos em: https://...ngrok-free.app/api/contratos
📡 Response status: 200
✅ Dados recebidos: { data: [...], pagination: {...} }
📊 Total de contratos: 2
```

**Se aparecer erro:** Copie a mensagem de erro completa e me envie.

---

## 🧪 TESTE RÁPIDO

**Teste 1 - API funcionando:**
```bash
curl https://SUA-URL-NGROK.ngrok-free.app/api/health
```
Deve retornar: `{"status":"healthy",...}`

**Teste 2 - Contratos funcionando:**
```bash
curl -H "ngrok-skip-browser-warning: true" https://SUA-URL-NGROK.ngrok-free.app/api/contratos
```
Deve retornar: `{"data":[...],...}`

**Teste 3 - No navegador:**
Abra: `https://SUA-URL-NGROK.ngrok-free.app/api/contratos`
Deve mostrar JSON dos contratos

---

## 🎯 CHECKLIST COMPLETO

Antes de tentar novamente:

- [ ] API rodando no Replit (`npm run dev`)
- [ ] Ngrok rodando (`ngrok http 5000`)
- [ ] URL do Ngrok copiada (formato: `https://xxx.ngrok-free.app`)
- [ ] Testou a URL no navegador
- [ ] Viu os dados JSON no navegador
- [ ] Substituiu a URL no prompt
- [ ] Deletou o api.ts antigo no Lovable
- [ ] Colou o novo código

---

## 🚨 SE AINDA NÃO FUNCIONAR

**Opção 1 - Testar com API pública temporária:**

Para testar se o problema é o Ngrok, use uma API de teste:

```typescript
const API_BASE_URL = 'https://jsonplaceholder.typicode.com';

export async function buscarContratos() {
  const response = await fetch(`${API_BASE_URL}/users`);
  return await response.json();
}
```

Se funcionar, o problema é sua URL do Ngrok.

**Opção 2 - Verificar Ngrok:**

No terminal do Ngrok, você deve ver as requisições chegando:
```
GET /api/contratos           200 OK
```

Se não aparecer nada, a requisição não está chegando.

**Opção 3 - Testar CORS localmente:**

Abra o Console no Lovable e digite:

```javascript
fetch('https://SUA-URL-NGROK.ngrok-free.app/api/contratos', {
  headers: { 'ngrok-skip-browser-warning': 'true' }
})
.then(r => r.json())
.then(console.log)
.catch(console.error)
```

Se funcionar, o problema é no código do Lovable.

---

## 📞 LOGS ÚTEIS

Me envie estes logs se continuar com erro:

1. **Console do navegador** (F12 > Console) - screenshot
2. **Response do cURL:**
   ```bash
   curl -v -H "ngrok-skip-browser-warning: true" https://SUA-URL-NGROK.ngrok-free.app/api/contratos
   ```
3. **Logs do Ngrok** (terminal onde rodou o ngrok)
4. **URL exata** que você está usando

---

**Siga estes passos e o erro vai ser resolvido!** 🚀
