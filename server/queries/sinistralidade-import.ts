/**
 * Queries para tabela SAMEL.SINISTRALIDADE_IMPORT
 * APIs de análise dos dados importados
 */

import { executeQuery } from '../oracle-db';

// Tipos para as respostas
export interface ResumoContratoImport {
  apolice: number;
  contratante: string | null;
  sinistroTotal: number;
  sinistroTitular: number;
  sinistrosDependentes: number;
  quantidadeBeneficiarios: number;
  quantidadeAtendimentos: number;
  breakeven: number;
}

export interface DetalhamentoImport {
  data: string | null;
  hora: string | null;
  dataAlta: string | null;
  tipoInternacao: string | null;
  caraterAtendimento: string | null;
  tipoConta: string | null;
  atendimento: number | null;
  autorizacaoOriginal: number | null;
  tipoValidacaoClinicaExterna: string | null;
  dataValidacaoClinicaExterna: string | null;
  dtProcedimento: string | null;
  codTuss: number | null;
  ieOrigemProced: number | null;
  eventoTuss: string | null;
  nrSeqProcInterno: number | null;
  nmProced: string | null;
  tipoServico: string | null;
  grupoReceita: string | null;
  tipoConsulta: string | null;
  apolice: number | null;
  contratante: string | null;
  plano: string | null;
  codBeneficiario: string | null;
  nomePacientePrestador: string | null;
  beneficiario: string | null;
  sexo: string | null;
  dataNascimento: string | null;
  faixaEtaria: string | null;
  matCliente: number | null;
  tipoDependente: string | null;
  titular: string | null;
  prestador: string | null;
  especialidade: string | null;
  qtde: number | null;
  valor: number | null;
  valorTotal: number | null;
  setorAtendimento: string | null;
  seContinuidade: string | null;
  dtContratacao: string | null;
  dtContrato: string | null;
  diasAdesao: number | null;
  cidDoenca: string | null;
  subEstipulante: string | null;
  formaChegada: string | null;
  vlProcedimentoCoparticipacao: number | null;
}

export interface BuscaPacienteImportResult extends DetalhamentoImport {}

export interface GrupoReceita {
  grupoReceita: string;
}

// Interface para parâmetros de filtro
interface FiltroResumoContratos {
  dataInicio: string;
  dataFim: string;
  contratos?: string;
  grupoReceita?: string;
}

interface FiltroDetalhamento {
  nrContrato: string | number;
  dataInicio: string;
  dataFim: string;
  grupoReceita?: string;
  limit?: number;
  offset?: number;
}

interface FiltroBuscaPaciente {
  nome: string;
  dataInicio: string;
  dataFim: string;
  grupoReceita?: string;
}

// Função para normalizar chaves do Oracle (MAIÚSCULAS) para camelCase
function normalizeKeys<T>(row: Record<string, any>): T {
  const keyMap: Record<string, string> = {
    'APOLICE': 'apolice',
    'CONTRATANTE': 'contratante',
    'SINISTRO_TOTAL': 'sinistroTotal',
    'SINISTRO_TITULAR': 'sinistroTitular',
    'SINISTROS_DEPENDENTES': 'sinistrosDependentes',
    'QUANTIDADE_BENEFICIARIOS': 'quantidadeBeneficiarios',
    'QUANTIDADE_ATENDIMENTOS': 'quantidadeAtendimentos',
    'BREAKEVEN': 'breakeven',
    'DATA': 'data',
    'HORA': 'hora',
    'DATA_ALTA': 'dataAlta',
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
    'TIPO_SERVICO': 'tipoServico',
    'GRUPO_RECEITA': 'grupoReceita',
    'TIPO_CONSULTA': 'tipoConsulta',
    'PLANO': 'plano',
    'COD_BENEFICIARIO': 'codBeneficiario',
    'NOME_PACIENTE_PRESTADOR': 'nomePacientePrestador',
    'BENEFICIARIO': 'beneficiario',
    'SEXO': 'sexo',
    'DATA_NASCIMENTO': 'dataNascimento',
    'FAIXA_ETARIA': 'faixaEtaria',
    'MAT_CLIENTE': 'matCliente',
    'TIPO_DEPENDENTE': 'tipoDependente',
    'TITULAR': 'titular',
    'PRESTADOR': 'prestador',
    'ESPECIALIDADE': 'especialidade',
    'QTDE': 'qtde',
    'VALOR': 'valor',
    'VALOR_TOTAL': 'valorTotal',
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
  
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(row)) {
    const camelKey = keyMap[key] || key.toLowerCase();
    result[camelKey] = value;
  }
  return result as T;
}

