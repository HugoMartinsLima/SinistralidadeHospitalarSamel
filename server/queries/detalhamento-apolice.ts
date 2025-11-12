import { readFileSync } from 'fs';
import { join } from 'path';
import { executeQuery } from '../oracle-db';

// Cache do SQL (carregado uma vez na inicialização)
let sqlDetalhamento: string | null = null;

/**
 * Interface para os parâmetros do detalhamento de apólice
 */
export interface DetalhamentoApoliceParams {
  nrContrato: number;
  dataInicio: string; // Formato: DD/MM/YYYY
  dataFim: string;    // Formato: DD/MM/YYYY
  grupoReceita?: string;
  limit?: number;
  offset?: number;
}

/**
 * Interface para o resultado do detalhamento
 */
export interface DetalhamentoApoliceResult {
  data: string;
  hora: string;
  dataalta?: string;
  tipo_internacao?: string;
  carater_atendimento?: string;
  tipo_conta?: string;
  atendimento?: string;
  autorizacao_original?: string;
  tipo_validacao_clinica_externa?: string;
  data_validacao_clinica_externa?: string;
  dt_procedimento?: string;
  cod_tuss?: string;
  ie_origem_proced?: string;
  evento_tuss?: string;
  nr_seq_proc_interno?: number;
  nm_proced?: string;
  tiposervico?: string;
  gruporeceita?: string;
  tipoconsulta?: string;
  apolice?: number;
  contratante?: string;
  plano?: string;
  cod_beneficiario?: string;
  nome_paciente_prestador?: string;
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

/**
 * Carrega o SQL do arquivo (executado uma vez)
 */
function loadSQL(): string {
  if (!sqlDetalhamento) {
    const sqlPath = join(__dirname, '../sql/detalhamento-apolice-completo.sql');
    sqlDetalhamento = readFileSync(sqlPath, 'utf-8');
    
    // Substituir valores fixos por bind variables
    sqlDetalhamento = sqlDetalhamento
      .replace(/TO_DATE\('01\/10\/2025'/g, "TO_DATE(:dataInicio")
      .replace(/TO_DATE\('31\/10\/2025'/g, "TO_DATE(:dataFim")
      .replace(/contrato\.nr_contrato in\s*\(\s*2444\s*\)/gi, "contrato.nr_contrato = :nrContrato");
    
    console.log('✅ SQL de detalhamento de apólice carregado e parametrizado');
  }
  
  return sqlDetalhamento;
}

/**
 * Busca o detalhamento de uma apólice
 */
export async function getDetalhamentoApolice(
  params: DetalhamentoApoliceParams
): Promise<DetalhamentoApoliceResult[]> {
  const sql = loadSQL();
  
  // Construir bind variables
  const binds: any = {
    dataInicio: params.dataInicio,
    dataFim: params.dataFim,
    nrContrato: params.nrContrato,
  };

  // Executar query
  const resultados = await executeQuery<DetalhamentoApoliceResult>(sql, binds);
  
  // Filtrar por grupo de receita se fornecido
  let filtered = resultados;
  if (params.grupoReceita && params.grupoReceita.toUpperCase() !== 'TODAS') {
    filtered = resultados.filter(
      r => r.gruporeceita?.toUpperCase() === params.grupoReceita?.toUpperCase()
    );
  }

  // Aplicar paginação se fornecida
  if (params.limit !== undefined && params.offset !== undefined) {
    const start = params.offset;
    const end = start + params.limit;
    filtered = filtered.slice(start, end);
  }

  return filtered;
}
