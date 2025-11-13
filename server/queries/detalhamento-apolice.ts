import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { executeQuery } from '../oracle-db';

// Obter __dirname em ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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
 * Aceita todas as colunas retornadas pelo SQL do Oracle
 */
export interface DetalhamentoApoliceResult {
  // Permite qualquer coluna retornada pelo SQL
  [key: string]: any;
  
  // Principais campos documentados (não limita a outros campos)
  data?: string;
  hora?: string;
  dataalta?: string;
  tipo_internacao?: string;
  carater_atendimento?: string;
  tipo_conta?: string;
  atendimento?: string;
  nm_proced?: string;
  tiposervico?: string;
  gruporeceita?: string;
  beneficiario?: string;
  prestador?: string;
  especialidade?: string;
  valor?: number;
  valortotal?: number;
  cid_doenca?: string;
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
      .replace(/contrato\.nr_contrato in\s*\(\s*2444\s*\)/gi, "contrato.nr_contrato IN (:nrContrato)");
    
    console.log('✅ SQL de detalhamento de apólice carregado e parametrizado');
    console.log('🔍 Primeiras 500 caracteres do SQL parametrizado:');
    console.log(sqlDetalhamento.substring(0, 500));
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
  
  console.log('='.repeat(80));
  console.log('🔍 DEBUG DETALHAMENTO DE APÓLICE');
  console.log('='.repeat(80));
  console.log('1. Total retornado do Oracle:', resultados.length);
  
  // Gerar fingerprints únicos para cada registro (para comparação)
  const fingerprints = resultados.map((r, idx) => ({
    index: idx,
    atendimento: r.atendimento,
    data: r.data,
    cod_tuss: r.cod_tuss,
    nm_proced: r.nm_proced?.substring(0, 30),
    beneficiario: r.beneficiario?.substring(0, 20),
    fingerprint: `${r.atendimento}|${r.data}|${r.cod_tuss}|${r.nm_proced}`
  }));
  
  console.log('🔍 Primeiros 5 registros (fingerprints):');
  fingerprints.slice(0, 5).forEach(f => console.log(`  - ${f.fingerprint}`));
  console.log('🔍 Últimos 5 registros (fingerprints):');
  fingerprints.slice(-5).forEach(f => console.log(`  - ${f.fingerprint}`));
  console.log('2. Parâmetros recebidos:', { 
    limit: params.limit, 
    offset: params.offset, 
    grupoReceita: params.grupoReceita,
    apolice: params.nrContrato,
    dataInicio: params.dataInicio,
    dataFim: params.dataFim
  });
  
  // Filtrar por grupo de receita se fornecido
  let filtered = resultados;
  if (params.grupoReceita && params.grupoReceita.toUpperCase() !== 'TODAS') {
    const beforeFilter = filtered.length;
    filtered = resultados.filter(
      r => r.gruporeceita?.toUpperCase() === params.grupoReceita?.toUpperCase()
    );
    console.log(`3. Total após filtro de grupoReceita (${params.grupoReceita}):`, filtered.length);
    console.log(`   → Removidos pelo filtro:`, beforeFilter - filtered.length);
  } else {
    console.log('3. Total após filtro de grupoReceita: (SEM FILTRO)', filtered.length);
  }

  // Aplicar paginação (sempre que limit for fornecido)
  let beforePagination = filtered.length;
  if (params.limit !== undefined) {
    const start = params.offset || 0;
    const end = start + params.limit;
    filtered = filtered.slice(start, end);
    console.log(`4. Total após slice/paginação (${start} a ${end}):`, filtered.length);
    console.log(`   → Intervalo solicitado: offset=${start}, limit=${params.limit}`);
  } else {
    console.log('4. Total após slice/paginação: (SEM PAGINAÇÃO)', filtered.length);
  }

  console.log('5. Total enviado no resultado final:', filtered.length);
  console.log('='.repeat(80));
  console.log('⚠️  RESUMO DA DISCREPÂNCIA:');
  console.log(`   Oracle retornou: ${resultados.length} registros`);
  console.log(`   API vai retornar: ${filtered.length} registros`);
  console.log(`   Diferença: ${resultados.length - filtered.length} registros`);
  console.log('='.repeat(80));
  
  return filtered;
}

/**
 * Busca o detalhamento de uma apólice SEM DISTINCT (versão debug)
 * Retorna TODOS os registros incluindo possíveis duplicatas
 */
export async function getDetalhamentoApoliceNoDistinct(
  params: DetalhamentoApoliceParams
): Promise<DetalhamentoApoliceResult[]> {
  // Carregar SQL sem DISTINCT
  const sqlPath = join(__dirname, '../sql/detalhamento-apolice-completo-no-distinct.sql');
  let sql = readFileSync(sqlPath, 'utf-8');
  
  // Substituir valores fixos por bind variables
  sql = sql
    .replace(/TO_DATE\('01\/10\/2025'/g, "TO_DATE(:dataInicio")
    .replace(/TO_DATE\('31\/10\/2025'/g, "TO_DATE(:dataFim")
    .replace(/contrato\.nr_contrato in\s*\(\s*2444\s*\)/gi, "contrato.nr_contrato IN (:nrContrato)");
  
  // Construir bind variables
  const binds: any = {
    dataInicio: params.dataInicio,
    dataFim: params.dataFim,
    nrContrato: params.nrContrato,
  };

  // Executar query
  const resultados = await executeQuery<DetalhamentoApoliceResult>(sql, binds);
  
  console.log('='.repeat(80));
  console.log('🔍 DEBUG DETALHAMENTO SEM DISTINCT');
  console.log('='.repeat(80));
  console.log('1. Total retornado do Oracle (SEM DISTINCT):', resultados.length);
  console.log('2. Parâmetros:', { 
    apolice: params.nrContrato,
    dataInicio: params.dataInicio,
    dataFim: params.dataFim
  });
  console.log('='.repeat(80));
  
  // Retornar TODOS os registros (sem filtro, sem paginação)
  return resultados;
}