/**
 * GET /api/sinistralidade/contratos/resumo
 * Dados agregados por contrato (apólice) para dashboard
 * Inclui busca de breakeven na tabela SAMEL.sini_empresa_breakeven
 */
export async function getResumoContratosImport(filtros: FiltroResumoContratos): Promise<ResumoContratoImport[]> {
  const { dataInicio, dataFim, contratos, grupoReceita } = filtros;
  
  let sql = `
    SELECT 
      si.APOLICE,
      MAX(si.CONTRATANTE) AS CONTRATANTE,
      NVL(SUM(si.VALOR_TOTAL), 0) AS SINISTRO_TOTAL,
      NVL(SUM(CASE WHEN UPPER(si.TIPO_DEPENDENTE) = 'TITULAR' OR si.TIPO_DEPENDENTE IS NULL THEN si.VALOR_TOTAL ELSE 0 END), 0) AS SINISTRO_TITULAR,
      NVL(SUM(CASE WHEN UPPER(si.TIPO_DEPENDENTE) != 'TITULAR' AND si.TIPO_DEPENDENTE IS NOT NULL THEN si.VALOR_TOTAL ELSE 0 END), 0) AS SINISTROS_DEPENDENTES,
      COUNT(DISTINCT si.COD_BENEFICIARIO) AS QUANTIDADE_BENEFICIARIOS,
      COUNT(*) AS QUANTIDADE_ATENDIMENTOS,
      NVL(b.BREAKEVEN, 75) AS BREAKEVEN
    FROM SAMEL.SINISTRALIDADE_IMPORT si
    LEFT JOIN SAMEL.sini_empresa_breakeven b ON TO_CHAR(si.APOLICE) = b.NR_CONTRATO
    WHERE 1=1
  `;
  
  const binds: Record<string, any> = {};
  
  // Filtro de data (DATA no formato DD/MM/RR para suportar anos de 2 dígitos)
  sql += ` AND TO_DATE(si.DATA, 'DD/MM/RR') >= TO_DATE(:dataInicio, 'DD/MM/RR')`;
  sql += ` AND TO_DATE(si.DATA, 'DD/MM/RR') <= TO_DATE(:dataFim, 'DD/MM/RR')`;
  binds.dataInicio = dataInicio;
  binds.dataFim = dataFim;
  
  // Filtro de contratos (lista separada por vírgula)
  // APOLICE pode ser numérico ou string - usar TO_CHAR para comparação segura
  if (contratos) {
    const contratosList = contratos.split(',').map(c => c.trim()).filter(c => c);
    if (contratosList.length > 0) {
      const placeholders = contratosList.map((_, i) => `:contrato${i}`).join(', ');
      sql += ` AND TO_CHAR(si.APOLICE) IN (${placeholders})`;
      contratosList.forEach((c, i) => {
        binds[`contrato${i}`] = c; // Mantém como string
      });
    }
  }
  
  // Filtro de grupo de receita
  if (grupoReceita) {
    sql += ` AND si.GRUPO_RECEITA = :grupoReceita`;
    binds.grupoReceita = grupoReceita;
  }
  
  sql += ` GROUP BY si.APOLICE, b.BREAKEVEN`;
  sql += ` ORDER BY si.APOLICE`;
  
  const rows = await executeQuery<Record<string, any>>(sql, binds);
  return rows.map(row => normalizeKeys<ResumoContratoImport>(row));
}

