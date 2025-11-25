# Prompt Lovable: API de Resumo de Contratos

## Objetivo
Implementar uma tabela/dashboard que exibe dados agregados de sinistralidade por contrato, consumindo a API `/api/contratos/resumo`.

---

## Endpoint da API

```
GET /api/contratos/resumo
```

### Query Parameters

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `dataInicio` | string | Sim | Data inicial no formato DD/MM/YYYY |
| `dataFim` | string | Sim | Data final no formato DD/MM/YYYY |
| `contratos` | string | Não | Lista de números de contrato separados por vírgula (ex: "2444,5998,3021") |
| `grupoReceita` | string | Não | Filtrar por grupo de receita específico |

### Exemplo de Requisição

```javascript
// Buscar todos os contratos no período
fetch('https://sua-api.ngrok.io/api/contratos/resumo?dataInicio=01/11/2025&dataFim=30/11/2025', {
  headers: {
    'ngrok-skip-browser-warning': 'true'
  }
})

// Buscar contratos específicos
fetch('https://sua-api.ngrok.io/api/contratos/resumo?dataInicio=01/11/2025&dataFim=30/11/2025&contratos=2444,5998', {
  headers: {
    'ngrok-skip-browser-warning': 'true'
  }
})

// Filtrar por grupo de receita
fetch('https://sua-api.ngrok.io/api/contratos/resumo?dataInicio=01/11/2025&dataFim=30/11/2025&grupoReceita=EXAMES', {
  headers: {
    'ngrok-skip-browser-warning': 'true'
  }
})
```

### Resposta da API

```json
{
  "data": [
    {
      "nrContrato": 2444,
      "dsEstipulante": "EMPRESA ABC LTDA",
      "sinistroTotal": 125000.50,
      "sinistroTitular": 85000.00,
      "sinistrosDependentes": 40000.50,
      "premio": null,
      "sinistralidade": null,
      "quantidadeBeneficiarios": 450,
      "quantidadeAtendimentos": 1250
    },
    {
      "nrContrato": 5998,
      "dsEstipulante": "OUTRA EMPRESA S/A",
      "sinistroTotal": 98500.00,
      "sinistroTitular": 65000.00,
      "sinistrosDependentes": 33500.00,
      "premio": null,
      "sinistralidade": null,
      "quantidadeBeneficiarios": 320,
      "quantidadeAtendimentos": 890
    }
  ],
  "total": 2,
  "filters": {
    "dataInicio": "01/11/2025",
    "dataFim": "30/11/2025",
    "contratos": "TODOS",
    "grupoReceita": "TODOS"
  }
}
```

---

## Estrutura dos Dados

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `nrContrato` | number | Número do contrato/apólice |
| `dsEstipulante` | string | Razão social da empresa contratante |
| `sinistroTotal` | number | Valor total de sinistros no período |
| `sinistroTitular` | number | Valor de sinistros apenas de titulares |
| `sinistrosDependentes` | number | Valor de sinistros apenas de dependentes |
| `premio` | number \| null | Valor do prêmio (null se não disponível) |
| `sinistralidade` | number \| null | Percentual de sinistralidade (null se prêmio não disponível) |
| `quantidadeBeneficiarios` | number | Quantidade de beneficiários únicos atendidos |
| `quantidadeAtendimentos` | number | Quantidade total de atendimentos no período |

---

## Implementação Frontend

### 1. Interface TypeScript

```typescript
interface ResumoContrato {
  nrContrato: number;
  dsEstipulante: string;
  sinistroTotal: number;
  sinistroTitular: number;
  sinistrosDependentes: number;
  premio: number | null;
  sinistralidade: number | null;
  quantidadeBeneficiarios: number;
  quantidadeAtendimentos: number;
}

interface ResumoContratosResponse {
  data: ResumoContrato[];
  total: number;
  filters: {
    dataInicio: string;
    dataFim: string;
    contratos: string;
    grupoReceita: string;
  };
}

interface ResumoContratosParams {
  dataInicio: string;
  dataFim: string;
  contratos?: string;
  grupoReceita?: string;
}
```

