# Prompt para Lovable - Importação de Sinistralidade

## Objetivo
Criar página de importação de planilha Excel/CSV para inserir dados na tabela SAMEL.SINISTRALIDADE_IMPORT.

## Endpoint da API

### POST /api/sinistralidade/import
Importa registros para a tabela de sinistralidade.

**URL Base**: `http://localhost:5000` (desenvolvimento) ou URL do ngrok

**Request Body**:
```json
{
  "registros": [
    {
      "data": "01/11/2025",
      "hora": "14:30:00",
      "dataAlta": "05/11/2025",
      "tipoInternacao": "CLINICA",
      "caraterAtendimento": "ELETIVO",
      "tipoConta": "HOSPITALAR",
      "atendimento": 123456,
      "autorizacaoOriginal": 789012,
      "tipoValidacaoClinicaExterna": null,
      "dataValidacaoClinicaExterna": null,
      "dtProcedimento": "01/11/2025",
      "codTuss": 10101012,
      "ieOrigemProced": 1,
      "eventoTuss": "10101012",
      "nrSeqProcInterno": 1,
      "nmProced": "CONSULTA EM CONSULTORIO",
      "tipoServico": "CONSULTA",
      "grupoReceita": "CONSULTAS",
      "tipoConsulta": "PRIMEIRA VEZ",
      "apolice": 2444,
      "contratante": "EMPRESA EXEMPLO LTDA",
      "plano": "ENFERMARIA",
      "codBeneficiario": "123456789",
      "nomePacientePrestador": "DR. JOAO SILVA",
      "beneficiario": "MARIA SANTOS",
      "sexo": "F",
      "dataNascimento": "15/03/1985",
      "faixaEtaria": "35-39",
      "matCliente": 12345,
      "tipoDependente": "TITULAR",
      "titular": "MARIA SANTOS",
      "prestador": "HOSPITAL ABC",
      "especialidade": "CLINICA MEDICA",
      "qtde": 1,
      "valor": 150.00,
      "valorTotal": 150.00,
      "setorAtendimento": "AMBULATORIO",
      "seContinuidade": "N",
      "dtContratacao": "01/01/2020",
      "dtContrato": "01/01/2020",
      "diasAdesao": 1800,
      "cidDoenca": "J06.9 - INFECCAO AGUDA",
      "subEstipulante": null,
      "formaChegada": "DEMANDA ESPONTANEA",
      "vlProcedimentoCoparticipacao": 15.00
    }
  ]
}
```

**Response Sucesso (200)**:
```json
{
  "success": true,
  "message": "500 registros inseridos com sucesso",
  "insertedCount": 500,
  "failedCount": 0
}
```

**Response Parcial (207)**:
```json
{
  "success": false,
  "message": "Inserção parcial: 450 inseridos, 50 falharam",
  "insertedCount": 450,
  "failedCount": 50,
  "errors": [
    { "index": 10, "error": "ORA-01400: cannot insert NULL into (SAMEL.SINISTRALIDADE_IMPORT.CAMPO)" }
  ]
}
```

### GET /api/sinistralidade/import/count
Conta registros na tabela.

**Response**:
```json
{
  "count": 1500,
  "message": "1500 registros na tabela SAMEL.SINISTRALIDADE_IMPORT"
}
```

### DELETE /api/sinistralidade/import
Limpa todos os registros da tabela (TRUNCATE).

**Response**:
```json
{
  "success": true,
  "message": "Tabela SAMEL.SINISTRALIDADE_IMPORT limpa com sucesso"
}
```

## Estrutura dos Campos (45 colunas)