/**
 * GET /api/sinistralidade/detalhamento
 * Retorna todos os campos da tabela sinistralidade_import filtrados
 * Suporta paginação (limit/offset opcionais)
 */
export async function getDetalhamentoImport(filtros: FiltroDetalhamento): Promise<{ data: DetalhamentoImport[]; total: number }> {
  const { nrContrato, dataInicio, dataFim, grupoReceita, limit, offset } = filtros;
  
  // Query para contar total
  let countSql = `
    SELECT COUNT(*) AS TOTAL
    FROM SAMEL.SINISTRALIDADE_IMPORT
    WHERE TO_CHAR(APOLICE) = :nrContrato
      AND TO_DATE(DATA, 'DD/MM/RR') >= TO_DATE(:dataInicio, 'DD/MM/RR')
      AND TO_DATE(DATA, 'DD/MM/RR') <= TO_DATE(:dataFim, 'DD/MM/RR')
  `;
  
  let sql = `
    SELECT 
      DATA,
      HORA,
      DATA_ALTA,
      TIPO_INTERNACAO,
      CARATER_ATENDIMENTO,
      TIPO_CONTA,
      ATENDIMENTO,
      AUTORIZACAO_ORIGINAL,
      TIPO_VALIDACAO_CLINICA_EXTERNA,
      DATA_VALIDACAO_CLINICA_EXTERNA,
      DT_PROCEDIMENTO,
      COD_TUSS,
      IE_ORIGEM_PROCED,
      EVENTO_TUSS,
      NR_SEQ_PROC_INTERNO,
      NM_PROCED,
      TIPO_SERVICO,
      GRUPO_RECEITA,
      TIPO_CONSULTA,
      APOLICE,
      CONTRATANTE,
      PLANO,
      COD_BENEFICIARIO,
      NOME_PACIENTE_PRESTADOR,
      BENEFICIARIO,
      SEXO,
      DATA_NASCIMENTO,
      FAIXA_ETARIA,
      MAT_CLIENTE,
      TIPO_DEPENDENTE,
      TITULAR,
      PRESTADOR,
      ESPECIALIDADE,
      QTDE,
      VALOR,
      VALOR_TOTAL,
      SETOR_ATENDIMENTO,
      SE_CONTINUIDADE,
      DT_CONTRATACAO,
      DT_CONTRATO,
      DIAS_ADESAO,
      CID_DOENCA,
      SUB_ESTIPULANTE,
      FORMA_CHEGADA,
      VL_PROCEDIMENTO_COPARTICIPACAO
    FROM SAMEL.SINISTRALIDADE_IMPORT
    WHERE TO_CHAR(APOLICE) = :nrContrato
      AND TO_DATE(DATA, 'DD/MM/RR') >= TO_DATE(:dataInicio, 'DD/MM/RR')
      AND TO_DATE(DATA, 'DD/MM/RR') <= TO_DATE(:dataFim, 'DD/MM/RR')
  `;
  
  const binds: Record<string, any> = {
    nrContrato: String(nrContrato),
    dataInicio,
    dataFim,
  };
  
  // Filtro de grupo de receita
  if (grupoReceita) {
    const grupoFilter = ` AND GRUPO_RECEITA = :grupoReceita`;
    sql += grupoFilter;
    countSql += grupoFilter;
    binds.grupoReceita = grupoReceita;
  }
  
  sql += ` ORDER BY DATA, HORA, BENEFICIARIO`;
  
  // Paginação (opcional)
  if (limit !== undefined) {
    sql += ` OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY`;
    binds.offset = offset || 0;
    binds.limit = limit;
  }
  
  // Executar queries em paralelo
  const [countResult, rows] = await Promise.all([
    executeQuery<{ TOTAL: number }>(countSql, binds),
    executeQuery<Record<string, any>>(sql, binds),
  ]);
  
  const total = countResult[0]?.TOTAL || 0;
  const data = rows.map(row => normalizeKeys<DetalhamentoImport>(row));
  
  return { data, total };
}

