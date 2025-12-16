# Prompt para Lovable - Dashboard de Evolução de Contratos

## Objetivo
Criar um dashboard para visualizar dados consolidados de evolução de contratos, com KPIs, gráficos mensais e filtros de período.

## API Base
A API está disponível em: `https://seu-dominio.replit.app`

## Endpoint Principal

### GET /api/evolucao-contrato/consolidado

Retorna dados consolidados de evolução de contratos para alimentar o dashboard.

**Query Parameters:**

| Parâmetro | Tipo | Obrigatório | Descrição | Exemplo |
|-----------|------|-------------|-----------|---------|
| dataInicio | string | ✅ Sim | Data inicial (DD/MM/YYYY) | 01/11/2024 |
| dataFim | string | ✅ Sim | Data final (DD/MM/YYYY) | 30/11/2024 |
| contratos | string | ❌ Não | Lista separada por vírgula | 2444,2445,2446 |

**Exemplo de Requisição:**
```javascript
const response = await fetch(
  `${API_URL}/api/evolucao-contrato/consolidado?dataInicio=01/01/2024&dataFim=31/12/2024&contratos=2444,2445`
);
const data = await response.json();
```

**Resposta:**
```json
{
  "data": [
    {
      "nrContrato": 2444,
      "periodo": "01/11/2024",
      "vlPremio": 150000.00,
      "vlPremioContinuidade": 5000.00,
      "vlPremioTotal": 155000.00,
      "vlSinistro": 120000.00,
      "pcSinistralidade": 77.42,
      "vlLimitadorTecnico": 116250.00,
      "pcDistorcao": 3.23,
      "vlAporteFinanceiro": 5000.00
    }
  ],
  "aggregated": {
    "totalPremio": 237000.00,
    "totalPremioContinuidade": 7000.00,
    "totalPremioTotal": 244000.00,
    "totalSinistro": 215000.00,
    "sinistralidadeMedia": 88.11,
    "totalContratos": 2,
    "totalRegistros": 3
  },
  "pagination": {
    "total": 3
  }
}
```

## Mapeamento para Dashboard

| KPI Dashboard | Campo API |
|---------------|-----------|
| Sinistralidade | `aggregated.sinistralidadeMedia` |
| Custo Assistencial | `aggregated.totalSinistro` |
| Receita (Prêmio) | `aggregated.totalPremioTotal` |
| Total Contratos | `aggregated.totalContratos` |
| Gráfico Mensal | `data[]` agrupado por `periodo` |

## Componente React - Dashboard

