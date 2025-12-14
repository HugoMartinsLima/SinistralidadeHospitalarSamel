import oracledb from 'oracledb';
import { getConnection } from '../oracle-db';
import { SinistralityImport } from '@shared/schema';

// Para campos que são APENAS data (DD/MM/YYYY)
function normalizeDateOnly(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  
  const str = dateStr.trim();
  
  // Formato DD/MM/YYYY - retorna como está
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
    return str;
  }
  
  // Formato DD/MM/YYYY com hora - extrair apenas data
  const matchWithTime = str.match(/^(\d{2}\/\d{2}\/\d{4})/);
  if (matchWithTime) {
    return matchWithTime[1];
  }
  
  // Formato DD/MM/YY - converter para YYYY
  const matchDMY2 = str.match(/^(\d{2})\/(\d{2})\/(\d{2})$/);
  if (matchDMY2) {
    const [, day, month, year2] = matchDMY2;
    const year4 = parseInt(year2, 10) >= 50 ? 1900 + parseInt(year2, 10) : 2000 + parseInt(year2, 10);
    return `${day}/${month}/${year4}`;
  }
  
  // Formato ISO: YYYY-MM-DD
  const matchISO = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (matchISO) {
    const [, year, month, day] = matchISO;
    return `${day}/${month}/${year}`;
  }
  
  console.warn(`⚠️ Formato de data não reconhecido: "${dateStr}"`);
  return null;
}

// Para campos que têm DATA E HORA (DD/MM/YYYY HH24:MI:SS)
function normalizeDateWithTime(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  
  const str = dateStr.trim();
  
  // Formato DD/MM/YYYY HH:MM:SS - retorna como está
  if (/^\d{2}\/\d{2}\/\d{4}\s+\d{2}:\d{2}:\d{2}$/.test(str)) {
    return str;
  }
  
  // Formato DD/MM/YYYY HH:MM - adicionar :00
  const matchWithMinutes = str.match(/^(\d{2}\/\d{2}\/\d{4})\s+(\d{2}):(\d{2})$/);
  if (matchWithMinutes) {
    const [, date, hour, min] = matchWithMinutes;
    return `${date} ${hour}:${min}:00`;
  }
  
  // Formato DD/MM/YYYY sem hora - adicionar 00:00:00
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
    return `${str} 00:00:00`;
  }
  
  // Formato ISO: YYYY-MM-DDTHH:MM:SS
  const matchISO = str.match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2}):(\d{2}))?/);
  if (matchISO) {
    const [, year, month, day, hour, min, sec] = matchISO;
    const h = hour || '00';
    const m = min || '00';
    const s = sec || '00';
    return `${day}/${month}/${year} ${h}:${m}:${s}`;
  }
  
  console.warn(`⚠️ Formato de data/hora não reconhecido: "${dateStr}"`);
  return null;
}

function mapRecordToBinds(record: SinistralityImport): Record<string, any> {
  return {
    // Campos de data APENAS (DD/MM/YYYY)
    data: normalizeDateOnly(record.data),
    dataValidacaoClinicaExterna: normalizeDateOnly(record.dataValidacaoClinicaExterna),
    dataNascimento: normalizeDateOnly(record.dataNascimento),
    dtContratacao: normalizeDateOnly(record.dtContratacao),
    dtContrato: normalizeDateOnly(record.dtContrato),
    
    // Campos de data COM HORA (DD/MM/YYYY HH24:MI:SS)
    dataAlta: normalizeDateWithTime(record.dataAlta),
    dtProcedimento: normalizeDateWithTime(record.dtProcedimento),
    
    // Campo hora (VARCHAR)
    hora: record.hora || null,
    
    // Campos numéricos
    atendimento: record.atendimento ?? null,
    autorizacaoOriginal: record.autorizacaoOriginal ?? null,
    codTuss: record.codTuss ?? null,
    ieOrigemProced: record.ieOrigemProced ?? null,
    nrSeqProcInterno: record.nrSeqProcInterno ?? null,
    apolice: record.apolice ?? null,
    matCliente: record.matCliente ?? null,
    qtde: record.qtde ?? null,
    valor: record.valor ?? null,
    valorTotal: record.valorTotal ?? null,
    diasAdesao: record.diasAdesao ?? null,
    vlProcedimentoCoparticipacao: record.vlProcedimentoCoparticipacao ?? null,
    
    // Campos texto
    tipoInternacao: record.tipoInternacao || null,
    caraterAtendimento: record.caraterAtendimento || null,
    tipoConta: record.tipoConta || null,
    tipoValidacaoClinicaExterna: record.tipoValidacaoClinicaExterna || null,
    eventoTuss: record.eventoTuss ? record.eventoTuss.substring(0, 20) : null, // Limite 20 chars
    nmProced: record.nmProced || null,
    tipoServico: record.tipoServico || null,
    grupoReceita: record.grupoReceita || null,
    tipoConsulta: record.tipoConsulta || null,
    contratante: record.contratante || null,
    plano: record.plano || null,
    codBeneficiario: record.codBeneficiario || null,
    nomePacientePrestador: record.nomePacientePrestador || null,
    beneficiario: record.beneficiario || null,
    sexo: record.sexo || null,
    faixaEtaria: record.faixaEtaria || null,
    tipoDependente: record.tipoDependente || null,
    titular: record.titular || null,
    prestador: record.prestador || null,
    especialidade: record.especialidade || null,
    setorAtendimento: record.setorAtendimento || null,
    seContinuidade: record.seContinuidade || null,
    cidDoenca: record.cidDoenca || null,
    subEstipulante: record.subEstipulante || null,
    formaChegada: record.formaChegada || null,
  };
}