| Campo (camelCase) | Tipo | Max Length | Descrição |
|---|---|---|---|
| data | string (date) | - | Data do atendimento (DD/MM/YYYY) |
| hora | string | 8 | Hora do atendimento (HH:MM:SS) |
| dataAlta | string (date) | - | Data da alta |
| tipoInternacao | string | 50 | Tipo de internação |
| caraterAtendimento | string | 50 | Caráter do atendimento |
| tipoConta | string | 50 | Tipo de conta |
| atendimento | number | - | Número do atendimento |
| autorizacaoOriginal | number | - | Número da autorização |
| tipoValidacaoClinicaExterna | string | 50 | Tipo de validação clínica |
| dataValidacaoClinicaExterna | string (date) | - | Data da validação |
| dtProcedimento | string (date) | - | Data do procedimento |
| codTuss | number | - | Código TUSS |
| ieOrigemProced | number | - | Origem do procedimento |
| eventoTuss | string | 20 | Evento TUSS |
| nrSeqProcInterno | number | - | Sequência do procedimento |
| nmProced | string | 255 | Nome do procedimento |
| tipoServico | string | 100 | Tipo de serviço |
| grupoReceita | string | 100 | Grupo de receita |
| tipoConsulta | string | 50 | Tipo de consulta |
| apolice | number | - | Número da apólice/contrato |
| contratante | string | 150 | Nome do contratante |
| plano | string | 100 | Nome do plano |
| codBeneficiario | string | 50 | Código do beneficiário |
| nomePacientePrestador | string | 255 | Nome do paciente prestador |
| beneficiario | string | 255 | Nome do beneficiário |
| sexo | string | 20 | Sexo (M/F) |
| dataNascimento | string (date) | - | Data de nascimento |
| faixaEtaria | string | 20 | Faixa etária |
| matCliente | number | - | Matrícula do cliente |
| tipoDependente | string | 50 | Tipo (TITULAR/DEPENDENTE) |
| titular | string | 255 | Nome do titular |
| prestador | string | 255 | Nome do prestador |
| especialidade | string | 100 | Especialidade médica |
| qtde | number | - | Quantidade |
| valor | number | - | Valor unitário |
| valorTotal | number | - | Valor total |
| setorAtendimento | string | 100 | Setor de atendimento |
| seContinuidade | string | 20 | É continuidade (S/N) |
| dtContratacao | string (date) | - | Data de contratação |
| dtContrato | string (date) | - | Data do contrato |
| diasAdesao | number | - | Dias de adesão |
| cidDoenca | string | 255 | CID da doença |
| subEstipulante | string | 150 | Sub-estipulante |
| formaChegada | string | 100 | Forma de chegada |
| vlProcedimentoCoparticipacao | number | - | Valor de coparticipação |

## Implementação Frontend (React + TypeScript)

### 1. Tipo TypeScript
```typescript
interface SinistralityImport {
  data?: string | null;
  hora?: string | null;
  dataAlta?: string | null;
  tipoInternacao?: string | null;
  caraterAtendimento?: string | null;
  tipoConta?: string | null;
  atendimento?: number | null;
  autorizacaoOriginal?: number | null;
  tipoValidacaoClinicaExterna?: string | null;
  dataValidacaoClinicaExterna?: string | null;
  dtProcedimento?: string | null;
  codTuss?: number | null;
  ieOrigemProced?: number | null;
  eventoTuss?: string | null;
  nrSeqProcInterno?: number | null;
  nmProced?: string | null;
  tipoServico?: string | null;
  grupoReceita?: string | null;
  tipoConsulta?: string | null;
  apolice?: number | null;
  contratante?: string | null;
  plano?: string | null;
  codBeneficiario?: string | null;
  nomePacientePrestador?: string | null;
  beneficiario?: string | null;
  sexo?: string | null;
  dataNascimento?: string | null;
  faixaEtaria?: string | null;
  matCliente?: number | null;
  tipoDependente?: string | null;
  titular?: string | null;
  prestador?: string | null;
  especialidade?: string | null;
  qtde?: number | null;
  valor?: number | null;
  valorTotal?: number | null;
  setorAtendimento?: string | null;
  seContinuidade?: string | null;
  dtContratacao?: string | null;
  dtContrato?: string | null;
  diasAdesao?: number | null;
  cidDoenca?: string | null;
  subEstipulante?: string | null;
  formaChegada?: string | null;
  vlProcedimentoCoparticipacao?: number | null;
}
```

### 2. Mapeamento de Colunas Excel -> API
```typescript
const COLUMN_MAPPING: Record<string, string> = {
  // Colunas em MAIÚSCULAS (como vêm do Excel/detalhamento)
  'DATA': 'data',
  'HORA': 'hora',
  'DATAALTA': 'dataAlta',
  'TIPO_INTERNACAO': 'tipoInternacao',
  'CARATER_ATENDIMENTO': 'caraterAtendimento',
  'TIPO_CONTA': 'tipoConta',
  'ATENDIMENTO': 'atendimento',
  'AUTORIZACAO_ORIGINAL': 'autorizacaoOriginal',
  'TIPO_VALIDACAO_CLINICA_EXTERNA': 'tipoValidacaoClinicaExterna',
  'DATA_VALIDACAO_CLINICA_EXTERNA': 'dataValidacaoClinicaExterna',
  'DT_PROCEDIMENTO': 'dtProcedimento',
  'COD_TUSS': 'codTuss',
  'IE_ORIGEM_PROCED': 'ieOrigemProced',
  'EVENTO_TUSS': 'eventoTuss',
  'NR_SEQ_PROC_INTERNO': 'nrSeqProcInterno',
  'NM_PROCED': 'nmProced',
  'TIPOSERVICO': 'tipoServico',
  'GRUPORECEITA': 'grupoReceita',
  'TIPOCONSULTA': 'tipoConsulta',
  'APOLICE': 'apolice',
  'CONTRATANTE': 'contratante',
  'PLANO': 'plano',
  'COD_BENEFICIARIO': 'codBeneficiario',
  'NOME_PACIENTE_PRESTADOR': 'nomePacientePrestador',
  'BENEFICIARIO': 'beneficiario',
  'SEXO': 'sexo',
  'DATANASCIMENTO': 'dataNascimento',
  'FAIXA_ETARIA': 'faixaEtaria',
  'MAT_CLIENTE': 'matCliente',
  'TIPODEPENDENTE': 'tipoDependente',
  'TITULAR': 'titular',
  'PRESTADOR': 'prestador',
  'ESPECIALIDADE': 'especialidade',
  'QTDE': 'qtde',
  'VALOR': 'valor',
  'VALORTOTAL': 'valorTotal',
  'SETOR_ATENDIMENTO': 'setorAtendimento',
  'SE_CONTINUIDADE': 'seContinuidade',
  'DT_CONTRATACAO': 'dtContratacao',
  'DT_CONTRATO': 'dtContrato',
  'DIAS_ADESAO': 'diasAdesao',
  'CID_DOENCA': 'cidDoenca',
  'SUB_ESTIPULANTE': 'subEstipulante',
  'FORMA_CHEGADA': 'formaChegada',
  'VL_PROCEDIMENTO_COPARTICIPACAO': 'vlProcedimentoCoparticipacao',
};

function mapExcelRowToApi(row: Record<string, any>): SinistralityImport {
  const mapped: SinistralityImport = {};
  
  for (const [excelKey, apiKey] of Object.entries(COLUMN_MAPPING)) {
    const value = row[excelKey] ?? row[excelKey.toLowerCase()] ?? row[apiKey];
    if (value !== undefined && value !== '') {
      (mapped as any)[apiKey] = value;
    }
  }
  
  return mapped;
}
```

