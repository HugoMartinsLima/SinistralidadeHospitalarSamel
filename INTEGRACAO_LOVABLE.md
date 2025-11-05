# 🎨 Integração API Local + Ngrok + Lovable

Guia completo para conectar sua API rodando localmente (via Ngrok) com o frontend no Lovable.

---

## 🚀 Passo 1: Rodar a API Localmente

No terminal, dentro da pasta do projeto:

```bash
npm run dev
```

Você deve ver:

```
✅ Pool de conexões Oracle criado com sucesso
📊 Conectado ao Oracle: 192.168.2.15:1521/outros.sameldm.com
[express] serving on 127.0.0.1:5000
```

---

## 🌐 Passo 2: Expor a API com Ngrok

**Em outro terminal** (deixe a API rodando no primeiro):

```bash
# Se ainda não instalou ngrok:
npm install -g ngrok

# Expor a porta 5000
ngrok http 5000
```

**O que você verá:**

```
Session Status                online
Account                       Seu Nome (Plan: Free)
Version                       3.x.x
Region                        United States (us)
Latency                       -
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123.ngrok-free.app -> http://localhost:5000
```

---

## 📋 Passo 3: Copiar a URL do Ngrok

Na linha **"Forwarding"**, copie a URL que começa com `https://`:

**Exemplo:**
```
https://abc123.ngrok-free.app
```

⚠️ **IMPORTANTE:** 
- A URL muda **toda vez** que você reinicia o ngrok
- Use a versão **HTTPS** (não HTTP)
- **NÃO adicione** `/api` no final

---

## 🧪 Passo 4: Testar a API no Navegador

Antes de integrar com o Lovable, teste se está funcionando:

```
https://abc123.ngrok-free.app/api/health
```

**Você deve ver:**

```json
{
  "status": "healthy",
  "oracle": "connected",
  "timestamp": "2025-11-05T...",
  "message": "API e banco de dados Oracle funcionando corretamente"
}
```

✅ **Se aparecer isso, está tudo certo!**

❌ **Se der erro "Not Found":** Verifique se a API está rodando

---

## 🎨 Passo 5: Integrar no Lovable

### **Opção A: Usar Fetch Direto (Simples)**

No seu código Lovable (TypeScript/React):

```typescript
// Substitua pela sua URL do Ngrok
const API_URL = 'https://abc123.ngrok-free.app';

// Exemplo: Buscar sinistros
async function buscarSinistros() {
  const response = await fetch(`${API_URL}/api/sinistros`);
  const data = await response.json();
  return data;
}

// Exemplo: Buscar estatísticas
async function buscarEstatisticas() {
  const response = await fetch(`${API_URL}/api/estatisticas`);
  const data = await response.json();
  return data;
}

// Exemplo: Buscar sinistros pendentes
async function buscarSinistrosPendentes() {
  const response = await fetch(`${API_URL}/api/sinistros?status=PENDENTE`);
  const data = await response.json();
  return data.data; // Retorna apenas o array de sinistros
}
```

### **Opção B: Criar um Arquivo de Configuração (Recomendado)**

Crie um arquivo `src/config/api.ts` no Lovable:

```typescript
// src/config/api.ts
const API_URL = 'https://abc123.ngrok-free.app'; // ⚠️ Substitua pela sua URL

export const api = {
  // Função auxiliar para fazer requisições
  async request(endpoint: string, options = {}) {
    const url = `${API_URL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erro na API:', error);
      throw error;
    }
  },

  // Métodos específicos
  sinistros: {
    listar: (filtros = '') => api.request(`/api/sinistros${filtros}`),
    buscarPorId: (id: number) => api.request(`/api/sinistros/${id}`),
    criar: (dados: any) => api.request('/api/sinistros', {
      method: 'POST',
      body: JSON.stringify(dados)
    }),
    atualizar: (id: number, dados: any) => api.request(`/api/sinistros/${id}`, {
      method: 'PUT',
      body: JSON.stringify(dados)
    }),
    deletar: (id: number) => api.request(`/api/sinistros/${id}`, {
      method: 'DELETE'
    }),
  },

  pacientes: {
    listar: (filtros = '') => api.request(`/api/pacientes${filtros}`),
    buscarPorId: (id: number) => api.request(`/api/pacientes/${id}`),
    criar: (dados: any) => api.request('/api/pacientes', {
      method: 'POST',
      body: JSON.stringify(dados)
    }),
  },

  estatisticas: {
    geral: () => api.request('/api/estatisticas'),
  },

  health: () => api.request('/api/health'),
};
```

### **Como Usar no Lovable:**

```typescript
import { api } from './config/api';
import { useState, useEffect } from 'react';

