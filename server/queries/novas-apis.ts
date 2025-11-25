import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { executeQuery } from '../oracle-db';

const DATE_REGEX = /^\d{2}\/\d{2}\/\d{4}$/;

function validateAndSanitizeDate(dateStr: string): string {
  if (!DATE_REGEX.test(dateStr)) {
    throw new Error(`Formato de data inválido: ${dateStr}. Use DD/MM/YYYY`);
  }
  const [day, month, year] = dateStr.split('/').map(Number);
  if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900 || year > 2100) {
    throw new Error(`Data inválida: ${dateStr}`);
  }
  return `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
}

function expandBindPlaceholders(
  sql: string,
  binds: Record<string, any>
): { sql: string; binds: Record<string, any> } {
  const expandedBinds: Record<string, any> = {};
  let expandedSql = sql;

  for (const [key, value] of Object.entries(binds)) {
    const regex = new RegExp(`:${key}(?![A-Za-z0-9_])`, 'g');
    let counter = 0;
    
    expandedSql = expandedSql.replace(regex, () => {
      const uniqueKey = `${key}_${counter}`;
      expandedBinds[uniqueKey] = value;
      counter++;
      return `:${uniqueKey}`;
    });
    
    if (counter === 0) {
      expandedBinds[key] = value;
    }
  }

  return { sql: expandedSql, binds: expandedBinds };
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let sqlDetalhamentoTemplate: string | null = null;

function loadDetalhamentoSQL(): string {
  if (!sqlDetalhamentoTemplate) {
    const sqlPath = join(__dirname, '../sql/detalhamento-apolice-completo.sql');
    sqlDetalhamentoTemplate = readFileSync(sqlPath, 'utf-8');
  }
  return sqlDetalhamentoTemplate;
}

function getClonedSQL(): string {
  const template = loadDetalhamentoSQL();
  return String(template);
}

export interface BuscaPacienteParams {
  nome: string;
  dataInicio: string;
  dataFim: string;
  grupoReceita?: string;
}

export interface BuscaPacienteResult {
  [key: string]: any;
}

export async function buscaPacientePorNome(
  params: BuscaPacienteParams
): Promise<BuscaPacienteResult[]> {
  console.log('='.repeat(80));
  console.log('🔍 BUSCA POR PACIENTE (OTIMIZADA - 2 ETAPAS)');
  console.log('='.repeat(80));
  console.log('Nome buscado:', params.nome);
  console.log('Período:', params.dataInicio, 'a', params.dataFim);
  console.log('Grupo Receita:', params.grupoReceita || 'TODOS');

  const safeDataInicio = validateAndSanitizeDate(params.dataInicio);
  const safeDataFim = validateAndSanitizeDate(params.dataFim);

  const sqlBuscaPessoas = `
    SELECT DISTINCT pf.cd_pessoa_fisica as "cdPessoaFisica"
    FROM tasy.pessoa_fisica pf
    WHERE UPPER(pf.nm_pessoa_fisica) LIKE UPPER(:nomePaciente)
    FETCH FIRST 100 ROWS ONLY
  `;

  console.log('ETAPA 1: Buscando cd_pessoa_fisica por nome...');
  const pessoasEncontradas = await executeQuery<{cdPessoaFisica: number}>(sqlBuscaPessoas, {
    nomePaciente: `%${params.nome}%`
  });

  console.log(`Pessoas encontradas: ${pessoasEncontradas.length}`);

  if (pessoasEncontradas.length === 0) {
    console.log('Nenhuma pessoa encontrada com este nome');
    console.log('='.repeat(80));
    return [];
  }

  const idsPessoas = pessoasEncontradas.map(p => p.cdPessoaFisica);
  console.log('IDs encontrados:', idsPessoas.slice(0, 10).join(', ') + (idsPessoas.length > 10 ? '...' : ''));

  console.log('ETAPA 2: Buscando detalhamento para as pessoas encontradas...');
  
  let sql = getClonedSQL();
  sql = sql.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  const idsLiteral = idsPessoas.join(', ');
  
  const blocoOriginal = /and\s*\(\s*1=1\s*\n\s*and\s*\(\s*contrato\.nr_contrato\s+in\s+\(:nrContrato\)\s*\)\s*\n\s*\)/i;
  sql = sql.replace(blocoOriginal,
    `AND (a.cd_pessoa_fisica IN (${idsLiteral}) OR seg.cd_pessoa_fisica IN (${idsLiteral}))`
  );
  
  sql = sql.replace(/:nrContrato/g, '0');

  const baseBinds: any = {
    DataInicio: safeDataInicio,
    DataFim: safeDataFim,
  };

  const { sql: expandedSql, binds: expandedBinds } = expandBindPlaceholders(sql, baseBinds);
  console.log('Bind variables expandidos:', Object.keys(expandedBinds).length);

  const rawResultados = await executeQuery<any>(expandedSql, expandedBinds);
  
  const resultados: BuscaPacienteResult[] = rawResultados.map(row => {
    const normalized: any = {};
    Object.keys(row).forEach(key => {
      normalized[key.toLowerCase()] = row[key];
    });
    return normalized;
  });

  let filtered = resultados;
  if (params.grupoReceita) {
    const grupoUpper = params.grupoReceita.toUpperCase();
    filtered = resultados.filter(r => 
      r.gruporeceita && r.gruporeceita.toUpperCase() === grupoUpper
    );
    console.log(`Filtrado por grupo receita "${params.grupoReceita}": ${resultados.length} -> ${filtered.length}`);
  }

  console.log('Total encontrado:', filtered.length);
  console.log('='.repeat(80));

  return filtered;
}

export interface ClassificacaoContagem {
  dsClassificacao: string;
  quantidade: number;
}

export async function listarClassificacoes(): Promise<ClassificacaoContagem[]> {
  const sql = `
    SELECT 
      (SELECT SUBSTR(ds_classificacao, 1, 255) 
       FROM pls_classificacao_contrato x 
       WHERE x.cd_classificacao = a.cd_classif_contrato) as "dsClassificacao",
      COUNT(*) as "quantidade"
    FROM pls_contrato a
    WHERE a.cd_classif_contrato IS NOT NULL
      AND a.cd_classif_contrato NOT IN (3)
    GROUP BY a.cd_classif_contrato
    ORDER BY COUNT(*) DESC
  `;

  console.log('='.repeat(80));
  console.log('📊 LISTANDO CLASSIFICAÇÕES DE CONTRATOS');
  console.log('='.repeat(80));

  const resultados = await executeQuery<ClassificacaoContagem>(sql);

  console.log('Total de classificações:', resultados.length);
  resultados.forEach(r => console.log(`  - ${r.dsClassificacao}: ${r.quantidade} contratos`));
  console.log('='.repeat(80));

  return resultados;
}

export interface DetalhamentoConsolidadoParams {
  dsClassificacao: string;
  dataInicio: string;
  dataFim: string;
  grupoReceita?: string;
}

export async function getDetalhamentoConsolidadoPorClassificacao(
  params: DetalhamentoConsolidadoParams
): Promise<{data: BuscaPacienteResult[], contratosIncluidos: number[]}> {
  const contratosSql = `
    SELECT a.NR_CONTRATO as "nrContrato"
    FROM pls_contrato a
    WHERE a.cd_classif_contrato NOT IN (3)
      AND (SELECT SUBSTR(ds_classificacao, 1, 255) 
           FROM pls_classificacao_contrato x 
           WHERE x.cd_classificacao = a.cd_classif_contrato) = :dsClassificacao
    ORDER BY a.NR_CONTRATO
  `;

  console.log('='.repeat(80));
  console.log('📊 DETALHAMENTO CONSOLIDADO POR CLASSIFICAÇÃO');
  console.log('='.repeat(80));
  console.log('Classificação:', params.dsClassificacao);
  console.log('Período:', params.dataInicio, 'a', params.dataFim);

  const contratosResult = await executeQuery<{nrContrato: number}>(contratosSql, {
    dsClassificacao: params.dsClassificacao
  });

  const contratosIncluidos = contratosResult.map(c => c.nrContrato);
  console.log('Contratos encontrados:', contratosIncluidos.length);

  if (contratosIncluidos.length === 0) {
    console.log('Nenhum contrato encontrado para esta classificação');
    console.log('='.repeat(80));
    return { data: [], contratosIncluidos: [] };
  }

  let sql = getClonedSQL();
  
  const inListValues = contratosIncluidos.map(c => Number(c)).join(', ');
  
  sql = sql.replace(
    /and \( 1=1\s*\nand \( contrato\.nr_contrato in  \(:nrContrato\)  \)\s*\)/i,
    `AND contrato.nr_contrato IN (${inListValues})`
  );
  
  sql = sql.replace(/:nrContrato/g, inListValues);

  const placeholdersRestantes = sql.match(/:[A-Za-z][A-Za-z0-9_]*/g) || [];
  const placeholdersFiltrados = placeholdersRestantes.filter(p => 
    !p.match(/:MI$/i) && !p.match(/:SS$/i)
  );
  console.log('Placeholders restantes após substituições:', placeholdersFiltrados.length);
  console.log('Lista:', Array.from(new Set(placeholdersFiltrados)).join(', '));

  const safeDataInicio = validateAndSanitizeDate(params.dataInicio);
  const safeDataFim = validateAndSanitizeDate(params.dataFim);
  
  const baseBinds = {
    DataInicio: safeDataInicio,
    DataFim: safeDataFim,
  };
  
  const { sql: expandedSql, binds: expandedBinds } = expandBindPlaceholders(sql, baseBinds);

  console.log('Bind variables expandidos:', Object.keys(expandedBinds).length);

  const rawResultados = await executeQuery<any>(expandedSql, expandedBinds);
  
  const resultados: BuscaPacienteResult[] = rawResultados.map(row => {
    const normalized: any = {};
    Object.keys(row).forEach(key => {
      normalized[key.toLowerCase()] = row[key];
    });
    return normalized;
  });

  let filtered = resultados;
  if (params.grupoReceita) {
    const grupoUpper = params.grupoReceita.toUpperCase();
    filtered = resultados.filter(r => 
      r.gruporeceita && r.gruporeceita.toUpperCase() === grupoUpper
    );
  }

  console.log('Total de registros consolidados:', filtered.length);
  console.log('='.repeat(80));

  return { data: filtered, contratosIncluidos };
}

export interface ResumoContratosParams {
  dataInicio: string;
  dataFim: string;
  contratos?: string;
  grupoReceita?: string;
}

export interface ResumoContratoItem {
  nrContrato: number;
  dsEstipulante: string;
  sinistroTotal: number;
  sinistroTitular: number;
  sinistrosDependentes: number;
  premio: number | null;
  sinistralidade: number | null;
  quantidadeBeneficiarios: number;
  quantidadeAtendimentos: number;
}

export async function getResumoContratos(
  params: ResumoContratosParams
): Promise<ResumoContratoItem[]> {
  console.log('='.repeat(80));
  console.log('📊 RESUMO DE CONTRATOS (usando detalhamento completo)');
  console.log('='.repeat(80));
  console.log('Período:', params.dataInicio, 'a', params.dataFim);
  console.log('Contratos:', params.contratos || 'TODOS');
  console.log('Grupo Receita:', params.grupoReceita || 'TODOS');

  const safeDataInicio = validateAndSanitizeDate(params.dataInicio);
  const safeDataFim = validateAndSanitizeDate(params.dataFim);

  let sql = getClonedSQL();
  sql = sql.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  let contratosFilter = '1=1';
  if (params.contratos) {
    const contratosList = params.contratos.split(',').map(c => c.trim()).filter(c => /^\d+$/.test(c));
    if (contratosList.length > 0) {
      contratosFilter = `contrato.nr_contrato IN (${contratosList.join(', ')})`;
    }
  }

  const blocoOriginal = /and\s*\(\s*1=1\s*\n\s*and\s*\(\s*contrato\.nr_contrato\s+in\s+\(:nrContrato\)\s*\)\s*\n\s*\)/i;
  sql = sql.replace(blocoOriginal, `AND (${contratosFilter})`);
  sql = sql.replace(/:nrContrato/g, '0');

  const resumoSql = `
    WITH detalhamento AS (
      ${sql}
    )
    SELECT 
      apolice as "nrContrato",
      MAX(contratante) as "dsEstipulante",
      COALESCE(SUM(valortotal), 0) as "sinistroTotal",
      COALESCE(SUM(CASE WHEN UPPER(tipodependente) = 'TITULAR' THEN valortotal ELSE 0 END), 0) as "sinistroTitular",
      COALESCE(SUM(CASE WHEN UPPER(tipodependente) = 'DEPENDENTE' THEN valortotal ELSE 0 END), 0) as "sinistrosDependentes",
      COUNT(DISTINCT cod_beneficiario) as "quantidadeBeneficiarios",
      COUNT(DISTINCT atendimento) as "quantidadeAtendimentos"
    FROM detalhamento
    ${params.grupoReceita ? `WHERE UPPER(gruporeceita) = UPPER(:grupoReceita)` : ''}
    GROUP BY apolice
    ORDER BY "sinistroTotal" DESC
  `;

  const binds: Record<string, any> = {
    DataInicio: safeDataInicio,
    DataFim: safeDataFim,
  };
  
  if (params.grupoReceita) {
    binds.grupoReceita = params.grupoReceita;
  }

  const { sql: expandedSql, binds: expandedBinds } = expandBindPlaceholders(resumoSql, binds);
  
  console.log('Executando query de resumo (baseada no detalhamento)...');
  console.log('Bind variables:', Object.keys(expandedBinds).length);

  const rawResultados = await executeQuery<any>(expandedSql, expandedBinds);

  const resultados: ResumoContratoItem[] = rawResultados.map(row => ({
    nrContrato: Number(row.nrContrato),
    dsEstipulante: row.dsEstipulante || '',
    sinistroTotal: Number(row.sinistroTotal) || 0,
    sinistroTitular: Number(row.sinistroTitular) || 0,
    sinistrosDependentes: Number(row.sinistrosDependentes) || 0,
    premio: null,
    sinistralidade: null,
    quantidadeBeneficiarios: Number(row.quantidadeBeneficiarios) || 0,
    quantidadeAtendimentos: Number(row.quantidadeAtendimentos) || 0,
  }));

  console.log('Contratos encontrados:', resultados.length);
  console.log('='.repeat(80));

  return resultados;
}
