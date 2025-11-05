# Guia de Integração - API de Sinistralidade Hospitalar

## 🎯 Para Usar no Lovable (Frontend)

### Passo 1: Obter a URL da API

Sua API está rodando no Replit. A URL é:
```
https://[nome-do-seu-replit].replit.app
```

**Como encontrar a URL:**
1. Abra seu projeto no Replit
2. Olhe no topo da aba "Webview" ou console
3. A URL será algo como: `https://sua-app.replit.app`

### Passo 2: Testar a Conexão

Antes de integrar no Lovable, teste se a API está funcionando:

1. Abra seu navegador
2. Acesse: `https://[sua-url].replit.app/api/health`
3. Você deve ver:
```json
{
  "status": "healthy",
  "oracle": "connected",
  "timestamp": "2025-11-05T...",
  "message": "API e banco de dados Oracle funcionando corretamente"
}
```

Se ver `"oracle": "connected"` ✅ - Tudo certo!

### Passo 3: Integrar no Lovable

No seu projeto Lovable, use a API assim:

#### Exemplo 1: Buscar Sinistros

```typescript
const API_URL = 'https://[sua-url].replit.app';

// Buscar todos os sinistros
async function buscarSinistros() {
  try {
    const response = await fetch(`${API_URL}/api/sinistros`);
    const data = await response.json();
    console.log('Sinistros:', data);
    return data;
  } catch (error) {
    console.error('Erro ao buscar sinistros:', error);
    throw error;
  }
}

// Buscar sinistros filtrados
async function buscarSinistrosPendentes() {
  const response = await fetch(`${API_URL}/api/sinistros?status=PENDENTE&limit=20`);
  const data = await response.json();
  return data;
}

// Buscar sinistro específico
async function buscarSinistroPorId(id: number) {
  const response = await fetch(`${API_URL}/api/sinistros/${id}`);
  const data = await response.json();
  return data;
}
```

#### Exemplo 2: Buscar Pacientes

```typescript
// Buscar todos os pacientes
async function buscarPacientes() {
  const response = await fetch(`${API_URL}/api/pacientes`);
  const data = await response.json();
  return data;
}

// Buscar paciente por nome/CPF
async function buscarPacientePorNome(nome: string) {
  const response = await fetch(
    `${API_URL}/api/pacientes?search=${encodeURIComponent(nome)}`
  );
  const data = await response.json();
  return data;
}

// Buscar paciente específico
async function buscarPacientePorId(id: number) {
  const response = await fetch(`${API_URL}/api/pacientes/${id}`);
  const data = await response.json();
  return data;
}
```

#### Exemplo 3: Buscar Estatísticas

```typescript
async function buscarEstatisticas() {
  const response = await fetch(`${API_URL}/api/estatisticas`);
  const data = await response.json();
  return data;
}

// Usar em um componente React
function Dashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    buscarEstatisticas().then(data => {
      setStats(data);
    });
  }, []);

  return (
    <div>
      <h1>Dashboard</h1>
      {stats && (
        <div>
          <p>Total de Sinistros: {stats.totalSinistros}</p>
          <p>Pendentes: {stats.sinistrosPendentes}</p>
          <p>Aprovados: {stats.sinistrosAprovados}</p>
          <p>Valor Total: R$ {stats.valorTotalSinistros.toLocaleString()}</p>
        </div>
      )}
    </div>
  );
}
```

### Passo 4: Configurar no Lovable

No Lovable, você pode criar um arquivo de configuração:

```typescript
// config/api.ts
export const API_CONFIG = {
  baseURL: 'https://[sua-url].replit.app',
  endpoints: {
    sinistros: '/api/sinistros',
    pacientes: '/api/pacientes',
    estatisticas: '/api/estatisticas',
    health: '/api/health',
  }
};

// Função auxiliar para fazer requisições
export async function apiRequest(endpoint: string, options = {}) {
  const url = `${API_CONFIG.baseURL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  return response.json();
}
```

E usar assim:

```typescript
import { apiRequest, API_CONFIG } from './config/api';

// Buscar sinistros
const sinistros = await apiRequest(API_CONFIG.endpoints.sinistros);

