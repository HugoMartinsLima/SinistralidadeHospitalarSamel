# 📄 API de Contratos - Integração com Lovable

Guia completo para usar os endpoints de contratos na sua página Lovable.

---

## 🏗️ Estrutura do Banco de Dados

### Tabela: `contratos`

```sql
CREATE TABLE contratos (
  id NUMBER PRIMARY KEY,
  codigo VARCHAR2(50) NOT NULL,
  descricao VARCHAR2(500) NOT NULL,
  ativo VARCHAR2(1) DEFAULT 'S'
);

-- Criar sequência para ID (se necessário)
CREATE SEQUENCE contratos_seq START WITH 1 INCREMENT BY 1;

-- Trigger para auto-incremento (se necessário)
CREATE OR REPLACE TRIGGER contratos_bi
BEFORE INSERT ON contratos
FOR EACH ROW
BEGIN
  IF :NEW.id IS NULL THEN
    SELECT contratos_seq.NEXTVAL INTO :NEW.id FROM dual;
  END IF;
END;
```

---

## 📡 Endpoints Disponíveis

### **1. Listar Todos os Contratos**

```
GET /api/contratos
```

**Parâmetros de Query (opcionais):**
- `search` - Buscar por código ou descrição
- `limit` - Quantidade de registros (padrão: 50)
- `offset` - Paginação (padrão: 0)

**Exemplos:**
```
GET /api/contratos
GET /api/contratos?search=CONV
GET /api/contratos?limit=10
GET /api/contratos?search=Convenio&limit=20
```

**Resposta:**
```json
{
  "data": [
    {
      "id": 1,
      "codigo": "CONV001",
      "descricao": "Convênio Médico Empresarial",
      "ativo": "S"
    },
    {
      "id": 2,
      "codigo": "CONV002",
      "descricao": "Convênio Odontológico",
      "ativo": "S"
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

### **2. Buscar Contrato por ID**

```
GET /api/contratos/:id
```

**Exemplo:**
```
GET /api/contratos/1
```

**Resposta:**
```json
{
  "id": 1,
  "codigo": "CONV001",
  "descricao": "Convênio Médico Empresarial",
  "ativo": "S"
}
```

---

### **3. Buscar Contrato por Código**

```
GET /api/contratos/codigo/:codigo
```

**Exemplo:**
```
GET /api/contratos/codigo/CONV001
```

**Resposta:**
```json
{
  "id": 1,
  "codigo": "CONV001",
  "descricao": "Convênio Médico Empresarial",
  "ativo": "S"
}
```

---

### **4. Criar Novo Contrato**

```
POST /api/contratos
Content-Type: application/json
```

**Body:**
```json
{
  "codigo": "CONV003",
  "descricao": "Convênio Hospitalar Premium",
  "ativo": "S"
}
```

**Resposta (201 Created):**
```json
{
  "message": "Contrato criado com sucesso",
  "id": 3,
  "data": {
    "id": 3,
    "codigo": "CONV003",
    "descricao": "Convênio Hospitalar Premium",
    "ativo": "S"
  }
}
```

---

### **5. Atualizar Contrato**

```
PUT /api/contratos/:id
Content-Type: application/json
```

**Body (pode enviar só os campos que quer atualizar):**
```json
{
  "descricao": "Convênio Hospitalar Premium Plus"
}
```

**Resposta:**
```json
{
  "message": "Contrato atualizado com sucesso",
  "rowsAffected": 1,
  "data": {
    "id": 3,
    "descricao": "Convênio Hospitalar Premium Plus"
  }
}
```

---

### **6. Deletar Contrato**

```
DELETE /api/contratos/:id
```

**Exemplo:**
```
DELETE /api/contratos/3
```

**Resposta:**
```json
{
  "message": "Contrato deletado com sucesso",
  "rowsAffected": 1
}
```

---

## 🎨 Integração no Lovable

### **Passo 1: Configurar API**

Adicione os métodos de contratos no seu arquivo `src/config/api.ts`:

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
    
    // Buscar por ID
    buscarPorId: (id: number) => api.request(`/api/contratos/${id}`),
    
    // Buscar por código
    buscarPorCodigo: (codigo: string) => 
      api.request(`/api/contratos/codigo/${codigo}`),
    
    // Criar novo contrato
    criar: (dados: {
      codigo: string;
      descricao: string;
      ativo?: string;
    }) => api.request('/api/contratos', {
      method: 'POST',
      body: JSON.stringify(dados)
    }),
    
    // Atualizar contrato
    atualizar: (id: number, dados: {
      codigo?: string;
      descricao?: string;
      ativo?: string;
    }) => api.request(`/api/contratos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dados)
    }),
    
    // Deletar contrato
    deletar: (id: number) => api.request(`/api/contratos/${id}`, {
      method: 'DELETE'
    }),
  },
};
```

---

### **Passo 2: Componente Lista de Contratos**

```typescript
import { useState, useEffect } from 'react';
import { api } from './config/api';

interface Contrato {
  id: number;
  codigo: string;
  descricao: string;
  ativo?: string;
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
    return <div>Carregando contratos...</div>;
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
          placeholder="Buscar por código ou descrição"
          className="flex-1 px-3 py-2 border rounded"
        />
        <button
          onClick={handleBuscar}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Buscar
        </button>
      </div>

