/**
 * Queries para tabela SAMEL.SINISTRALIDADE_IMPORT
 * APIs de análise dos dados importados
 * COLUNAS: Nomes exatos conforme tabela Oracle
 * FILTRO DE DATA: Usa DT_PROCEDIMENTO para filtrar por período
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
  vlMensalidade: number;
  vlPremioContinuidade: number;
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

// Função para normalizar chaves do Oracle para camelCase
// Nomes das colunas conforme tabela real
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
    'VL_MENSALIDADE': 'vlMensalidade',
    'VL_PREMIO_CONTINUIDADE': 'vlPremioContinuidade',
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
 * FILTRO: Usa DT_PROCEDIMENTO para filtrar por período
 */
export async function getResumoContratosImport(filtros: FiltroResumoContratos): Promise<ResumoContratoImport[]> {
  const { dataInicio, dataFim, contratos, grupoReceita } = filtros;
  
  let sql = `
    SELECT 
      si.APOLICE,
      MAX(si.CONTRATANTE) AS CONTRATANTE,
      NVL(SUM(si.VALORTOTAL), 0) AS SINISTRO_TOTAL,
      NVL(SUM(CASE WHEN UPPER(si.TIPODEPENDENTE) = 'TITULAR' OR si.TIPODEPENDENTE IS NULL THEN si.VALORTOTAL ELSE 0 END), 0) AS SINISTRO_TITULAR,
      NVL(SUM(CASE WHEN UPPER(si.TIPODEPENDENTE) != 'TITULAR' AND si.TIPODEPENDENTE IS NOT NULL THEN si.VALORTOTAL ELSE 0 END), 0) AS SINISTROS_DEPENDENTES,
      COUNT(DISTINCT si.COD_BENEFICIARIO) AS QUANTIDADE_BENEFICIARIOS,
      COUNT(*) AS QUANTIDADE_ATENDIMENTOS,
      NVL(b.BREAKEVEN, 75) AS BREAKEVEN,
      NVL(p.VL_MENSALIDADE, 0) AS VL_MENSALIDADE,
      NVL(p.VL_PREMIO_CONTINUIDADE, 0) AS VL_PREMIO_CONTINUIDADE
    FROM SAMEL.SINISTRALIDADE_IMPORT si
    LEFT JOIN SAMEL.sini_empresa_breakeven b ON TO_CHAR(si.APOLICE) = b.NR_CONTRATO
    LEFT JOIN (
      SELECT 
        nr_contrato,
        SUM(vl_mensalidade) AS VL_MENSALIDADE,
        SUM(vl_premio_continuidade) AS VL_PREMIO_CONTINUIDADE
      FROM weknow_b.wk_sinistralidade
      WHERE dt_mes_ref BETWEEN TO_DATE(:dataInicioP, 'DD/MM/YYYY') AND TO_DATE(:dataFimP, 'DD/MM/YYYY')
      GROUP BY nr_contrato
    ) p ON si.APOLICE = p.nr_contrato
    WHERE 1=1
  `;
  
  const binds: Record<string, any> = {
    dataInicioP: dataInicio,
    dataFimP: dataFim,
  };
  
  // Filtro de data usando DT_PROCEDIMENTO
  sql += ` AND si.DT_PROCEDIMENTO >= TO_DATE(:dataInicio, 'DD/MM/YYYY')`;
  sql += ` AND si.DT_PROCEDIMENTO <= TO_DATE(:dataFim, 'DD/MM/YYYY')`;
  binds.dataInicio = dataInicio;
  binds.dataFim = dataFim;
  
  // Filtro de contratos (lista separada por vírgula)
  if (contratos) {
    const contratosList = contratos.split(',').map(c => c.trim()).filter(c => c);
    if (contratosList.length > 0) {
      const placeholders = contratosList.map((_, i) => `:contrato${i}`).join(', ');
      sql += ` AND TO_CHAR(si.APOLICE) IN (${placeholders})`;
      contratosList.forEach((c, i) => {
        binds[`contrato${i}`] = c;
      });
    }
  }
  
  // Filtro de grupo de receita
  if (grupoReceita) {
    sql += ` AND si.GRUPORECEITA = :grupoReceita`;
    binds.grupoReceita = grupoReceita;
  }
  
  sql += ` GROUP BY si.APOLICE, b.BREAKEVEN, p.VL_MENSALIDADE, p.VL_PREMIO_CONTINUIDADE`;
  sql += ` ORDER BY si.APOLICE`;
  
  const rows = await executeQuery<Record<string, any>>(sql, binds);
  return rows.map(row => normalizeKeys<ResumoContratoImport>(row));
}

