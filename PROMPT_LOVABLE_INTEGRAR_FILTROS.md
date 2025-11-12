# 🔗 PROMPT PARA LOVABLE - Integrar Filtros com API

## Cole este prompt no Lovable:

---

Preciso conectar os **filtros da topbar** (período de datas e seletor de empresa/contrato) com a **API de detalhamento**.

Quando o usuário clicar no botão "Detalhamento", a API deve receber:
- **Data Início** e **Data Fim** do seletor de período
- **Número do Contrato** da linha clicada

---

## 🎯 **OBJETIVO:**

Quando clicar em "Detalhamento", chamar a API passando os valores dos filtros:

```
GET /api/apolices/{numeroContrato}/detalhamento?dataInicio={dataInicio}&dataFim={dataFim}
```

**Exemplo:**
```
GET /api/apolices/2444/detalhamento?dataInicio=01/10/2025&dataFim=31/10/2025
```

---

## 📋 **IMPLEMENTAÇÃO PASSO A PASSO:**

### **1. Capturar Valores dos Filtros da Topbar**

Identifique onde os filtros estão armazenados no estado do componente. Provavelmente você tem algo assim:

```typescript
// Estado dos filtros (exemplo - ajuste conforme sua implementação)
const [periodoInicio, setPeriodoInicio] = useState("01/10/2025");
const [periodoFim, setPeriodoFim] = useState("31/10/2025");
const [contratoSelecionado, setContratoSelecionado] = useState(2444);
```

Se estiver usando um seletor de range de datas (Date Range Picker), você pode ter:

```typescript
const [dateRange, setDateRange] = useState({
  from: new Date("2025-10-01"),
  to: new Date("2025-10-31")
});
```

---

### **2. Formatar Datas para API (DD/MM/YYYY)**

A API espera datas no formato brasileiro: **DD/MM/YYYY**

```typescript
// Função para formatar data para DD/MM/YYYY
const formatarDataParaAPI = (data: Date): string => {
  const dia = String(data.getDate()).padStart(2, '0');
  const mes = String(data.getMonth() + 1).padStart(2, '0');
  const ano = data.getFullYear();
  return `${dia}/${mes}/${ano}`;
};

// Exemplos de uso:
const dataInicio = formatarDataParaAPI(dateRange.from); // "01/10/2025"
const dataFim = formatarDataParaAPI(dateRange.to);       // "31/10/2025"
```

**OU**, se você já tem as datas como string no formato correto:

```typescript
// Se já estão no formato "01/10/2025", use direto
const dataInicio = periodoInicio; // "01/10/2025"
const dataFim = periodoFim;       // "31/10/2025"
```

---

### **3. Atualizar o Hook useDetalhamentoApolice**

Modifique o hook para aceitar os parâmetros dinâmicos:

```typescript
import { useQuery } from "@tanstack/react-query";

function useDetalhamentoApolice(
  apolice: number,
  dataInicio: string,  // ← Recebe do filtro
  dataFim: string,     // ← Recebe do filtro
  grupoReceita?: string
) {
  return useQuery({
    queryKey: ['/api/apolices', apolice, 'detalhamento', dataInicio, dataFim, grupoReceita],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('dataInicio', dataInicio);  // ← Passa data início do filtro
      params.append('dataFim', dataFim);        // ← Passa data fim do filtro
      
      if (grupoReceita && grupoReceita !== 'todas') {
        params.append('grupoReceita', grupoReceita);
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
      return result.data;
    },
    enabled: !!apolice && !!dataInicio && !!dataFim
  });
}
```

---

### **4. Conectar Botão "Detalhamento" com os Filtros**

No componente da tabela de apólices:

```typescript
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

function TabelaApolices() {
  // ===== FILTROS DA TOPBAR =====
  // (Ajuste conforme sua implementação real)
  const [dateRange, setDateRange] = useState({
    from: new Date("2025-10-01"),
    to: new Date("2025-10-31")
  });
  
  // ===== MODAL DE DETALHAMENTO =====
  const [apoliceDetalhada, setApoliceDetalhada] = useState<number | null>(null);

  // ===== FORMATAR DATAS PARA API =====
  const formatarDataParaAPI = (data: Date): string => {
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const ano = data.getFullYear();
    return `${dia}/${mes}/${ano}`;
  };

  const dataInicio = formatarDataParaAPI(dateRange.from);
  const dataFim = formatarDataParaAPI(dateRange.to);

  // ===== BUSCAR DETALHAMENTO (passa datas dos filtros) =====
  const { data: detalhamento, isLoading } = useDetalhamentoApolice(
    apoliceDetalhada || 0,
    dataInicio,  // ← Data do filtro
    dataFim      // ← Data do filtro
  );

  return (
    <>
      {/* Tabela de Apólices */}
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>2E DESPACHOS ADUANEIROS LTDA</TableCell>
            <TableCell>2444</TableCell>
            <TableCell>
              {/* Botão Detalhamento - clica e abre modal */}
              <Button 
                onClick={() => setApoliceDetalhada(2444)}
                data-testid="button-detalhamento-2444"
              >
                Detalhamento
              </Button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>

      {/* Modal de Detalhamento */}
      <Dialog 
        open={!!apoliceDetalhada} 
        onOpenChange={() => setApoliceDetalhada(null)}
      >
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>
              Detalhamento - Apólice {apoliceDetalhada}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              Período: {dataInicio} a {dataFim}
            </p>
          </DialogHeader>

          {isLoading ? (
            <div>Carregando...</div>
          ) : (
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
                {detalhamento?.map((item: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell>{item.data}</TableCell>
                    <TableCell>{item.nm_proced}</TableCell>
                    <TableCell>{item.beneficiario}</TableCell>
                    <TableCell>R$ {item.valor?.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
```

---

### **5. Pegar Número do Contrato da Linha Clicada**

Se sua tabela tem múltiplas apólices:

```typescript
interface Apolice {
  nrContrato: number;
  dsEstipulante: string;
  breakeven: number;
  // ... outros campos
}

function TabelaApolices({ apolices }: { apolices: Apolice[] }) {
  const [apoliceDetalhada, setApoliceDetalhada] = useState<number | null>(null);
  
  return (
    <Table>
      <TableBody>
        {apolices.map((apolice) => (
          <TableRow key={apolice.nrContrato}>
            <TableCell>{apolice.dsEstipulante}</TableCell>
            <TableCell>{apolice.nrContrato}</TableCell>
            <TableCell>
              <Button 
                onClick={() => setApoliceDetalhada(apolice.nrContrato)}
                data-testid={`button-detalhamento-${apolice.nrContrato}`}
              >
                Detalhamento
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
```

---

## 📊 **EXEMPLO COMPLETO DE INTEGRAÇÃO:**

```typescript
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// ===== HOOK PERSONALIZADO =====
function useDetalhamentoApolice(
  apolice: number,
  dataInicio: string,
  dataFim: string
) {
  return useQuery({
    queryKey: ['/api/apolices', apolice, 'detalhamento', dataInicio, dataFim],
    queryFn: async () => {
      const params = new URLSearchParams({
        dataInicio,
        dataFim
      });

      const url = `https://unhalted-tanja-unvinous.ngrok-free.dev/api/apolices/${apolice}/detalhamento?${params}`;
      
      const response = await fetch(url, {
        headers: { 'ngrok-skip-browser-warning': 'true' }
      });

      if (!response.ok) throw new Error('Erro ao buscar detalhamento');

      const result = await response.json();
      return result.data;
    },
    enabled: !!apolice && !!dataInicio && !!dataFim
  });
}

