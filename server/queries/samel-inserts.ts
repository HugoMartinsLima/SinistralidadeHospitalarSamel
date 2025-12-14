import oracledb from 'oracledb';
import { getConnection } from '../oracle-db';
import { SinistralityImport } from '@shared/schema';

function normalizeDate(dateStr: string | null | undefined): string | null {
  if (!dateStr) return null;
  
  const str = dateStr.trim();
  
  // Formato DD/MM/YYYY (com ou sem hora)
  // Ex: "01/11/2025" ou "01/11/2025 00:00:00"
  const matchDMY4 = str.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (matchDMY4) {
    return `${matchDMY4[1]}/${matchDMY4[2]}/${matchDMY4[3]}`;
  }
  
  // Formato DD/MM/YY (ano com 2 dígitos, com ou sem hora)
  // Ex: "22/11/25" ou "22/11/25 00:00:00"
  const matchDMY2 = str.match(/^(\d{2})\/(\d{2})\/(\d{2})/);
  if (matchDMY2) {
    const year2 = parseInt(matchDMY2[3], 10);
    const year4 = year2 >= 50 ? 1900 + year2 : 2000 + year2;
    return `${matchDMY2[1]}/${matchDMY2[2]}/${year4}`;
  }
  
  // Formato ISO: YYYY-MM-DD ou YYYY-MM-DDTHH:MM:SS
  // Ex: "2025-11-01" ou "2025-11-01T00:00:00.000Z"
  const matchISO = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (matchISO) {
    return `${matchISO[3]}/${matchISO[2]}/${matchISO[1]}`;
  }
  
  console.warn(`⚠️ Formato de data não reconhecido: "${dateStr}"`);
  return null;
}

function mapRecordToBinds(record: SinistralityImport): Record<string, any> {
  return {
    data: normalizeDate(record.data),
    hora: record.hora || null,
    dataAlta: normalizeDate(record.dataAlta),
    tipoInternacao: record.tipoInternacao || null,
    caraterAtendimento: record.caraterAtendimento || null,
    tipoConta: record.tipoConta || null,
    atendimento: record.atendimento ?? null,
    autorizacaoOriginal: record.autorizacaoOriginal ?? null,
    tipoValidacaoClinicaExterna: record.tipoValidacaoClinicaExterna || null,
    dataValidacaoClinicaExterna: normalizeDate(record.dataValidacaoClinicaExterna),
    dtProcedimento: normalizeDate(record.dtProcedimento),
    codTuss: record.codTuss ?? null,
    ieOrigemProced: record.ieOrigemProced ?? null,
    eventoTuss: record.eventoTuss || null,
    nrSeqProcInterno: record.nrSeqProcInterno ?? null,
    nmProced: record.nmProced || null,
    tipoServico: record.tipoServico || null,
    grupoReceita: record.grupoReceita || null,
    tipoConsulta: record.tipoConsulta || null,
    apolice: record.apolice ?? null,
    contratante: record.contratante || null,
    plano: record.plano || null,
    codBeneficiario: record.codBeneficiario || null,
    nomePacientePrestador: record.nomePacientePrestador || null,
    beneficiario: record.beneficiario || null,
    sexo: record.sexo || null,
    dataNascimento: normalizeDate(record.dataNascimento),
    faixaEtaria: record.faixaEtaria || null,
    matCliente: record.matCliente ?? null,
    tipoDependente: record.tipoDependente || null,
    titular: record.titular || null,
    prestador: record.prestador || null,
    especialidade: record.especialidade || null,
    qtde: record.qtde ?? null,
    valor: record.valor ?? null,
    valorTotal: record.valorTotal ?? null,
    setorAtendimento: record.setorAtendimento || null,
    seContinuidade: record.seContinuidade || null,
    dtContratacao: normalizeDate(record.dtContratacao),
    dtContrato: normalizeDate(record.dtContrato),
    diasAdesao: record.diasAdesao ?? null,
    cidDoenca: record.cidDoenca || null,
    subEstipulante: record.subEstipulante || null,
    formaChegada: record.formaChegada || null,
    vlProcedimentoCoparticipacao: record.vlProcedimentoCoparticipacao ?? null,
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
  TO_DATE(:data, 'DD/MM/YYYY'), :hora, TO_DATE(:dataAlta, 'DD/MM/YYYY'), :tipoInternacao, :caraterAtendimento,
  :tipoConta, :atendimento, :autorizacaoOriginal, :tipoValidacaoClinicaExterna,
  TO_DATE(:dataValidacaoClinicaExterna, 'DD/MM/YYYY'), TO_DATE(:dtProcedimento, 'DD/MM/YYYY'), :codTuss, :ieOrigemProced,
  :eventoTuss, :nrSeqProcInterno, :nmProced, :tipoServico, :grupoReceita,
  :tipoConsulta, :apolice, :contratante, :plano, :codBeneficiario,
  :nomePacientePrestador, :beneficiario, :sexo, TO_DATE(:dataNascimento, 'DD/MM/YYYY'), :faixaEtaria,
  :matCliente, :tipoDependente, :titular, :prestador, :especialidade,
  :qtde, :valor, :valorTotal, :setorAtendimento, :seContinuidade,
  TO_DATE(:dtContratacao, 'DD/MM/YYYY'), TO_DATE(:dtContrato, 'DD/MM/YYYY'), :diasAdesao, :cidDoenca, :subEstipulante,
  :formaChegada, :vlProcedimentoCoparticipacao
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