      {/* Lista de Contratos */}
      <div className="space-y-2">
        {contratos.map((contrato) => (
          <div
            key={contrato.id}
            className="p-4 border rounded hover:bg-gray-50"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-bold text-lg">{contrato.codigo}</h3>
                <p className="text-gray-600">{contrato.descricao}</p>
              </div>
              {contrato.ativo === 'S' && (
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                  Ativo
                </span>
              )}
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

### **Passo 3: Buscar Contrato por Código**

```typescript
import { useState } from 'react';
import { api } from './config/api';

function BuscarContrato() {
  const [codigo, setCodigo] = useState('');
  const [contrato, setContrato] = useState(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  async function handleBuscar() {
    if (!codigo) {
      alert('Digite um código');
      return;
    }

    try {
      setLoading(true);
      setErro('');
      const resultado = await api.contratos.buscarPorCodigo(codigo);
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
          type="text"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value.toUpperCase())}
          placeholder="Digite o código (ex: CONV001)"
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
          <h3 className="font-bold text-lg mb-2">
            {contrato.codigo}
          </h3>
          <p className="text-gray-600">{contrato.descricao}</p>
          <p className="text-sm text-gray-500 mt-2">
            ID: {contrato.id} | 
            Status: {contrato.ativo === 'S' ? 'Ativo' : 'Inativo'}
          </p>
        </div>
      )}
    </div>
  );
}

export default BuscarContrato;
```

---

### **Passo 4: Criar Novo Contrato**

```typescript
import { useState } from 'react';
import { api } from './config/api';

function NovoContrato() {
  const [form, setForm] = useState({
    codigo: '',
    descricao: '',
    ativo: 'S',
  });

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.codigo || !form.descricao) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      const response = await api.contratos.criar(form);
      alert(`Contrato criado com sucesso! ID: ${response.id}`);
      
      // Limpar formulário
      setForm({ codigo: '', descricao: '', ativo: 'S' });
    } catch (error) {
      console.error('Erro ao criar contrato:', error);
      alert('Erro ao criar contrato: ' + error.message);
    }
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Novo Contrato</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">
            Código *
          </label>
          <input
            type="text"
            value={form.codigo}
            onChange={(e) => setForm({...form, codigo: e.target.value.toUpperCase()})}
            placeholder="Ex: CONV001"
            className="w-full px-3 py-2 border rounded"
            required
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">
            Descrição *
          </label>
          <textarea
            value={form.descricao}
            onChange={(e) => setForm({...form, descricao: e.target.value})}
            placeholder="Ex: Convênio Médico Empresarial"
            className="w-full px-3 py-2 border rounded"
            rows={3}
            required
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">
            Ativo
          </label>
          <select
            value={form.ativo}
            onChange={(e) => setForm({...form, ativo: e.target.value})}
            className="px-3 py-2 border rounded"
          >
            <option value="S">Sim</option>
            <option value="N">Não</option>
          </select>
        </div>

        <button
          type="submit"
          className="px-6 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Criar Contrato
        </button>
      </form>
    </div>
  );
}

export default NovoContrato;
```

---

### **Passo 5: Select/Dropdown de Contratos**

Para usar em formulários onde você precisa selecionar um contrato:

```typescript
import { useState, useEffect } from 'react';
import { api } from './config/api';

function SelectContrato({ onChange, value }) {
  const [contratos, setContratos] = useState([]);

  useEffect(() => {
    async function carregar() {
      const response = await api.contratos.listar();
      setContratos(response.data);
    }
    carregar();
  }, []);

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="px-3 py-2 border rounded"
    >
      <option value="">Selecione um contrato</option>
      {contratos.map((contrato) => (
        <option key={contrato.id} value={contrato.codigo}>
          {contrato.codigo} - {contrato.descricao}
        </option>
      ))}
    </select>
  );
}

export default SelectContrato;
```

---

## ✅ Checklist de Integração

- [ ] Tabela `contratos` criada no Oracle
- [ ] Sequência e trigger configurados (se necessário)
- [ ] API rodando localmente (`npm run dev`)
- [ ] Ngrok expondo a API (`ngrok http 5000`)
- [ ] URL do Ngrok atualizada no `api.ts`
- [ ] Endpoints de contratos testados
- [ ] Componentes Lovable criados
- [ ] Testado criar, listar, buscar contratos

---

## 🧪 Testar os Endpoints

### **No Navegador:**

```
https://sua-url.ngrok-free.app/api/contratos
```

### **Com cURL:**

```bash
# Listar
curl https://sua-url.ngrok-free.app/api/contratos

# Criar
curl -X POST https://sua-url.ngrok-free.app/api/contratos \
  -H "Content-Type: application/json" \
  -d '{"codigo":"TEST001","descricao":"Teste"}'

# Buscar por código
curl https://sua-url.ngrok-free.app/api/contratos/codigo/TEST001
```

---

## 🎉 Pronto!

Agora você tem uma API completa de contratos integrada com seu Lovable! 

**Recursos:**
- ✅ CRUD completo
- ✅ Validação de dados
- ✅ Busca por código ou descrição
- ✅ Paginação
- ✅ Tratamento de erros

**Qualquer dúvida, consulte este guia!** 🚀