// ===== COMPONENTE PRINCIPAL =====
function PaginaAnaliseApolices() {
  // FILTROS DA TOPBAR
  const [dateRange, setDateRange] = useState({
    from: new Date("2025-10-01"),
    to: new Date("2025-10-31")
  });

  // MODAL
  const [apoliceDetalhada, setApoliceDetalhada] = useState<number | null>(null);

  // FORMATAR DATAS
  const formatarData = (data: Date) => {
    const dia = String(data.getDate()).padStart(2, '0');
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const ano = data.getFullYear();
    return `${dia}/${mes}/${ano}`;
  };

  const dataInicio = formatarData(dateRange.from);
  const dataFim = formatarData(dateRange.to);

  // BUSCAR DADOS
  const { data: detalhamento, isLoading } = useDetalhamentoApolice(
    apoliceDetalhada || 0,
    dataInicio,
    dataFim
  );

  return (
    <div>
      {/* TOPBAR COM FILTROS */}
      <div className="flex gap-4 p-4">
        {/* Date Range Picker já existente */}
        <DateRangePicker 
          date={dateRange}
          onDateChange={setDateRange}
        />
      </div>

      {/* TABELA DE APÓLICES */}
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>2E DESPACHOS ADUANEIROS LTDA</TableCell>
            <TableCell>2444</TableCell>
            <TableCell>
              <Button onClick={() => setApoliceDetalhada(2444)}>
                Detalhamento
              </Button>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>

      {/* MODAL DETALHAMENTO */}
      <Dialog open={!!apoliceDetalhada} onOpenChange={() => setApoliceDetalhada(null)}>
        <DialogContent className="max-w-6xl">
          <DialogHeader>
            <DialogTitle>Detalhamento - Apólice {apoliceDetalhada}</DialogTitle>
            <p className="text-sm text-muted-foreground">
              📅 Período: {dataInicio} a {dataFim}
            </p>
          </DialogHeader>

          {isLoading ? (
            <div className="p-8 text-center">Carregando detalhamento...</div>
          ) : (
            <div className="overflow-auto max-h-[70vh]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Procedimento</TableHead>
                    <TableHead>Beneficiário</TableHead>
                    <TableHead>Prestador</TableHead>
                    <TableHead>Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {detalhamento?.map((item: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell>{item.data}</TableCell>
                      <TableCell>{item.nm_proced}</TableCell>
                      <TableCell>{item.beneficiario}</TableCell>
                      <TableCell>{item.prestador}</TableCell>
                      <TableCell>R$ {item.valor?.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Total */}
              <div className="mt-4 text-right font-bold">
                Total de Registros: {detalhamento?.length || 0}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
```

---

## 🔄 **FLUXO COMPLETO:**

1. **Usuário seleciona período:** `01/10/2025 - 31/10/2025` (topbar)
2. **Usuário clica "Detalhamento"** na linha da apólice 2444
3. **Hook captura valores:**
   - `apolice = 2444`
   - `dataInicio = "01/10/2025"`
   - `dataFim = "31/10/2025"`
4. **API é chamada:**
   ```
   GET /api/apolices/2444/detalhamento?dataInicio=01/10/2025&dataFim=31/10/2025
   ```
5. **Dados são exibidos no modal** com os filtros aplicados

---

## ✅ **CHECKLIST:**

- [ ] Identificar onde estão os filtros de data na topbar
- [ ] Criar função `formatarDataParaAPI` para converter Date → DD/MM/YYYY
- [ ] Modificar `useDetalhamentoApolice` para receber `dataInicio` e `dataFim`
- [ ] Passar valores dos filtros para o hook
- [ ] Testar com diferentes períodos
- [ ] Testar com diferentes apólices
- [ ] Mostrar período selecionado no modal

---

## 💡 **DICAS:**

### **Se o seletor de data for um Input de Texto:**
```typescript
// Assumindo que já está no formato DD/MM/YYYY
const dataInicio = inputDataInicio; // "01/10/2025"
const dataFim = inputDataFim;       // "31/10/2025"
```

### **Se for um DatePicker do Shadcn:**
```typescript
import { format } from "date-fns";

const dataInicio = format(dateRange.from, "dd/MM/yyyy");
const dataFim = format(dateRange.to, "dd/MM/yyyy");
```

### **Validação de Datas:**
```typescript
const { data, isLoading, error } = useDetalhamentoApolice(
  apoliceDetalhada || 0,
  dataInicio,
  dataFim
);

// Mostrar mensagem se não tiver dados
{!isLoading && detalhamento?.length === 0 && (
  <div className="p-8 text-center text-muted-foreground">
    Nenhum registro encontrado para o período selecionado.
  </div>
)}
```

---

## 🎯 **RESULTADO FINAL:**

Quando o usuário:
1. Selecionar período: **01/10/2025 - 31/10/2025**
2. Clicar em **"Detalhamento"** na apólice **2444**

A API será chamada com:
```
https://unhalted-tanja-unvinous.ngrok-free.dev/api/apolices/2444/detalhamento?dataInicio=01/10/2025&dataFim=31/10/2025
```

E retornará **apenas os dados daquele período e daquela apólice!** 🎉

---

## 🆘 **TROUBLESHOOTING:**

**Problema:** Datas não estão sendo passadas corretamente
- **Solução:** Verifique formato DD/MM/YYYY com console.log(dataInicio, dataFim)

**Problema:** API retorna dados errados
- **Solução:** Teste URL manualmente no navegador primeiro

**Problema:** Modal não atualiza ao mudar período
- **Solução:** Feche e abra o modal novamente (queryKey inclui datas, vai recarregar)

---

**A API já está pronta e funcionando! Só falta conectar os filtros da topbar com os parâmetros.** 🚀