### 3. Componente de Upload
```tsx
import { useState } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';

const API_BASE = 'http://localhost:5000'; // ou sua URL ngrok

export function ImportSinistralidade() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [recordCount, setRecordCount] = useState(0);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const parseExcel = async (file: File): Promise<SinistralityImport[]> => {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(sheet);
    
    return jsonData.map(row => mapExcelRowToApi(row as Record<string, any>));
  };

  const handleImport = async () => {
    if (!file) {
      toast({ title: 'Erro', description: 'Selecione um arquivo', variant: 'destructive' });
      return;
    }

    setLoading(true);
    setProgress(10);

    try {
      // Parse Excel
      const registros = await parseExcel(file);
      setRecordCount(registros.length);
      setProgress(30);

      // Enviar para API em lotes de 500
      const BATCH_SIZE = 500;
      let totalInserted = 0;
      let totalFailed = 0;

      for (let i = 0; i < registros.length; i += BATCH_SIZE) {
        const batch = registros.slice(i, i + BATCH_SIZE);
        
        const response = await fetch(`${API_BASE}/api/sinistralidade/import`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ registros: batch }),
        });

        const result = await response.json();
        totalInserted += result.insertedCount || 0;
        totalFailed += result.failedCount || 0;

        setProgress(30 + Math.round((i / registros.length) * 60));
      }

      setProgress(100);
      
      if (totalFailed === 0) {
        toast({
          title: 'Sucesso!',
          description: `${totalInserted} registros importados com sucesso`,
        });
      } else {
        toast({
          title: 'Importação parcial',
          description: `${totalInserted} inseridos, ${totalFailed} falharam`,
          variant: 'warning',
        });
      }
    } catch (error) {
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClearTable = async () => {
    if (!confirm('Tem certeza que deseja limpar todos os registros?')) return;

    try {
      const response = await fetch(`${API_BASE}/api/sinistralidade/import`, {
        method: 'DELETE',
      });
      const result = await response.json();
      toast({ title: 'Sucesso', description: result.message });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao limpar tabela',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Importar Sinistralidade</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileChange}
          className="block w-full"
        />
        
        {file && (
          <p className="text-sm text-muted-foreground">
            Arquivo: {file.name}
          </p>
        )}

        {loading && (
          <div className="space-y-2">
            <Progress value={progress} />
            <p className="text-sm">Processando {recordCount} registros...</p>
          </div>
        )}

        <div className="flex gap-2">
          <Button onClick={handleImport} disabled={!file || loading}>
            {loading ? 'Importando...' : 'Importar'}
          </Button>
          <Button variant="destructive" onClick={handleClearTable}>
            Limpar Tabela
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
```

### 4. Dependência necessária
```bash
npm install xlsx
```

## Observações Importantes

1. **Formato de Datas**: A API aceita datas em DD/MM/YYYY ou YYYY-MM-DD
2. **Campos Opcionais**: Todos os 45 campos são opcionais, envie apenas os que tiver
3. **Batch Insert**: Para grandes volumes, envie em lotes de 500 registros
4. **Transação**: A API faz commit parcial - registros válidos são inseridos mesmo se alguns falharem
5. **TRUNCATE**: O DELETE limpa toda a tabela, use com cuidado
