import oracledb from 'oracledb';
import { getConnection, executeQuery } from '../oracle-db';

export interface EvolucaoContrato {
  nrContrato: number;
  periodo: string;
  vlPremio: number;
  vlPremioContinuidade: number;
  vlPremioTotal: number;
  vlSinistro: number;
  pcSinistralidade: number;
  vlLimitadorTecnico: number;
  pcDistorcao: number;
  vlAporteFinanceiro: number;
  dtCriacao?: string;
  dtAtualizacao?: string;
}

export interface EvolucaoContratoInput {
  nrContrato: number;
  periodo: string;
  vlPremio?: number;
  vlPremioContinuidade?: number;
  vlPremioTotal?: number;
  vlSinistro?: number;
  pcSinistralidade?: number;
  vlLimitadorTecnico?: number;
  pcDistorcao?: number;
  vlAporteFinanceiro?: number;
}

function normalizeRow(row: Record<string, any>): EvolucaoContrato {
  return {
    nrContrato: row.NR_CONTRATO,
    periodo: row.PERIODO ? formatDate(row.PERIODO) : '',
    vlPremio: row.VL_PREMIO ?? 0,
    vlPremioContinuidade: row.VL_PREMIO_CONTINUIDADE ?? 0,
    vlPremioTotal: row.VL_PREMIO_TOTAL ?? 0,
    vlSinistro: row.VL_SINISTRO ?? 0,
    pcSinistralidade: row.PC_SINISTRALIDADE ?? 0,
    vlLimitadorTecnico: row.VL_LIMITADOR_TECNICO ?? 0,
    pcDistorcao: row.PC_DISTORCAO ?? 0,
    vlAporteFinanceiro: row.VL_APORTE_FINANCEIRO ?? 0,
    dtCriacao: row.DT_CRIACAO ? formatDate(row.DT_CRIACAO) : undefined,
    dtAtualizacao: row.DT_ATUALIZACAO ? formatDate(row.DT_ATUALIZACAO) : undefined,
  };
}

function formatDate(date: Date | string): string {
  if (typeof date === 'string') return date;
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

export async function listarEvolucaoContrato(nrContrato: number): Promise<EvolucaoContrato[]> {
  const sql = `
    SELECT 
      NR_CONTRATO,
      PERIODO,
      VL_PREMIO,
      VL_PREMIO_CONTINUIDADE,
      VL_PREMIO_TOTAL,
      VL_SINISTRO,
      PC_SINISTRALIDADE,
      VL_LIMITADOR_TECNICO,
      PC_DISTORCAO,
      VL_APORTE_FINANCEIRO,
      DT_CRIACAO,
      DT_ATUALIZACAO
    FROM SAMEL.SINI_EVOLUCAO_CONTRATO
    WHERE NR_CONTRATO = :nrContrato
    ORDER BY PERIODO DESC
  `;
  
  const rows = await executeQuery<Record<string, any>>(sql, { nrContrato });
  return rows.map(normalizeRow);
}

export async function buscarEvolucaoContrato(nrContrato: number, periodo: string): Promise<EvolucaoContrato | null> {
  const sql = `
    SELECT 
      NR_CONTRATO,
      PERIODO,
      VL_PREMIO,
      VL_PREMIO_CONTINUIDADE,
      VL_PREMIO_TOTAL,
      VL_SINISTRO,
      PC_SINISTRALIDADE,
      VL_LIMITADOR_TECNICO,
      PC_DISTORCAO,
      VL_APORTE_FINANCEIRO,
      DT_CRIACAO,
      DT_ATUALIZACAO
    FROM SAMEL.SINI_EVOLUCAO_CONTRATO
    WHERE NR_CONTRATO = :nrContrato
      AND PERIODO = TO_DATE(:periodo, 'DD/MM/YYYY')
  `;
  
  const rows = await executeQuery<Record<string, any>>(sql, { nrContrato, periodo });
  return rows.length > 0 ? normalizeRow(rows[0]) : null;
}

export async function inserirEvolucaoContrato(dados: EvolucaoContratoInput): Promise<{ success: boolean; message: string }> {
  console.log('📥 Inserindo evolução contrato:', dados.nrContrato, dados.periodo);
  
  let connection: oracledb.Connection | null = null;
  
  try {
    connection = await getConnection();
    
    const sql = `
      INSERT INTO SAMEL.SINI_EVOLUCAO_CONTRATO (
        NR_CONTRATO,
        PERIODO,
        VL_PREMIO,
        VL_PREMIO_CONTINUIDADE,
        VL_PREMIO_TOTAL,
        VL_SINISTRO,
        PC_SINISTRALIDADE,
        VL_LIMITADOR_TECNICO,
        PC_DISTORCAO,
        VL_APORTE_FINANCEIRO,
        DT_CRIACAO,
        DT_ATUALIZACAO
      ) VALUES (
        :nrContrato,
        TO_DATE(:periodo, 'DD/MM/YYYY'),
        :vlPremio,
        :vlPremioContinuidade,
        :vlPremioTotal,
        :vlSinistro,
        :pcSinistralidade,
        :vlLimitadorTecnico,
        :pcDistorcao,
        :vlAporteFinanceiro,
        SYSDATE,
        SYSDATE
      )
    `;
    
    const binds = {
      nrContrato: dados.nrContrato,
      periodo: dados.periodo,
      vlPremio: dados.vlPremio ?? 0,
      vlPremioContinuidade: dados.vlPremioContinuidade ?? 0,
      vlPremioTotal: dados.vlPremioTotal ?? 0,
      vlSinistro: dados.vlSinistro ?? 0,
      pcSinistralidade: dados.pcSinistralidade ?? 0,
      vlLimitadorTecnico: dados.vlLimitadorTecnico ?? 0,
      pcDistorcao: dados.pcDistorcao ?? 0,
      vlAporteFinanceiro: dados.vlAporteFinanceiro ?? 0,
    };
    
    await connection.execute(sql, binds, { autoCommit: true });
    console.log('✅ Registro inserido com sucesso');
    
    return { success: true, message: 'Registro inserido com sucesso' };
  } catch (err: any) {
    console.error('❌ Erro ao inserir:', err.message);
    throw err;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (closeErr) {
        console.error('❌ Erro ao fechar conexão:', closeErr);
      }
    }
  }
}