```tsx
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TrendingUp, TrendingDown, DollarSign, Activity, Users, AlertTriangle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';

const API_URL = 'https://seu-dominio.replit.app';

interface EvolucaoRecord {
  nrContrato: number;
  periodo: string;
  vlPremio: number;
  vlPremioContinuidade: number;
  vlPremioTotal: number;
  vlSinistro: number;
  pcSinistralidade: number;
  vlLimitadorTecnico: number;
  pcDistorcao: number;
  vlAporteFinanceiro: number;
}

interface ConsolidadoResponse {
  data: EvolucaoRecord[];
  aggregated: {
    totalPremio: number;
    totalPremioContinuidade: number;
    totalPremioTotal: number;
    totalSinistro: number;
    sinistralidadeMedia: number;
    totalContratos: number;
    totalRegistros: number;
  };
  pagination: { total: number };
}

export function DashboardEvolucao() {
  const [dataInicio, setDataInicio] = useState('01/01/2024');
  const [dataFim, setDataFim] = useState('31/12/2024');
  const [contratos, setContratos] = useState('');

  const { data, isLoading, error, refetch } = useQuery<ConsolidadoResponse>({
    queryKey: ['/api/evolucao-contrato/consolidado', dataInicio, dataFim, contratos],
    queryFn: async () => {
      const params = new URLSearchParams({
        dataInicio,
        dataFim,
      });
      if (contratos.trim()) {
        params.append('contratos', contratos);
      }
      const response = await fetch(`${API_URL}/api/evolucao-contrato/consolidado?${params}`);
      if (!response.ok) throw new Error('Erro ao buscar dados');
      return response.json();
    },
    enabled: !!dataInicio && !!dataFim
  });

  // Agrupar dados por período para gráfico
  const chartData = useMemo(() => {
    if (!data?.data) return [];
    
    const grouped: Record<string, { periodo: string; premioTotal: number; sinistro: number; sinistralidade: number }> = {};
    
    data.data.forEach(record => {
      if (!grouped[record.periodo]) {
        grouped[record.periodo] = {
          periodo: formatPeriodo(record.periodo),
          premioTotal: 0,
          sinistro: 0,
          sinistralidade: 0
        };
      }
      grouped[record.periodo].premioTotal += record.vlPremioTotal;
      grouped[record.periodo].sinistro += record.vlSinistro;
    });
    
    // Calcular sinistralidade por período
    Object.values(grouped).forEach(g => {
      g.sinistralidade = g.premioTotal > 0 ? (g.sinistro / g.premioTotal) * 100 : 0;
    });
    
    return Object.values(grouped).sort((a, b) => a.periodo.localeCompare(b.periodo));
  }, [data]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatPercent = (value: number) => `${value.toFixed(2)}%`;

  const formatPeriodo = (periodo: string) => {
    const [dia, mes, ano] = periodo.split('/');
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${meses[parseInt(mes) - 1]}/${ano}`;
  };

  const getSinistralidadeColor = (value: number) => {
    if (value < 60) return 'text-green-600';
    if (value < 75) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-4">
        Erro ao carregar dados: {error.message}
      </div>
    );
  }

  const agg = data?.aggregated;

  return (
    <div className="p-6 space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="dataInicio">Data Início</Label>
              <Input
                id="dataInicio"
                placeholder="DD/MM/YYYY"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
                data-testid="input-data-inicio"
              />
            </div>
            <div>
              <Label htmlFor="dataFim">Data Fim</Label>
              <Input
                id="dataFim"
                placeholder="DD/MM/YYYY"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
                data-testid="input-data-fim"
              />
            </div>
            <div>
              <Label htmlFor="contratos">Contratos (opcional)</Label>
              <Input
                id="contratos"
                placeholder="2444,2445,2446"
                value={contratos}
                onChange={(e) => setContratos(e.target.value)}
                data-testid="input-contratos"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={() => refetch()} data-testid="button-filtrar">
                Filtrar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sinistralidade</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getSinistralidadeColor(agg?.sinistralidadeMedia || 0)}`}>
              {formatPercent(agg?.sinistralidadeMedia || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {(agg?.sinistralidadeMedia || 0) <= 75 ? (
                <span className="flex items-center text-green-600">
                  <TrendingDown className="h-3 w-3 mr-1" /> Dentro do limite
                </span>
              ) : (
                <span className="flex items-center text-red-600">
                  <TrendingUp className="h-3 w-3 mr-1" /> Acima do limite
                </span>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Custo Assistencial</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(agg?.totalSinistro || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total de sinistros no período
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Receita (Prêmio)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(agg?.totalPremioTotal || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Prêmio + Continuidade
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contratos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {agg?.totalContratos || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {agg?.totalRegistros || 0} registros no período
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Evolução Mensal */}
        <Card>
          <CardHeader>
            <CardTitle>Evolução Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="periodo" />
                <YAxis yAxisId="left" tickFormatter={(v) => formatCurrency(v)} />
                <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => `${v}%`} />
                <Tooltip 
                  formatter={(value, name) => {
                    if (name === 'sinistralidade') return [`${Number(value).toFixed(2)}%`, 'Sinistralidade'];
                    return [formatCurrency(Number(value)), name === 'premioTotal' ? 'Prêmio' : 'Sinistro'];
                  }}
                />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="premioTotal" name="Prêmio" stroke="#22c55e" strokeWidth={2} />
                <Line yAxisId="left" type="monotone" dataKey="sinistro" name="Sinistro" stroke="#ef4444" strokeWidth={2} />
                <Line yAxisId="right" type="monotone" dataKey="sinistralidade" name="Sinistralidade %" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Gráfico de Barras - Prêmio vs Sinistro */}
        <Card>
          <CardHeader>
            <CardTitle>Prêmio vs Sinistro por Mês</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="periodo" />
                <YAxis tickFormatter={(v) => formatCurrency(v)} />
                <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                <Legend />
                <Bar dataKey="premioTotal" name="Prêmio" fill="#22c55e" />
                <Bar dataKey="sinistro" name="Sinistro" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Detalhes por Contrato */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhamento por Registro</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Contrato</th>
                  <th className="text-left p-2">Período</th>
                  <th className="text-right p-2">Prêmio Total</th>
                  <th className="text-right p-2">Sinistro</th>
                  <th className="text-right p-2">Sinistralidade</th>
                  <th className="text-right p-2">Distorção</th>
                </tr>
              </thead>
              <tbody>
                {data?.data.map((row, index) => (
                  <tr key={`${row.nrContrato}-${row.periodo}-${index}`} className="border-b hover:bg-muted/50">
                    <td className="p-2 font-medium">{row.nrContrato}</td>
                    <td className="p-2">{formatPeriodo(row.periodo)}</td>
                    <td className="p-2 text-right">{formatCurrency(row.vlPremioTotal)}</td>
                    <td className="p-2 text-right">{formatCurrency(row.vlSinistro)}</td>
                    <td className={`p-2 text-right font-medium ${getSinistralidadeColor(row.pcSinistralidade)}`}>
                      {formatPercent(row.pcSinistralidade)}
                    </td>
                    <td className={`p-2 text-right ${row.pcDistorcao < 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatPercent(row.pcDistorcao)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

## Dependências Necessárias

```bash
npm install recharts
```

## Regras de Negócio

1. **Sinistralidade < 60%**: Saudável (verde)
2. **Sinistralidade 60-75%**: Atenção (amarelo)
3. **Sinistralidade > 75%**: Crítico (vermelho)
4. **Limite Técnico**: 75% do prêmio total

## Exemplos de Chamadas

```javascript
// Buscar todos os contratos de 2024
GET /api/evolucao-contrato/consolidado?dataInicio=01/01/2024&dataFim=31/12/2024

// Buscar contratos específicos
GET /api/evolucao-contrato/consolidado?dataInicio=01/01/2024&dataFim=31/12/2024&contratos=2444,2445

// Buscar último trimestre
GET /api/evolucao-contrato/consolidado?dataInicio=01/10/2024&dataFim=31/12/2024
```

## Observações

1. Os dados vêm pré-calculados da tabela `SINI_EVOLUCAO_CONTRATO`
2. O período sempre representa o primeiro dia do mês (01/MM/YYYY)
3. O objeto `aggregated` contém totais e média de sinistralidade
4. Use os gráficos do `recharts` para visualização