function SinistrosPage() {
  const [sinistros, setSinistros] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function carregarDados() {
      try {
        setLoading(true);
        const response = await api.sinistros.listar('?limit=20');
        setSinistros(response.data);
      } catch (error) {
        console.error('Erro ao carregar sinistros:', error);
      } finally {
        setLoading(false);
      }
    }

    carregarDados();
  }, []);

  if (loading) return <div>Carregando...</div>;

  return (
    <div>
      <h1>Sinistros</h1>
      {sinistros.map(sinistro => (
        <div key={sinistro.id}>
          <h3>{sinistro.numeroSinistro}</h3>
          <p>Paciente: {sinistro.pacienteNome}</p>
          <p>Valor: R$ {sinistro.valorTotal.toLocaleString('pt-BR')}</p>
          <p>Status: {sinistro.status}</p>
        </div>
      ))}
    </div>
  );
}

export default SinistrosPage;
```

---

## 📊 Passo 6: Exemplos Práticos

### **1. Dashboard de Estatísticas**

```typescript
import { api } from './config/api';
import { useState, useEffect } from 'react';

function Dashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.estatisticas.geral().then(setStats);
  }, []);

  if (!stats) return <div>Carregando...</div>;

  return (
    <div className="grid grid-cols-4 gap-4">
      <div className="card">
        <h3>Total de Sinistros</h3>
        <p className="text-3xl">{stats.totalSinistros}</p>
      </div>
      <div className="card">
        <h3>Pendentes</h3>
        <p className="text-3xl text-yellow-600">{stats.sinistrosPendentes}</p>
      </div>
      <div className="card">
        <h3>Aprovados</h3>
        <p className="text-3xl text-green-600">{stats.sinistrosAprovados}</p>
      </div>
      <div className="card">
        <h3>Valor Total</h3>
        <p className="text-3xl">
          R$ {stats.valorTotalSinistros.toLocaleString('pt-BR')}
        </p>
      </div>
    </div>
  );
}
```

### **2. Busca de Pacientes**

```typescript
import { api } from './config/api';
import { useState } from 'react';

function BuscaPaciente() {
  const [busca, setBusca] = useState('');
  const [resultados, setResultados] = useState([]);

  async function handleBuscar() {
    const response = await api.pacientes.listar(`?search=${busca}`);
    setResultados(response.data);
  }

  return (
    <div>
      <input 
        type="text"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        placeholder="Digite nome ou CPF"
      />
      <button onClick={handleBuscar}>Buscar</button>

      {resultados.map(paciente => (
        <div key={paciente.id}>
          <h3>{paciente.nome}</h3>
          <p>CPF: {paciente.cpf}</p>
          <p>Plano: {paciente.plano}</p>
        </div>
      ))}
    </div>
  );
}
```

### **3. Filtrar Sinistros por Status**

```typescript
import { api } from './config/api';

function FiltroSinistros() {
  const [status, setStatus] = useState('PENDENTE');
  const [sinistros, setSinistros] = useState([]);

  async function buscarPorStatus(novoStatus: string) {
    setStatus(novoStatus);
    const response = await api.sinistros.listar(`?status=${novoStatus}`);
    setSinistros(response.data);
  }

  return (
    <div>
      <div className="flex gap-2">
        <button onClick={() => buscarPorStatus('PENDENTE')}>Pendentes</button>
        <button onClick={() => buscarPorStatus('APROVADO')}>Aprovados</button>
        <button onClick={() => buscarPorStatus('REJEITADO')}>Rejeitados</button>
      </div>

      {/* Lista de sinistros */}
      {sinistros.map(s => (...))}
    </div>
  );
}
```

### **4. Criar Novo Sinistro**

```typescript
import { api } from './config/api';
import { useState } from 'react';

