# API de Breakeven - Guia de Integração Lovable

## Visão Geral

Endpoints para gerenciar o **breakeven** (ponto de equilíbrio) por contrato na tabela `sini_empresa_breakeven`.

## Estrutura da Tabela

```sql
sini_empresa_breakeven
├── NR_CONTRATO    VARCHAR2(50)  NOT NULL  -- Número do contrato (PK)
├── DS_ESTIPULANTE VARCHAR2(255)           -- Nome da empresa
└── BREAKEVEN      NUMBER(5,2)   NOT NULL  -- Valor do breakeven (0-999.99)
```

## Endpoints Disponíveis

### 1. Listar Todos os Breakevens

```http
GET /api/breakeven
```

**Resposta:**
```json
{
  "data": [
    {
      "nrContrato": "12345",
      "dsEstipulante": "EMPRESA EXEMPLO LTDA",
      "breakeven": 75.50
    }
  ],
  "total": 1
}
```

### 2. Buscar Breakeven de um Contrato

```http
GET /api/breakeven/:nrContrato
```

**Exemplo:** `GET /api/breakeven/12345`

**Resposta (200):**
```json
{
  "nrContrato": "12345",
  "dsEstipulante": "EMPRESA EXEMPLO LTDA",
  "breakeven": 75.50
}
```

**Resposta (404):**
```json
{
  "error": "Breakeven não encontrado",
  "message": "Nenhum breakeven cadastrado para o contrato 12345"
}
```

### 3. Criar ou Atualizar Breakeven (Upsert)

```http
POST /api/breakeven
Content-Type: application/json

{
  "nrContrato": "12345",
  "dsEstipulante": "EMPRESA EXEMPLO LTDA",
  "breakeven": 75.50
}
```

**Campos:**
| Campo | Tipo | Obrigatório | Descrição |
|-------|------|-------------|-----------|
| nrContrato | string | Sim | Número do contrato (máx. 50 chars) |
| dsEstipulante | string | Não | Nome da empresa (máx. 255 chars) |
| breakeven | number | Sim | Valor do breakeven (0 a 999.99) |

**Resposta (201 - Criado / 200 - Atualizado):**
```json
{
  "success": true,
  "action": "inserted",
  "message": "Breakeven criado para contrato 12345",
  "data": {
    "nrContrato": "12345",
    "dsEstipulante": "EMPRESA EXEMPLO LTDA",
    "breakeven": 75.50
  }
}
```

### 4. Criar/Atualizar Múltiplos Breakevens (Batch)

```http
POST /api/breakeven/batch
Content-Type: application/json

{
  "registros": [
    { "nrContrato": "12345", "dsEstipulante": "EMPRESA A", "breakeven": 75.50 },
    { "nrContrato": "67890", "dsEstipulante": "EMPRESA B", "breakeven": 80.00 }
  ]
}
```

**Resposta:**
```json
{
  "success": true,
  "inserted": 1,
  "updated": 1,
  "failed": 0,
  "total": 2,
  "errors": []
}
```

### 5. Remover Breakeven

```http
DELETE /api/breakeven/:nrContrato
```

**Exemplo:** `DELETE /api/breakeven/12345`

**Resposta (200):**
```json
{
  "success": true,
  "message": "Breakeven removido para o contrato 12345"
}
```

---

## Código React/TypeScript para Lovable

### Tipos

```typescript
interface Breakeven {
  nrContrato: string;
  dsEstipulante: string | null;
  breakeven: number;
}

interface BreakevenInput {
  nrContrato: string;
  dsEstipulante?: string;
  breakeven: number;
}

interface BreakevenResponse {
  data: Breakeven[];
  total: number;
}

interface SaveBreakevenResponse {
  success: boolean;
  action: 'inserted' | 'updated';
  message: string;
  data: Breakeven;
}
```

### Funções de API

```typescript
const API_BASE = 'https://sua-api.com'; // Substitua pela URL real

// Listar todos os breakevens
export async function listarBreakevens(): Promise<Breakeven[]> {
  const response = await fetch(`${API_BASE}/api/breakeven`);
  if (!response.ok) throw new Error('Erro ao listar breakevens');
  const data: BreakevenResponse = await response.json();
  return data.data;
}

// Buscar breakeven por contrato
export async function getBreakeven(nrContrato: string): Promise<Breakeven | null> {
  const response = await fetch(`${API_BASE}/api/breakeven/${nrContrato}`);
  if (response.status === 404) return null;
  if (!response.ok) throw new Error('Erro ao buscar breakeven');
  return response.json();
}

// Salvar breakeven (cria ou atualiza)
export async function salvarBreakeven(data: BreakevenInput): Promise<SaveBreakevenResponse> {
  const response = await fetch(`${API_BASE}/api/breakeven`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Erro ao salvar breakeven');
  }
  return response.json();
}

// Remover breakeven
export async function removerBreakeven(nrContrato: string): Promise<void> {
  const response = await fetch(`${API_BASE}/api/breakeven/${nrContrato}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Erro ao remover breakeven');
}
```

### Exemplo de Componente React

```tsx
import { useState, useEffect } from 'react';
import { listarBreakevens, salvarBreakeven, removerBreakeven } from './api';

