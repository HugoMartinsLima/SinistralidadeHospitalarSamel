# 🎯 PROMPT PARA LOVABLE - Página de Detalhamento de Sinistros

## Cole este prompt no Lovable:

---

Preciso criar uma página completa de "Análise de Apólices" que exiba uma **tabela detalhada** com todos os sinistros de um contrato, com filtros de período e empresa.

## 📋 Requisitos da Página:

### 1. Filtros no Topo (já existem, apenas conectar com API):
- **Data Início e Data Fim**: DatePicker (formato DD/MM/YYYY)
- **Empresa/Contrato**: Dropdown com dados de `/api/contratos`
- **Grupo de Receita**: Dropdown (opcional, já existe)
- Botão "Filtrar" para aplicar filtros

### 2. Tabela de Dados (criar nova):
- Exibir **TODAS as 47 colunas** retornadas pela API
- Paginação (100 registros por página)
- Loading state enquanto carrega
- Scroll horizontal para acomodar muitas colunas
- Design responsivo

### 3. Resumo/Totais (acima da tabela):
- Total de registros encontrados
- Soma de valores (`valor` e `valortotal`)
- Período selecionado
- Empresa selecionada

---

## 🔗 API Endpoint:

```
GET https://sua-url.ngrok-free.dev/api/apolices/:nrContrato/detalhamento
```

**Query Parameters:**
- `dataInicio`: Data início (DD/MM/YYYY) - padrão: 01/10/2025
- `dataFim`: Data fim (DD/MM/YYYY) - padrão: 31/10/2025
- `grupoReceita`: Filtro opcional (ex: "Cirúrgico")
- `limit`: Registros por página (padrão: 100)
- `offset`: Paginação (padrão: 0)

**Header obrigatório:**
```typescript
'ngrok-skip-browser-warning': 'true'
```

---

## 📤 Resposta da API:

```json
{
  "data": [
    {
      "data": "15/10/2025",
      "hora": "14:30:00",
      "dataalta": "16/10/2025 10:00",
      "tipo_internacao": "CLÍNICA",
      "carater_atendimento": "ELETIVO",
      "tipo_conta": "INTERNAÇÃO",
      "atendimento": "123456",
      "autorizacao_original": "AUTH123",
      "tipo_validacao_clinica_externa": "",
      "data_validacao_clinica_externa": null,
      "dt_procedimento": "15/10/2025 14:30",
      "cod_tuss": "10101012",
      "ie_origem_proced": "1",
      "evento_tuss": "CONSULTA MÉDICA",
      "nr_seq_proc_interno": "123",
      "nm_proced": "Consulta em Cardiologia",
      "tiposervico": "CONSULTA",
      "gruporeceita": "CONSULTAS ELETIVAS",
      "tipoconsulta": "NORMAL",
      "apolice": 2455,
      "contratante": "EMPRESA XYZ LTDA",
      "plano": "PLANO EXECUTIVO",
      "cod_beneficiario": "245500001",
      "nome_paciente_prestador": "JOÃO DA SILVA",
      "beneficiario": "JOÃO DA SILVA",
      "sexo": "M",
      "datanascimento": "01/01/1980",
      "faixa_etaria": "40-49 ANOS",
      "mat_cliente": "12345",
      "tipodependente": "TITULAR",
      "titular": "JOÃO DA SILVA",
      "prestador": "DR. CARLOS SOUZA",
      "especialidade": "CARDIOLOGIA",
      "qtde": 1,
      "valor": 150.00,
      "valortotal": 150.00,
      "setor_atendimento": "AMBULATÓRIO",
      "se_continuidade": "NORMAL",
      "dt_contratacao": "01/01/2020",
      "dt_contrato": "01/01/2020",
      "dias_adesao": 2000,
      "cid_doenca": "I10 - HIPERTENSÃO",
      "sub_estipulante": "MATRIZ",
      "forma_chegada": "DEMANDA ESPONTÂNEA",
      "vl_procedimento_coparticipacao": 15.00
    }
  ],
  "pagination": {
    "limit": 100,
    "offset": 0,
    "total": 526
  },
  "filters": {
    "nrContrato": 2455,
    "dataInicio": "01/10/2025",
    "dataFim": "31/10/2025",
    "grupoReceita": "TODAS"
  }
}
```