function NovoSinistro() {
  const [form, setForm] = useState({
    numeroSinistro: '',
    pacienteId: '',
    dataOcorrencia: '',
    valorTotal: '',
    tipoSinistro: 'CONSULTA',
    descricao: '',
    hospital: '',
  });

  async function handleSubmit(e) {
    e.preventDefault();
    
    try {
      const novoSinistro = await api.sinistros.criar({
        ...form,
        pacienteId: parseInt(form.pacienteId),
        valorTotal: parseFloat(form.valorTotal),
        status: 'PENDENTE',
      });

      alert('Sinistro criado com sucesso!');
      console.log('Novo sinistro:', novoSinistro);
    } catch (error) {
      alert('Erro ao criar sinistro: ' + error.message);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Número do Sinistro"
        value={form.numeroSinistro}
        onChange={(e) => setForm({...form, numeroSinistro: e.target.value})}
      />
      <input
        type="number"
        placeholder="ID do Paciente"
        value={form.pacienteId}
        onChange={(e) => setForm({...form, pacienteId: e.target.value})}
      />
      <input
        type="date"
        value={form.dataOcorrencia}
        onChange={(e) => setForm({...form, dataOcorrencia: e.target.value})}
      />
      <input
        type="number"
        step="0.01"
        placeholder="Valor Total"
        value={form.valorTotal}
        onChange={(e) => setForm({...form, valorTotal: e.target.value})}
      />
      <button type="submit">Criar Sinistro</button>
    </form>
  );
}
```

---

## 📋 Endpoints Disponíveis

### **Sinistros**
- `GET /api/sinistros` - Listar todos
- `GET /api/sinistros?status=PENDENTE` - Filtrar por status
- `GET /api/sinistros/:id` - Buscar por ID
- `POST /api/sinistros` - Criar novo
- `PUT /api/sinistros/:id` - Atualizar
- `DELETE /api/sinistros/:id` - Deletar

### **Pacientes**
- `GET /api/pacientes` - Listar todos
- `GET /api/pacientes?search=João` - Buscar por nome/CPF
- `GET /api/pacientes/:id` - Buscar por ID
- `POST /api/pacientes` - Criar novo
- `PUT /api/pacientes/:id` - Atualizar
- `DELETE /api/pacientes/:id` - Deletar

### **Estatísticas**
- `GET /api/estatisticas` - Dashboard geral

### **Health Check**
- `GET /api/health` - Status da API e Oracle

---

## ⚠️ Avisos Importantes

### **1. URL do Ngrok Muda**

A URL do Ngrok muda **toda vez** que você reinicia. Então você precisará:

1. Parar o ngrok (`Ctrl+C`)
2. Rodar novamente (`ngrok http 5000`)
3. **Atualizar a URL** no código do Lovable

**Solução:** Crie uma variável de ambiente no Lovable ou use o plano pago do Ngrok que dá URL fixa.

### **2. Mantenha a API Rodando**

- **Terminal 1:** `npm run dev` (API rodando)
- **Terminal 2:** `ngrok http 5000` (Túnel ativo)

Se fechar qualquer um, o Lovable perde conexão.

### **3. Aviso de Segurança do Ngrok**

Na primeira vez que acessar a URL do Ngrok, pode aparecer uma tela de aviso.

**Para usuários do Lovable:**
- Adicione `ngrok-skip-browser-warning: true` nos headers das requisições:

```typescript
fetch(`${API_URL}/api/sinistros`, {
  headers: {
    'ngrok-skip-browser-warning': 'true',
  }
})
```

Ou adicione no arquivo `api.ts`:

```typescript
async request(endpoint: string, options = {}) {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true', // ← Adicione esta linha
      ...options.headers,
    },
  });
  return await response.json();
}
```

---

## 🔍 Depuração

### **Ver Requisições no Ngrok**

Abra no navegador enquanto o ngrok está rodando:

```
http://127.0.0.1:4040
```

Você verá **todas as requisições** que passam pelo túnel!

---

## ✅ Checklist de Integração

- [ ] API rodando localmente (`npm run dev`)
- [ ] Ngrok rodando (`ngrok http 5000`)
- [ ] URL do Ngrok copiada
- [ ] Testou `/api/health` no navegador
- [ ] Criou arquivo `api.ts` no Lovable
- [ ] Substituiu a URL no código
- [ ] Adicionou header `ngrok-skip-browser-warning`
- [ ] Testou buscar dados no Lovable

---

## 🎉 Pronto!

Agora seu Lovable está conectado à sua API local via Ngrok! 

**Dicas:**
- Use o dashboard do Ngrok (`http://127.0.0.1:4040`) para debugar
- Mantenha os 2 terminais abertos (API + Ngrok)
- Se a URL mudar, atualize no Lovable

**Boa sorte com seu projeto!** 🚀