### 2. Hook React Query

```typescript
import { useQuery } from '@tanstack/react-query';

const API_BASE_URL = 'https://sua-api.ngrok.io';

const fetchResumoContratos = async (params: ResumoContratosParams): Promise<ResumoContratosResponse> => {
  const searchParams = new URLSearchParams({
    dataInicio: params.dataInicio,
    dataFim: params.dataFim,
  });
  
  if (params.contratos) {
    searchParams.append('contratos', params.contratos);
  }
  if (params.grupoReceita) {
    searchParams.append('grupoReceita', params.grupoReceita);
  }

  const response = await fetch(`${API_BASE_URL}/api/contratos/resumo?${searchParams}`, {
    headers: {
      'ngrok-skip-browser-warning': 'true',
    },
  });

  if (!response.ok) {
    throw new Error('Erro ao buscar resumo de contratos');
  }

  return response.json();
};

export function useContratosResumo(params: ResumoContratosParams) {
  return useQuery({
    queryKey: ['contratos-resumo', params],
    queryFn: () => fetchResumoContratos(params),
    staleTime: 5 * 60 * 1000, // 5 minutos
    enabled: !!params.dataInicio && !!params.dataFim,
  });
}
```

### 3. Componente de Tabela

```tsx
import { useContratosResumo } from '@/hooks/useContratosResumo';
import { formatCurrency, formatNumber } from '@/lib/utils';

interface Props {
  dataInicio: string;
  dataFim: string;
  contratos?: string;
  grupoReceita?: string;
}

export function TabelaResumoContratos({ dataInicio, dataFim, contratos, grupoReceita }: Props) {
  const { data, isLoading, error } = useContratosResumo({
    dataInicio,
    dataFim,
    contratos,
    grupoReceita,
  });

  if (isLoading) {
    return <div>Carregando resumo de contratos...</div>;
  }

  if (error) {
    return <div>Erro ao carregar dados: {error.message}</div>;
  }

  if (!data || data.data.length === 0) {
    return <div>Nenhum contrato encontrado no período selecionado.</div>;
  }

  return (
    <div>
      <p className="text-sm text-muted-foreground mb-4">
        {data.total} contrato(s) encontrado(s)
      </p>
      
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-muted">
            <th className="p-2 text-left">Contrato</th>
            <th className="p-2 text-left">Estipulante</th>
            <th className="p-2 text-right">Sinistro Total</th>
            <th className="p-2 text-right">Titular</th>
            <th className="p-2 text-right">Dependentes</th>
            <th className="p-2 text-right">Beneficiários</th>
            <th className="p-2 text-right">Atendimentos</th>
          </tr>
        </thead>
        <tbody>
          {data.data.map((contrato) => (
            <tr key={contrato.nrContrato} className="border-b hover:bg-muted/50">
              <td className="p-2">{contrato.nrContrato}</td>
              <td className="p-2">{contrato.dsEstipulante}</td>
              <td className="p-2 text-right">{formatCurrency(contrato.sinistroTotal)}</td>
              <td className="p-2 text-right">{formatCurrency(contrato.sinistroTitular)}</td>
              <td className="p-2 text-right">{formatCurrency(contrato.sinistrosDependentes)}</td>
              <td className="p-2 text-right">{formatNumber(contrato.quantidadeBeneficiarios)}</td>
              <td className="p-2 text-right">{formatNumber(contrato.quantidadeAtendimentos)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-muted font-bold">
            <td className="p-2" colSpan={2}>TOTAL</td>
            <td className="p-2 text-right">
              {formatCurrency(data.data.reduce((sum, c) => sum + c.sinistroTotal, 0))}
            </td>
            <td className="p-2 text-right">
              {formatCurrency(data.data.reduce((sum, c) => sum + c.sinistroTitular, 0))}
            </td>
            <td className="p-2 text-right">
              {formatCurrency(data.data.reduce((sum, c) => sum + c.sinistrosDependentes, 0))}
            </td>
            <td className="p-2 text-right">
              {formatNumber(data.data.reduce((sum, c) => sum + c.quantidadeBeneficiarios, 0))}
            </td>
            <td className="p-2 text-right">
              {formatNumber(data.data.reduce((sum, c) => sum + c.quantidadeAtendimentos, 0))}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
```

