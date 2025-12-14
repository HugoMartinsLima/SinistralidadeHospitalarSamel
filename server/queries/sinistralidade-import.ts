/**
 * Queries para tabela SAMEL.SINISTRALIDADE_IMPORT
 * APIs de análise dos dados importados
 * IMPORTANTE: Colunas criadas em camelCase requerem aspas duplas no Oracle
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

// Função para normalizar chaves - colunas em camelCase retornam como criadas
function normalizeKeys<T>(row: Record<string, any>): T {
  const keyMap: Record<string, string> = {
    'apolice': 'apolice',
    'contratante': 'contratante',
    'sinistroTotal': 'sinistroTotal',
    'sinistroTitular': 'sinistroTitular',
    'sinistrosDependentes': 'sinistrosDependentes',
    'quantidadeBeneficiarios': 'quantidadeBeneficiarios',
    'quantidadeAtendimentos': 'quantidadeAtendimentos',
    'breakeven': 'breakeven',
    'BREAKEVEN': 'breakeven',
    'data': 'data',
    'hora': 'hora',
    'dataAlta': 'dataAlta',
    'tipoInternacao': 'tipoInternacao',
    'caraterAtendimento': 'caraterAtendimento',
    'tipoConta': 'tipoConta',
    'atendimento': 'atendimento',
    'autorizacaoOriginal': 'autorizacaoOriginal',
    'tipoValidacaoClinicaExterna': 'tipoValidacaoClinicaExterna',
    'dataValidacaoClinicaExterna': 'dataValidacaoClinicaExterna',
    'dtProcedimento': 'dtProcedimento',
    'codTuss': 'codTuss',
    'ieOrigemProced': 'ieOrigemProced',
    'eventoTuss': 'eventoTuss',
    'nrSeqProcInterno': 'nrSeqProcInterno',
    'nmProced': 'nmProced',
    'tipoServico': 'tipoServico',
    'grupoReceita': 'grupoReceita',
    'tipoConsulta': 'tipoConsulta',
    'plano': 'plano',
    'codBeneficiario': 'codBeneficiario',
    'nomePacientePrestador': 'nomePacientePrestador',
    'beneficiario': 'beneficiario',
    'sexo': 'sexo',
    'dataNascimento': 'dataNascimento',
    'faixaEtaria': 'faixaEtaria',
    'matCliente': 'matCliente',
    'tipoDependente': 'tipoDependente',
    'titular': 'titular',
    'prestador': 'prestador',
    'especialidade': 'especialidade',
    'qtde': 'qtde',
    'valor': 'valor',
    'valorTotal': 'valorTotal',
    'setorAtendimento': 'setorAtendimento',
    'seContinuidade': 'seContinuidade',
    'dtContratacao': 'dtContratacao',
    'dtContrato': 'dtContrato',
    'diasAdesao': 'diasAdesao',
    'cidDoenca': 'cidDoenca',
    'subEstipulante': 'subEstipulante',
    'formaChegada': 'formaChegada',
    'vlProcedimentoCoparticipacao': 'vlProcedimentoCoparticipacao',
  };
  
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(row)) {
    const camelKey = keyMap[key] || key;
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
      si."apolice",
      MAX(si."contratante") AS "contratante",
      NVL(SUM(si."valorTotal"), 0) AS "sinistroTotal",
      NVL(SUM(CASE WHEN UPPER(si."tipoDependente") = 'TITULAR' OR si."tipoDependente" IS NULL THEN si."valorTotal" ELSE 0 END), 0) AS "sinistroTitular",
      NVL(SUM(CASE WHEN UPPER(si."tipoDependente") != 'TITULAR' AND si."tipoDependente" IS NOT NULL THEN si."valorTotal" ELSE 0 END), 0) AS "sinistrosDependentes",
      COUNT(DISTINCT si."codBeneficiario") AS "quantidadeBeneficiarios",
      COUNT(*) AS "quantidadeAtendimentos",
      NVL(b.BREAKEVEN, 75) AS BREAKEVEN
    FROM SAMEL.SINISTRALIDADE_IMPORT si
    LEFT JOIN SAMEL.sini_empresa_breakeven b ON TO_CHAR(si."apolice") = b.NR_CONTRATO
    WHERE 1=1
  `;
  
  const binds: Record<string, any> = {};
  
  // Filtro de data (data no formato DD/MM/RR para suportar anos de 2 dígitos)
  sql += ` AND TO_DATE(si."data", 'DD/MM/RR') >= TO_DATE(:dataInicio, 'DD/MM/RR')`;
  sql += ` AND TO_DATE(si."data", 'DD/MM/RR') <= TO_DATE(:dataFim, 'DD/MM/RR')`;
  binds.dataInicio = dataInicio;
  binds.dataFim = dataFim;
  
  // Filtro de contratos (lista separada por vírgula)
  if (contratos) {
    const contratosList = contratos.split(',').map(c => c.trim()).filter(c => c);
    if (contratosList.length > 0) {
      const placeholders = contratosList.map((_, i) => `:contrato${i}`).join(', ');
      sql += ` AND TO_CHAR(si."apolice") IN (${placeholders})`;
      contratosList.forEach((c, i) => {
        binds[`contrato${i}`] = c;
      });
    }
  }
  
  // Filtro de grupo de receita
  if (grupoReceita) {
    sql += ` AND si."grupoReceita" = :grupoReceita`;
    binds.grupoReceita = grupoReceita;
  }
  
  sql += ` GROUP BY si."apolice", b.BREAKEVEN`;
  sql += ` ORDER BY si."apolice"`;
  
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
    WHERE TO_CHAR("apolice") = :nrContrato
      AND TO_DATE("data", 'DD/MM/RR') >= TO_DATE(:dataInicio, 'DD/MM/RR')
      AND TO_DATE("data", 'DD/MM/RR') <= TO_DATE(:dataFim, 'DD/MM/RR')
  `;
  
  let sql = `
    SELECT 
      "data",
      "hora",
      "dataAlta",
      "tipoInternacao",
      "caraterAtendimento",
      "tipoConta",
      "atendimento",
      "autorizacaoOriginal",
      "tipoValidacaoClinicaExterna",
      "dataValidacaoClinicaExterna",
      "dtProcedimento",
      "codTuss",
      "ieOrigemProced",
      "eventoTuss",
      "nrSeqProcInterno",
      "nmProced",
      "tipoServico",
      "grupoReceita",
      "tipoConsulta",
      "apolice",
      "contratante",
      "plano",
      "codBeneficiario",
      "nomePacientePrestador",
      "beneficiario",
      "sexo",
      "dataNascimento",
      "faixaEtaria",
      "matCliente",
      "tipoDependente",
      "titular",
      "prestador",
      "especialidade",
      "qtde",
      "valor",
      "valorTotal",
      "setorAtendimento",
      "seContinuidade",
      "dtContratacao",
      "dtContrato",
      "diasAdesao",
      "cidDoenca",
      "subEstipulante",
      "formaChegada",
      "vlProcedimentoCoparticipacao"
    FROM SAMEL.SINISTRALIDADE_IMPORT
    WHERE TO_CHAR("apolice") = :nrContrato
      AND TO_DATE("data", 'DD/MM/RR') >= TO_DATE(:dataInicio, 'DD/MM/RR')
      AND TO_DATE("data", 'DD/MM/RR') <= TO_DATE(:dataFim, 'DD/MM/RR')
  `;
  
  const binds: Record<string, any> = {
    nrContrato: String(nrContrato),
    dataInicio,
    dataFim,
  };
  
  // Filtro de grupo de receita
  if (grupoReceita) {
    const grupoFilter = ` AND "grupoReceita" = :grupoReceita`;
    sql += grupoFilter;
    countSql += grupoFilter;
    binds.grupoReceita = grupoReceita;
  }
  
  sql += ` ORDER BY "data", "hora", "beneficiario"`;
  
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
      "data",
      "hora",
      "dataAlta",
      "tipoInternacao",
      "caraterAtendimento",
      "tipoConta",
      "atendimento",
      "autorizacaoOriginal",
      "tipoValidacaoClinicaExterna",
      "dataValidacaoClinicaExterna",
      "dtProcedimento",
      "codTuss",
      "ieOrigemProced",
      "eventoTuss",
      "nrSeqProcInterno",
      "nmProced",
      "tipoServico",
      "grupoReceita",
      "tipoConsulta",
      "apolice",
      "contratante",
      "plano",
      "codBeneficiario",
      "nomePacientePrestador",
      "beneficiario",
      "sexo",
      "dataNascimento",
      "faixaEtaria",
      "matCliente",
      "tipoDependente",
      "titular",
      "prestador",
      "especialidade",
      "qtde",
      "valor",
      "valorTotal",
      "setorAtendimento",
      "seContinuidade",
      "dtContratacao",
      "dtContrato",
      "diasAdesao",
      "cidDoenca",
      "subEstipulante",
      "formaChegada",
      "vlProcedimentoCoparticipacao"
    FROM SAMEL.SINISTRALIDADE_IMPORT
    WHERE (UPPER("beneficiario") LIKE UPPER(:nomeBusca) OR UPPER("nomePacientePrestador") LIKE UPPER(:nomeBusca))
      AND TO_DATE("data", 'DD/MM/RR') >= TO_DATE(:dataInicio, 'DD/MM/RR')
      AND TO_DATE("data", 'DD/MM/RR') <= TO_DATE(:dataFim, 'DD/MM/RR')
  `;
  
  const binds: Record<string, any> = {
    nomeBusca: `%${nome}%`,
    dataInicio,
    dataFim,
  };
  
  // Filtro de grupo de receita
  if (grupoReceita) {
    sql += ` AND "grupoReceita" = :grupoReceita`;
    binds.grupoReceita = grupoReceita;
  }
  
  sql += ` ORDER BY "beneficiario", "data", "hora"`;
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
    SELECT DISTINCT "grupoReceita"
    FROM SAMEL.SINISTRALIDADE_IMPORT
    WHERE "grupoReceita" IS NOT NULL
    ORDER BY "grupoReceita"
  `;
  
  const rows = await executeQuery<{ grupoReceita: string }>(sql);
  return rows.map(row => ({ grupoReceita: row.grupoReceita }));
}
