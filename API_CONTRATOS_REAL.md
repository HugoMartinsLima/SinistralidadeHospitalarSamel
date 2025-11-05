# 📄 API de Contratos - Estrutura Real (pls_contrato)

Guia atualizado com a estrutura real do banco de dados Oracle.

---

## 🏗️ Estrutura do Banco de Dados

### Tabelas Utilizadas

**pls_contrato:**
- `NR_CONTRATO` - Número do contrato (chave primária)
- `CD_CGC_ESTIPULANTE` - CGC/CNPJ do estipulante

**pessoa_juridica:**
- `CD_CGC` - CNPJ da pessoa jurídica
- `DS_RAZAO_SOCIAL` - Razão social (nome da empresa)

### Query Base

```sql
SELECT 
  a.NR_CONTRATO,
  a.CD_CGC_ESTIPULANTE,
  (SELECT SUBSTR(ds_razao_social, 1, 255) 
   FROM pessoa_juridica x 
   WHERE x.cd_cgc = a.cd_cgc_estipulante) ds_estipulante  
FROM pls_contrato a
WHERE 1=1
ORDER BY 3 ASC
```

---

## 📡 Endpoints Disponíveis

### **1. Listar Todos os Contratos**

```
GET /api/contratos
```

**Parâmetros de Query (opcionais):**
- `search` - Buscar por número do contrato ou razão social
- `limit` - Quantidade de registros (padrão: 50)
- `offset` - Paginação (padrão: 0)

**Exemplos:**
```
GET /api/contratos
GET /api/contratos?search=2444
GET /api/contratos?search=Samel
GET /api/contratos?limit=10
```

**Resposta:**
```json
{
  "data": [
    {
      "nrContrato": 1270,
      "cdCgcEstipulante": "12.345.678/0001-90",
      "dsEstipulante": "EMPRESA XYZ LTDA"
    },
    {
      "nrContrato": 2444,
      "cdCgcEstipulante": "98.765.432/0001-10",
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

---

### **2. Buscar Contrato por Número**

```
GET /api/contratos/:nrContrato
```

**Exemplo:**
```
GET /api/contratos/2444
```

**Resposta:**
```json
{
  "nrContrato": 2444,
  "cdCgcEstipulante": "98.765.432/0001-10",
  "dsEstipulante": "HOSPITAL ABC S/A"
}
```

---

## 🎨 Integração no Lovable

### **Passo 1: Configurar API**

Atualize seu arquivo `src/config/api.ts`:

```typescript
const API_URL = 'https://sua-url-ngrok.ngrok-free.app';

export const api = {
  async request(endpoint: string, options = {}) {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  },

  contratos: {
    // Listar todos os contratos
    listar: (filtros = '') => api.request(`/api/contratos${filtros}`),
    
    // Buscar por número do contrato
    buscarPorNumero: (nrContrato: number) => 
      api.request(`/api/contratos/${nrContrato}`),
    
    // Buscar com filtro de texto
    buscar: (search: string) => 
      api.request(`/api/contratos?search=${encodeURIComponent(search)}`),
  },
};
```

---

### **Passo 2: Componente Lista de Contratos**

```typescript
import { useState, useEffect } from 'react';
import { api } from './config/api';

interface Contrato {
  nrContrato: number;
  cdCgcEstipulante: string;
  dsEstipulante: string;
}

