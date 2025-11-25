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
  let sql = getClonedSQL();
  
  sql = sql.replace(
    /and \( 1=1\s*\nand \( contrato\.nr_contrato in  \(:nrContrato\)  \)\s*\)/,
    `AND (
      UPPER(tasy.obter_nome_pf(a.cd_pessoa_fisica)) LIKE UPPER(:nomePaciente)
      OR UPPER(tasy.obter_nome_pf(seg.cd_pessoa_fisica)) LIKE UPPER(:nomePaciente)
    )`
  );
  
  sql = sql.replace(
    /\(pc\.nr_contrato in \(:nrContrato\)\)/g,
    `(1=1)`
  );

  const safeDataInicio = validateAndSanitizeDate(params.dataInicio);
  const safeDataFim = validateAndSanitizeDate(params.dataFim);
  
  const baseBinds: any = {
    DataInicio: safeDataInicio,
    DataFim: safeDataFim,
    nomePaciente: `%${params.nome}%`,
  };

  console.log('='.repeat(80));
  console.log('🔍 BUSCA POR PACIENTE');
  console.log('='.repeat(80));
  console.log('Nome buscado:', params.nome);
  console.log('Período:', params.dataInicio, 'a', params.dataFim);
  console.log('Grupo Receita:', params.grupoReceita || 'TODOS');

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
    /and \( 1=1\s*\nand \( contrato\.nr_contrato in  \(:nrContrato\)  \)\s*\)/,
    `AND contrato.nr_contrato IN (${inListValues})`
  );
  
  sql = sql.replace(
    /\(pc\.nr_contrato in \(:nrContrato\)\)/g,
    `(pc.nr_contrato IN (${inListValues}))`
  );

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
