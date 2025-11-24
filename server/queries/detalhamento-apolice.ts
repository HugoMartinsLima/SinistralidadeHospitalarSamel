import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';
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
    
    console.log('✅ SQL de detalhamento de apólice carregado do arquivo');
    console.log('⚠️  IMPORTANTE: SQL já possui bind variables corretas (:DataInicio, :DataFim, :nrContrato)');
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
  
  // Construir bind variables (IMPORTANTE: SQL usa :DataInicio e :DataFim com maiúsculas)
  const binds: any = {
    DataInicio: params.dataInicio,
    DataFim: params.dataFim,
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
  
  // IMPORTANTE: SQL já possui bind variables corretas (:DataInicio, :DataFim, :nrContrato)
  // Não é necessário substituir nada
  
  // Construir bind variables (IMPORTANTE: SQL usa :DataInicio e :DataFim com maiúsculas)
  const binds: any = {
    DataInicio: params.dataInicio,
    DataFim: params.dataFim,
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

// Lista canônica das 45 colunas retornadas pelo SELECT Oracle (ordem fixa)
// IMPORTANTE: oracledb com outFormat=OUT_FORMAT_OBJECT retorna chaves em lowercase
// NOTA: Removidas colunas vl_procedimento_cobrado e vl_procedimento_a_pagar (não existem no SQL original)
export const EXPECTED_COLUMNS = [
  'data', 'hora', 'dataalta', 'tipo_internacao', 'carater_atendimento', 'tipo_conta',
  'atendimento', 'autorizacao_original', 'tipo_validacao_clinica_externa',
  'data_validacao_clinica_externa', 'dt_procedimento', 'cod_tuss', 'ie_origem_proced',
  'evento_tuss', 'nr_seq_proc_interno', 'nm_proced', 'tiposervico', 'gruporeceita',
  'tipoconsulta', 'apolice', 'contratante', 'plano', 'cod_beneficiario',
  'nome_paciente_prestador', 'beneficiario', 'sexo', 'datanascimento', 'faixa_etaria',
  'mat_cliente', 'tipodependente', 'titular', 'prestador', 'especialidade', 'qtde',
  'valor', 'valortotal',
  'setor_atendimento', 'se_continuidade', 'dt_contratacao',
  'dt_contrato', 'dias_adesao', 'cid_doenca', 'sub_estipulante', 'forma_chegada',
  'vl_procedimento_coparticipacao'
] as const;

// Cache de validação (executado apenas uma vez)
let columnsValidated = false;

/**
 * Valida que o registro contém exatamente as 45 colunas esperadas
 * Lança erro se houver colunas faltando ou extras
 */
function validateColumns(record: DetalhamentoApoliceResult): void {
  if (columnsValidated) return;
  
  const recordKeys = Object.keys(record).sort();
  const expectedKeys = [...EXPECTED_COLUMNS].sort();
  
  // Verificar colunas faltando
  const missing = expectedKeys.filter((k: string) => !recordKeys.includes(k));
  if (missing.length > 0) {
    throw new Error(
      `❌ ERRO CRÍTICO: Faltam ${missing.length} colunas no registro Oracle!\n` +
      `Colunas faltando: ${missing.join(', ')}\n` +
      `Esperadas: ${expectedKeys.length} | Recebidas: ${recordKeys.length}`
    );
  }
  
  // Verificar colunas extras (pode indicar mudança no SQL)
  const extra = recordKeys.filter((k: string) => !expectedKeys.includes(k));
  if (extra.length > 0) {
    console.warn(
      `⚠️  ATENÇÃO: ${extra.length} colunas extras no registro Oracle!\n` +
      `Colunas extras: ${extra.join(', ')}\n` +
      `Isso pode indicar que o SQL foi modificado.`
    );
  }
  
  columnsValidated = true;
  console.log(`✅ Validação de colunas OK: ${EXPECTED_COLUMNS.length} colunas confirmadas`);
}

/**
 * Cria fingerprint SHA-256 determinístico de um registro
 * Normaliza todos os 47 campos para garantir comparação segura de dados financeiros
 * 
 * Normalização:
 * - Strings: UPPERCASE + trim (alinha com Oracle collation BINARY)
 * - Números: formato fixo com 10 decimais para precisão
 * - NULL/undefined: token literal '__NULL__'
 * - Ordem: fixa por lista de colunas (determinística)
 */
function buildDetalhamentoFingerprint(record: DetalhamentoApoliceResult): string {
  // Validar colunas (apenas primeira vez)
  validateColumns(record);
  
  // Normalizar cada valor de forma determinística usando lista canônica de 47 colunas
  const normalizedValues = EXPECTED_COLUMNS.map(col => {
    const value = record[col];
    
    // NULL/undefined: token literal
    if (value === null || value === undefined) {
      return '__NULL__';
    }
    
    // Date objects: normalizar para ISO UTC string (determinístico independente de timezone)
    // Oracle DATE/TIMESTAMP podem vir como Date do JavaScript
    if (value instanceof Date) {
      return value.toISOString(); // Formato: 2025-10-01T12:30:45.000Z
    }
    
    // Números: Oracle NUMBER pode vir como string ou number - normalizar ambos
    // Campos numéricos críticos: VALOR, VALORTOTAL, VL_PROCEDIMENTO_COBRADO, VL_PROCEDIMENTO_A_PAGAR, etc.
    if (typeof value === 'number') {
      return value.toFixed(10);
    }
    
    // Tentar parsear strings numéricas (Oracle NUMBER às vezes vem como string)
    if (typeof value === 'string') {
      const trimmed = value.trim();
      const parsed = Number(trimmed);
      
      // Se é um número válido, normalizar com toFixed(10)
      if (!isNaN(parsed) && trimmed !== '') {
        return parsed.toFixed(10);
      }
      
      // Caso contrário, tratar como string: UPPERCASE + trim
      return value.toUpperCase().trim();
    }
    
    // Outros tipos: converter para string e normalizar
    return String(value).toUpperCase().trim();
  });
  
  // Criar payload determinístico: col1|col2|col3|...|col47
  const payload = normalizedValues.join('|');
  
  // Gerar hash SHA-256
  return createHash('sha256').update(payload, 'utf8').digest('hex');
}

/**
 * Busca o detalhamento de uma apólice COM DEDUPLICAÇÃO em JavaScript
 * Remove duplicatas usando chave composta, preservando primeiro registro de cada grupo
 */
export async function getDetalhamentoApoliceDeduplicado(
  params: DetalhamentoApoliceParams
): Promise<{deduplicated: DetalhamentoApoliceResult[], duplicates: any[]}> {
  // Executar SQL SEM DISTINCT para obter TODOS os registros
  const todosRegistros = await getDetalhamentoApoliceNoDistinct(params);
  
  console.log('='.repeat(80));
  console.log('🔧 APLICANDO DEDUPLICAÇÃO SHA-256 (TODAS AS 47 COLUNAS)');
  console.log('='.repeat(80));
  console.log('1. Total de registros ANTES da deduplicação:', todosRegistros.length);
  
  // Mapa para rastrear registros únicos por fingerprint SHA-256
  const registrosUnicos = new Map<string, DetalhamentoApoliceResult>();
  const duplicatasEncontradas: any[] = [];
  
  // Aplicar deduplicação usando fingerprint SHA-256 de todas as 47 colunas
  todosRegistros.forEach((registro, index) => {
    // Gerar fingerprint SHA-256 determinístico de TODAS as 47 colunas
    const hash = buildDetalhamentoFingerprint(registro);
    
    if (!registrosUnicos.has(hash)) {
      // Primeiro registro com este hash - manter
      registrosUnicos.set(hash, registro);
    } else {
      // Duplicata encontrada (registro 100% idêntico em todas as 47 colunas)
      const registroOriginal = registrosUnicos.get(hash)!;
      duplicatasEncontradas.push({
        hash: hash.substring(0, 16), // Primeiros 16 chars do hash para exibição
        index,
        chaveVisual: `${registro.atendimento}|${registro.data}|${registro.hora}|${registro.cod_tuss}`,
        original: {
          atendimento: registroOriginal.atendimento,
          data: registroOriginal.data,
          cod_tuss: registroOriginal.cod_tuss,
          nm_proced: registroOriginal.nm_proced,
          valor: registroOriginal.valor,
          valortotal: registroOriginal.valortotal
        },
        duplicata: {
          atendimento: registro.atendimento,
          data: registro.data,
          cod_tuss: registro.cod_tuss,
          nm_proced: registro.nm_proced,
          valor: registro.valor,
          valortotal: registro.valortotal
        },
        // Se o hash é idêntico, valores devem ser idênticos (diferença = 0)
        diferencaValor: Number(registro.valor || 0) - Number(registroOriginal.valor || 0),
        diferencaValorTotal: Number(registro.valortotal || 0) - Number(registroOriginal.valortotal || 0)
      });
    }
  });
  
  const deduplicated = Array.from(registrosUnicos.values());
  
  console.log('2. Total de registros APÓS deduplicação SHA-256:', deduplicated.length);
  console.log('3. Total de duplicatas 100% idênticas removidas:', duplicatasEncontradas.length);
  
  if (duplicatasEncontradas.length > 0) {
    console.log('⚠️  DUPLICATAS 100% IDÊNTICAS ENCONTRADAS:');
    duplicatasEncontradas.slice(0, 5).forEach((dup, idx) => {
      console.log(`   ${idx + 1}. Hash: ${dup.hash}... | Chave visual: ${dup.chaveVisual}`);
      console.log(`      Diferença valor: R$ ${dup.diferencaValor.toFixed(2)} | Diferença total: R$ ${dup.diferencaValorTotal.toFixed(2)}`);
    });
    if (duplicatasEncontradas.length > 5) {
      console.log(`   ... e mais ${duplicatasEncontradas.length - 5} duplicatas`);
    }
  } else {
    console.log('✅ Nenhuma duplicata 100% idêntica encontrada');
  }
  
  console.log('='.repeat(80));
  
  return {
    deduplicated,
    duplicates: duplicatasEncontradas
  };
}
