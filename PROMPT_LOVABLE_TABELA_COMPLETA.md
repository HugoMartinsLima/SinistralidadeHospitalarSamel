# 🎯 PROMPT PARA LOVABLE - Tabela Completa com Todas as Colunas

## Cole este prompt no Lovable:

---

Preciso criar uma tabela de detalhamento de apólice que mostre **TODAS as colunas** retornadas pela API.

A API retorna mais de 40 colunas diferentes com informações detalhadas de procedimentos, atendimentos, pacientes e valores.

---

## 📡 **ENDPOINT DA API:**

```
GET https://unhalted-tanja-unvinous.ngrok-free.dev/api/apolices/{apolice}/detalhamento
```

**Exemplo:**
```
https://unhalted-tanja-unvinous.ngrok-free.dev/api/apolices/2444/detalhamento?dataInicio=01/10/2025&dataFim=31/10/2025
```

---

## 📥 **RESPOSTA DA API (Estrutura):**

A API retorna um objeto JSON com:
- `data`: Array com os registros (cada registro tem TODAS as colunas do SELECT)
- `pagination`: Informações de paginação
- `filters`: Filtros aplicados

Cada registro em `data` contém TODAS as colunas disponíveis no banco de dados.

---

## 💻 **IMPLEMENTAÇÃO COMPLETA:**

### **1. Criar Interface TypeScript Dinâmica:**

```typescript
// Tipo que aceita TODAS as colunas retornadas pela API
interface DetalhamentoItem {
  // Permite qualquer propriedade
  [key: string]: any;
  
  // Principais campos documentados (mas não limita a outros)
  data?: string;
  hora?: string;
  dataalta?: string;
  tipo_internacao?: string;
  carater_atendimento?: string;
  tipo_conta?: string;
  atendimento?: string;
  autorizacao_original?: string;
  dt_procedimento?: string;
  cod_tuss?: string;
  evento_tuss?: string;
  nm_proced?: string;
  tiposervico?: string;
  gruporeceita?: string;
  tipoconsulta?: string;
  apolice?: number;
  contratante?: string;
  plano?: string;
  cod_beneficiario?: string;
  beneficiario?: string;
  sexo?: string;
  datanascimento?: string;
  faixa_etaria?: string;
  MAT_CLIENTE?: string;
  tipodependente?: string;
  titular?: string;
  prestador?: string;
  especialidade?: string;
  qtde?: number;
  valor?: number;
  valortotal?: number;
  setor_atendimento?: string;
  SE_CONTINUIDADE?: string;
  DT_CONTRATACAO?: string;
  dt_contrato?: string;
  dias_adesao?: number;
  cid_doenca?: string;
  sub_estipulante?: string;
  forma_chegada?: string;
  vl_procedimento_coparticipacao?: number;
}
```

---

### **2. Hook para Buscar Detalhamento:**

```typescript
import { useQuery } from "@tanstack/react-query";

function useDetalhamentoApolice(apolice: number, filtros?: {
  dataInicio?: string;
  dataFim?: string;
  grupoReceita?: string;
}) {
  return useQuery({
    queryKey: ['/api/apolices', apolice, 'detalhamento', filtros],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filtros?.dataInicio) params.append('dataInicio', filtros.dataInicio);
      if (filtros?.dataFim) params.append('dataFim', filtros.dataFim);
      if (filtros?.grupoReceita && filtros.grupoReceita !== 'todas') {
        params.append('grupoReceita', filtros.grupoReceita);
      }

      const url = `https://unhalted-tanja-unvinous.ngrok-free.dev/api/apolices/${apolice}/detalhamento?${params}`;
      
      const response = await fetch(url, {
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      });

      if (!response.ok) {
        throw new Error('Erro ao buscar detalhamento');
      }

      const result = await response.json();
      return result.data as DetalhamentoItem[];
    },
    enabled: !!apolice
  });
}
```

---

### **3. OPÇÃO A: Tabela Completa com Scroll Horizontal**

Ideal para mostrar todas as colunas disponíveis:

```typescript
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

