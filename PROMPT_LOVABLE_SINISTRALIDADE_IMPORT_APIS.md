# APIs de Análise da Sinistralidade Importada

Este documento descreve as 4 APIs para análise dos dados importados na tabela `SAMEL.SINISTRALIDADE_IMPORT`.

## Base URL
```
https://sua-api.replit.app
```

---

## 1. GET /api/sinistralidade/contratos/resumo

Retorna dados agregados por contrato (apólice) para dashboard de sinistralidade.

### Query Parameters

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| dataInicio | string | Sim | Data inicial (formato DD/MM/YYYY) |
| dataFim | string | Sim | Data final (formato DD/MM/YYYY) |
| contratos | string | Não | Lista de apólices separadas por vírgula (ex: "1234,5678") |
| grupoReceita | string | Não | Filtrar por grupo de receita específico |

### Exemplo de Requisição
```
GET /api/sinistralidade/contratos/resumo?dataInicio=01/01/2024&dataFim=31/12/2024
```

### Exemplo de Resposta
```json
{
  "data": [
    {
      "apolice": 12345,
      "contratante": "EMPRESA XYZ LTDA",
      "sinistroTotal": 150000.50,
      "sinistroTitular": 100000.00,
      "sinistrosDependentes": 50000.50,
      "quantidadeBeneficiarios": 45,
      "quantidadeAtendimentos": 320,
      "breakeven": 75
    }
  ],
  "total": 1,
  "filters": {
    "dataInicio": "01/01/2024",
    "dataFim": "31/12/2024",
    "contratos": "TODOS",
    "grupoReceita": "TODOS"
  }
}
```

### Campos da Resposta

| Campo | Tipo | Descrição |
|-------|------|-----------|
| apolice | number | Número da apólice/contrato |
| contratante | string | Nome da empresa contratante |
| sinistroTotal | number | Soma total do valor_total de todos os atendimentos |
| sinistroTitular | number | Soma do valor_total apenas de titulares |
| sinistrosDependentes | number | Soma do valor_total apenas de dependentes |
| quantidadeBeneficiarios | number | Quantidade de beneficiários distintos |
| quantidadeAtendimentos | number | Total de registros/atendimentos |
| breakeven | number | Percentual de breakeven (default 75% se não cadastrado) |

---

## 2. GET /api/sinistralidade/detalhamento

Retorna todos os campos da tabela sinistralidade_import com filtros e paginação opcional.

### Query Parameters

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| nrContrato | number | Sim | Número da apólice/contrato |
| dataInicio | string | Sim | Data inicial (formato DD/MM/YYYY) |
| dataFim | string | Sim | Data final (formato DD/MM/YYYY) |
| grupoReceita | string | Não | Filtrar por grupo de receita |
| limit | number | Não | Limite de registros (se não enviado, retorna TODOS) |
| offset | number | Não | Offset para paginação |

### Exemplo de Requisição
```
GET /api/sinistralidade/detalhamento?nrContrato=12345&dataInicio=01/01/2024&dataFim=31/12/2024&limit=50&offset=0
```

### Exemplo de Resposta
```json
{
  "data": [
    {
      "data": "15/03/2024",
      "hora": "14:30:00",
      "dataAlta": "15/03/2024",
      "tipoInternacao": null,
      "caraterAtendimento": "ELETIVO",
      "tipoConta": "AMBULATORIAL",
      "atendimento": 987654,
      "autorizacaoOriginal": 123456,
      "tipoValidacaoClinicaExterna": null,
      "dataValidacaoClinicaExterna": null,
      "dtProcedimento": "15/03/2024",
      "codTuss": 10101012,
      "ieOrigemProced": 1,
      "eventoTuss": "10101012",
      "nrSeqProcInterno": 1,
      "nmProced": "CONSULTA EM CONSULTÓRIO",
      "tipoServico": "CONSULTA",
      "grupoReceita": "CONSULTAS",
      "tipoConsulta": "PRIMEIRA CONSULTA",
      "apolice": 12345,
      "contratante": "EMPRESA XYZ LTDA",
      "plano": "ENFERMARIA",
      "codBeneficiario": "000123456",
      "nomePacientePrestador": "JOÃO DA SILVA",
      "beneficiario": "JOÃO DA SILVA",
      "sexo": "MASCULINO",
      "dataNascimento": "15/05/1980",
      "faixaEtaria": "40-49",
      "matCliente": 123456,
      "tipoDependente": "TITULAR",
      "titular": "JOÃO DA SILVA",
      "prestador": "CLÍNICA SAÚDE TOTAL",
      "especialidade": "CLÍNICA MÉDICA",
      "qtde": 1,
      "valor": 150.00,
      "valorTotal": 150.00,
      "setorAtendimento": "AMBULATÓRIO",
      "seContinuidade": "N",
      "dtContratacao": "01/01/2020",
      "dtContrato": "01/01/2024",
      "diasAdesao": 1460,
      "cidDoenca": null,
      "subEstipulante": null,
      "formaChegada": "DEMANDA ESPONTÂNEA",
      "vlProcedimentoCoparticipacao": 30.00
    }
  ],
  "total": 320,
  "pagination": {
    "limit": 50,
    "offset": 0
  },
  "filters": {
    "nrContrato": 12345,
    "dataInicio": "01/01/2024",
    "dataFim": "31/12/2024",
    "grupoReceita": "TODOS"
  }
}
```