const INSERT_SQL = `
INSERT INTO SAMEL.SINISTRALIDADE_IMPORT (
  DATA, HORA, DATAALTA, TIPO_INTERNACAO, CARATER_ATENDIMENTO,
  TIPO_CONTA, ATENDIMENTO, AUTORIZACAO_ORIGINAL, TIPO_VALIDACAO_CLINICA_EXTERNA,
  DATA_VALIDACAO_CLINICA_EXTERNA, DT_PROCEDIMENTO, COD_TUSS, IE_ORIGEM_PROCED,
  EVENTO_TUSS, NR_SEQ_PROC_INTERNO, NM_PROCED, TIPOSERVICO, GRUPORECEITA,
  TIPOCONSULTA, APOLICE, CONTRATANTE, PLANO, COD_BENEFICIARIO,
  NOME_PACIENTE_PRESTADOR, BENEFICIARIO, SEXO, DATANASCIMENTO, FAIXA_ETARIA,
  MAT_CLIENTE, TIPODEPENDENTE, TITULAR, PRESTADOR, ESPECIALIDADE,
  QTDE, VALOR, VALORTOTAL, SETOR_ATENDIMENTO, SE_CONTINUIDADE,
  DT_CONTRATACAO, DT_CONTRATO, DIAS_ADESAO, CID_DOENCA, SUB_ESTIPULANTE,
  FORMA_CHEGADA, VL_PROCEDIMENTO_COPARTICIPACAO
) VALUES (
  TO_DATE(:data, 'DD/MM/YYYY'),
  :hora,
  CASE WHEN :dataAlta IS NOT NULL THEN TO_DATE(:dataAlta, 'DD/MM/YYYY HH24:MI:SS') ELSE NULL END,
  :tipoInternacao,
  :caraterAtendimento,
  :tipoConta,
  :atendimento,
  :autorizacaoOriginal,
  :tipoValidacaoClinicaExterna,
  CASE WHEN :dataValidacaoClinicaExterna IS NOT NULL THEN TO_DATE(:dataValidacaoClinicaExterna, 'DD/MM/YYYY') ELSE NULL END,
  CASE WHEN :dtProcedimento IS NOT NULL THEN TO_DATE(:dtProcedimento, 'DD/MM/YYYY HH24:MI:SS') ELSE NULL END,
  :codTuss,
  :ieOrigemProced,
  :eventoTuss,
  :nrSeqProcInterno,
  :nmProced,
  :tipoServico,
  :grupoReceita,
  :tipoConsulta,
  :apolice,
  :contratante,
  :plano,
  :codBeneficiario,
  :nomePacientePrestador,
  :beneficiario,
  :sexo,
  CASE WHEN :dataNascimento IS NOT NULL THEN TO_DATE(:dataNascimento, 'DD/MM/YYYY') ELSE NULL END,
  :faixaEtaria,
  :matCliente,
  :tipoDependente,
  :titular,
  :prestador,
  :especialidade,
  :qtde,
  :valor,
  :valorTotal,
  :setorAtendimento,
  :seContinuidade,
  CASE WHEN :dtContratacao IS NOT NULL THEN TO_DATE(:dtContratacao, 'DD/MM/YYYY') ELSE NULL END,
  CASE WHEN :dtContrato IS NOT NULL THEN TO_DATE(:dtContrato, 'DD/MM/YYYY') ELSE NULL END,
  :diasAdesao,
  :cidDoenca,
  :subEstipulante,
  :formaChegada,
  :vlProcedimentoCoparticipacao
)`;

