# Prompt para Lovable - Página de Evolução Mensal de Contrato

## Objetivo
Criar uma página para gerenciar a evolução mensal de contratos, permitindo visualizar, editar e salvar dados financeiros mensais como prêmios, sinistros e indicadores de sinistralidade.

## API Base
A API está disponível em: `https://seu-dominio.replit.app`

## Endpoints Disponíveis

### 1. Listar Evolução de um Contrato
```
GET /api/evolucao-contrato/:nrContrato
```

**Exemplo de Requisição:**
```javascript
const response = await fetch(`${API_URL}/api/evolucao-contrato/12345`);
const data = await response.json();
```

**Resposta:**
```json
{
  "data": [
    {
      "nrContrato": 12345,
      "periodo": "01/01/2024",
      "vlPremio": 50000.00,
      "vlPremioContinuidade": 5000.00,
      "vlPremioTotal": 55000.00,
      "vlSinistro": 35000.00,
      "pcSinistralidade": 63.64,
      "vlLimitadorTecnico": 41250.00,
      "pcDistorcao": -15.15,
      "vlAporteFinanceiro": 0.00
    }
  ],
  "total": 12,
  "nrContrato": 12345
}
```

### 2. Buscar Registro Específico
```
GET /api/evolucao-contrato/:nrContrato/:periodo
```

**Exemplo:**
```javascript
const response = await fetch(`${API_URL}/api/evolucao-contrato/12345/01%2F01%2F2024`);
```

**Nota:** O período deve ser URL-encoded (DD%2FMM%2FYYYY)

### 3. Salvar Registro (Insert ou Update)
```
POST /api/evolucao-contrato
Content-Type: application/json
```

**Body:**
```json
{
  "nrContrato": 12345,
  "periodo": "01/01/2024",
  "vlPremio": 50000.00,
  "vlPremioContinuidade": 5000.00,
  "vlPremioTotal": 55000.00,
  "vlSinistro": 35000.00,
  "pcSinistralidade": 63.64,
  "vlLimitadorTecnico": 41250.00,
  "pcDistorcao": -15.15,
  "vlAporteFinanceiro": 0.00
}
```

**Resposta:**
```json
{
  "success": true,
  "message": "Registro inserido com sucesso",
  "action": "insert"
}
```
ou
```json
{
  "success": true,
  "message": "Registro atualizado com sucesso",
  "action": "update"
}
```

### 4. Atualizar Parcialmente
```
PUT /api/evolucao-contrato/:nrContrato/:periodo
Content-Type: application/json
```

**Body (campos opcionais - não enviados são preservados):**
```json
{
  "vlSinistro": 40000.00,
  "pcSinistralidade": 72.73
}
```

### 5. Remover Registro
```
DELETE /api/evolucao-contrato/:nrContrato/:periodo
```

## Campos da Tabela

| Campo | Tipo | Descrição |
|-------|------|-----------|
| nrContrato | number | Número do contrato (obrigatório) |
| periodo | string | Mês/ano no formato DD/MM/YYYY - sempre dia 01 (obrigatório) |
| vlPremio | number | Valor do prêmio mensal |
| vlPremioContinuidade | number | Valor do prêmio de continuidade |
| vlPremioTotal | number | Soma: vlPremio + vlPremioContinuidade |
| vlSinistro | number | Valor total do sinistro no mês |
| pcSinistralidade | number | Percentual: (vlSinistro / vlPremioTotal) * 100 |
| vlLimitadorTecnico | number | Valor do limitador técnico (75% do prêmio total) |
| pcDistorcao | number | Percentual de distorção |
| vlAporteFinanceiro | number | Valor do aporte financeiro |

## Interface Sugerida

### Layout da Página
1. **Seletor de Contrato** - Dropdown para escolher o contrato
2. **Tabela de Evolução** - Grid editável com os meses
3. **Botões de Ação** - Salvar, Adicionar Mês, Excluir

### Componente React - Tabela Editável

