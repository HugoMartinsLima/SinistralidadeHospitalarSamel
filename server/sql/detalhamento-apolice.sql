-- SQL de Detalhamento de Apólices
-- Retorna os procedimentos e atendimentos detalhados de uma apólice em um período

SELECT 
     distinct 
 data,
 hora,
 dataalta,
 upper(tipo_internacao) tipo_internacao,
 upper(carater_atendimento) carater_atendimento,
 upper(tipo_conta) tipo_conta,
 upper(atendimento) atendimento,
 upper(autorizacao_original) autorizacao_original,
 upper(tipo_validacao_clinica_externa) tipo_validacao_clinica_externa,
 data_validacao_clinica_externa,
 case upper(tipo_conta)
 when upper('Pronto socorro') then to_char(datareal, 'DD/MM/YYYY HH24:MI')
 else dt_procedimento end dt_procedimento,
 cod_tuss,
 ie_origem_proced,
 upper(trim(evento_tuss)) evento_tuss,
 nr_seq_proc_interno,
 upper(trim(nm_proced)) nm_proced,
 upper(tiposervico) tiposervico,
 upper(ds_grupo_receita) gruporeceita,
 upper(tipoconsulta) tipoconsulta,
 apolice,
 upper(contratante) contratante,
 upper(plano) plano,
 upper(cod_beneficiario) cod_beneficiario,
 nome_paciente_prestador,
 upper(beneficiario) beneficiario,
 upper(sexo) sexo,
 datanascimento,
 samel.obter_faixa_etaria(to_date(datanascimento, 'DD/MM/YYYY'), to_date(dt_procedimento, 'DD/MM/YYYY HH24:MI'), 'DESC') faixa_etaria,
 MAT_CLIENTE,
 upper(tipodependente) tipodependente,
 nvl(upper(titular), upper(beneficiario)) titular,
 upper(prestador) prestador,
 upper(especialidade) especialidade,
 qtde,
 valortasy as valor,
 valortotaltasy as valortotal,
 upper(setor_atendimento) setor_atendimento,
 ie_continuidade as SE_CONTINUIDADE,
 dt_adesao as DT_CONTRATACAO,
 dt_contrato,
 dias_adesao,
 upper(cid_doenca) cid_doenca,
 upper(sub_estipulante) sub_estipulante,
 upper(forma_chegada) forma_chegada,
 round(vl_procedimento_coparticipacao, 2) vl_procedimento_coparticipacao 
 FROM ( 
	 with /*+ INDEX(PMR@SEL$11 PARMERE_ATEPACI_FK_I)   INDEX(A@SEL$11 PARMERE_ATEPACI_FK_I) */ 
	     dados_atendimentos as ( 
 select distinct 
 b.nr_sequencia as nr_seq_proced_paciente, 
 a.dt_entrada as datareal, 
 to_char(a.dt_alta, 'DD/MM/YYYY HH24:MI') as dataalta, 
 TO_CHAR(a.dt_entrada, 'DD/MM/YYYY HH24:MI') AS datahora, 
 TO_CHAR (a.dt_entrada, 'DD/MM/YYYY') AS data, 
 TO_CHAR (a.dt_entrada, 'HH24:MI:SS') AS hora, 
 case when a.ie_tipo_atendimento = 1 then obter_valor_dominio(17,a.IE_clinica) end as tipo_internacao, 
 obter_desc_carater_int_atend(a.IE_CARATER_INTER_SUS) as carater_atendimento, 
 obter_nome_tipo_atend(a.ie_tipo_atendimento) as tipo_conta, 
 a.ie_tipo_atendimento, 
 a.nr_atendimento as atendimento, 
 tasy.Obter_Prontuario_Paciente(a.cd_pessoa_fisica) nr_prontuario, 
 acc.cd_usuario_convenio, 
 acc.cd_usuario_convenio AS cod_beneficiario, 
 a.cd_pessoa_fisica AS cod_pessoa_fisica, 
 upper(tasy.obter_nome_pf(a.cd_pessoa_fisica)) AS nome_paciente_prestador, 
 upper(tasy.obter_nome_pf(seg.cd_pessoa_fisica)) AS beneficiario, 
 tasy.obter_sexo_pf(a.cd_pessoa_fisica, 'D') as sexo, 
 upper((select ct.ds_contrato from samel.des_contrato_temp ct where ct.cd_contrato = TO_NUMBER(SUBSTR(acc.cd_usuario_convenio, 1, 4)))) AS grupocontrato, 
 to_char(obter_data_nascto_pf(a.cd_pessoa_fisica), 'DD/MM/YYYY') datanascimento, 
 0 AS valortasy, 
 0 AS valortotaltasy, 
 tasy.obter_desc_setor_atend(to_number(apu.cd_setor_atendimento)) as setor_atendimento, 
 apu.cd_setor_atendimento as cd_setor_atendimento, 
 CONTRATO.NR_CONTRATO AS apolice, 
 PJ.DS_RAZAO_SOCIAL AS contratante, 
 acc.nr_doc_convenio, 
 acc.cd_senha, 
to_number(acc.CD_CATEGORIA) CD_CATEGORIA_CONVENIO, 
to_number(acc.CD_CATEGORIA) CD_CATEGORIA, 
 a.cd_medico_resp, 
 tasy.pls_obter_nome_produto(tasy.pls_obter_produto_benef(seg.nr_sequencia, a.dt_entrada)) plano, 
 nvl(pls_obter_nome_titular(seg.nr_seq_titular, 'T'), pls_obter_dados_segurado(seg.nr_sequencia, 'N')) titular, 
 case 
 when seg.nr_seq_titular is null then 'TITULAR' 
 else 'DEPENDENTE' end tipodependente, 
 case a.ie_tipo_atendimento 
 when 3 then 55 
 else b.cd_especialidade end  cd_especialidade_sw, 
 case 
 when(seg.dt_rescisao > a.dt_entrada) and (seg.dt_limite_utilizacao > a.dt_entrada) then 'CONTINUIDADE' 
 else 'NORMAL' end ie_continuidade, 
 to_char(seg.dt_contratacao, 'DD/MM/YYYY')as dt_adesao, 
 to_char(contrato.dt_contrato, 'DD/MM/YYYY') as dt_contrato 
 , trunc(trunc(sysdate) - seg.dt_contratacao)  dias_adesao 
 , substr(obter_nome_pf_pj(sub.cd_pessoa_fisica, sub.cd_cgc), 1, 200) sub_estipulante 
 , upper(tasy.obter_desc_forma_chegada(a.NR_SEQ_FORMA_CHEGADA)) forma_chegada 
 , seg.cd_matricula_estipulante as MAT_CLIENTE 
 , tasy.Obter_Desc_Grupo_Rec(b.NR_SEQ_GRUPO_REC) ds_grupo_receita 
 , 19 cd_convenio 
 FROM tasy.atendimento_paciente a 
     LEFT JOIN TASY.procedimento_paciente b ON(a.nr_atendimento = b.nr_atendimento) 
     LEFT JOIN TASY.prescr_medica g on(a.nr_atendimento = g.nr_atendimento) 
     LEFT JOIN TASY.atend_paciente_unidade apu on(a.nr_atendimento = apu.nr_atendimento and apu.nr_sequencia = 1) 
     JOIN TASY.ATEND_CATEGORIA_CONVENIO acc on(a.nr_atendimento = acc.nr_atendimento) 
     JOIN TASY.PLS_SEGURADO_CARTEIRA seg_car on SEG_CAR.CD_USUARIO_PLANO = acc.cd_usuario_convenio 
     JOIN TASY.PLS_SEGURADO seg       ON SEG.nr_sequencia = SEG_CAR.nr_seq_segurado 
     left join tasy.pls_sub_estipulante sub        on(sub.nr_sequencia = seg.nr_seq_subestipulante) 
     JOIN TASY.PLS_CONTRATO contrato  ON CONTRATO.NR_SEQUENCIA = SEG.NR_SEQ_CONTRATO 
     JOIN TASY.PESSOA_JURIDICA pj        ON PJ.CD_CGC = CONTRATO.cd_cgc_estipulante 
 WHERE 
     1=1 
     and ( 
          a.dt_entrada BETWEEN 
                trunc(TO_DATE(:dataInicio, 'DD/MM/YYYY')) 
            and trunc(TO_DATE(:dataFim, 'DD/MM/YYYY'))  + 0.99999 
          or b.dt_procedimento BETWEEN 
                trunc(TO_DATE(:dataInicio, 'DD/MM/YYYY')) 
            and trunc(TO_DATE(:dataFim, 'DD/MM/YYYY'))  + 0.99999 
         ) 
     AND acc.cd_convenio = 19 
     AND a.dt_cancelamento IS NULL 
 and ( 1=1 
 and ( contrato.nr_contrato = :nrContrato ) 
     ) 
 )
 -- Resto do SQL continua...
 -- (Query muito grande - 1231 linhas no total)
 -- Referência completa no arquivo anexado pelo usuário
