# 🎯 PROMPT PARA LOVABLE - Botão de Detalhamento de Apólice

## Cole este prompt no Lovable:

---

Preciso que o botão "Detalhamento" (que já existe na tela) chame a API para buscar os dados detalhados da apólice.

**Contexto:**
- Na tabela de "Análise por Apólice", cada linha tem um botão "Detalhamento"
- Quando clicar nesse botão, deve chamar a API e mostrar os detalhes em uma nova tela ou modal
- Os dados incluem: procedimentos, atendimentos, pacientes, valores, etc.

---

## 📡 **ENDPOINT DA API:**

```
GET https://unhalted-tanja-unvinous.ngrok-free.dev/api/apolices/{apolice}/detalhamento
```

**Exemplo concreto:**
```
GET https://unhalted-tanja-unvinous.ngrok-free.dev/api/apolices/2444/detalhamento?dataInicio=01/10/2025&dataFim=31/10/2025&grupoReceita=Cirúrgico
```

---

## 📥 **PARÂMETROS:**

### **Path Parameter (obrigatório):**
- `{apolice}`: Número da apólice (ex: 2444)

### **Query Parameters (opcionais):**
- `dataInicio`: Data início (formato: DD/MM/YYYY) - padrão: 01/10/2025
- `dataFim`: Data fim (formato: DD/MM/YYYY) - padrão: 31/10/2025
- `grupoReceita`: Filtrar por grupo (ex: "Cirúrgico", "Consultas Eletivas") - padrão: TODAS
- `limit`: Quantidade de registros (padrão: 100)
- `offset`: Paginação (padrão: 0)

---

## 📤 **RESPOSTA DA API:**

```json
{
  "data": [
    {
      "data": "15/10/2025",
      "hora": "14:30:00",
      "dataalta": "16/10/2025 10:00",
      "tipo_conta": "INTERNAÇÃO",
      "atendimento": "123456",
      "dt_procedimento": "15/10/2025 14:30",
      "cod_tuss": "10101012",
      "evento_tuss": "CONSULTA MÉDICA",
      "nm_proced": "Consulta em Cardiologia",
      "tiposervico": "CONSULTA",
      "gruporeceita": "CONSULTAS ELETIVAS",
      "apolice": 2444,
      "contratante": "2E DESPACHOS ADUANEIROS LTDA",
      "plano": "PLANO EXECUTIVO",
      "beneficiario": "JOÃO DA SILVA",
      "sexo": "M",
      "datanascimento": "01/01/1980",
      "faixa_etaria": "40-49 ANOS",
      "prestador": "DR. CARLOS SOUZA",
      "especialidade": "CARDIOLOGIA",
      "qtde": 1,
      "valor": 150.00,
      "valortotal": 150.00,
      "setor_atendimento": "AMBULATÓRIO",
      "cid_doenca": "I10 - HIPERTENSÃO ESSENCIAL"
    }
    // ... mais registros
  ],
  "pagination": {
    "limit": 100,
    "offset": 0,
    "total": 156
  },
  "filters": {
    "nrContrato": 2444,
    "dataInicio": "01/10/2025",
    "dataFim": "31/10/2025",
    "grupoReceita": "TODAS"
  }
}
```

---

## 💻 **IMPLEMENTAÇÃO NO LOVABLE:**

### **1. Criar função para buscar detalhamento:**

```typescript
import { useQuery } from "@tanstack/react-query";

interface DetalhamentoItem {
  data: string;
  hora: string;
  dt_procedimento?: string;
  evento_tuss?: string;
  nm_proced?: string;
  tiposervico?: string;
  gruporeceita?: string;
  beneficiario?: string;
  prestador?: string;
  especialidade?: string;
  qtde?: number;
  valor?: number;
  valortotal?: number;
  setor_atendimento?: string;
  cid_doenca?: string;
  // ... outros campos conforme necessário
}

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

### **2. Usar no botão "Detalhamento":**

```typescript
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

