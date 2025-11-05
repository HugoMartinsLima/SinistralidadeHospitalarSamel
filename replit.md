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

### 6. Criar Sinistro
```
POST /api/sinistros
Content-Type: application/json
```

**Body:**
```json
{
  "numeroSinistro": "SIN-2025-001",
  "pacienteId": 123,
  "dataOcorrencia": "2025-01-15",
  "status": "PENDENTE",
  "valorTotal": 5000.00,
  "tipoSinistro": "CONSULTA",
  "descricao": "Consulta cardiológica (opcional)",
  "hospital": "Hospital São Lucas (opcional)"
}
```

### 7. Atualizar Sinistro
```
PUT /api/sinistros/:id
Content-Type: application/json
```

**Body:**
```json
{
  "status": "APROVADO",
  "valorTotal": 5500.00
}
```

### 8. Deletar Sinistro
```
DELETE /api/sinistros/:id
```

### 9. Criar Paciente
```
POST /api/pacientes
Content-Type: application/json
```

**Body:**
```json
{
  "nome": "João Silva",
  "cpf": "123.456.789-00",
  "dataNascimento": "1980-05-15",
  "plano": "Premium",
  "numeroCarteirinha": "123456789",
  "telefone": "(11) 98765-4321 (opcional)",
  "email": "joao.silva@email.com (opcional)"
}
```

### 10. Atualizar Paciente
```
PUT /api/pacientes/:id
Content-Type: application/json
```

**Body:**
```json
{
  "telefone": "(11) 91234-5678",
  "email": "novo.email@email.com"
}
```

### 11. Deletar Paciente
```
DELETE /api/pacientes/:id
```

### 12. Estatísticas Gerais
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

### 13. Informações da API
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

// Exemplo: Criar novo sinistro
async function criarSinistro(sinistro: any) {
  const response = await fetch(`${API_BASE_URL}/api/sinistros`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(sinistro)
  });
  return await response.json();
}

// Exemplo: Atualizar sinistro
async function atualizarSinistro(id: number, dados: any) {
  const response = await fetch(`${API_BASE_URL}/api/sinistros/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(dados)
  });
  return await response.json();
}

// Exemplo: Deletar sinistro
async function deletarSinistro(id: number) {
  const response = await fetch(`${API_BASE_URL}/api/sinistros/${id}`, {
    method: 'DELETE'
  });
  return await response.json();
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

- ✅ **CRUD Completo**: API REST com todos endpoints CREATE, READ, UPDATE e DELETE implementados
- ✅ **Validação**: Usa Zod para validação de dados com mensagens de erro apropriadas
- ✅ **Códigos HTTP**: Erros de validação retornam 400, erros de banco/servidor retornam 500
- ✅ **Campos Opcionais**: Campos opcionais (descricao, hospital, telefone, email) são tratados corretamente
- ✅ **CORS**: Configurado para aceitar requisições de qualquer origem
- ✅ **Pool de Conexões**: Oracle configurado com mínimo de 2 e máximo de 10 conexões
- ✅ **Formato de Datas**: Todas as datas são retornadas no formato ISO (YYYY-MM-DD)
- ✅ **Logs**: A API loga automaticamente todas as requisições para `/api/*`
- ✅ **Segurança**: Credenciais armazenadas em Replit Secrets (nunca em código)

## 🔧 Desenvolvimento

- A API reinicia automaticamente quando você faz alterações no código
- Os logs aparecem no console do Replit
- Use o endpoint `/api/health` para verificar se a conexão com Oracle está funcionando

## 📚 Próximos Passos

1. Configure seu frontend no Lovable para consumir esta API
2. Use a URL do Replit (sem necessidade de Ngrok)
3. Implemente autenticação se necessário
4. Adicione mais endpoints conforme necessário