/**
 * GET /api/sinistralidade/pacientes/busca
 * Busca registros de paciente por nome (case insensitive)
 * Busca em beneficiario e nomePacientePrestador
 */
export async function buscaPacienteImport(filtros: FiltroBuscaPaciente): Promise<BuscaPacienteImportResult[]> {
  const { nome, dataInicio, dataFim, grupoReceita } = filtros;
  
  let sql = `
    SELECT 
      DATA,
      HORA,
      DATA_ALTA,
      TIPO_INTERNACAO,
      CARATER_ATENDIMENTO,
      TIPO_CONTA,
      ATENDIMENTO,
      AUTORIZACAO_ORIGINAL,
      TIPO_VALIDACAO_CLINICA_EXTERNA,
      DATA_VALIDACAO_CLINICA_EXTERNA,
      DT_PROCEDIMENTO,
      COD_TUSS,
      IE_ORIGEM_PROCED,
      EVENTO_TUSS,
      NR_SEQ_PROC_INTERNO,
      NM_PROCED,
      TIPO_SERVICO,
      GRUPO_RECEITA,
      TIPO_CONSULTA,
      APOLICE,
      CONTRATANTE,
      PLANO,
      COD_BENEFICIARIO,
      NOME_PACIENTE_PRESTADOR,
      BENEFICIARIO,
      SEXO,
      DATA_NASCIMENTO,
      FAIXA_ETARIA,
      MAT_CLIENTE,
      TIPO_DEPENDENTE,
      TITULAR,
      PRESTADOR,
      ESPECIALIDADE,
      QTDE,
      VALOR,
      VALOR_TOTAL,
      SETOR_ATENDIMENTO,
      SE_CONTINUIDADE,
      DT_CONTRATACAO,
      DT_CONTRATO,
      DIAS_ADESAO,
      CID_DOENCA,
      SUB_ESTIPULANTE,
      FORMA_CHEGADA,
      VL_PROCEDIMENTO_COPARTICIPACAO
    FROM SAMEL.SINISTRALIDADE_IMPORT
    WHERE (UPPER(BENEFICIARIO) LIKE UPPER(:nomeBusca) OR UPPER(NOME_PACIENTE_PRESTADOR) LIKE UPPER(:nomeBusca))
      AND TO_DATE(DATA, 'DD/MM/RR') >= TO_DATE(:dataInicio, 'DD/MM/RR')
      AND TO_DATE(DATA, 'DD/MM/RR') <= TO_DATE(:dataFim, 'DD/MM/RR')
  `;
  
  const binds: Record<string, any> = {
    nomeBusca: `%${nome}%`,
    dataInicio,
    dataFim,
  };
  
  // Filtro de grupo de receita
  if (grupoReceita) {
    sql += ` AND GRUPO_RECEITA = :grupoReceita`;
    binds.grupoReceita = grupoReceita;
  }
  
  sql += ` ORDER BY BENEFICIARIO, DATA, HORA`;
  sql += ` FETCH FIRST 500 ROWS ONLY`;
  
  const rows = await executeQuery<Record<string, any>>(sql, binds);
  return rows.map(row => normalizeKeys<BuscaPacienteImportResult>(row));
}

/**
 * GET /api/sinistralidade/grupos-receita
 * Lista todos os grupos de receita distintos
 */
export async function getGruposReceitaImport(): Promise<GrupoReceita[]> {
  const sql = `
    SELECT DISTINCT GRUPO_RECEITA
    FROM SAMEL.SINISTRALIDADE_IMPORT
    WHERE GRUPO_RECEITA IS NOT NULL
    ORDER BY GRUPO_RECEITA
  `;
  
  const rows = await executeQuery<{ GRUPO_RECEITA: string }>(sql);
  return rows.map(row => ({ grupoReceita: row.GRUPO_RECEITA }));
}