### Todos os 45 Campos Retornados

| Campo | Tipo | Descrição |
|-------|------|-----------|
| data | string | Data do atendimento (DD/MM/YYYY) |
| hora | string | Hora do atendimento (HH:MM:SS) |
| dataAlta | string | Data da alta (DD/MM/YYYY) |
| tipoInternacao | string | Tipo de internação |
| caraterAtendimento | string | Caráter do atendimento (ELETIVO, URGÊNCIA, etc.) |
| tipoConta | string | Tipo da conta (AMBULATORIAL, INTERNAÇÃO) |
| atendimento | number | Número do atendimento |
| autorizacaoOriginal | number | Número da autorização original |
| tipoValidacaoClinicaExterna | string | Tipo de validação clínica externa |
| dataValidacaoClinicaExterna | string | Data da validação clínica externa |
| dtProcedimento | string | Data do procedimento |
| codTuss | number | Código TUSS do procedimento |
| ieOrigemProced | number | Indicador de origem do procedimento |
| eventoTuss | string | Evento TUSS |
| nrSeqProcInterno | number | Sequência interna do procedimento |
| nmProced | string | Nome do procedimento |
| tipoServico | string | Tipo de serviço |
| grupoReceita | string | Grupo de receita |
| tipoConsulta | string | Tipo de consulta |
| apolice | number | Número da apólice |
| contratante | string | Nome do contratante |
| plano | string | Nome do plano |
| codBeneficiario | string | Código do beneficiário |
| nomePacientePrestador | string | Nome do paciente no prestador |
| beneficiario | string | Nome do beneficiário |
| sexo | string | Sexo do beneficiário |
| dataNascimento | string | Data de nascimento |
| faixaEtaria | string | Faixa etária |
| matCliente | number | Matrícula do cliente |
| tipoDependente | string | Tipo de dependente (TITULAR, DEPENDENTE) |
| titular | string | Nome do titular |
| prestador | string | Nome do prestador |
| especialidade | string | Especialidade médica |
| qtde | number | Quantidade |
| valor | number | Valor unitário |
| valorTotal | number | Valor total |
| setorAtendimento | string | Setor de atendimento |
| seContinuidade | string | Indicador de continuidade (S/N) |
| dtContratacao | string | Data de contratação |
| dtContrato | string | Data do contrato |
| diasAdesao | number | Dias desde a adesão |
| cidDoenca | string | CID da doença |
| subEstipulante | string | Sub-estipulante |
| formaChegada | string | Forma de chegada |
| vlProcedimentoCoparticipacao | number | Valor da coparticipação |

---

## 3. GET /api/sinistralidade/pacientes/busca

Busca registros de paciente por nome (case insensitive) em todos os contratos.

### Query Parameters

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| nome | string | Sim | Nome do paciente (mínimo 3 caracteres) |
| dataInicio | string | Sim | Data inicial (formato DD/MM/YYYY) |
| dataFim | string | Sim | Data final (formato DD/MM/YYYY) |
| grupoReceita | string | Não | Filtrar por grupo de receita |

### Exemplo de Requisição
```
GET /api/sinistralidade/pacientes/busca?nome=SILVA&dataInicio=01/01/2024&dataFim=31/12/2024
```

### Exemplo de Resposta
```json
{
  "data": [
    {
      "data": "15/03/2024",
      "hora": "14:30:00",
      "beneficiario": "JOÃO DA SILVA",
      "apolice": 12345,
      "contratante": "EMPRESA XYZ LTDA",
      "nmProced": "CONSULTA EM CONSULTÓRIO",
      "valorTotal": 150.00
      // ... todos os 45 campos
    }
  ],
  "total": 25,
  "paciente": "SILVA",
  "filters": {
    "dataInicio": "01/01/2024",
    "dataFim": "31/12/2024",
    "grupoReceita": "TODOS"
  }
}
```

