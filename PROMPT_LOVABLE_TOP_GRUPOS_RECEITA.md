# Prompt para Lovable - Top Grupos de Receita (Ranking)

## Objetivo
Criar componente para exibir os grupos de receita mais caros no Dashboard, com ranking visual e totais gerais.

## API Base
A API está disponível em: `https://seu-dominio.replit.app`

## Endpoint

### GET /api/sinistralidade/grupos-receita/ranking

Retorna os grupos de receita mais caros ordenados por valor total.

**Query Parameters:**

| Parâmetro | Tipo | Obrigatório | Descrição | Exemplo |
|-----------|------|-------------|-----------|---------|
| dataInicio | string | Sim | Data inicial (DD/MM/YYYY) | 01/11/2024 |
| dataFim | string | Sim | Data final (DD/MM/YYYY) | 30/11/2024 |
| limit | number | Não | Quantidade máxima (default: 10, max: 100) | 5 |

**Exemplo de Requisição:**
```javascript
const response = await fetch(
  `${API_URL}/api/sinistralidade/grupos-receita/ranking?dataInicio=01/11/2024&dataFim=30/11/2024&limit=5`
);
const data = await response.json();
```

**Resposta:**
```json
{
  "data": [
    {
      "gruporeceita": "EXAMES",
      "totalProcedimentos": 1250,
      "valorTotal": 485230.50,
      "ticketMedio": 388.18
    },
    {
      "gruporeceita": "CONSULTAS",
      "totalProcedimentos": 3420,
      "valorTotal": 342000.00,
      "ticketMedio": 100.00
    },
    {
      "gruporeceita": "INTERNAÇÃO",
      "totalProcedimentos": 45,
      "valorTotal": 298500.00,
      "ticketMedio": 6633.33
    }
  ],
  "totais": {
    "totalGeral": 1589730.50,
    "totalProcedimentos": 5847,
    "ticketMedioGeral": 271.89
  },
  "pagination": {
    "limit": 5,
    "total": 12
  }
}
```

## Campos do Response

**Array data[] (ordenado por valorTotal DESC):**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| gruporeceita | string | Nome do grupo de receita |
| totalProcedimentos | number | Quantidade de procedimentos |
| valorTotal | number | Soma dos valores do grupo |
| ticketMedio | number | valorTotal / totalProcedimentos |

**Objeto totais (considera TODOS os registros):**

| Campo | Tipo | Descrição |
|-------|------|-----------|
| totalGeral | number | Soma de todos os valores |
| totalProcedimentos | number | Total de todos procedimentos |
| ticketMedioGeral | number | Ticket médio geral |

## Componente React

```tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Activity, DollarSign, FileText } from 'lucide-react';

const API_URL = 'https://seu-dominio.replit.app';

interface GrupoReceita {
  gruporeceita: string;
  totalProcedimentos: number;
  valorTotal: number;
  ticketMedio: number;
}

interface RankingResponse {
  data: GrupoReceita[];
  totais: {
    totalGeral: number;
    totalProcedimentos: number;
    ticketMedioGeral: number;
  };
  pagination: {
    limit: number;
    total: number;
  };
}

interface TopGruposReceitaProps {
  dataInicio: string;
  dataFim: string;
  limit?: number;
}

export function TopGruposReceita({ dataInicio, dataFim, limit = 10 }: TopGruposReceitaProps) {
  const { data, isLoading, error } = useQuery<RankingResponse>({
    queryKey: ['/api/sinistralidade/grupos-receita/ranking', dataInicio, dataFim, limit],
    queryFn: async () => {
      const params = new URLSearchParams({
        dataInicio,
        dataFim,
        limit: String(limit),
      });
      const response = await fetch(`${API_URL}/api/sinistralidade/grupos-receita/ranking?${params}`);
      if (!response.ok) throw new Error('Erro ao buscar ranking');
      return response.json();
    },
    enabled: !!dataInicio && !!dataFim
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Top Grupos de Receita
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Grupos de Receita</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600">Erro ao carregar dados</p>
        </CardContent>
      </Card>
    );
  }

  const maxValue = data?.data[0]?.valorTotal || 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Top Grupos de Receita
          </div>
          <Badge variant="outline">
            {data?.pagination.total} grupos
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Totais Gerais */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Total Geral</p>
            <p className="text-lg font-bold text-primary">
              {formatCurrency(data?.totais.totalGeral || 0)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Procedimentos</p>
            <p className="text-lg font-bold">
              {formatNumber(data?.totais.totalProcedimentos || 0)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Ticket Médio</p>
            <p className="text-lg font-bold">
              {formatCurrency(data?.totais.ticketMedioGeral || 0)}
            </p>
          </div>
        </div>

        {/* Lista de Grupos */}
        <div className="space-y-3">
          {data?.data.map((grupo, index) => {
            const percentage = (grupo.valorTotal / maxValue) * 100;
            
            return (
              <div key={grupo.gruporeceita} className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={index === 0 ? "default" : "secondary"}
                      className="w-6 h-6 flex items-center justify-center p-0"
                    >
                      {index + 1}
                    </Badge>
                    <span className="font-medium">{grupo.gruporeceita}</span>
                  </div>
                  <span className="font-bold text-primary">
                    {formatCurrency(grupo.valorTotal)}
                  </span>
                </div>
                <Progress value={percentage} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    {formatNumber(grupo.totalProcedimentos)} procedimentos
                  </span>
                  <span className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    Ticket: {formatCurrency(grupo.ticketMedio)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
```

## Uso no Dashboard

```tsx
import { TopGruposReceita } from '@/components/TopGruposReceita';

function Dashboard() {
  const [dataInicio, setDataInicio] = useState('01/11/2024');
  const [dataFim, setDataFim] = useState('30/11/2024');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Outros cards do dashboard */}
      
      <TopGruposReceita 
        dataInicio={dataInicio} 
        dataFim={dataFim} 
        limit={5} 
      />
    </div>
  );
}
```

## Hook Customizado (Opcional)

```tsx
import { useQuery } from '@tanstack/react-query';

const API_URL = 'https://seu-dominio.replit.app';

interface UseTopGruposReceitaParams {
  dataInicio: string;
  dataFim: string;
  limit?: number;
}

export function useTopGruposReceita({ dataInicio, dataFim, limit = 10 }: UseTopGruposReceitaParams) {
  return useQuery({
    queryKey: ['/api/sinistralidade/grupos-receita/ranking', dataInicio, dataFim, limit],
    queryFn: async () => {
      const params = new URLSearchParams({
        dataInicio,
        dataFim,
        limit: String(limit),
      });
      const response = await fetch(`${API_URL}/api/sinistralidade/grupos-receita/ranking?${params}`);
      if (!response.ok) throw new Error('Erro ao buscar ranking');
      return response.json();
    },
    enabled: !!dataInicio && !!dataFim
  });
}
```

## Exemplos de Chamadas

```javascript
// Top 5 grupos do mês de novembro
GET /api/sinistralidade/grupos-receita/ranking?dataInicio=01/11/2024&dataFim=30/11/2024&limit=5

// Top 10 grupos do ano (default)
GET /api/sinistralidade/grupos-receita/ranking?dataInicio=01/01/2024&dataFim=31/12/2024

// Top 3 grupos do trimestre
GET /api/sinistralidade/grupos-receita/ranking?dataInicio=01/10/2024&dataFim=31/12/2024&limit=3
```

## Observações

1. Os dados são ordenados por `valorTotal` decrescente (mais caros primeiro)
2. O objeto `totais` considera TODOS os registros do período, não apenas os retornados no `limit`
3. `ticketMedio` = `valorTotal / totalProcedimentos`
4. Registros com `gruporeceita` NULL são ignorados
5. O `limit` máximo é 100 (sanitizado pelo backend)