function ListaContratos() {
  const [contratos, setContratos] = useState<Contrato[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');

  // Carregar contratos ao montar o componente
  useEffect(() => {
    carregarContratos();
  }, []);

  async function carregarContratos(search = '') {
    try {
      setLoading(true);
      const filtro = search ? `?search=${encodeURIComponent(search)}` : '';
      const response = await api.contratos.listar(filtro);
      setContratos(response.data);
    } catch (error) {
      console.error('Erro ao carregar contratos:', error);
      alert('Erro ao carregar contratos');
    } finally {
      setLoading(false);
    }
  }

  function handleBuscar() {
    carregarContratos(busca);
  }

  if (loading) {
    return <div className="p-4">Carregando contratos...</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Contratos</h1>

      {/* Campo de Busca */}
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por número ou razão social"
          className="flex-1 px-3 py-2 border rounded"
        />
        <button
          onClick={handleBuscar}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Buscar
        </button>
        <button
          onClick={() => {
            setBusca('');
            carregarContratos();
          }}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Limpar
        </button>
      </div>

      {/* Lista de Contratos */}
      <div className="space-y-2">
        {contratos.map((contrato) => (
          <div
            key={contrato.nrContrato}
            className="p-4 border rounded hover:bg-gray-50 cursor-pointer"
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-semibold text-gray-500">
                    Contrato Nº
                  </span>
                  <h3 className="font-bold text-lg">
                    {contrato.nrContrato}
                  </h3>
                </div>
                <p className="text-gray-700 font-medium">
                  {contrato.dsEstipulante}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  CNPJ: {contrato.cdCgcEstipulante}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {contratos.length === 0 && (
        <p className="text-center text-gray-500 mt-8">
          Nenhum contrato encontrado
        </p>
      )}
    </div>
  );
}

export default ListaContratos;
```

---

### **Passo 3: Buscar Contrato por Número**

```typescript
import { useState } from 'react';
import { api } from './config/api';

function BuscarContrato() {
  const [numero, setNumero] = useState('');
  const [contrato, setContrato] = useState(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  async function handleBuscar() {
    const nrContrato = Number(numero);
    
    if (!numero || isNaN(nrContrato)) {
      alert('Digite um número de contrato válido');
      return;
    }

    try {
      setLoading(true);
      setErro('');
      const resultado = await api.contratos.buscarPorNumero(nrContrato);
      setContrato(resultado);
    } catch (error) {
      setErro('Contrato não encontrado');
      setContrato(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Buscar Contrato</h2>

      <div className="flex gap-2 mb-4">
        <input
          type="number"
          value={numero}
          onChange={(e) => setNumero(e.target.value)}
          placeholder="Digite o número do contrato (ex: 2444)"
          className="flex-1 px-3 py-2 border rounded"
        />
        <button
          onClick={handleBuscar}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Buscando...' : 'Buscar'}
        </button>
      </div>

      {erro && (
        <div className="p-4 bg-red-100 text-red-700 rounded mb-4">
          {erro}
        </div>
      )}

      {contrato && (
        <div className="p-4 border rounded bg-white">
          <div className="mb-2">
            <span className="text-sm text-gray-500">Número do Contrato</span>
            <h3 className="font-bold text-2xl">{contrato.nrContrato}</h3>
          </div>
          <div className="mb-2">
            <span className="text-sm text-gray-500">Razão Social</span>
            <p className="font-medium text-lg">{contrato.dsEstipulante}</p>
          </div>
          <div>
            <span className="text-sm text-gray-500">CNPJ</span>
            <p className="text-gray-700">{contrato.cdCgcEstipulante}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default BuscarContrato;
```

---

### **Passo 4: Select/Dropdown de Contratos**

Para usar em formulários onde você precisa selecionar um contrato:

```typescript
import { useState, useEffect } from 'react';
import { api } from './config/api';

interface SelectContratoProps {
  value: number | '';
  onChange: (nrContrato: number) => void;
}

function SelectContrato({ value, onChange }: SelectContratoProps) {
  const [contratos, setContratos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregar() {
      try {
        const response = await api.contratos.listar();
        setContratos(response.data);
      } catch (error) {
        console.error('Erro ao carregar contratos:', error);
      } finally {
        setLoading(false);
      }
    }
    carregar();
  }, []);

  if (loading) {
    return <div className="text-sm text-gray-500">Carregando contratos...</div>;
  }

  return (
    <select
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="w-full px-3 py-2 border rounded"
    >
      <option value="">Selecione um contrato</option>
      {contratos.map((contrato) => (
        <option key={contrato.nrContrato} value={contrato.nrContrato}>
          {contrato.nrContrato} - {contrato.dsEstipulante}
        </option>
      ))}
    </select>
  );
}

export default SelectContrato;

// Exemplo de uso:
function FormularioExemplo() {
  const [contratoSelecionado, setContratoSelecionado] = useState('');

  return (
    <div className="p-4">
      <label className="block mb-2 font-medium">Contrato</label>
      <SelectContrato
        value={contratoSelecionado}
        onChange={(nr) => setContratoSelecionado(nr)}
      />
    </div>
  );
}
```

---

### **Passo 5: Busca com Autocomplete**

```typescript
import { useState, useEffect } from 'react';
import { api } from './config/api';

function BuscaAutocomplete() {
  const [busca, setBusca] = useState('');
  const [resultados, setResultados] = useState([]);
  const [loading, setLoading] = useState(false);

  // Debounce da busca (espera 500ms após digitar)
  useEffect(() => {
    if (!busca) {
      setResultados([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setLoading(true);
        const response = await api.contratos.buscar(busca);
        setResultados(response.data);
      } catch (error) {
        console.error('Erro ao buscar:', error);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [busca]);

  return (
    <div className="relative">
      <input
        type="text"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Digite para buscar..."
        className="w-full px-3 py-2 border rounded"
      />

      {loading && (
        <div className="absolute right-3 top-3">
          <div className="animate-spin h-4 w-4 border-2 border-blue-500 rounded-full border-t-transparent"></div>
        </div>
      )}

      {resultados.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border rounded shadow-lg max-h-60 overflow-y-auto">
          {resultados.map((contrato) => (
            <div
              key={contrato.nrContrato}
              className="p-3 hover:bg-gray-100 cursor-pointer border-b last:border-b-0"
              onClick={() => {
                // Fazer algo com o contrato selecionado
                console.log('Selecionado:', contrato);
                setBusca('');
                setResultados([]);
              }}
            >
              <div className="font-semibold">
                Contrato {contrato.nrContrato}
              </div>
              <div className="text-sm text-gray-600">
                {contrato.dsEstipulante}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default BuscaAutocomplete;
```

---

## 🧪 Testar os Endpoints

### **No Navegador (com Ngrok):**

```
https://sua-url.ngrok-free.app/api/contratos
https://sua-url.ngrok-free.app/api/contratos/2444
https://sua-url.ngrok-free.app/api/contratos?search=Samel
```

### **Com cURL:**

```bash
# Listar todos
curl https://sua-url.ngrok-free.app/api/contratos

# Buscar por número
curl https://sua-url.ngrok-free.app/api/contratos/2444

# Buscar por texto
curl "https://sua-url.ngrok-free.app/api/contratos?search=Hospital"

# Limitar resultados
curl "https://sua-url.ngrok-free.app/api/contratos?limit=10"
```

---

## 📊 Estrutura da Resposta

### Listar Contratos
```json
{
  "data": [
    {
      "nrContrato": 1270,
      "cdCgcEstipulante": "12.345.678/0001-90",
      "dsEstipulante": "EMPRESA XYZ LTDA"
    },
    {
      "nrContrato": 2444,
      "cdCgcEstipulante": "98.765.432/0001-10",
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

### Buscar por Número
```json
{
  "nrContrato": 2444,
  "cdCgcEstipulante": "98.765.432/0001-10",
  "dsEstipulante": "HOSPITAL ABC S/A"
}
```

### Erro 404 (Não Encontrado)
```json
{
  "error": "Contrato não encontrado",
  "message": "Nenhum contrato encontrado com número 9999"
}
```

---

## ✅ Checklist de Integração

- [ ] API rodando localmente (`npm run dev`)
- [ ] Ngrok expondo a API (`ngrok http 5000`)
- [ ] URL do Ngrok atualizada no `api.ts`
- [ ] Testou endpoint `/api/contratos` no navegador
- [ ] Testou buscar por número específico
- [ ] Criou componentes no Lovable
- [ ] Testou integração end-to-end

---

## 💡 Dicas

1. **Busca Flexível**: A busca funciona tanto por número do contrato quanto por razão social
2. **Read-Only**: Estes endpoints são apenas para leitura (não modificam dados)
3. **Performance**: A query usa subquery otimizada para buscar a razão social
4. **Ordenação**: Resultados ordenados por razão social (dsEstipulante)

---

## 🎉 Pronto!

Agora sua página no Lovable pode buscar e exibir contratos diretamente do banco Oracle usando a tabela `pls_contrato`! 

**Qualquer dúvida, consulte este guia!** 🚀