// Buscar com filtros
const pendentes = await apiRequest(
  `${API_CONFIG.endpoints.sinistros}?status=PENDENTE`
);
```

## 📋 Exemplos de Filtros

### Filtrar Sinistros por Status
```
GET /api/sinistros?status=PENDENTE
GET /api/sinistros?status=APROVADO
GET /api/sinistros?status=REJEITADO
```

### Filtrar Sinistros por Período
```
GET /api/sinistros?dataInicio=2025-01-01&dataFim=2025-01-31
```

### Filtrar Sinistros por Paciente
```
GET /api/sinistros?pacienteId=123
```

### Combinar Filtros
```
GET /api/sinistros?status=PENDENTE&dataInicio=2025-01-01&limit=10
```

### Paginação
```
GET /api/sinistros?limit=20&offset=0    // Primeiros 20
GET /api/sinistros?limit=20&offset=20   // Próximos 20
GET /api/sinistros?limit=20&offset=40   // Próximos 20
```

### Buscar Pacientes
```
GET /api/pacientes?search=João
GET /api/pacientes?search=123.456.789-00
GET /api/pacientes?search=123456789
```

## 🔍 Estrutura de Resposta

### Sinistros
```json
{
  "data": [
    {
      "id": 1,
      "numeroSinistro": "SIN-2025-001",
      "pacienteId": 123,
      "pacienteNome": "João Silva",
      "dataOcorrencia": "2025-01-15",
      "dataRegistro": "2025-01-16",
      "status": "PENDENTE",
      "valorTotal": 5000.00,
      "tipoSinistro": "CONSULTA",
      "descricao": "Consulta cardiológica",
      "hospital": "Hospital São Lucas"
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 1
  }
}
```

### Pacientes
```json
{
  "data": [
    {
      "id": 123,
      "nome": "João Silva",
      "cpf": "123.456.789-00",
      "dataNascimento": "1980-05-15",
      "plano": "Premium",
      "numeroCarteirinha": "123456789",
      "telefone": "(11) 98765-4321",
      "email": "joao.silva@email.com"
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 1
  }
}
```

### Estatísticas
```json
{
  "totalSinistros": 1500,
  "sinistrosPendentes": 250,
  "sinistrosAprovados": 1100,
  "sinistrosRejeitados": 150,
  "valorTotalSinistros": 2500000.00,
  "valorMedioPorSinistro": 1666.67
}
```

## ⚠️ Tratamento de Erros

### Erro 404 - Não Encontrado
```json
{
  "error": "Sinistro não encontrado",
  "message": "Nenhum sinistro encontrado com ID 999"
}
```

### Erro 500 - Erro do Servidor
```json
{
  "error": "Erro ao buscar sinistros",
  "message": "ORA-00942: table or view does not exist"
}
```

### Erro 503 - Banco Indisponível
```json
{
  "status": "unhealthy",
  "oracle": "disconnected",
  "timestamp": "2025-11-05T...",
  "message": "Falha na conexão com o banco de dados Oracle"
}
```

## 🚀 Dicas Importantes

1. **Sempre use HTTPS**: A URL do Replit já vem com HTTPS
2. **Não precisa de Ngrok**: O Replit já expõe sua API publicamente
3. **CORS está configurado**: Pode fazer requisições de qualquer domínio
4. **Use o endpoint /health**: Para verificar se a API está funcionando
5. **Trate erros**: Sempre use try/catch nas suas requisições
6. **Cache inteligente**: Considere cachear estatísticas que mudam pouco

## 📞 Suporte

Se a API não estiver funcionando:

1. Verifique o endpoint `/api/health`
2. Veja os logs no console do Replit
3. Confirme que o banco Oracle está acessível
4. Verifique se as credenciais estão corretas nos Secrets

## 🎨 Exemplo Completo no Lovable

```typescript
import { useState, useEffect } from 'react';

const API_URL = 'https://[sua-url].replit.app';

function SinistrosPage() {
  const [sinistros, setSinistros] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function carregarSinistros() {
      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/api/sinistros?limit=20`);
        const data = await response.json();
        setSinistros(data.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    carregarSinistros();
  }, []);

  if (loading) return <div>Carregando...</div>;
  if (error) return <div>Erro: {error}</div>;

  return (
    <div>
      <h1>Sinistros</h1>
      <ul>
        {sinistros.map(sinistro => (
          <li key={sinistro.id}>
            {sinistro.numeroSinistro} - {sinistro.pacienteNome} - 
            R$ {sinistro.valorTotal.toLocaleString()} - {sinistro.status}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default SinistrosPage;
```

Pronto! Agora você pode integrar sua API do Replit com o frontend no Lovable! 🎉