/**
 * GET /api/sinistralidade/detalhamento
 * Retorna todos os campos da tabela sinistralidade_import filtrados
 * Suporta paginação (limit/offset opcionais)
 * FILTRO: Usa DT_PROCEDIMENTO para filtrar por período
 */
export async function getDetalhamentoImport(filtros: FiltroDetalhamento): Promise<{ data: DetalhamentoImport[]; total: number }> {
  const { nrContrato, dataInicio, dataFim, grupoReceita, limit, offset } = filtros;
  
  // Query para contar total
  let countSql = `
    SELECT COUNT(*) AS TOTAL
    FROM SAMEL.SINISTRALIDADE_IMPORT
    WHERE TO_CHAR(APOLICE) = :nrContrato
      AND DT_PROCEDIMENTO >= TO_DATE(:dataInicio, 'DD/MM/YYYY')
      AND DT_PROCEDIMENTO <= TO_DATE(:dataFim, 'DD/MM/YYYY')
  `;
  
  let sql = `
    SELECT 
      DATA,
      HORA,
      DATAALTA,
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
      TIPOSERVICO,
      GRUPORECEITA,
      TIPOCONSULTA,
      APOLICE,
      CONTRATANTE,
      PLANO,
      COD_BENEFICIARIO,
      NOME_PACIENTE_PRESTADOR,
      BENEFICIARIO,
      SEXO,
      DATANASCIMENTO,
      FAIXA_ETARIA,
      MAT_CLIENTE,
      TIPODEPENDENTE,
      TITULAR,
      PRESTADOR,
      ESPECIALIDADE,
      QTDE,
      VALOR,
      VALORTOTAL,
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
      AND DT_PROCEDIMENTO >= TO_DATE(:dataInicio, 'DD/MM/YYYY')
      AND DT_PROCEDIMENTO <= TO_DATE(:dataFim, 'DD/MM/YYYY')
  `;
  
  const binds: Record<string, any> = {
    nrContrato: String(nrContrato),
    dataInicio,
    dataFim,
  };
  
  // Filtro de grupo de receita
  if (grupoReceita) {
    const grupoFilter = ` AND GRUPORECEITA = :grupoReceita`;
    sql += grupoFilter;
    countSql += grupoFilter;
    binds.grupoReceita = grupoReceita;
  }
  
  sql += ` ORDER BY DT_PROCEDIMENTO, HORA, BENEFICIARIO`;
  
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
 * Busca em BENEFICIARIO e NOME_PACIENTE_PRESTADOR
 * FILTRO: Usa DT_PROCEDIMENTO para filtrar por período
 */
export async function buscaPacienteImport(filtros: FiltroBuscaPaciente): Promise<BuscaPacienteImportResult[]> {
  const { nome, dataInicio, dataFim, grupoReceita } = filtros;
  
  let sql = `
    SELECT 
      DATA,
      HORA,
      DATAALTA,
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
      TIPOSERVICO,
      GRUPORECEITA,
      TIPOCONSULTA,
      APOLICE,
      CONTRATANTE,
      PLANO,
      COD_BENEFICIARIO,
      NOME_PACIENTE_PRESTADOR,
      BENEFICIARIO,
      SEXO,
      DATANASCIMENTO,
      FAIXA_ETARIA,
      MAT_CLIENTE,
      TIPODEPENDENTE,
      TITULAR,
      PRESTADOR,
      ESPECIALIDADE,
      QTDE,
      VALOR,
      VALORTOTAL,
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
      AND DT_PROCEDIMENTO >= TO_DATE(:dataInicio, 'DD/MM/YYYY')
      AND DT_PROCEDIMENTO <= TO_DATE(:dataFim, 'DD/MM/YYYY')
  `;
  
  const binds: Record<string, any> = {
    nomeBusca: `%${nome}%`,
    dataInicio,
    dataFim,
  };
  
  // Filtro de grupo de receita
  if (grupoReceita) {
    sql += ` AND GRUPORECEITA = :grupoReceita`;
    binds.grupoReceita = grupoReceita;
  }
  
  sql += ` ORDER BY BENEFICIARIO, DT_PROCEDIMENTO, HORA`;
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
    SELECT DISTINCT GRUPORECEITA
    FROM SAMEL.SINISTRALIDADE_IMPORT
    WHERE GRUPORECEITA IS NOT NULL
    ORDER BY GRUPORECEITA
  `;
  
  const rows = await executeQuery<{ GRUPORECEITA: string }>(sql);
  return rows.map(row => ({ grupoReceita: row.GRUPORECEITA }));
}

// Interface para o ranking de grupos de receita
export interface GrupoReceitaRanking {
  gruporeceita: string;
  totalProcedimentos: number;
  valorTotal: number;
  ticketMedio: number;
}

export interface GrupoReceitaRankingTotais {
  totalGeral: number;
  totalProcedimentos: number;
  ticketMedioGeral: number;
}

export interface GrupoReceitaRankingResponse {
  data: GrupoReceitaRanking[];
  totais: GrupoReceitaRankingTotais;
  pagination: {
    limit: number;
    total: number;
  };
}

interface FiltroGrupoReceitaRanking {
  dataInicio: string;
  dataFim: string;
  limit?: number;
}

/**
 * GET /api/sinistralidade/grupos-receita/ranking
 * Retorna os grupos de receita mais caros (ranking por valorTotal)
 * Ordenado por valor total decrescente
 * FILTRO: Usa DT_PROCEDIMENTO para filtrar por período
 */
export async function getGruposReceitaRanking(filtros: FiltroGrupoReceitaRanking): Promise<GrupoReceitaRankingResponse> {
  const { dataInicio, dataFim, limit = 10 } = filtros;
  
  // Validar e sanitizar limit (deve ser inteiro positivo entre 1 e 100)
  const safeLimit = Math.max(1, Math.min(100, Math.floor(Number(limit) || 10)));
  
  const binds: Record<string, any> = {
    dataInicio,
    dataFim,
  };
  
  // Query para top N grupos - limit inline (sanitizado) pois Oracle não aceita bind em FETCH FIRST
  // ticketMedio = valorTotal / totalProcedimentos (não usar AVG que divide diferente)
  const sqlRanking = `
    SELECT 
      GRUPORECEITA,
      COUNT(*) AS TOTAL_PROCEDIMENTOS,
      NVL(SUM(VALORTOTAL), 0) AS VALOR_TOTAL,
      ROUND(NVL(SUM(VALORTOTAL), 0) / NULLIF(COUNT(*), 0), 2) AS TICKET_MEDIO
    FROM SAMEL.SINISTRALIDADE_IMPORT
    WHERE DT_PROCEDIMENTO >= TO_DATE(:dataInicio, 'DD/MM/YYYY')
      AND DT_PROCEDIMENTO <= TO_DATE(:dataFim, 'DD/MM/YYYY')
      AND GRUPORECEITA IS NOT NULL
    GROUP BY GRUPORECEITA
    ORDER BY VALOR_TOTAL DESC
    FETCH FIRST ${safeLimit} ROWS ONLY
  `;
  
  // Query para totais gerais (considera TODOS os registros, não apenas o limit)
  // ticketMedioGeral = totalGeral / totalProcedimentos
  const sqlTotais = `
    SELECT 
      NVL(SUM(VALORTOTAL), 0) AS TOTAL_GERAL,
      COUNT(*) AS TOTAL_PROCEDIMENTOS,
      ROUND(NVL(SUM(VALORTOTAL), 0) / NULLIF(COUNT(*), 0), 2) AS TICKET_MEDIO_GERAL,
      COUNT(DISTINCT GRUPORECEITA) AS TOTAL_GRUPOS
    FROM SAMEL.SINISTRALIDADE_IMPORT
    WHERE DT_PROCEDIMENTO >= TO_DATE(:dataInicio, 'DD/MM/YYYY')
      AND DT_PROCEDIMENTO <= TO_DATE(:dataFim, 'DD/MM/YYYY')
      AND GRUPORECEITA IS NOT NULL
  `;
  
  // Executar queries em paralelo
  const [rankingRows, totaisRows] = await Promise.all([
    executeQuery<Record<string, any>>(sqlRanking, binds),
    executeQuery<Record<string, any>>(sqlTotais, binds),
  ]);
  
  // Mapear resultados do ranking
  const data: GrupoReceitaRanking[] = rankingRows.map(row => ({
    gruporeceita: row.GRUPORECEITA,
    totalProcedimentos: Number(row.TOTAL_PROCEDIMENTOS) || 0,
    valorTotal: Number(row.VALOR_TOTAL) || 0,
    ticketMedio: Number(row.TICKET_MEDIO) || 0,
  }));
  
  // Mapear totais
  const totaisRow = totaisRows[0] || {};
  const totais: GrupoReceitaRankingTotais = {
    totalGeral: Number(totaisRow.TOTAL_GERAL) || 0,
    totalProcedimentos: Number(totaisRow.TOTAL_PROCEDIMENTOS) || 0,
    ticketMedioGeral: Number(totaisRow.TICKET_MEDIO_GERAL) || 0,
  };
  
  return {
    data,
    totais,
    pagination: {
      limit: safeLimit,
      total: Number(totaisRow.TOTAL_GRUPOS) || 0,
    },
  };
}
