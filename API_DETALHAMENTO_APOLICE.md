# 📊 Endpoint: Detalhamento de Apólice

## Descrição

Endpoint para buscar o detalhamento completo de uma apólice, incluindo todos os procedimentos, atendimentos, pacientes e valores em um período.

Este endpoint executa uma query Oracle complexa (1231 linhas) que traz informações detalhadas de:
- Procedimentos realizados
- Atendimentos hospitalares  
- Dados dos beneficiários
- Valores e coparticipações
- CIDs e diagnósticos
- Prestadores e especialidades

---

## 🔗 URL

```
GET /api/apolices/:nrContrato/detalhamento
```

---

## 📥 Parâmetros

### **Path Parameter (Obrigatório):**
- `nrContrato`: Número da apólice/contrato (ex: 2444)

### **Query Parameters (Opcionais):**
- `dataInicio`: Data início do período (formato: DD/MM/YYYY) - padrão: 01/10/2025
- `dataFim`: Data fim do período (formato: DD/MM/YYYY) - padrão: 31/10/2025
- `grupoReceita`: Filtrar por grupo de receita (ex: "Cirúrgico") - padrão: TODAS
- `limit`: Quantidade de registros por página - padrão: 100
- `offset`: Número de registros para pular (paginação) - padrão: 0

---

## 📤 Resposta de Sucesso

**Status:** `200 OK`

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
      "dt_procedimento": "15/10/2025 14:30",
      "cod_tuss": "10101012",
      "evento_tuss": "CONSULTA MÉDICA",
      "nm_proced": "Consulta em Cardiologia",
      "tiposervico": "CONSULTA",
      "gruporeceita": "CONSULTAS ELETIVAS",
      "apolice": 2444,
      "contratante": "2E DESPACHOS ADUANEIROS LTDA",
      "plano": "PLANO EXECUTIVO",
      "cod_beneficiario": "244400001",
      "nome_paciente_prestador": "JOÃO DA SILVA",
      "beneficiario": "JOÃO DA SILVA",
      "sexo": "M",
      "datanascimento": "01/01/1980",
      "faixa_etaria": "40-49 ANOS",
      "MAT_CLIENTE": "12345",
      "tipodependente": "TITULAR",
      "titular": "JOÃO DA SILVA",
      "prestador": "DR. CARLOS SOUZA",
      "especialidade": "CARDIOLOGIA",
      "qtde": 1,
      "valor": 150.00,
      "valortotal": 150.00,
      "setor_atendimento": "AMBULATÓRIO",
      "SE_CONTINUIDADE": "NORMAL",
      "DT_CONTRATACAO": "01/01/2020",
      "dt_contrato": "01/01/2020",
      "dias_adesao": 2000,
      "cid_doenca": "I10 - HIPERTENSÃO ESSENCIAL",
      "sub_estipulante": "MATRIZ",
      "forma_chegada": "DEMANDA ESPONTÂNEA",
      "vl_procedimento_coparticipacao": 15.00
    }
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

## ❌ Respostas de Erro

### **Contrato Inválido**
**Status:** `400 Bad Request`

```json
{
  "error": "Número de contrato inválido",
  "message": "O número do contrato deve ser um número válido"
}
```

### **Erro de Validação**
**Status:** `400 Bad Request`

```json
{
  "error": "Erro de validação",
  "message": "Data início deve estar no formato DD/MM/YYYY"
}
```

### **Erro de Servidor**
**Status:** `500 Internal Server Error`

```json
{
  "error": "Erro ao buscar detalhamento de apólice",
  "message": "Mensagem de erro detalhada"
}
```

---

## 💻 Exemplos de Uso

### Navegador
```
https://sua-url.ngrok-free.dev/api/apolices/2444/detalhamento
https://sua-url.ngrok-free.dev/api/apolices/2444/detalhamento?dataInicio=01/10/2025&dataFim=31/10/2025
https://sua-url.ngrok-free.dev/api/apolices/2444/detalhamento?grupoReceita=Cirúrgico&limit=50
```

### JavaScript/TypeScript
```typescript
async function buscarDetalhamento(apolice: number, filtros?: {
  dataInicio?: string;
  dataFim?: string;
  grupoReceita?: string;
}) {
  const params = new URLSearchParams();
  if (filtros?.dataInicio) params.append('dataInicio', filtros.dataInicio);
  if (filtros?.dataFim) params.append('dataFim', filtros.dataFim);
  if (filtros?.grupoReceita) params.append('grupoReceita', filtros.grupoReceita);

  const response = await fetch(
    `https://sua-url.ngrok-free.dev/api/apolices/${apolice}/detalhamento?${params}`,
    {
      headers: {
        'ngrok-skip-browser-warning': 'true'
      }
    }
  );
  
  if (!response.ok) {
    throw new Error('Erro ao buscar detalhamento');
  }
  
  const data = await response.json();
  return data;
}

// Exemplo de uso:
const resultado = await buscarDetalhamento(2444, {
  dataInicio: '01/10/2025',
  dataFim: '31/10/2025',
  grupoReceita: 'Consultas Eletivas'
});

console.log('Total de registros:', resultado.pagination.total);
console.log('Procedimentos:', resultado.data);
```

### cURL
```bash
# Básico
curl "https://sua-url.ngrok-free.dev/api/apolices/2444/detalhamento" \
  -H "ngrok-skip-browser-warning: true"