export function BreakevenManager() {
  const [breakevens, setBreakevens] = useState<Breakeven[]>([]);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState<string | null>(null);
  const [form, setForm] = useState({ nrContrato: '', dsEstipulante: '', breakeven: 0 });

  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    setLoading(true);
    try {
      const dados = await listarBreakevens();
      setBreakevens(dados);
    } catch (error) {
      console.error('Erro:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSalvar() {
    try {
      await salvarBreakeven({
        nrContrato: form.nrContrato,
        dsEstipulante: form.dsEstipulante || undefined,
        breakeven: form.breakeven,
      });
      await carregarDados();
      setForm({ nrContrato: '', dsEstipulante: '', breakeven: 0 });
      setEditando(null);
    } catch (error) {
      alert('Erro ao salvar: ' + error);
    }
  }

  async function handleRemover(nrContrato: string) {
    if (!confirm('Deseja remover o breakeven deste contrato?')) return;
    try {
      await removerBreakeven(nrContrato);
      await carregarDados();
    } catch (error) {
      alert('Erro ao remover: ' + error);
    }
  }

  function handleEditar(b: Breakeven) {
    setEditando(b.nrContrato);
    setForm({
      nrContrato: b.nrContrato,
      dsEstipulante: b.dsEstipulante || '',
      breakeven: b.breakeven,
    });
  }

  if (loading) return <div>Carregando...</div>;

  return (
    <div>
      <h2>Gerenciar Breakeven por Contrato</h2>
      
      {/* Formulário */}
      <div className="form">
        <input
          placeholder="Nº Contrato"
          value={form.nrContrato}
          onChange={(e) => setForm({ ...form, nrContrato: e.target.value })}
          disabled={!!editando}
        />
        <input
          placeholder="Empresa"
          value={form.dsEstipulante}
          onChange={(e) => setForm({ ...form, dsEstipulante: e.target.value })}
        />
        <input
          type="number"
          placeholder="Breakeven %"
          value={form.breakeven}
          onChange={(e) => setForm({ ...form, breakeven: parseFloat(e.target.value) || 0 })}
          min={0}
          max={999.99}
          step={0.01}
        />
        <button onClick={handleSalvar}>
          {editando ? 'Atualizar' : 'Adicionar'}
        </button>
        {editando && (
          <button onClick={() => { setEditando(null); setForm({ nrContrato: '', dsEstipulante: '', breakeven: 0 }); }}>
            Cancelar
          </button>
        )}
      </div>

      {/* Tabela */}
      <table>
        <thead>
          <tr>
            <th>Contrato</th>
            <th>Empresa</th>
            <th>Breakeven</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {breakevens.map((b) => (
            <tr key={b.nrContrato}>
              <td>{b.nrContrato}</td>
              <td>{b.dsEstipulante || '-'}</td>
              <td>{b.breakeven.toFixed(2)}%</td>
              <td>
                <button onClick={() => handleEditar(b)}>Editar</button>
                <button onClick={() => handleRemover(b.nrContrato)}>Remover</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

## Validações

- `nrContrato`: Obrigatório, máximo 50 caracteres
- `dsEstipulante`: Opcional, máximo 255 caracteres  
- `breakeven`: Obrigatório, número entre 0 e 999.99

## Comportamento UPSERT

O endpoint `POST /api/breakeven` funciona como **upsert**:
- Se o contrato **não existe**: cria novo registro (status 201)
- Se o contrato **já existe**: atualiza o registro (status 200)

Isso simplifica a lógica do frontend - basta chamar POST independente se é criação ou atualização.

## Erros Comuns

| Status | Erro | Causa |
|--------|------|-------|
| 400 | Erro de validação | Dados inválidos (breakeven negativo, contrato vazio) |
| 404 | Breakeven não encontrado | GET/DELETE de contrato inexistente |
| 500 | Erro interno | Problema de conexão com banco |