function TabelaApolices() {
  const [apoliceDetalhada, setApoliceDetalhada] = useState<number | null>(null);

  // Buscar detalhamento quando uma apólice é selecionada
  const { data: detalhamento, isLoading } = useDetalhamentoApolice(
    apoliceDetalhada || 0,
    {
      dataInicio: '01/10/2025',  // Usar valores dos filtros da tela
      dataFim: '31/10/2025',
      grupoReceita: selectedGrupo  // Valor do dropdown de grupos
    }
  );

  return (
    <>
      {/* Tabela de apólices */}
      <Table>
        <TableBody>
          {apolices.map((apolice) => (
            <TableRow key={apolice.nrContrato}>
              <TableCell>{apolice.dsEstipulante}</TableCell>
              <TableCell>{apolice.breakeven}%</TableCell>
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

      {/* Modal de detalhamento */}
      <Dialog 
        open={!!apoliceDetalhada} 
        onOpenChange={() => setApoliceDetalhada(null)}
      >
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>
              Detalhamento da Apólice {apoliceDetalhada}
            </DialogTitle>
          </DialogHeader>

          {isLoading ? (
            <div>Carregando detalhamento...</div>
          ) : (
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
                {detalhamento?.map((item, index) => (
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
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
```

---

## 🎨 **OPÇÃO ALTERNATIVA: Nova Página em vez de Modal:**

Se preferir navegar para uma nova página:

```typescript
import { useNavigate } from "wouter";

function TabelaApolices() {
  const [_, navigate] = useNavigate();

  return (
    <Button 
      onClick={() => navigate(`/apolices/${apolice.nrContrato}/detalhamento`)}
    >
      Detalhamento
    </Button>
  );
}

// Em outra página:
function PaginaDetalhamento() {
  const { apolice } = useParams();
  const { data, isLoading } = useDetalhamentoApolice(Number(apolice));

  // Renderizar tabela de detalhamento
}
```

---

## ✅ **CHECKLIST DE IMPLEMENTAÇÃO:**

- [ ] Criar função `useDetalhamentoApolice` com useQuery
- [ ] Adicionar header `ngrok-skip-browser-warning: true`
- [ ] Conectar botão "Detalhamento" para chamar a API
- [ ] Criar modal ou página para mostrar os dados
- [ ] Passar filtros de data e grupo de receita da tela atual
- [ ] Tratar estado de loading
- [ ] Tratar erros (mostrar mensagem se API falhar)
- [ ] Adicionar paginação se necessário
- [ ] Testar com diferentes apólices

---

## 📊 **PRINCIPAIS CAMPOS RETORNADOS:**

| Campo | Descrição | Exemplo |
|-------|-----------|---------|
| data | Data do atendimento | "15/10/2025" |
| nm_proced | Nome do procedimento | "Consulta em Cardiologia" |
| beneficiario | Nome do beneficiário | "JOÃO DA SILVA" |
| prestador | Nome do médico/prestador | "DR. CARLOS SOUZA" |
| especialidade | Especialidade médica | "CARDIOLOGIA" |
| gruporeceita | Grupo de receita | "CONSULTAS ELETIVAS" |
| valor | Valor unitário | 150.00 |
| valortotal | Valor total (valor × qtde) | 150.00 |
| tiposervico | Tipo de serviço | "CONSULTA" |
| cid_doenca | CID da doença | "I10 - HIPERTENSÃO" |

Escolha quais colunas exibir na tabela conforme necessário!

---

## 🆘 **TROUBLESHOOTING:**

**Erro: "Número de contrato inválido"**
- Certifique-se de passar o número da apólice correto (ex: 2444)

**Erro: "Erro de validação"**
- Verifique formato das datas: deve ser DD/MM/YYYY
- Exemplo correto: `dataInicio=01/10/2025`

**API não retorna dados:**
- Verifique se existe dados para aquela apólice no período
- Teste a URL diretamente no navegador primeiro

---

## 🧪 **TESTAR A API PRIMEIRO:**

Antes de implementar, teste no navegador:

```
https://unhalted-tanja-unvinous.ngrok-free.dev/api/apolices/2444/detalhamento?dataInicio=01/10/2025&dataFim=31/10/2025
```

Deve retornar JSON com os dados!

---

## 💡 **DICAS:**

1. **Loading State**: Sempre mostrar skeleton ou spinner enquanto carrega
2. **Paginação**: Se tiver muitos registros, implementar paginação
3. **Filtros**: Permitir filtrar por grupo de receita na tela de detalhamento
4. **Export**: Adicionar botão para exportar para Excel/PDF
5. **Totalização**: Mostrar total de valores no rodapé da tabela

---

**Use a opção que preferir (Modal ou Página Nova) e mantenha o design consistente com o resto da aplicação!**