---

## 💻 Implementação:

### 1. Hook de Query com Filtros:

```typescript
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

// Estados dos filtros
const [selectedEmpresa, setSelectedEmpresa] = useState<string>("todas");
const [dataInicio, setDataInicio] = useState("01/10/2025");
const [dataFim, setDataFim] = useState("31/10/2025");
const [grupoReceita, setGrupoReceita] = useState("TODAS");
const [currentPage, setCurrentPage] = useState(0);
const limit = 100;

// Query para buscar detalhamento
const { data: detalhamento, isLoading, isError, refetch } = useQuery({
  queryKey: [
    '/api/detalhamento',
    selectedEmpresa,
    dataInicio,
    dataFim,
    grupoReceita,
    currentPage
  ],
  queryFn: async () => {
    // Não buscar se não tiver empresa selecionada
    if (selectedEmpresa === "todas" || !selectedEmpresa) {
      return null;
    }

    const params = new URLSearchParams({
      dataInicio,
      dataFim,
      grupoReceita,
      limit: String(limit),
      offset: String(currentPage * limit)
    });

    const response = await fetch(
      `https://sua-url.ngrok-free.dev/api/apolices/${selectedEmpresa}/detalhamento?${params}`,
      {
        headers: {
          'ngrok-skip-browser-warning': 'true'
        }
      }
    );

    if (!response.ok) {
      throw new Error('Erro ao buscar detalhamento');
    }

    return await response.json();
  },
  enabled: selectedEmpresa !== "todas" && !!selectedEmpresa,
  staleTime: 2 * 60 * 1000, // Cache de 2 minutos
});

// Dados e totais
const sinistros = detalhamento?.data || [];
const totalRegistros = detalhamento?.pagination?.total || 0;
const totalPaginas = Math.ceil(totalRegistros / limit);

// Calcular totais financeiros
const somaValor = sinistros.reduce((acc: number, item: any) => 
  acc + (parseFloat(item.valor) || 0), 0
);
const somaValorTotal = sinistros.reduce((acc: number, item: any) => 
  acc + (parseFloat(item.valortotal) || 0), 0
);
```

### 2. Seção de Filtros (conectar com estado):

```tsx
<div className="space-y-4 mb-6">
  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
    {/* Data Início */}
    <div>
      <Label>Data Início</Label>
      <Input
        type="text"
        placeholder="DD/MM/AAAA"
        value={dataInicio}
        onChange={(e) => setDataInicio(e.target.value)}
        data-testid="input-data-inicio"
      />
    </div>

    {/* Data Fim */}
    <div>
      <Label>Data Fim</Label>
      <Input
        type="text"
        placeholder="DD/MM/AAAA"
        value={dataFim}
        onChange={(e) => setDataFim(e.target.value)}
        data-testid="input-data-fim"
      />
    </div>

    {/* Empresa/Contrato (usar componente do dropdown de empresas já criado) */}
    <div>
      <Label>Empresa/Contrato</Label>
      <Select value={selectedEmpresa} onValueChange={setSelectedEmpresa}>
        <SelectTrigger data-testid="select-empresa">
          <SelectValue placeholder="Selecione uma empresa" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todas">Todas as Empresas</SelectItem>
          {/* Empresas da API /api/contratos */}
        </SelectContent>
      </Select>
    </div>

    {/* Grupo Receita */}
    <div>
      <Label>Grupo de Receita</Label>
      <Select value={grupoReceita} onValueChange={setGrupoReceita}>
        <SelectTrigger data-testid="select-grupo">
          <SelectValue placeholder="TODAS" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="TODAS">TODAS</SelectItem>
          {/* Grupos da API /api/grupos-receita */}
        </SelectContent>
      </Select>
    </div>
  </div>

  {/* Botão Filtrar */}
  <Button 
    onClick={() => {
      setCurrentPage(0);
      refetch();
    }}
    disabled={selectedEmpresa === "todas"}
    data-testid="button-filtrar"
  >
    <Search className="mr-2 h-4 w-4" />
    Filtrar
  </Button>