### Notas
- Busca case insensitive nos campos `beneficiario` e `nomePacientePrestador`
- Limitado a 500 registros por busca
- Retorna todos os 45 campos da tabela

---

## 4. GET /api/sinistralidade/grupos-receita

Lista todos os grupos de receita distintos existentes na tabela.

### Query Parameters
Nenhum parâmetro necessário.

### Exemplo de Requisição
```
GET /api/sinistralidade/grupos-receita
```

### Exemplo de Resposta
```json
{
  "data": [
    { "grupoReceita": "CONSULTAS" },
    { "grupoReceita": "EXAMES" },
    { "grupoReceita": "HONORÁRIOS" },
    { "grupoReceita": "INTERNAÇÃO" },
    { "grupoReceita": "MATERIAIS" },
    { "grupoReceita": "MEDICAMENTOS" },
    { "grupoReceita": "PROCEDIMENTOS" },
    { "grupoReceita": "TAXAS" }
  ],
  "total": 8
}
```

---

## Códigos de Erro

| Código | Descrição |
|--------|-----------|
| 400 | Parâmetros inválidos ou faltando |
| 500 | Erro interno do servidor |

### Exemplo de Erro
```json
{
  "error": "Parâmetros obrigatórios",
  "message": "dataInicio e dataFim são obrigatórios (formato DD/MM/YYYY)"
}
```

---

## Exemplo de Uso no Frontend (React + TanStack Query)

```typescript
import { useQuery } from '@tanstack/react-query';

// Hook para resumo de contratos
export function useResumoContratos(dataInicio: string, dataFim: string, contratos?: string, grupoReceita?: string) {
  const params = new URLSearchParams({ dataInicio, dataFim });
  if (contratos) params.append('contratos', contratos);
  if (grupoReceita) params.append('grupoReceita', grupoReceita);
  
  return useQuery({
    queryKey: ['/api/sinistralidade/contratos/resumo', dataInicio, dataFim, contratos, grupoReceita],
    queryFn: async () => {
      const res = await fetch(`/api/sinistralidade/contratos/resumo?${params}`);
      if (!res.ok) throw new Error('Erro ao buscar resumo');
      return res.json();
    },
    enabled: !!dataInicio && !!dataFim,
  });
}

// Hook para detalhamento
export function useDetalhamento(nrContrato: number, dataInicio: string, dataFim: string, grupoReceita?: string, limit?: number, offset?: number) {
  const params = new URLSearchParams({ 
    nrContrato: String(nrContrato), 
    dataInicio, 
    dataFim 
  });
  if (grupoReceita) params.append('grupoReceita', grupoReceita);
  if (limit) params.append('limit', String(limit));
  if (offset) params.append('offset', String(offset));
  
  return useQuery({
    queryKey: ['/api/sinistralidade/detalhamento', nrContrato, dataInicio, dataFim, grupoReceita, limit, offset],
    queryFn: async () => {
      const res = await fetch(`/api/sinistralidade/detalhamento?${params}`);
      if (!res.ok) throw new Error('Erro ao buscar detalhamento');
      return res.json();
    },
    enabled: !!nrContrato && !!dataInicio && !!dataFim,
  });
}

// Hook para grupos de receita
export function useGruposReceita() {
  return useQuery({
    queryKey: ['/api/sinistralidade/grupos-receita'],
    queryFn: async () => {
      const res = await fetch('/api/sinistralidade/grupos-receita');
      if (!res.ok) throw new Error('Erro ao buscar grupos');
      return res.json();
    },
  });
}

// Hook para busca de paciente
export function useBuscaPaciente(nome: string, dataInicio: string, dataFim: string, grupoReceita?: string) {
  const params = new URLSearchParams({ nome, dataInicio, dataFim });
  if (grupoReceita) params.append('grupoReceita', grupoReceita);
  
  return useQuery({
    queryKey: ['/api/sinistralidade/pacientes/busca', nome, dataInicio, dataFim, grupoReceita],
    queryFn: async () => {
      const res = await fetch(`/api/sinistralidade/pacientes/busca?${params}`);
      if (!res.ok) throw new Error('Erro ao buscar paciente');
      return res.json();
    },
    enabled: !!nome && nome.length >= 3 && !!dataInicio && !!dataFim,
  });
}
```