function ModalDetalhamentoCompleto() {
  const [apoliceDetalhada, setApoliceDetalhada] = useState<number | null>(null);

  const { data: detalhamento, isLoading } = useDetalhamentoApolice(
    apoliceDetalhada || 0,
    {
      dataInicio: '01/10/2025',
      dataFim: '31/10/2025',
    }
  );

  // Extrair todas as colunas disponíveis do primeiro registro
  const colunas = detalhamento && detalhamento.length > 0 
    ? Object.keys(detalhamento[0]) 
    : [];

  // Formatador de valores para exibição
  const formatarValor = (valor: any) => {
    if (valor === null || valor === undefined) return '-';
    if (typeof valor === 'number') {
      // Se parecer um valor monetário (tem decimais)
      if (valor % 1 !== 0) {
        return `R$ ${valor.toFixed(2)}`;
      }
      return valor.toString();
    }
    return valor.toString();
  };

  return (
    <>
      {/* Botão na sua tabela de apólices */}
      <Button 
        onClick={() => setApoliceDetalhada(2444)}
        data-testid="button-detalhamento-2444"
      >
        Detalhamento Completo
      </Button>

      {/* Modal com scroll horizontal */}
      <Dialog 
        open={!!apoliceDetalhada} 
        onOpenChange={() => setApoliceDetalhada(null)}
      >
        <DialogContent className="max-w-[95vw] max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>
              Detalhamento Completo - Apólice {apoliceDetalhada}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              Total: {detalhamento?.length || 0} registros | 
              Colunas: {colunas.length}
            </p>
          </DialogHeader>

          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-muted-foreground">Carregando detalhamento...</div>
            </div>
          ) : (
            <ScrollArea className="h-[calc(85vh-120px)]">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {colunas.map((coluna) => (
                        <TableHead key={coluna} className="whitespace-nowrap min-w-[150px]">
                          {coluna.toUpperCase()}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {detalhamento?.map((item, index) => (
                      <TableRow key={index}>
                        {colunas.map((coluna) => (
                          <TableCell key={coluna} className="whitespace-nowrap">
                            {formatarValor(item[coluna])}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
```

---

### **4. OPÇÃO B: Tabela com Colunas Principais + Seletor de Colunas**

Ideal para UX melhor - mostra principais colunas e permite escolher quais visualizar:

```typescript
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Settings } from "lucide-react";

function ModalDetalhamentoPersonalizado() {
  const [apoliceDetalhada, setApoliceDetalhada] = useState<number | null>(null);
  
  // Colunas padrão exibidas
  const colunasDefault = [
    'data',
    'hora',
    'nm_proced',
    'beneficiario',
    'prestador',
    'especialidade',
    'valor',
    'valortotal',
    'gruporeceita'
  ];
  
  const [colunasVisiveis, setColunasVisiveis] = useState<string[]>(colunasDefault);

  const { data: detalhamento, isLoading } = useDetalhamentoApolice(
    apoliceDetalhada || 0,
    { dataInicio: '01/10/2025', dataFim: '31/10/2025' }
  );

  // Todas as colunas disponíveis
  const todasColunas = detalhamento && detalhamento.length > 0 
    ? Object.keys(detalhamento[0]) 
    : [];

  // Labels amigáveis para as colunas
  const labelsColunas: Record<string, string> = {
    'data': 'Data',
    'hora': 'Hora',
    'dataalta': 'Data Alta',
    'tipo_conta': 'Tipo Conta',
    'atendimento': 'Atendimento',
    'nm_proced': 'Procedimento',
    'tiposervico': 'Tipo Serviço',
    'gruporeceita': 'Grupo Receita',
    'beneficiario': 'Beneficiário',
    'sexo': 'Sexo',
    'datanascimento': 'Dt. Nascimento',
    'faixa_etaria': 'Faixa Etária',
    'prestador': 'Prestador',
    'especialidade': 'Especialidade',
    'valor': 'Valor Unit.',
    'valortotal': 'Valor Total',
    'qtde': 'Qtde',
    'cid_doenca': 'CID',
    'setor_atendimento': 'Setor',
    'apolice': 'Apólice',
    'contratante': 'Contratante',
    'plano': 'Plano',
  };

  const getLabelColuna = (coluna: string) => {
    return labelsColunas[coluna] || coluna.toUpperCase();
  };

  const formatarValor = (valor: any, coluna: string) => {
    if (valor === null || valor === undefined) return '-';
    
    // Valores monetários
    if (coluna.includes('valor') || coluna.includes('vl_')) {
      return typeof valor === 'number' ? `R$ ${valor.toFixed(2)}` : valor;
    }
    
    return valor.toString();
  };

  const toggleColuna = (coluna: string) => {
    setColunasVisiveis(prev => 
      prev.includes(coluna) 
        ? prev.filter(c => c !== coluna)
        : [...prev, coluna]
    );
  };

  return (
    <>
      <Button 
        onClick={() => setApoliceDetalhada(2444)}
        data-testid="button-detalhamento-2444"
      >
        Ver Detalhamento
      </Button>

      <Dialog 
        open={!!apoliceDetalhada} 
        onOpenChange={() => setApoliceDetalhada(null)}
      >
        <DialogContent className="max-w-[95vw] max-h-[85vh]">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>
                  Detalhamento - Apólice {apoliceDetalhada}
                </DialogTitle>
                <p className="text-sm text-muted-foreground">
                  {detalhamento?.length || 0} registros
                </p>
              </div>
              
              {/* Seletor de Colunas */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Colunas ({colunasVisiveis.length}/{todasColunas.length})
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    <h4 className="font-semibold mb-2">Selecionar Colunas</h4>
                    {todasColunas.map((coluna) => (
                      <div key={coluna} className="flex items-center space-x-2">
                        <Checkbox
                          id={`col-${coluna}`}
                          checked={colunasVisiveis.includes(coluna)}
                          onCheckedChange={() => toggleColuna(coluna)}
                        />
                        <Label 
                          htmlFor={`col-${coluna}`}
                          className="text-sm cursor-pointer"
                        >
                          {getLabelColuna(coluna)}
                        </Label>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setColunasVisiveis(todasColunas)}
                    >
                      Todas
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setColunasVisiveis(colunasDefault)}
                    >
                      Padrão
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </DialogHeader>

          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              Carregando...
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[calc(85vh-160px)] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {colunasVisiveis.map((coluna) => (
                      <TableHead key={coluna} className="whitespace-nowrap">
                        {getLabelColuna(coluna)}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detalhamento?.map((item, index) => (
                    <TableRow key={index}>
                      {colunasVisiveis.map((coluna) => (
                        <TableCell key={coluna} className="whitespace-nowrap">
                          {formatarValor(item[coluna], coluna)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
```

---

### **5. OPÇÃO C: Tabela + Detalhes em Painel Lateral**

Tabela com linhas clicáveis + painel lateral mostrando TODOS os campos:

```typescript
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function ModalDetalhamentoComPainel() {
  const [apoliceDetalhada, setApoliceDetalhada] = useState<number | null>(null);
  const [itemSelecionado, setItemSelecionado] = useState<DetalhamentoItem | null>(null);

  const { data: detalhamento, isLoading } = useDetalhamentoApolice(
    apoliceDetalhada || 0,
    { dataInicio: '01/10/2025', dataFim: '31/10/2025' }
  );

  return (
    <>
      <Button onClick={() => setApoliceDetalhada(2444)}>
        Ver Detalhamento
      </Button>

      <Dialog 
        open={!!apoliceDetalhada} 
        onOpenChange={() => {
          setApoliceDetalhada(null);
          setItemSelecionado(null);
        }}
      >
        <DialogContent className="max-w-[95vw] max-h-[85vh]">
          <DialogHeader>
            <DialogTitle>Detalhamento - Apólice {apoliceDetalhada}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 h-[calc(85vh-120px)]">
            {/* Tabela Resumida */}
            <ScrollArea className="h-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Procedimento</TableHead>
                    <TableHead>Beneficiário</TableHead>
                    <TableHead>Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detalhamento?.map((item, index) => (
                    <TableRow 
                      key={index}
                      className="cursor-pointer hover:bg-muted"
                      onClick={() => setItemSelecionado(item)}
                      data-testid={`row-detalhamento-${index}`}
                    >
                      <TableCell>{item.data}</TableCell>
                      <TableCell>{item.nm_proced}</TableCell>
                      <TableCell>{item.beneficiario}</TableCell>
                      <TableCell>R$ {item.valor?.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>

            {/* Painel de Detalhes */}
            <ScrollArea className="h-full">
              {itemSelecionado ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Todos os Detalhes</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {Object.entries(itemSelecionado).map(([chave, valor]) => (
                      <div key={chave} className="grid grid-cols-2 gap-2 text-sm">
                        <div className="font-semibold text-muted-foreground">
                          {chave.toUpperCase()}:
                        </div>
                        <div>{valor?.toString() || '-'}</div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Clique em uma linha para ver todos os detalhes
                </div>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
```

---

## 📊 **LISTA DE TODAS AS COLUNAS DISPONÍVEIS:**

A API retorna estas colunas (e possivelmente mais):

**Atendimento:**
- data, hora, dataalta
- tipo_internacao, carater_atendimento, tipo_conta
- atendimento, autorizacao_original
- setor_atendimento, forma_chegada
- SE_CONTINUIDADE

**Procedimento:**
- dt_procedimento, cod_tuss, evento_tuss
- nm_proced, tiposervico, gruporeceita, tipoconsulta
- ie_origem_proced, nr_seq_proc_interno
- qtde, valor, valortotal
- vl_procedimento_coparticipacao

**Paciente/Beneficiário:**
- beneficiario, nome_paciente_prestador
- cod_beneficiario, MAT_CLIENTE
- sexo, datanascimento, faixa_etaria
- tipodependente, titular
- DT_CONTRATACAO, dias_adesao

**Contrato/Apólice:**
- apolice, contratante, plano
- dt_contrato, sub_estipulante

**Prestador:**
- prestador, especialidade

**Diagnóstico:**
- cid_doenca

**Validações:**
- tipo_validacao_clinica_externa
- data_validacao_clinica_externa

---

## ✅ **QUAL OPÇÃO ESCOLHER?**

- **OPÇÃO A**: Use se quer mostrar TODAS as colunas em uma tabela grande (com scroll)
- **OPÇÃO B**: Use se quer UX melhor - usuário escolhe quais colunas visualizar
- **OPÇÃO C**: Use se quer tabela resumida + painel com detalhes completos

**Recomendação:** OPÇÃO B (seletor de colunas) oferece melhor experiência!

---

## 🎨 **MELHORIAS ADICIONAIS:**

### **Exportar para Excel:**
```typescript
const exportarParaExcel = () => {
  // Criar CSV com todas as colunas
  const headers = colunasVisiveis.join(',');
  const rows = detalhamento?.map(item => 
    colunasVisiveis.map(col => item[col]).join(',')
  ).join('\n');
  
  const csv = `${headers}\n${rows}`;
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `detalhamento-${apoliceDetalhada}.csv`;
  a.click();
};

// Botão de exportação
<Button onClick={exportarParaExcel}>
  Exportar para Excel
</Button>
```

### **Totalização:**
```typescript
const totalValores = detalhamento?.reduce((acc, item) => acc + (item.valortotal || 0), 0);

<div className="text-right font-bold">
  Total: R$ {totalValores?.toFixed(2)}
</div>
```

---

## 💡 **DICAS:**

1. **Performance**: Se tiver muitos registros (>1000), adicione paginação
2. **Scroll**: Use ScrollArea do shadcn para melhor UX
3. **Formatação**: Formate valores monetários, datas, etc.
4. **Filtros**: Permita filtrar por coluna na própria tabela
5. **Ordenação**: Adicione sort ao clicar nos headers

---

**Use a opção que melhor atender suas necessidades! A API já retorna TODAS as colunas do banco de dados.** 🚀