export async function atualizarEvolucaoContrato(
  nrContrato: number, 
  periodo: string, 
  dados: Partial<EvolucaoContratoInput>
): Promise<{ success: boolean; message: string; rowsAffected: number }> {
  console.log('📝 Atualizando evolução contrato:', nrContrato, periodo);
  
  let connection: oracledb.Connection | null = null;
  
  try {
    connection = await getConnection();
    
    const sql = `
      UPDATE SAMEL.SINI_EVOLUCAO_CONTRATO SET
        VL_PREMIO = :vlPremio,
        VL_PREMIO_CONTINUIDADE = :vlPremioContinuidade,
        VL_PREMIO_TOTAL = :vlPremioTotal,
        VL_SINISTRO = :vlSinistro,
        PC_SINISTRALIDADE = :pcSinistralidade,
        VL_LIMITADOR_TECNICO = :vlLimitadorTecnico,
        PC_DISTORCAO = :pcDistorcao,
        VL_APORTE_FINANCEIRO = :vlAporteFinanceiro,
        DT_ATUALIZACAO = SYSDATE
      WHERE NR_CONTRATO = :nrContrato
        AND PERIODO = TO_DATE(:periodo, 'DD/MM/YYYY')
    `;
    
    const binds = {
      nrContrato,
      periodo,
      vlPremio: dados.vlPremio ?? 0,
      vlPremioContinuidade: dados.vlPremioContinuidade ?? 0,
      vlPremioTotal: dados.vlPremioTotal ?? 0,
      vlSinistro: dados.vlSinistro ?? 0,
      pcSinistralidade: dados.pcSinistralidade ?? 0,
      vlLimitadorTecnico: dados.vlLimitadorTecnico ?? 0,
      pcDistorcao: dados.pcDistorcao ?? 0,
      vlAporteFinanceiro: dados.vlAporteFinanceiro ?? 0,
    };
    
    const result = await connection.execute(sql, binds, { autoCommit: true });
    const rowsAffected = result.rowsAffected || 0;
    
    console.log('✅ Registros atualizados:', rowsAffected);
    
    return { 
      success: rowsAffected > 0, 
      message: rowsAffected > 0 ? 'Registro atualizado com sucesso' : 'Nenhum registro encontrado',
      rowsAffected 
    };
  } catch (err: any) {
    console.error('❌ Erro ao atualizar:', err.message);
    throw err;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (closeErr) {
        console.error('❌ Erro ao fechar conexão:', closeErr);
      }
    }
  }
}

export async function excluirEvolucaoContrato(
  nrContrato: number, 
  periodo: string
): Promise<{ success: boolean; message: string; rowsAffected: number }> {
  console.log('🗑️ Excluindo evolução contrato:', nrContrato, periodo);
  
  let connection: oracledb.Connection | null = null;
  
  try {
    connection = await getConnection();
    
    const sql = `
      DELETE FROM SAMEL.SINI_EVOLUCAO_CONTRATO
      WHERE NR_CONTRATO = :nrContrato
        AND PERIODO = TO_DATE(:periodo, 'DD/MM/YYYY')
    `;
    
    const result = await connection.execute(sql, { nrContrato, periodo }, { autoCommit: true });
    const rowsAffected = result.rowsAffected || 0;
    
    console.log('✅ Registros excluídos:', rowsAffected);
    
    return { 
      success: rowsAffected > 0, 
      message: rowsAffected > 0 ? 'Registro excluído com sucesso' : 'Nenhum registro encontrado',
      rowsAffected 
    };
  } catch (err: any) {
    console.error('❌ Erro ao excluir:', err.message);
    throw err;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (closeErr) {
        console.error('❌ Erro ao fechar conexão:', closeErr);
      }
    }
  }
}

export async function upsertEvolucaoContrato(dados: EvolucaoContratoInput): Promise<{ success: boolean; message: string; action: 'insert' | 'update' }> {
  const existente = await buscarEvolucaoContrato(dados.nrContrato, dados.periodo);
  
  if (existente) {
    await atualizarEvolucaoContrato(dados.nrContrato, dados.periodo, dados);
    return { success: true, message: 'Registro atualizado com sucesso', action: 'update' };
  } else {
    await inserirEvolucaoContrato(dados);
    return { success: true, message: 'Registro inserido com sucesso', action: 'insert' };
  }
}
