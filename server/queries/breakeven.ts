/**
 * Queries para tabela sini_empresa_breakeven
 * CRUD de breakeven por contrato
 */

import { executeQuery, executeUpdate } from '../oracle-db';
import type { Breakeven, InsertBreakeven } from '@shared/schema';

interface BreakevenRow {
  NR_CONTRATO: string;
  DS_ESTIPULANTE: string | null;
  BREAKEVEN: number;
}

function normalizeRow(row: BreakevenRow): Breakeven {
  return {
    nrContrato: row.NR_CONTRATO,
    dsEstipulante: row.DS_ESTIPULANTE,
    breakeven: row.BREAKEVEN,
  };
}

/**
 * Lista todos os breakevens cadastrados
 */
export async function listarBreakevens(): Promise<Breakeven[]> {
  const sql = `
    SELECT 
      NR_CONTRATO,
      DS_ESTIPULANTE,
      BREAKEVEN
    FROM sini_empresa_breakeven
    ORDER BY NR_CONTRATO
  `;
  
  const rows = await executeQuery<BreakevenRow>(sql);
  return rows.map(normalizeRow);
}

/**
 * Busca breakeven de um contrato específico
 */
export async function getBreakevenPorContrato(nrContrato: string): Promise<Breakeven | null> {
  const sql = `
    SELECT 
      NR_CONTRATO,
      DS_ESTIPULANTE,
      BREAKEVEN
    FROM sini_empresa_breakeven
    WHERE NR_CONTRATO = :nrContrato
  `;
  
  const rows = await executeQuery<BreakevenRow>(sql, { nrContrato });
  
  if (rows.length === 0) {
    return null;
  }
  
  return normalizeRow(rows[0]);
}

/**
 * Cria ou atualiza breakeven (UPSERT)
 * Se o contrato já existe, atualiza. Se não existe, insere.
 */
export async function upsertBreakeven(data: InsertBreakeven): Promise<{ action: 'inserted' | 'updated' }> {
  // Verificar se já existe
  const existing = await getBreakevenPorContrato(data.nrContrato);
  
  if (existing) {
    // Atualizar
    const updateSql = `
      UPDATE sini_empresa_breakeven
      SET DS_ESTIPULANTE = :dsEstipulante,
          BREAKEVEN = :breakeven
      WHERE NR_CONTRATO = :nrContrato
    `;
    
    await executeUpdate(updateSql, {
      nrContrato: data.nrContrato,
      dsEstipulante: data.dsEstipulante || null,
      breakeven: data.breakeven,
    });
    
    return { action: 'updated' };
  } else {
    // Inserir
    const insertSql = `
      INSERT INTO sini_empresa_breakeven (NR_CONTRATO, DS_ESTIPULANTE, BREAKEVEN)
      VALUES (:nrContrato, :dsEstipulante, :breakeven)
    `;
    
    await executeUpdate(insertSql, {
      nrContrato: data.nrContrato,
      dsEstipulante: data.dsEstipulante || null,
      breakeven: data.breakeven,
    });
    
    return { action: 'inserted' };
  }
}

/**
 * Remove breakeven de um contrato
 */
export async function deleteBreakeven(nrContrato: string): Promise<boolean> {
  const sql = `
    DELETE FROM sini_empresa_breakeven
    WHERE NR_CONTRATO = :nrContrato
  `;
  
  const result = await executeUpdate(sql, { nrContrato });
  return (result.rowsAffected ?? 0) > 0;
}

/**
 * Insere múltiplos breakevens em lote (batch upsert)
 */
export async function upsertBreakevensBatch(registros: InsertBreakeven[]): Promise<{
  inserted: number;
  updated: number;
  failed: number;
  errors: Array<{ nrContrato: string; error: string }>;
}> {
  let inserted = 0;
  let updated = 0;
  let failed = 0;
  const errors: Array<{ nrContrato: string; error: string }> = [];
  
  for (const registro of registros) {
    try {
      const result = await upsertBreakeven(registro);
      if (result.action === 'inserted') {
        inserted++;
      } else {
        updated++;
      }
    } catch (error) {
      failed++;
      errors.push({
        nrContrato: registro.nrContrato,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    }
  }
  
  return { inserted, updated, failed, errors };
}