# Com filtros
curl "https://sua-url.ngrok-free.dev/api/apolices/2444/detalhamento?dataInicio=01/10/2025&dataFim=31/10/2025&grupoReceita=Cirúrgico" \
  -H "ngrok-skip-browser-warning: true"

# Com paginação
curl "https://sua-url.ngrok-free.dev/api/apolices/2444/detalhamento?limit=50&offset=0" \
  -H "ngrok-skip-browser-warning: true"
```

---

## 📊 Principais Campos Retornados

| Campo | Tipo | Descrição |
|-------|------|-----------|
| data | string | Data do atendimento (DD/MM/YYYY) |
| hora | string | Hora do atendimento (HH:MM:SS) |
| tipo_conta | string | Tipo de conta (INTERNAÇÃO, AMBULATORIAL, etc) |
| atendimento | string | Número do atendimento |
| dt_procedimento | string | Data/hora do procedimento |
| cod_tuss | string | Código TUSS do procedimento |
| evento_tuss | string | Descrição do evento TUSS |
| nm_proced | string | Nome do procedimento |
| tiposervico | string | Tipo de serviço (CONSULTA, CIRÚRGICO, etc) |
| gruporeceita | string | Grupo de receita |
| apolice | number | Número da apólice |
| contratante | string | Razão social do contratante |
| plano | string | Nome do plano |
| beneficiario | string | Nome do beneficiário |
| sexo | string | Sexo do beneficiário (M/F) |
| datanascimento | string | Data de nascimento |
| faixa_etaria | string | Faixa etária calculada |
| tipodependente | string | TITULAR ou DEPENDENTE |
| prestador | string | Nome do prestador/médico |
| especialidade | string | Especialidade médica |
| qtde | number | Quantidade de procedimentos |
| valor | number | Valor unitário |
| valortotal | number | Valor total (valor × qtde) |
| cid_doenca | string | CID da doença |
| vl_procedimento_coparticipacao | number | Valor da coparticipação |

---

## 🏗️ Arquitetura Interna

Este endpoint utiliza uma arquitetura em camadas para melhor organização:

```
routes.ts (Controller)
    ↓
queries/detalhamento-apolice.ts (Service Layer)
    ↓
oracle-db.ts (Data Access Layer)
    ↓
Oracle Database
```

**Detalhes:**
- **SQL**: Armazenado em `server/sql/detalhamento-apolice-completo.sql` (1231 linhas)
- **Parametrização**: SQL carregado uma vez e parametrizado com bind variables
- **Validação**: Zod schema em `shared/schema.ts`
- **Filtros**: Aplicados em memória após query (grupoReceita) ou via SQL (datas, contrato)

---

## 🔐 Segurança

- ✅ **Bind Variables**: Uso exclusivo de bind variables do Oracle (protege contra SQL Injection)
- ✅ **Validação**: Todos os parâmetros validados com Zod antes de executar query
- ✅ **Read-Only**: Endpoint apenas para leitura (GET)
- ✅ **CORS**: Configurado para aceitar requisições do Lovable

---

## ⚡ Performance

- **Cache SQL**: SQL carregado e parametrizado uma vez na inicialização
- **Paginação**: Suporte a limit/offset para grandes volumes
- **Índices Oracle**: Query otimizada com hints de índice
- **Pool de Conexões**: Reutilização eficiente de conexões Oracle

---

## 📝 Notas Técnicas

1. **Formato de Datas**: Sempre DD/MM/YYYY (formato brasileiro)
2. **Valores Numéricos**: Valores monetários em formato decimal (ex: 150.00)
3. **Filtro de Grupo**: Case-insensitive (aceita "cirúrgico" ou "CIRÚRGICO")
4. **Paginação**: Aplicada em memória após query completa
5. **SQL Complexo**: 1231 linhas com CTEs, múltiplos JOINs e subqueries

---

## 🧪 Testando o Endpoint

### 1. Teste básico (navegador):
```
https://sua-url.ngrok/api/apolices/2444/detalhamento
```

### 2. Com filtros:
```
https://sua-url.ngrok/api/apolices/2444/detalhamento?dataInicio=01/10/2025&dataFim=31/10/2025&grupoReceita=Cirúrgico
```

### 3. Verificar resposta:
- Status deve ser 200
- Deve retornar objeto com: data, pagination, filters
- data deve ser um array de objetos

---

## 🔧 Troubleshooting

**Problema: Timeout na query**
- **Solução**: Reduzir período (dataInicio/dataFim) ou usar paginação

**Problema: Muitos registros**
- **Solução**: Usar limit menor (ex: limit=50) ou filtrar por grupoReceita

**Problema: Dados não aparecem**
- **Verificar**: Se existem dados para aquela apólice no período
- **Verificar**: Formato das datas (deve ser DD/MM/YYYY)
- **Verificar**: Número da apólice está correto

**Problema: Erro 400**
- **Verificar**: Formato dos parâmetros (datas, números)
- **Verificar**: Mensagem de erro detalhada

---

## 🔗 Endpoints Relacionados

- `GET /api/contratos` - Listar todos os contratos
- `GET /api/contratos/:nrContrato` - Buscar contrato específico
- `GET /api/grupos-receita` - Listar grupos de receita para filtro

---

**Última atualização:** 07/11/2025