</div>
```

### 3. Card de Resumo/Totais:

```tsx
{detalhamento && (
  <Card className="mb-4">
    <CardHeader>
      <CardTitle>Resumo</CardTitle>
    </CardHeader>
    <CardContent>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Total de Registros</p>
          <p className="text-2xl font-bold" data-testid="text-total-registros">
            {totalRegistros}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Soma Valor</p>
          <p className="text-2xl font-bold text-green-600" data-testid="text-soma-valor">
            R$ {somaValor.toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Soma Valor Total</p>
          <p className="text-2xl font-bold text-blue-600" data-testid="text-soma-valortotal">
            R$ {somaValorTotal.toFixed(2)}
          </p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Período</p>
          <p className="text-lg font-semibold" data-testid="text-periodo">
            {dataInicio} - {dataFim}
          </p>
        </div>
      </div>
    </CardContent>
  </Card>
)}
```

### 4. Tabela de Dados (47 colunas):

```tsx
<Card>
  <CardContent className="p-0">
    {/* Loading */}
    {isLoading && (
      <div className="p-8 text-center" data-testid="loading-detalhamento">
        <p>Carregando detalhamento...</p>
      </div>
    )}

    {/* Erro */}
    {isError && (
      <div className="p-8 text-center text-destructive" data-testid="error-detalhamento">
        <p>Erro ao carregar dados. Verifique os filtros e tente novamente.</p>
      </div>
    )}

    {/* Sem empresa selecionada */}
    {selectedEmpresa === "todas" && (
      <div className="p-8 text-center text-muted-foreground">
        <p>Selecione uma empresa para visualizar o detalhamento</p>
      </div>
    )}

    {/* Tabela com dados */}
    {!isLoading && !isError && sinistros.length > 0 && (
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="sticky left-0 bg-background z-10">Data</TableHead>
              <TableHead>Hora</TableHead>
              <TableHead>Data Alta</TableHead>
              <TableHead>Tipo Internação</TableHead>
              <TableHead>Caráter Atendimento</TableHead>
              <TableHead>Tipo Conta</TableHead>
              <TableHead>Atendimento</TableHead>
              <TableHead>Autorização</TableHead>
              <TableHead>Validação Clínica</TableHead>
              <TableHead>Data Validação</TableHead>
              <TableHead>Data Procedimento</TableHead>
              <TableHead>Código TUSS</TableHead>
              <TableHead>Origem Proced.</TableHead>
              <TableHead>Evento TUSS</TableHead>
              <TableHead>Seq. Proc. Interno</TableHead>
              <TableHead>Nome Procedimento</TableHead>
              <TableHead>Tipo Serviço</TableHead>
              <TableHead>Grupo Receita</TableHead>
              <TableHead>Tipo Consulta</TableHead>
              <TableHead>Apólice</TableHead>
              <TableHead>Contratante</TableHead>
              <TableHead>Plano</TableHead>
              <TableHead>Cód. Beneficiário</TableHead>
              <TableHead>Nome Paciente</TableHead>
              <TableHead>Beneficiário</TableHead>
              <TableHead>Sexo</TableHead>
              <TableHead>Data Nascimento</TableHead>
              <TableHead>Faixa Etária</TableHead>
              <TableHead>Matrícula Cliente</TableHead>
              <TableHead>Tipo Dependente</TableHead>
              <TableHead>Titular</TableHead>
              <TableHead>Prestador</TableHead>
              <TableHead>Especialidade</TableHead>
              <TableHead>Qtde</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="text-right">Valor Total</TableHead>
              <TableHead>Setor Atendimento</TableHead>
              <TableHead>Continuidade</TableHead>
              <TableHead>Data Contratação</TableHead>
              <TableHead>Data Contrato</TableHead>
              <TableHead>Dias Adesão</TableHead>
              <TableHead>CID Doença</TableHead>
              <TableHead>Sub Estipulante</TableHead>
              <TableHead>Forma Chegada</TableHead>
              <TableHead className="text-right">Coparticipação</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sinistros.map((sinistro: any, index: number) => (
              <TableRow key={index} data-testid={`row-sinistro-${index}`}>
                <TableCell className="sticky left-0 bg-background font-medium">
                  {sinistro.data}
                </TableCell>
                <TableCell>{sinistro.hora}</TableCell>
                <TableCell>{sinistro.dataalta}</TableCell>
                <TableCell>{sinistro.tipo_internacao}</TableCell>
                <TableCell>{sinistro.carater_atendimento}</TableCell>
                <TableCell>{sinistro.tipo_conta}</TableCell>
                <TableCell>{sinistro.atendimento}</TableCell>
                <TableCell>{sinistro.autorizacao_original}</TableCell>
                <TableCell>{sinistro.tipo_validacao_clinica_externa}</TableCell>
                <TableCell>{sinistro.data_validacao_clinica_externa}</TableCell>
                <TableCell>{sinistro.dt_procedimento}</TableCell>
                <TableCell>{sinistro.cod_tuss}</TableCell>
                <TableCell>{sinistro.ie_origem_proced}</TableCell>
                <TableCell className="max-w-xs truncate" title={sinistro.evento_tuss}>
                  {sinistro.evento_tuss}
                </TableCell>
                <TableCell>{sinistro.nr_seq_proc_interno}</TableCell>
                <TableCell className="max-w-xs truncate" title={sinistro.nm_proced}>
                  {sinistro.nm_proced}
                </TableCell>
                <TableCell>{sinistro.tiposervico}</TableCell>
                <TableCell>{sinistro.gruporeceita}</TableCell>
                <TableCell>{sinistro.tipoconsulta}</TableCell>
                <TableCell>{sinistro.apolice}</TableCell>
                <TableCell className="max-w-xs truncate" title={sinistro.contratante}>
                  {sinistro.contratante}
                </TableCell>
                <TableCell>{sinistro.plano}</TableCell>
                <TableCell>{sinistro.cod_beneficiario}</TableCell>
                <TableCell className="max-w-xs truncate" title={sinistro.nome_paciente_prestador}>
                  {sinistro.nome_paciente_prestador}
                </TableCell>
                <TableCell>{sinistro.beneficiario}</TableCell>
                <TableCell>{sinistro.sexo}</TableCell>
                <TableCell>{sinistro.datanascimento}</TableCell>
                <TableCell>{sinistro.faixa_etaria}</TableCell>
                <TableCell>{sinistro.mat_cliente}</TableCell>
                <TableCell>{sinistro.tipodependente}</TableCell>
                <TableCell>{sinistro.titular}</TableCell>
                <TableCell className="max-w-xs truncate" title={sinistro.prestador}>
                  {sinistro.prestador}
                </TableCell>
                <TableCell>{sinistro.especialidade}</TableCell>
                <TableCell className="text-center">{sinistro.qtde}</TableCell>
                <TableCell className="text-right font-medium">
                  R$ {parseFloat(sinistro.valor).toFixed(2)}
                </TableCell>
                <TableCell className="text-right font-bold text-green-600">
                  R$ {parseFloat(sinistro.valortotal).toFixed(2)}
                </TableCell>
                <TableCell>{sinistro.setor_atendimento}</TableCell>
                <TableCell>{sinistro.se_continuidade}</TableCell>
                <TableCell>{sinistro.dt_contratacao}</TableCell>
                <TableCell>{sinistro.dt_contrato}</TableCell>
                <TableCell className="text-center">{sinistro.dias_adesao}</TableCell>
                <TableCell className="max-w-xs truncate" title={sinistro.cid_doenca}>
                  {sinistro.cid_doenca}
                </TableCell>
                <TableCell>{sinistro.sub_estipulante}</TableCell>
                <TableCell>{sinistro.forma_chegada}</TableCell>
                <TableCell className="text-right">
                  R$ {parseFloat(sinistro.vl_procedimento_coparticipacao).toFixed(2)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )}

    {/* Sem dados */}
    {!isLoading && !isError && sinistros.length === 0 && selectedEmpresa !== "todas" && (
      <div className="p-8 text-center text-muted-foreground">
        <p>Nenhum registro encontrado para os filtros selecionados.</p>
      </div>
    )}
  </CardContent>
</Card>
```

### 5. Paginação:

```tsx
{totalPaginas > 1 && (
  <div className="flex items-center justify-between mt-4">
    <div className="text-sm text-muted-foreground">
      Página {currentPage + 1} de {totalPaginas} ({totalRegistros} registros)
    </div>
    
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
        disabled={currentPage === 0}
        data-testid="button-prev-page"
      >
        <ChevronLeft className="h-4 w-4" />
        Anterior
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => setCurrentPage(p => Math.min(totalPaginas - 1, p + 1))}
        disabled={currentPage >= totalPaginas - 1}
        data-testid="button-next-page"
      >
        Próxima
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  </div>
)}
```

---

## 🎨 Melhorias Opcionais:

### Exportar para Excel/CSV:

```tsx
import { Download } from "lucide-react";

const exportarCSV = () => {
  if (!sinistros.length) return;
  
  // Cabeçalhos
  const headers = Object.keys(sinistros[0]).join(';');
  
  // Dados
  const rows = sinistros.map((s: any) => 
    Object.values(s).map(v => `"${v}"`).join(';')
  ).join('\n');
  
  // Download
  const csv = `${headers}\n${rows}`;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `detalhamento_${selectedEmpresa}_${dataInicio}_${dataFim}.csv`;
  link.click();
};

<Button variant="outline" onClick={exportarCSV} disabled={!sinistros.length}>
  <Download className="mr-2 h-4 w-4" />
  Exportar CSV
</Button>
```

### Filtro na Tabela (busca rápida):

```tsx
const [filtroTabela, setFiltroTabela] = useState("");

const sinistrosFiltrados = sinistros.filter((s: any) =>
  Object.values(s).some(v => 
    String(v).toLowerCase().includes(filtroTabela.toLowerCase())
  )
);

<Input
  placeholder="Buscar na tabela..."
  value={filtroTabela}
  onChange={(e) => setFiltroTabela(e.target.value)}
  className="max-w-sm mb-4"
  data-testid="input-filtro-tabela"
/>
```

---

## 📝 Notas Importantes:

1. **URL da API**: Substitua `sua-url.ngrok-free.dev` pela URL real
2. **Header obrigatório**: Sempre incluir `'ngrok-skip-browser-warning': 'true'`
3. **Formato de data**: Aceita apenas DD/MM/YYYY (ex: 01/10/2025)
4. **Primeira coluna fixa**: `sticky left-0` mantém a data visível ao rolar
5. **Valores numéricos**: Formatados com `.toFixed(2)` para 2 casas decimais
6. **Textos longos**: `truncate` com `title` para mostrar completo no hover
7. **Scroll horizontal**: Tabela responsiva com `overflow-x-auto`
8. **Paginação**: Controla automaticamente via `offset` e `limit`

---

## ✅ Checklist de Implementação:

- [ ] Filtros funcionando (data, empresa, grupo)
- [ ] Tabela exibe todas as 47 colunas
- [ ] Primeira coluna (data) fixa ao rolar horizontalmente
- [ ] Loading state durante carregamento
- [ ] Totais corretos (registros e valores)
- [ ] Paginação funcional
- [ ] Mensagem quando não há empresa selecionada
- [ ] Mensagem quando não há dados
- [ ] Valores formatados corretamente (R$)
- [ ] Header ngrok em todas as requisições
- [ ] Design responsivo

---

Mantenha o design consistente com o resto da aplicação. Use os componentes shadcn já existentes (Card, Table, Button, Select, Input).