### 4. Funções de Formatação

```typescript
// utils.ts
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('pt-BR').format(value);
}

export function formatPercent(value: number | null): string {
  if (value === null) return '-';
  return `${value.toFixed(1)}%`;
}
```

---

## Filtros Sugeridos

### Componente de Filtros

```tsx
import { useState } from 'react';
import { DateRangePicker } from '@/components/ui/date-range-picker';
import { Select } from '@/components/ui/select';

export function FiltrosResumo({ onFilterChange }) {
  const [dataInicio, setDataInicio] = useState('01/11/2025');
  const [dataFim, setDataFim] = useState('30/11/2025');
  const [grupoReceita, setGrupoReceita] = useState('');

  const handleApplyFilters = () => {
    onFilterChange({
      dataInicio,
      dataFim,
      grupoReceita: grupoReceita || undefined,
    });
  };

  return (
    <div className="flex gap-4 items-end mb-6">
      <div>
        <label className="text-sm font-medium">Período</label>
        <DateRangePicker
          startDate={dataInicio}
          endDate={dataFim}
          onStartDateChange={setDataInicio}
          onEndDateChange={setDataFim}
        />
      </div>
      
      <div>
        <label className="text-sm font-medium">Grupo Receita</label>
        <Select
          value={grupoReceita}
          onValueChange={setGrupoReceita}
          placeholder="Todos"
        >
          <SelectItem value="">Todos</SelectItem>
          <SelectItem value="EXAMES">Exames</SelectItem>
          <SelectItem value="INTERNACAO">Internação</SelectItem>
          <SelectItem value="CONSULTAS">Consultas</SelectItem>
        </Select>
      </div>

      <button 
        onClick={handleApplyFilters}
        className="px-4 py-2 bg-primary text-white rounded"
      >
        Aplicar Filtros
      </button>
    </div>
  );
}
```

---

## Cards de Indicadores (KPIs)

```tsx
interface KPICardsProps {
  data: ResumoContrato[];
}

export function KPICards({ data }: KPICardsProps) {
  const totalSinistro = data.reduce((sum, c) => sum + c.sinistroTotal, 0);
  const totalBeneficiarios = data.reduce((sum, c) => sum + c.quantidadeBeneficiarios, 0);
  const totalAtendimentos = data.reduce((sum, c) => sum + c.quantidadeAtendimentos, 0);
  const custoMedioPorBeneficiario = totalBeneficiarios > 0 
    ? totalSinistro / totalBeneficiarios 
    : 0;

  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Sinistro Total</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{formatCurrency(totalSinistro)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Beneficiários</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{formatNumber(totalBeneficiarios)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Atendimentos</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{formatNumber(totalAtendimentos)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Custo/Beneficiário</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{formatCurrency(custoMedioPorBeneficiario)}</p>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## Notas Importantes

1. **Header obrigatório**: Sempre incluir `ngrok-skip-browser-warning: true` nas requisições
2. **Formato de data**: Usar DD/MM/YYYY (padrão brasileiro)
3. **Valores monetários**: Já vêm como números (não strings), prontos para formatação
4. **Premio e Sinistralidade**: Atualmente retornam `null` - podem ser implementados futuramente
5. **Performance**: A API usa o SQL completo de detalhamento para garantir valores corretos
6. **Sem limite de registros**: A API retorna todos os contratos encontrados (ordenados por sinistroTotal DESC)

---

## Checklist de Implementação

- [ ] Criar hook `useContratosResumo`
- [ ] Criar componente de tabela com dados reais
- [ ] Adicionar filtros (período obrigatório, grupo receita opcional)
- [ ] Implementar KPI cards com totalizadores
- [ ] Adicionar loading states e tratamento de erro
- [ ] Formatar valores monetários em R$
- [ ] Adicionar linha de totais no rodapé da tabela
- [ ] Testar com diferentes períodos e filtros