export interface InsertResult {
  success: boolean;
  insertedCount: number;
  failedCount: number;
  errors: { index: number; error: string }[];
}

export async function insertSinistralidade(
  registros: SinistralityImport[]
): Promise<InsertResult> {
  console.log('='.repeat(80));
  console.log('📥 INSERT SINISTRALIDADE_IMPORT');
  console.log('='.repeat(80));
  console.log('Total de registros a inserir:', registros.length);

  let connection: oracledb.Connection | null = null;
  const result: InsertResult = {
    success: true,
    insertedCount: 0,
    failedCount: 0,
    errors: [],
  };

  try {
    connection = await getConnection();
    
    for (let i = 0; i < registros.length; i++) {
      try {
        const binds = mapRecordToBinds(registros[i]);
        
        // Log primeiro registro para debug
        if (i === 0) {
          console.log('📋 Primeiro registro (binds):');
          console.log('  data:', binds.data);
          console.log('  hora:', binds.hora);
          console.log('  dataAlta:', binds.dataAlta);
          console.log('  dtProcedimento:', binds.dtProcedimento);
          console.log('  dataNascimento:', binds.dataNascimento);
          console.log('  apolice:', binds.apolice);
          console.log('  grupoReceita:', binds.grupoReceita);
        }
        
        await connection.execute(INSERT_SQL, binds, { autoCommit: false });
        result.insertedCount++;
        
        if ((i + 1) % 100 === 0) {
          console.log(`✅ Inseridos ${i + 1}/${registros.length} registros...`);
        }
      } catch (err: any) {
        result.failedCount++;
        result.errors.push({
          index: i,
          error: err.message || String(err),
        });
        console.error(`❌ Erro no registro ${i}:`, err.message);
        
        // Log dados do registro com erro
        if (result.failedCount <= 3) {
          const binds = mapRecordToBinds(registros[i]);
          console.error('  Dados do registro:', JSON.stringify(binds, null, 2));
        }
      }
    }

    if (result.failedCount === 0) {
      await connection.commit();
      console.log('✅ COMMIT realizado com sucesso');
    } else if (result.insertedCount > 0) {
      await connection.commit();
      console.log(`⚠️  COMMIT parcial: ${result.insertedCount} inseridos, ${result.failedCount} falharam`);
      result.success = false;
    } else {
      await connection.rollback();
      console.log('❌ ROLLBACK: todos os registros falharam');
      result.success = false;
    }

    console.log('='.repeat(80));
    console.log('📊 Resultado:', result.insertedCount, 'inseridos,', result.failedCount, 'falhas');
    console.log('='.repeat(80));

    return result;
  } catch (err: any) {
    console.error('❌ Erro geral no insert:', err);
    
    if (connection) {
      try {
        await connection.rollback();
        console.log('↩️  ROLLBACK executado');
      } catch (rollbackErr) {
        console.error('❌ Erro no rollback:', rollbackErr);
      }
    }
    
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

export async function truncateSinistralidade(): Promise<void> {
  console.log('🗑️  Executando TRUNCATE em SAMEL.SINISTRALIDADE_IMPORT...');
  
  let connection: oracledb.Connection | null = null;
  
  try {
    connection = await getConnection();
    await connection.execute('TRUNCATE TABLE SAMEL.SINISTRALIDADE_IMPORT', [], { autoCommit: true });
    console.log('✅ TRUNCATE executado com sucesso');
  } catch (err) {
    console.error('❌ Erro no TRUNCATE:', err);
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

export async function countSinistralidade(): Promise<number> {
  let connection: oracledb.Connection | null = null;
  
  try {
    connection = await getConnection();
    const result = await connection.execute<{ COUNT: number }>(
      'SELECT COUNT(*) as COUNT FROM SAMEL.SINISTRALIDADE_IMPORT',
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    return result.rows?.[0]?.COUNT ?? 0;
  } catch (err) {
    console.error('❌ Erro ao contar registros:', err);
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
