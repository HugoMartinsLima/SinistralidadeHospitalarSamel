# API de Sinistralidade Hospitalar

API REST desenvolvida em Node.js/Express integrada com banco de dados Oracle para gerenciamento de sinistros hospitalares.

## 📋 Sobre o Projeto

Esta API foi desenvolvida para servir como backend para uma aplicação de sinistralidade hospitalar. O frontend será desenvolvido no Lovable e consumirá esta API.

## 🏗️ Arquitetura

- **Backend**: Node.js + Express
- **Banco de Dados**: Oracle Database
- **Driver Oracle**: oracledb (driver oficial Oracle para Node.js)
- **CORS**: Configurado para aceitar requisições de qualquer origem
- **Pool de Conexões**: Gerenciamento eficiente de conexões com Oracle

## 🔌 Configuração

### Variáveis de Ambiente (Secrets)

As seguintes variáveis de ambiente devem estar configuradas no Replit Secrets:

- `ORACLE_HOST`: Endereço IP ou hostname do servidor Oracle
- `ORACLE_PORT`: Porta do Oracle (geralmente 1521)
- `ORACLE_USER`: Usuário do banco de dados
- `ORACLE_PASSWORD`: Senha do usuário
- `ORACLE_SERVICE`: Nome do serviço Oracle

**Nota**: Nunca exponha credenciais reais em código ou documentação. Use sempre o sistema de Secrets do Replit.

## 📡 Endpoints da API

### 1. Health Check
```
GET /api/health
```
Verifica o status da API e conexão com o banco de dados Oracle.

**Resposta de sucesso:**
```json
{
  "status": "healthy",
  "oracle": "connected",
  "timestamp": "2025-11-05T12:00:00.000Z",
  "message": "API e banco de dados Oracle funcionando corretamente"
}
```

### 2. Listar Sinistros
```
GET /api/sinistros
```

**Parâmetros de Query (opcionais):**
- `status`: Filtrar por status (PENDENTE, EM_ANALISE, APROVADO, REJEITADO, PAGO)
- `dataInicio`: Data inicial (formato: YYYY-MM-DD)
- `dataFim`: Data final (formato: YYYY-MM-DD)
- `pacienteId`: ID do paciente
- `limit`: Quantidade de registros (padrão: 50)
- `offset`: Paginação (padrão: 0)

**Exemplo:**
```
GET /api/sinistros?status=PENDENTE&limit=10
```

**Resposta:**
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
    "limit": 10,
    "offset": 0,
    "total": 1
  }
}
```

### 3. Detalhes de um Sinistro
```
GET /api/sinistros/:id
```

**Exemplo:**
```
GET /api/sinistros/1
```

### 4. Listar Pacientes
```
GET /api/pacientes
```

**Parâmetros de Query (opcionais):**
- `search`: Buscar por nome, CPF ou número de carteirinha
- `limit`: Quantidade de registros (padrão: 50)
- `offset`: Paginação (padrão: 0)

**Exemplo:**
```
GET /api/pacientes?search=João&limit=10
```

**Resposta:**
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
    "limit": 10,
    "offset": 0,
    "total": 1
  }
}
```

### 5. Detalhes de um Paciente
```
GET /api/pacientes/:id
```

**Exemplo:**
```
GET /api/pacientes/123
```

### 6. Estatísticas Gerais
```
GET /api/estatisticas
```

**Resposta:**
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

### 7. Informações da API
```
GET /api
```

Retorna informações sobre a API e lista de endpoints disponíveis.

## 🌐 Usando a API no Lovable

### URL da API

A URL da sua API no Replit é:
```
https://[seu-projeto].replit.app
```

Você pode encontrar a URL exata na aba "Webview" do Replit ou no topo da interface.

### Exemplo de Integração no Frontend (Lovable)

```typescript
// Configurar base URL da API
const API_BASE_URL = 'https://[seu-projeto].replit.app';

// Exemplo: Buscar sinistros
async function buscarSinistros() {
  const response = await fetch(`${API_BASE_URL}/api/sinistros?limit=10`);
  const data = await response.json();
  return data;
}

// Exemplo: Buscar estatísticas
async function buscarEstatisticas() {
  const response = await fetch(`${API_BASE_URL}/api/estatisticas`);
  const data = await response.json();
  return data;
}

// Exemplo: Buscar pacientes
async function buscarPacientes(search: string) {
  const response = await fetch(
    `${API_BASE_URL}/api/pacientes?search=${encodeURIComponent(search)}`
  );
  const data = await response.json();
  return data;
}
```

## 🔍 Estrutura do Banco de Dados Oracle

A API espera as seguintes tabelas no banco Oracle:

### Tabela: sinistros
- `id` (NUMBER)
- `numero_sinistro` (VARCHAR2)
- `paciente_id` (NUMBER)
- `data_ocorrencia` (DATE)
- `data_registro` (DATE)
- `status` (VARCHAR2) - PENDENTE, EM_ANALISE, APROVADO, REJEITADO, PAGO
- `valor_total` (NUMBER)
- `tipo_sinistro` (VARCHAR2)
- `descricao` (VARCHAR2)
- `hospital` (VARCHAR2)

### Tabela: pacientes
- `id` (NUMBER)
- `nome` (VARCHAR2)
- `cpf` (VARCHAR2)
- `data_nascimento` (DATE)
- `plano` (VARCHAR2)
- `numero_carteirinha` (VARCHAR2)
- `telefone` (VARCHAR2)
- `email` (VARCHAR2)

## 🚀 Como Testar

1. Verifique se a API está funcionando:
   ```
   GET https://[seu-projeto].replit.app/api/health
   ```

2. Teste os endpoints usando ferramentas como:
   - Browser (para requisições GET)
   - Postman
   - cURL
   - Thunder Client (VS Code)

3. Exemplo com cURL:
   ```bash
   curl https://[seu-projeto].replit.app/api/sinistros
   ```

## 📝 Notas Importantes

- A API usa CORS configurado para aceitar requisições de qualquer origem
- O pool de conexões Oracle está configurado com mínimo de 2 e máximo de 10 conexões
- Todas as datas são retornadas no formato ISO (YYYY-MM-DD)
- Os erros retornam status HTTP apropriados (404, 500, etc.)
- A API loga automaticamente todas as requisições para `/api/*`

## 🔧 Desenvolvimento

- A API reinicia automaticamente quando você faz alterações no código
- Os logs aparecem no console do Replit
- Use o endpoint `/api/health` para verificar se a conexão com Oracle está funcionando

## 📚 Próximos Passos

1. Configure seu frontend no Lovable para consumir esta API
2. Use a URL do Replit (sem necessidade de Ngrok)
3. Implemente autenticação se necessário
4. Adicione mais endpoints conforme necessário