```tsx
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Trash2, Save, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const API_URL = 'https://seu-dominio.replit.app';

interface EvolucaoContrato {
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

interface EvolucaoContratoPageProps {
  nrContrato: number;
}

export function EvolucaoContratoPage({ nrContrato }: EvolucaoContratoPageProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingRows, setEditingRows] = useState<Record<string, EvolucaoContrato>>({});

  // Buscar dados
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/evolucao-contrato', nrContrato],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/api/evolucao-contrato/${nrContrato}`);
      if (!response.ok) throw new Error('Erro ao buscar dados');
      return response.json();
    },
    enabled: !!nrContrato
  });

  // Mutation para salvar
  const saveMutation = useMutation({
    mutationFn: async (registro: EvolucaoContrato) => {
      const response = await fetch(`${API_URL}/api/evolucao-contrato`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registro)
      });
      if (!response.ok) throw new Error('Erro ao salvar');
      return response.json();
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['/api/evolucao-contrato', nrContrato] });
      toast({
        title: 'Sucesso',
        description: result.message
      });
    },
    onError: (error) => {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  // Mutation para excluir
  const deleteMutation = useMutation({
    mutationFn: async (periodo: string) => {
      const periodoEncoded = encodeURIComponent(periodo);
      const response = await fetch(
        `${API_URL}/api/evolucao-contrato/${nrContrato}/${periodoEncoded}`,
        { method: 'DELETE' }
      );
      if (!response.ok) throw new Error('Erro ao excluir');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/evolucao-contrato', nrContrato] });
      toast({
        title: 'Sucesso',
        description: 'Registro excluído'
      });
    }
  });

  // Handlers
  const handleEdit = (registro: EvolucaoContrato) => {
    setEditingRows(prev => ({
      ...prev,
      [registro.periodo]: { ...registro }
    }));
  };

  const handleChange = (periodo: string, field: keyof EvolucaoContrato, value: string) => {
    setEditingRows(prev => ({
      ...prev,
      [periodo]: {
        ...prev[periodo],
        [field]: parseFloat(value) || 0
      }
    }));
  };

  const handleSave = (periodo: string) => {
    const registro = editingRows[periodo];
    if (registro) {
      // Calcular campos derivados
      registro.vlPremioTotal = registro.vlPremio + registro.vlPremioContinuidade;
      registro.pcSinistralidade = registro.vlPremioTotal > 0 
        ? (registro.vlSinistro / registro.vlPremioTotal) * 100 
        : 0;
      registro.vlLimitadorTecnico = registro.vlPremioTotal * 0.75;
      
      saveMutation.mutate(registro);
      setEditingRows(prev => {
        const newState = { ...prev };
        delete newState[periodo];
        return newState;
      });
    }
  };

  const handleDelete = (periodo: string) => {
    if (confirm('Deseja excluir este registro?')) {
      deleteMutation.mutate(periodo);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(2)}%`;
  };

  const formatPeriodo = (periodo: string) => {
    const [dia, mes, ano] = periodo.split('/');
    const meses = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    return `${meses[parseInt(mes) - 1]}/${ano}`;
  };

  if (isLoading) return <div>Carregando...</div>;
  if (error) return <div>Erro ao carregar dados</div>;

  const registros: EvolucaoContrato[] = data?.data || [];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          Evolução Mensal - Contrato {nrContrato}
        </h1>
        <Button onClick={() => {/* Abrir modal para novo mês */}}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Mês
        </Button>
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Período</TableHead>
              <TableHead className="text-right">Prêmio</TableHead>
              <TableHead className="text-right">Continuidade</TableHead>
              <TableHead className="text-right">Prêmio Total</TableHead>
              <TableHead className="text-right">Sinistro</TableHead>
              <TableHead className="text-right">Sinistralidade</TableHead>
              <TableHead className="text-right">Limitador Técnico</TableHead>
              <TableHead className="text-right">Distorção</TableHead>
              <TableHead className="text-right">Aporte</TableHead>
              <TableHead className="w-24">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {registros.map((registro) => {
              const isEditing = !!editingRows[registro.periodo];
              const currentData = isEditing ? editingRows[registro.periodo] : registro;

              return (
                <TableRow 
                  key={registro.periodo}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => !isEditing && handleEdit(registro)}
                >
                  <TableCell className="font-medium">
                    {formatPeriodo(registro.periodo)}
                  </TableCell>
                  <TableCell className="text-right">
                    {isEditing ? (
                      <Input
                        type="number"
                        value={currentData.vlPremio}
                        onChange={(e) => handleChange(registro.periodo, 'vlPremio', e.target.value)}
                        className="w-32 text-right"
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : formatCurrency(registro.vlPremio)}
                  </TableCell>
                  <TableCell className="text-right">
                    {isEditing ? (
                      <Input
                        type="number"
                        value={currentData.vlPremioContinuidade}
                        onChange={(e) => handleChange(registro.periodo, 'vlPremioContinuidade', e.target.value)}
                        className="w-32 text-right"
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : formatCurrency(registro.vlPremioContinuidade)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(currentData.vlPremioTotal)}
                  </TableCell>
                  <TableCell className="text-right">
                    {isEditing ? (
                      <Input
                        type="number"
                        value={currentData.vlSinistro}
                        onChange={(e) => handleChange(registro.periodo, 'vlSinistro', e.target.value)}
                        className="w-32 text-right"
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : formatCurrency(registro.vlSinistro)}
                  </TableCell>
                  <TableCell className={`text-right font-medium ${
                    currentData.pcSinistralidade > 75 ? 'text-red-600' : 
                    currentData.pcSinistralidade > 60 ? 'text-yellow-600' : 'text-green-600'
                  }`}>
                    {formatPercent(currentData.pcSinistralidade)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(currentData.vlLimitadorTecnico)}
                  </TableCell>
                  <TableCell className={`text-right ${
                    currentData.pcDistorcao < 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatPercent(currentData.pcDistorcao)}
                  </TableCell>
                  <TableCell className="text-right">
                    {isEditing ? (
                      <Input
                        type="number"
                        value={currentData.vlAporteFinanceiro}
                        onChange={(e) => handleChange(registro.periodo, 'vlAporteFinanceiro', e.target.value)}
                        className="w-32 text-right"
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : formatCurrency(registro.vlAporteFinanceiro)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                      {isEditing && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleSave(registro.periodo)}
                          disabled={saveMutation.isPending}
                        >
                          <Save className="w-4 h-4" />
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => handleDelete(registro.periodo)}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Totais */}
      <div className="mt-6 grid grid-cols-4 gap-4">
        <div className="p-4 border rounded-lg">
          <p className="text-sm text-muted-foreground">Total Prêmios</p>
          <p className="text-xl font-bold">
            {formatCurrency(registros.reduce((acc, r) => acc + r.vlPremioTotal, 0))}
          </p>
        </div>
        <div className="p-4 border rounded-lg">
          <p className="text-sm text-muted-foreground">Total Sinistros</p>
          <p className="text-xl font-bold">
            {formatCurrency(registros.reduce((acc, r) => acc + r.vlSinistro, 0))}
          </p>
        </div>
        <div className="p-4 border rounded-lg">
          <p className="text-sm text-muted-foreground">Sinistralidade Média</p>
          <p className="text-xl font-bold">
            {formatPercent(
              registros.length > 0
                ? registros.reduce((acc, r) => acc + r.pcSinistralidade, 0) / registros.length
                : 0
            )}
          </p>
        </div>
        <div className="p-4 border rounded-lg">
          <p className="text-sm text-muted-foreground">Total Aporte</p>
          <p className="text-xl font-bold">
            {formatCurrency(registros.reduce((acc, r) => acc + r.vlAporteFinanceiro, 0))}
          </p>
        </div>
      </div>
    </div>
  );
}
```

## Regras de Negócio

1. **Período**: Sempre o primeiro dia do mês (01/MM/YYYY)
2. **Prêmio Total**: Calculado automaticamente = vlPremio + vlPremioContinuidade
3. **Sinistralidade**: Calculada = (vlSinistro / vlPremioTotal) * 100
4. **Limitador Técnico**: Geralmente 75% do prêmio total
5. **Distorção**: Diferença percentual entre sinistralidade e limitador

## Cores para Indicadores

- **Sinistralidade < 60%**: Verde (saudável)
- **Sinistralidade 60-75%**: Amarelo (atenção)
- **Sinistralidade > 75%**: Vermelho (crítico)

## Tratamento de Erros

```typescript
// Verificar resposta da API
if (!response.ok) {
  const error = await response.json();
  throw new Error(error.message || 'Erro desconhecido');
}

// Exibir mensagem ao usuário
toast({
  title: response.ok ? 'Sucesso' : 'Erro',
  description: result.message,
  variant: response.ok ? 'default' : 'destructive'
});
```

## Observações Importantes

1. O endpoint POST funciona como UPSERT - insere se não existe, atualiza se já existe
2. O endpoint PUT preserva valores não enviados (update parcial)
3. O período deve estar no formato DD/MM/YYYY
4. Todos os valores numéricos aceitam casas decimais
5. A API retorna os dados ordenados por período
