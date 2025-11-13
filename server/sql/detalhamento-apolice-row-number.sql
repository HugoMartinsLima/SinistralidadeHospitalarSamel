-- VERSÃO COM ROW_NUMBER() - Deduplicação determinística por todas as 47 colunas
-- Remove DISTINCTs e aplica ROW_NUMBER() PARTITION BY todas as colunas
-- ORDER BY: atendimento, dt_procedimento, hora, nr_seq_proc_interno, order_key

WITH detalhamento_union AS (
    SELECT 
        data, hora, dataalta, tipo_internacao, carater_atendimento, tipo_conta,
        atendimento, autorizacao_original, tipo_validacao_clinica_externa,
        data_validacao_clinica_externa, dt_procedimento, cod_tuss, ie_origem_proced,
        evento_tuss, nr_seq_proc_interno, nm_proced, tiposervico, gruporeceita,
        tipoconsulta, apolice, contratante, plano, cod_beneficiario,
        nome_paciente_prestador, beneficiario, sexo, datanascimento, faixa_etaria,
        MAT_CLIENTE, tipodependente, titular, prestador, especialidade, qtde,
        valor, valortotal, setor_atendimento, SE_CONTINUIDADE, DT_CONTRATACAO,
        dt_contrato, dias_adesao, cid_doenca, sub_estipulante, forma_chegada,
        vl_procedimento_coparticipacao,
        NVL2(nr_seq_proc_interno,
             TO_CHAR(nr_seq_proc_interno,'FM0000000000'),
             LPAD(NVL(atendimento,'0'),10,'0')||
             REPLACE(NVL(dt_procedimento,''),'/','')||
             REPLACE(SUBSTR(NVL(hora,'00:00:00'),1,5),':','')) AS order_key
    FROM (
