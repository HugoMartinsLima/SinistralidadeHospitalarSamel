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
     --testando apenas para alimentar o numero de atendimento caso o procedimento seja no mes posterior por exemplo 
     LEFT JOIN TASY.procedimento_paciente b ON(a.nr_atendimento = b.nr_atendimento) 
      -- testando apenas para alimentar o numero de atendimento caso o prescricao seja no mes posterior por exemplo: 
     --utiu para cobranca de mediacaoes. Ex: Quimioterapia 
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
                trunc(TO_DATE(:DataInicio, 'DD/MM/YYYY')) 
            and trunc(TO_DATE(:DataFim, 'DD/MM/YYYY'))  + 0.99999 
          or b.dt_procedimento BETWEEN 
                trunc(TO_DATE(:DataInicio, 'DD/MM/YYYY')) 
            and trunc(TO_DATE(:DataFim, 'DD/MM/YYYY'))  + 0.99999 
         ) 
     AND acc.cd_convenio = 19 
     AND a.dt_cancelamento IS NULL 
 and ( 1=1 
 and ( contrato.nr_contrato in  (:nrContrato)  ) 
     ) 
 ), 
	 parecer_medico_passo as ( 
	     select DISTINCT 
             da.cd_categoria, 
 	         da.datareal, 
 	         da.dataalta, 
 	         da.datahora, 
 	         da.data, 
 	         da.hora, 
 	         da.tipo_internacao, 
 	         da.carater_atendimento, 
 	         da.tipo_conta, 
 	         da.atendimento, 
 	         da.nr_prontuario, 
 	         COALESCE(pr_pa.CD_SENHA, da.cd_senha, da.nr_doc_convenio) AS autorizacao_original, 
           '' as tipo_validacao_clinica_externa, 
           null data_validacao_clinica_externa, 
 	        to_char(p_medico.dt_procedimento,'dd/mm/yyyy hh24:mi') as dt_procedimento, 
 	        pr_pa.cd_procedimento AS cod_tuss, 
             pr_pa.IE_ORIGEM_PROCED, 
 	        pr_pa.nr_seq_proc_interno, 
 	        upper(case 
 	             when lower(obter_desc_procedimento (pr_pa.cd_procedimento, pr_pa.ie_origem_proced)) like '%di%apartamento%' then 'Diária de Apartamento' 
 	             when lower(obter_desc_procedimento (pr_pa.cd_procedimento, pr_pa.ie_origem_proced)) like '%di%enfermaria%' then 'Diária de Enfermaria' 
 	             else initcap(obter_desc_procedimento (pr_pa.cd_procedimento, pr_pa.ie_origem_proced)) 
 	         end) AS evento_tuss, 
 
 	         nvl(Obter_Desc_Proc_Interno(pr_pa.nr_seq_proc_interno), upper(case 
 	             when lower(obter_desc_procedimento (pr_pa.cd_procedimento, pr_pa.ie_origem_proced)) like '%di%apartamento%' then 'Diária de Apartamento' 
 	             when lower(obter_desc_procedimento (pr_pa.cd_procedimento, pr_pa.ie_origem_proced)) like '%di%enfermaria%' then 'Diária de Enfermaria' 
 	             else initcap(obter_desc_procedimento (pr_pa.cd_procedimento, pr_pa.ie_origem_proced)) 
 	         end)) NM_PROCED, 
 	         case 
 	           when COALESCE(pr_pa.CD_SENHA, da.cd_senha, da.nr_doc_convenio) is not null 
 	            then '1' 
 	            else null 
 	         end as status_cod, 
 	         upper(case 
 	          when COALESCE(pr_pa.CD_SENHA, da.cd_senha, da.nr_doc_convenio) is not null 
 	                then 'Autorizado' 
 	                else null 
 	             end) as status_desc, 
 	        case when (pr_pa.cd_procedimento = '84452019' or pr_pa.nr_seq_proc_interno = 13917) then 'PARECER' ELSE  upper(obter_tipo_procedimento(pr_pa.cd_procedimento, pr_pa.ie_origem_proced, 'D'))  END AS tiposervico, 
 	         case 
 	             when pr_pa.cd_procedimento = 10101012 then 
 	                 case 
 	                    when samel_obter_se_atend_retorno(da.atendimento, 'C') = 'S' then 'RETORNO' 
 	                    else 
 	                        'NORMAL' 
 	                    end 
 	                 else 
 	              '' 
 	         end as TIPOCONSULTA, 
	         da.apolice, 
	         da.contratante, 
	         upper(( 
	             select 
	                 ct.ds_contrato 
	             from samel.des_contrato_temp ct 
	             where 
	                 ct.cd_contrato = TO_NUMBER(SUBSTR(da.cod_beneficiario,1,4))) 
	         ) AS grupocontrato, 
	         da.cod_beneficiario, 
	         da.cod_pessoa_fisica, 
	         da.nome_paciente_prestador, 
	         da.beneficiario, 
	         da.sexo, 
	         da.datanascimento, 
	         p_medico.nm_medico_parecer prestador, 
	         p_medico.ds_especialidade_parecer as especialidade, 
	         pr_pa.qt_procedimento AS qtde, 
	         case 
	             when da.ie_tipo_atendimento = 3 and pr_pa.cd_procedimento not in ('10101039') 
	                 then 0 
	             when( 
	                 da.ie_tipo_atendimento = 1 
	                 and( 
	                     ( 
	                         --parecer 
	                         pr_pa.cd_procedimento = '84452019' 
	                         or pr_pa.nr_seq_proc_interno = 13917 
	                     ) 
	                     or 
	             ( 
	                         --por tipos de serviço. 
	                         upper(obter_tipo_procedimento(pr_pa.cd_procedimento, pr_pa.ie_origem_proced, 'D')) in 
	                         ('RADIOLOGIA', 'TOMOGRAFIA', 'LABORATÓRIO', 'VISITA HOSPITALAR', 'BIOPSIA', 'FISIOTERAPIA', 
	                         'ACUPUNTURA', 'CONSULTA', 'ULTRA-SONOGRAFIA') 
	                     ) 
	                     or 
	                     (--por consulta direta ao lab 
	                     select 
	                         count(1) 
	                     from exame_laboratorio yy 
	                     where 
	                         ( 
	                             yy.cd_procedimento = pr_pa.cd_procedimento 
	                             and yy.ie_origem_proced = pr_pa.ie_origem_proced 
	                         ) 
	                         or 
	                         yy.nr_seq_proc_interno = pr_pa.nr_seq_proc_interno 
	                     ) > 1 
	                 ) 
	             )then 0 
	             when( 
	                da.ie_tipo_atendimento = 8 
	                and samel_obter_se_atend_retorno(da.atendimento, 'C') = 'S' 
	                and pr_pa.cd_procedimento = 10101012 
	             ) then 0 
	             when( 
	                         upper(obter_tipo_procedimento(pr_pa.cd_procedimento, pr_pa.ie_origem_proced, 'D')) 
	                         not in ('CIRURGICO', 'DIÁRIA') 
	                         and upper(da.setor_atendimento) = 'BERÇARIO' 
	             ) then 0 
	             else 
	                 pa.vl_procedimento 
	             end AS valortasy, 
	         --- #### --- 
	         case 
	             when da.ie_tipo_atendimento = 3 and pr_pa.cd_procedimento not in ('10101039') 
	                 then 0 
	             when( 
	                 da.ie_tipo_atendimento = 1 
	                 and( 
	                     ( 
	                         --parecer 
	                         pr_pa.cd_procedimento = '84452019' 
	                         or pr_pa.nr_seq_proc_interno = 13917 
	                     ) 
	                     or 
	             ( 
	                         --por tipos de serviço. 
	                         upper(obter_tipo_procedimento(pr_pa.cd_procedimento, pr_pa.ie_origem_proced, 'D')) in 
	                         ('RADIOLOGIA', 'TOMOGRAFIA', 'LABORATÓRIO', 'VISITA HOSPITALAR', 'BIOPSIA', 'FISIOTERAPIA', 
	                         'ACUPUNTURA', 'CONSULTA', 'ULTRA-SONOGRAFIA') 
	                     ) 
	                     or 
	                     (--por consulta direta ao lab 
	                     select 
	                         count(1) 
	                     from exame_laboratorio yy 
	                     where 
	                         ( 
	                             yy.cd_procedimento = pr_pa.cd_procedimento 
	                             and yy.ie_origem_proced = pr_pa.ie_origem_proced 
	                         ) 
	                         or 
	                         yy.nr_seq_proc_interno = pr_pa.nr_seq_proc_interno 
	                     ) > 1 
	                 ) 
	             )then 0 
	             when( 
	                da.ie_tipo_atendimento = 8 
	                and samel_obter_se_atend_retorno(da.atendimento, 'C') = 'S' 
	                and pr_pa.cd_procedimento = 10101012 
	             ) then 0 
	             when( 
	                         upper(obter_tipo_procedimento(pr_pa.cd_procedimento, pr_pa.ie_origem_proced, 'D')) 
	                         not in ('CIRURGICO', 'DIÁRIA') 
	                         and upper(da.setor_atendimento) = 'BERÇARIO' 
	             ) then 0 
	             else 
	                 (pa.vl_procedimento * pr_pa.qt_procedimento) 
	             end AS valortotaltasy, 
	         case pr_pa.cd_procedimento when 10101012 then 
	             case 
	                 when(SELECT count(1)  FROM tasy.agenda t1 
	                             INNER JOIN tasy.agenda_consulta t2 ON t2.cd_agenda = t1.cd_agenda 
	                             WHERE t2.nr_atendimento = da.atendimento AND ROWNUM = 1) = 1 
	                     then 
	                         (SELECT case when t1.cd_procedencia = 17 then 'Telemedicina' else da.setor_atendimento end  FROM tasy.agenda t1 
	                         INNER JOIN tasy.agenda_consulta t2 ON t2.cd_agenda = t1.cd_agenda 
	                         WHERE t2.nr_atendimento = da.atendimento AND ROWNUM = 1) 
	                 else 
	                 da.setor_atendimento end 
	         else da.setor_atendimento 
	         end as setor_atendimento , 
	          da.plano, 
	          da.titular, 
	          da.tipodependente, 
	          da.ie_continuidade, 
	          da.dt_adesao, 
	          da.dias_adesao , 
	          da.sub_estipulante, 
           pamb.vl_procedimento vl_procedimento_coparticipacao, 
           da.dt_contrato 
           , da.forma_chegada 
           ,da.MAT_CLIENTE 
	        ,da.ds_grupo_receita 
	    from dados_atendimentos da 
	         join tasy.procedimento_paciente pr_pa on (da.nr_seq_proced_paciente = pr_pa.nr_sequencia) 
	         --LEFT JOIN TASY.prescr_medica g on (pr_pa.nr_prescricao = g.nr_prescricao) -- Falta indice. Ficou muito lento. 
	    outer apply( 
	      select 
	          a.cd_edicao_amb, 
	          a.cd_procedimento, 
	          a.vl_procedimento, 
	          a.DT_INICIO_VIGENCIA, 
	          a.DT_FINAL_VIGENCIA 
	           from ( 
	               select ROW_NUMBER() over (partition by  a.cd_edicao_amb, a.CD_PROCEDIMENTO order by a.cd_edicao_amb, a.CD_PROCEDIMENTO,  c.DT_INICIO_VIGENCIA desc) num_order, 
	                      a.cd_edicao_amb, 
	                      a.cd_procedimento, 
	                      round(a.vl_procedimento * nvl(c.TX_AJUSTE_GERAL, 1), 2) vl_procedimento, 
	                      a.DT_INICIO_VIGENCIA, 
	                      a.DT_FINAL_VIGENCIA 
	                from PRECO_AMB a 
	                        join 
	                    edicao_amb b on( 
	                        b.cd_edicao_amb = a.cd_edicao_amb 
	                        ) 
	                        join 
	                    convenio_amb c on( 
	                        c.cd_edicao_amb = b.cd_edicao_amb 
	                        ) 
	                where a.cd_edicao_amb in (6000, 6001, 6002) 
	                    and pr_pa.DT_PROCEDIMENTO between c.DT_INICIO_VIGENCIA and nvl(c.DT_FINAL_VIGENCIA, trunc(sysdate) + 0.99999) 
	                    and pr_pa.DT_PROCEDIMENTO between a.DT_INICIO_VIGENCIA and nvl(a.DT_FINAL_VIGENCIA, trunc(sysdate) + 0.99999) 
	                    and c.CD_CATEGORIA = da.CD_CATEGORIA_CONVENIO 
	                    and a.CD_PROCEDIMENTO = pr_pa.CD_PROCEDIMENTO 
	                   ----  and a.IE_ORIGEM_PROCED = pr_pa.IE_ORIGEM_PROCED 
	                    and c.CD_CONVENIO = da.cd_convenio 
	            ) a where num_order = 1 
	        ) pa 
	            outer apply( 
	                select * 
	                from( 
	                    select ROW_NUMBER() over(partition by  a.cd_edicao_amb, a.CD_PROCEDIMENTO  order by a.cd_edicao_amb, a.CD_PROCEDIMENTO, a.DT_INICIO_VIGENCIA desc) num_order, 
	                          a.cd_edicao_amb, 
	                          a.cd_procedimento, 
	                          round(a.vl_procedimento * nvl(c.TX_AJUSTE_GERAL, 1), 2) vl_procedimento, 
	                          a.DT_INICIO_VIGENCIA, 
	                          a.DT_FINAL_VIGENCIA 
	                    from PRECO_AMB a 
	                            left 
	                    join 
	                        edicao_amb b on ( 
	                            b.cd_edicao_amb = a.cd_edicao_amb 
	                            ) 
	                            left 
	                    join 
	                        convenio_amb c on ( 
	                            c.cd_edicao_amb = b.cd_edicao_amb 
	                            ) 
	                    where a.cd_edicao_amb in (6004) 
	                        and c.dt_final_vigencia is null 
	                        and pr_pa.DT_PROCEDIMENTO between nvl(c.DT_INICIO_VIGENCIA, pr_pa.DT_PROCEDIMENTO) and nvl(c.DT_FINAL_VIGENCIA, trunc(pr_pa.DT_PROCEDIMENTO) + 0.99999) 
	                        and pr_pa.DT_PROCEDIMENTO between a.DT_INICIO_VIGENCIA and nvl(a.DT_FINAL_VIGENCIA, trunc(sysdate) + 0.99999) 
	                        and c.CD_CATEGORIA = da.CD_CATEGORIA_CONVENIO 
	                        and a.CD_PROCEDIMENTO = pr_pa.CD_PROCEDIMENTO 
	                        ----  and a.IE_ORIGEM_PROCED = pr_pa.IE_ORIGEM_PROCED 
	                        and nvl(c.CD_CONVENIO, da.cd_convenio) = da.cd_convenio 
	                ) a where num_order = 1 
	        ) pamb 
	             -- fim coparticipacao 
        -- fim coparticipacao 
	        left join( 
	             select --1375877 
	                    pmr.nr_atendimento nr_atendimento_parecer 
	                 , pm.cd_medico cd_medico_parecer 
	                 , initcap(obter_nome_pf(pm.cd_medico)) nm_medico_parecer 
	                 ,  pls_obter_cbo_medico(pm.cd_medico) cd_especialidade_parecer 
	                 ,  OBTER_DESC_ESPEC_MEDICA(pmr.CD_ESPECIALIDADE_DEST) ds_especialidade_parecer 
	                 ,  pm.dt_liberacao dt_procedimento 
	             from 
	                 parecer_medico_req pmr 
	             join 
	                 parecer_medico pm on(pm.nr_parecer = pmr.nr_parecer) 
	             join 
	                 medico m on(m.cd_pessoa_fisica = pm.cd_medico) 
	             where 1 = 1 
	                 -- nr_atendimento = 7555883 
	                 and pmr.ie_situacao = 'A' 
	                 and pm.ie_situacao = 'A' 
	                 and pm.dt_registro BETWEEN 
	                        trunc(TO_DATE(:DataInicio, 'DD/MM/YYYY')) 
	                     and trunc(TO_DATE(:DataFim, 'DD/MM/YYYY'))  + 0.99999 
	             ) p_medico on ( 
	                (pr_pa.cd_procedimento in ('84452019') or pr_pa.nr_seq_proc_interno = 13917) 
	                and p_medico.nr_atendimento_parecer = pr_pa.nr_atendimento 
	                ) 
	          where 1=1 
	             and pr_pa.qt_procedimento > 0 
	             and (pr_pa.cd_procedimento = '84452019' or pr_pa.nr_seq_proc_interno = 13917) 
	             and pr_pa.cd_motivo_exc_conta IS NULL 
	             and ( 
	                     to_number(tasy.obter_dados_estrut_proc(pr_pa.cd_procedimento,pr_pa.ie_origem_proced,'C','A')) not in (85, 9) 
	                     or pr_pa.nr_seq_proc_interno in ( 
	                                                      14157, 14106, 13785, 13564, 14063, 13570, 13756, 14130, 
	                                                      13689, 13672, 13684, 14130, 13572, 13788, 13700, 13963, 
	                                                      13966, 13967, 13917 
	                                                     ) 
	                 ) 
	             and nvl(pr_pa.nr_seq_proc_interno, 0) not in (13747,13961,14064,16038,16039)  
	             -- Filtro para garantir que os procedimentos restornos são do mes atual. 
             and ( 
                  pr_pa.dt_procedimento BETWEEN 
                        trunc(TO_DATE(:DataInicio, 'DD/MM/YYYY')) 
                      and trunc(TO_DATE(:DataFim, 'DD/MM/YYYY'))  + 0.99999 
                 ) 
 ), 
	 procedimento_paciente_passo as ( 
	     select DISTINCT 
         da.cd_categoria, 
	         da.datareal, 
	         da.dataalta, 
	         da.datahora, 
	         da.data, 
	         da.hora, 
 	         da.tipo_internacao, 
 	         da.carater_atendimento, 
 	         da.tipo_conta, 
 	         da.atendimento, 
 	         da.nr_prontuario, 
 	         COALESCE(pr_pa.CD_SENHA, da.cd_senha, da.nr_doc_convenio) AS autorizacao_original, 
            '' as tipo_validacao_clinica_externa, 
            null data_validacao_clinica_externa, 
 	         to_char(pr_pa.dt_procedimento,'dd/mm/yyyy hh24:mi') as dt_procedimento, 
 	         pr_pa.cd_procedimento AS cod_tuss, 
             pr_pa.IE_ORIGEM_PROCED, 
 	         pr_pa.nr_seq_proc_interno, 
 	         upper(case 
 	             when lower(obter_desc_procedimento (pr_pa.cd_procedimento, pr_pa.ie_origem_proced)) like '%di%apartamento%' then 'Diária de Apartamento' 
 	             when lower(obter_desc_procedimento (pr_pa.cd_procedimento, pr_pa.ie_origem_proced)) like '%di%enfermaria%' then 'Diária de Enfermaria' 
 	             else initcap(obter_desc_procedimento (pr_pa.cd_procedimento, pr_pa.ie_origem_proced)) 
 	         end) AS evento_tuss, 
 
 	         nvl(Obter_Desc_Proc_Interno(pr_pa.nr_seq_proc_interno), upper(case 
 	             when lower(obter_desc_procedimento (pr_pa.cd_procedimento, pr_pa.ie_origem_proced)) like '%di%apartamento%' then 'Diária de Apartamento' 
 	             when lower(obter_desc_procedimento (pr_pa.cd_procedimento, pr_pa.ie_origem_proced)) like '%di%enfermaria%' then 'Diária de Enfermaria' 
 	             else initcap(obter_desc_procedimento (pr_pa.cd_procedimento, pr_pa.ie_origem_proced)) 
 	         end)) NM_PROCED, 
 	         case 
 	           when COALESCE(pr_pa.CD_SENHA, da.cd_senha, da.nr_doc_convenio) is not null 
 	            then '1' 
 	            else null 
 	         end as status_cod, 
 	         upper(case 
 	          when COALESCE(pr_pa.CD_SENHA, da.cd_senha, da.nr_doc_convenio) is not null 
 	                then 'Autorizado' 
 	                else null 
 	             end) as status_desc, 
 	        case when (pr_pa.cd_procedimento = '84452019' or pr_pa.nr_seq_proc_interno = 13917) then 'PARECER' ELSE  upper(obter_tipo_procedimento(pr_pa.cd_procedimento, pr_pa.ie_origem_proced, 'D'))  END AS tiposervico, 
 	         case 
 	             when pr_pa.cd_procedimento = 10101012 then 
 	                 case 
 	                    when samel_obter_se_atend_retorno(da.atendimento, 'C') = 'S' then 'RETORNO' 
 	                    else 
 	                        'NORMAL' 
 	                    end 
 	                 else 
 	              '' 
 	         end as TIPOCONSULTA, 
	         da.apolice, 
	         da.contratante, 
	         upper(( 
	             select 
	                 ct.ds_contrato 
	             from samel.des_contrato_temp ct 
	             where 
	                 ct.cd_contrato = TO_NUMBER(SUBSTR(da.cod_beneficiario,1,4))) 
	         ) AS grupocontrato, 
	         da.cod_beneficiario, 
	         da.cod_pessoa_fisica, 
	         da.nome_paciente_prestador, 
	         da.beneficiario, 
	         da.sexo, 
	         da.datanascimento, 
	         case 
	             when da.ie_tipo_atendimento in (1,7) then upper(nvl(obter_nome_pf(pr_pa.cd_medico),obter_nome_pf(pr_pa.CD_MEDICO_EXECUTOR))) 
	             when da.ie_tipo_atendimento = 3 and pr_pa.nr_prescricao is not null then upper(nvl(obter_nome_pf(pr_pa.cd_medico),obter_nome_pf(pr_pa.CD_MEDICO_EXECUTOR))) 
	             else upper(obter_nome_pf(da.cd_medico_resp)) 
	         end AS prestador, 
	                nvl(upper(obter_desc_espec_agenda(CASE pr_pa.cd_procedimento 
	                    WHEN 10101012 
	                    THEN 
	                        (SELECT t1.cd_especialidade FROM agenda t1 
	                            INNER JOIN agenda_consulta t2 ON t2.cd_agenda = t1.cd_agenda 
	                        WHERE   t2.nr_atendimento = da.atendimento AND ROWNUM = 1) 
	                    WHEN 10101039 
	                    THEN 55 
	                    ELSE 
	                        (SELECT   t1.cd_especialidade 
	                        FROM   agenda t1 INNER JOIN agenda_paciente t2 ON t2.cd_agenda = t1.cd_agenda 
	                        WHERE  t2.nr_atendimento = da.atendimento AND ROWNUM = 1) 
	                    END)), UPPER(tasy.Obter_Desc_Espec_medica(da.cd_especialidade_sw)))  as especialidade, 
	         pr_pa.qt_procedimento AS qtde, 
	         case 
	             when da.ie_tipo_atendimento = 3 and pr_pa.cd_procedimento not in ('10101039') 
	                 then 0 
	             when( 
	                 da.ie_tipo_atendimento = 1 
	                 and( 
	                     ( 
	                         --parecer 
	                         pr_pa.cd_procedimento = '84452019' 
	                         or pr_pa.nr_seq_proc_interno = 13917 
	                     ) 
	                     or 
	             ( 
	                         --por tipos de serviço. 
	                         upper(obter_tipo_procedimento(pr_pa.cd_procedimento, pr_pa.ie_origem_proced, 'D')) in 
	                         ('RADIOLOGIA', 'TOMOGRAFIA', 'LABORATÓRIO', 'VISITA HOSPITALAR', 'BIOPSIA', 'FISIOTERAPIA', 
	                         'ACUPUNTURA', 'CONSULTA', 'ULTRA-SONOGRAFIA') 
	                     ) 
	                     or 
	                     (--por consulta direta ao lab 
	                     select 
	                         count(1) 
	                     from exame_laboratorio yy 
	                     where 
	                         ( 
	                             yy.cd_procedimento = pr_pa.cd_procedimento 
	                             and yy.ie_origem_proced = pr_pa.ie_origem_proced 
	                         ) 
	                         or 
	                         yy.nr_seq_proc_interno = pr_pa.nr_seq_proc_interno 
	                     ) > 1 
	                 ) 
	             )then 0 
	             when( 
	                da.ie_tipo_atendimento = 8 
	                and samel_obter_se_atend_retorno(da.atendimento, 'C') = 'S' 
	                and pr_pa.cd_procedimento = 10101012 
	             ) then 0 
	             when( 
	                         upper(obter_tipo_procedimento(pr_pa.cd_procedimento, pr_pa.ie_origem_proced, 'D')) 
	                         not in ('CIRURGICO', 'DIÁRIA') 
	                         and upper(da.setor_atendimento) = 'BERÇARIO' 
	             ) then 0 
	             else 
	                 pa.vl_procedimento 
	             end AS valortasy, 
	         --- #### --- 
	         case 
	             when da.ie_tipo_atendimento = 3 and pr_pa.cd_procedimento not in ('10101039') 
	                 then 0 
	             when( 
	                 da.ie_tipo_atendimento = 1 
	                 and( 
	                     ( 
	                         --parecer 
	                         pr_pa.cd_procedimento = '84452019' 
	                         or pr_pa.nr_seq_proc_interno = 13917 
	                     ) 
	                     or 
	             ( 
	                         --por tipos de serviço. 
	                         upper(obter_tipo_procedimento(pr_pa.cd_procedimento, pr_pa.ie_origem_proced, 'D')) in 
	                         ('RADIOLOGIA', 'TOMOGRAFIA', 'LABORATÓRIO', 'VISITA HOSPITALAR', 'BIOPSIA', 'FISIOTERAPIA', 
	                         'ACUPUNTURA', 'CONSULTA', 'ULTRA-SONOGRAFIA') 
	                     ) 
	                     or 
	                     (--por consulta direta ao lab 
	                     select 
	                         count(1) 
	                     from exame_laboratorio yy 
	                     where 
	                         ( 
	                             yy.cd_procedimento = pr_pa.cd_procedimento 
	                             and yy.ie_origem_proced = pr_pa.ie_origem_proced 
	                         ) 
	                         or 
	                         yy.nr_seq_proc_interno = pr_pa.nr_seq_proc_interno 
	                     ) > 1 
	                 ) 
	             )then 0 
	             when( 
	                da.ie_tipo_atendimento = 8 
	                and samel_obter_se_atend_retorno(da.atendimento, 'C') = 'S' 
	                and pr_pa.cd_procedimento = 10101012 
	             ) then 0 
	             when( 
	                         upper(obter_tipo_procedimento(pr_pa.cd_procedimento, pr_pa.ie_origem_proced, 'D')) 
	                         not in ('CIRURGICO', 'DIÁRIA') 
	                         and upper(da.setor_atendimento) = 'BERÇARIO' 
	             ) then 0 
	             else 
	                 (pa.vl_procedimento * pr_pa.qt_procedimento) 
	             end AS valortotaltasy, 
	         case pr_pa.cd_procedimento when 10101012 then 
	             case 
	                 when(SELECT count(1)  FROM tasy.agenda t1 
	                             INNER JOIN tasy.agenda_consulta t2 ON t2.cd_agenda = t1.cd_agenda 
	                             WHERE t2.nr_atendimento = da.atendimento AND ROWNUM = 1) = 1 
	                     then 
	                         (SELECT case when t1.cd_procedencia = 17 then 'Telemedicina' else da.setor_atendimento end  FROM tasy.agenda t1 
	                         INNER JOIN tasy.agenda_consulta t2 ON t2.cd_agenda = t1.cd_agenda 
	                         WHERE t2.nr_atendimento = da.atendimento AND ROWNUM = 1) 
	                 else 
	                 da.setor_atendimento end 
	         else da.setor_atendimento 
	         end as setor_atendimento , 
	          da.plano, 
	          da.titular, 
	          da.tipodependente, 
	          da.ie_continuidade, 
	          da.dt_adesao, 
	          da.dias_adesao , 
	          da.sub_estipulante, 
           pamb.vl_procedimento vl_procedimento_coparticipacao, 
           da.dt_contrato 
           , da.forma_chegada 
           ,da.MAT_CLIENTE 
	       ,da.ds_grupo_receita 
	    from dados_atendimentos da 
	         join tasy.procedimento_paciente pr_pa on (da.nr_seq_proced_paciente = pr_pa.nr_sequencia) 
 outer apply( 
    select 
        a.cd_edicao_amb, 
        a.cd_procedimento, 
        a.vl_procedimento, 
        a.DT_INICIO_VIGENCIA, 
        a.DT_FINAL_VIGENCIA 
         from ( 
             select ROW_NUMBER() over (partition by  a.cd_edicao_amb, a.CD_PROCEDIMENTO, a.IE_ORIGEM_PROCED order by a.cd_edicao_amb, a.CD_PROCEDIMENTO, c.DT_INICIO_VIGENCIA desc) num_order, 
                   a.cd_edicao_amb, 
                   a.cd_procedimento, 
                   round(a.vl_procedimento * nvl(c.TX_AJUSTE_GERAL, 1), 2) vl_procedimento, 
                   a.DT_INICIO_VIGENCIA, 
                   a.DT_FINAL_VIGENCIA 
             from PRECO_AMB a 
                     join 
                 edicao_amb b on( 
                     b.cd_edicao_amb = a.cd_edicao_amb 
                     ) 
                     join 
                 convenio_amb c on( 
                     c.cd_edicao_amb = b.cd_edicao_amb 
                     ) 
             where a.cd_edicao_amb in (6000, 6001, 6002) 
                 and pr_pa.DT_PROCEDIMENTO between c.DT_INICIO_VIGENCIA and nvl(c.DT_FINAL_VIGENCIA, trunc(sysdate) + 0.99999) 
                 and pr_pa.DT_PROCEDIMENTO between a.DT_INICIO_VIGENCIA and nvl(a.DT_FINAL_VIGENCIA, trunc(sysdate) + 0.99999) 
                 and c.CD_CATEGORIA = da.CD_CATEGORIA_CONVENIO 
                 and a.CD_PROCEDIMENTO = pr_pa.CD_PROCEDIMENTO 
                 -- and a.IE_ORIGEM_PROCED = pr_pa.IE_ORIGEM_PROCED 
                 and c.CD_CONVENIO = da.cd_convenio 
         ) a where num_order = 1 
     ) pa 
    outer apply( 
     select * 
         from( 
             select ROW_NUMBER() over(partition by  a.cd_edicao_amb, a.CD_PROCEDIMENTO order by a.cd_edicao_amb, a.CD_PROCEDIMENTO , a.DT_INICIO_VIGENCIA desc) num_order, 
                   a.cd_edicao_amb, 
                   a.cd_procedimento, 
                   round(a.vl_procedimento * nvl(c.TX_AJUSTE_GERAL, 1), 2) vl_procedimento, 
                   a.DT_INICIO_VIGENCIA, 
                   a.DT_FINAL_VIGENCIA 
             from PRECO_AMB a 
                     left 
             join 
                 edicao_amb b on ( 
                     b.cd_edicao_amb = a.cd_edicao_amb 
                     ) 
                     left 
             join 
                 convenio_amb c on ( 
                     c.cd_edicao_amb = b.cd_edicao_amb 
                     ) 
             where a.cd_edicao_amb in (6004) 
                 and c.dt_final_vigencia is null 
                 and pr_pa.DT_PROCEDIMENTO between nvl(c.DT_INICIO_VIGENCIA, pr_pa.DT_PROCEDIMENTO) and nvl(c.DT_FINAL_VIGENCIA, trunc(pr_pa.DT_PROCEDIMENTO) + 0.99999) 
                 and pr_pa.DT_PROCEDIMENTO between a.DT_INICIO_VIGENCIA and nvl(a.DT_FINAL_VIGENCIA, trunc(sysdate) + 0.99999) 
                 and nvl(c.CD_CATEGORIA, da.CD_CATEGORIA_CONVENIO) = da.CD_CATEGORIA_CONVENIO 
                 and a.CD_PROCEDIMENTO = pr_pa.CD_PROCEDIMENTO 
                 -- and a.IE_ORIGEM_PROCED = pr_pa.IE_ORIGEM_PROCED 
                 and nvl(c.CD_CONVENIO, da.cd_convenio) = da.cd_convenio 
         ) a where num_order = 1 
 ) pamb 
  -- fim coparticipacao 
	          where 1=1 
	             and not(pr_pa.cd_procedimento = '84452019' or pr_pa.nr_seq_proc_interno = 13917) 
	             and pr_pa.qt_procedimento > 0 
	             and pr_pa.cd_motivo_exc_conta IS NULL 
	             and ( 
	                     to_number(tasy.obter_dados_estrut_proc(pr_pa.cd_procedimento,pr_pa.ie_origem_proced,'C','A')) not in (85, 9) 
	                     or pr_pa.nr_seq_proc_interno in (   14157, 14106, 13785, 13564, 14063, 13570, 13756, 14130, 
	                                                     13689, 13672, 13684, 14130, 13572, 13788, 13700, 13963, 13966, 13967, 13917)) 
	             and nvl(pr_pa.nr_seq_proc_interno, 0) not in (13747,13961,14064,16038,16039) 
	             -- Filtro para garantir que os procedimentos restornos são do mes atual. 
             and ( 
                  pr_pa.dt_procedimento BETWEEN trunc(TO_DATE(:DataInicio, 'DD/MM/YYYY'))  and trunc(TO_DATE(:DataFim, 'DD/MM/YYYY')) + 0.99999             ) 
             and case 
             when 
                 pr_pa.nr_seq_proc_pacote is not null 
                 and upper(obter_tipo_procedimento(pr_pa.cd_procedimento, pr_pa.ie_origem_proced, 'D')) is null 
             then 
                 0 
             else 
                     1 end = 1 
	             and 
	                  case 
	                      when( 
	                          pr_pa.NR_SEQ_PROC_PACOTE is not null 
	                          and pr_pa.NR_SEQ_PROC_PACOTE<> pr_pa.nr_sequencia 
	                          ) 
	                      then 
	                          1 
	                      when pr_pa.NR_SEQ_PROC_PACOTE is null then 
	                          1 
	                      else 
	                     0 
	                  end = 1 
	 ), 
	 medicacoes_quimioterapia_fisioterapia as ( 
	     select DISTINCT 
          da.cd_categoria, 
	         da.datareal, 
	         da.dataalta, 
	         da.datahora, 
	         da.data, 
	         da.hora, 
 	         da.tipo_internacao, 
 	         da.carater_atendimento, 
 	         da.tipo_conta, 
 	         da.atendimento, 
 	         da.nr_prontuario, 
 	         COALESCE(pr_pr.CD_SENHA, da.cd_senha, da.nr_doc_convenio) AS autorizacao_original, 
             '' as tipo_validacao_clinica_externa, 
             null data_validacao_clinica_externa, 
 	         to_char(pr_pr.dt_prev_execucao,'dd/mm/yyyy hh24:mi') as dt_procedimento, 
 	         to_number(pr_pr.cd_procedimento) AS cod_tuss, 
             pr_pr.IE_ORIGEM_PROCED, 
 	         pr_pr.nr_seq_proc_interno, 
 	         upper(case 
 	             when lower(obter_desc_procedimento (pr_pr.cd_procedimento, pr_pr.ie_origem_proced)) like '%di%apartamento%' then 'Diária de Apartamento' 
 	             when lower(obter_desc_procedimento (pr_pr.cd_procedimento, pr_pr.ie_origem_proced)) like '%di%enfermaria%' then 'Diária de Enfermaria' 
 	             else initcap(obter_desc_procedimento (pr_pr.cd_procedimento, pr_pr.ie_origem_proced)) 
 	         end) AS evento_tuss, 
 	         nvl(Obter_Desc_Proc_Interno(pr_pr.nr_seq_proc_interno), upper(case 
 	             when lower(obter_desc_procedimento (pr_pr.cd_procedimento, pr_pr.ie_origem_proced)) like '%di%apartamento%' then 'Diária de Apartamento' 
 	             when lower(obter_desc_procedimento (pr_pr.cd_procedimento, pr_pr.ie_origem_proced)) like '%di%enfermaria%' then 'Diária de Enfermaria' 
 	             else initcap(obter_desc_procedimento (pr_pr.cd_procedimento, pr_pr.ie_origem_proced)) 
 	         end)) NM_PROCED, 
 	         case 
 	           when COALESCE(pr_pr.CD_SENHA, da.cd_senha, da.nr_doc_convenio) is not null 
 	            then '1' 
 	            else null 
 	         end as status_cod, 
 	         upper(case 
 	          when COALESCE(pr_pr.CD_SENHA, da.cd_senha, da.nr_doc_convenio) is not null 
 	                then 'Autorizado' 
 	                else null 
 	             end) as status_desc, 
 	         CASE WHEN (pr_pr.cd_procedimento = '84452019' or pr_pr.nr_seq_proc_interno = 13917) THEN 'PARECER' else upper(obter_tipo_procedimento(pr_pr.cd_procedimento, pr_pr.ie_origem_proced, 'D')) end AS tiposervico, 
 	         case 
 	             when pr_pr.cd_procedimento = 10101012 then 
 	                 case 
 	                    when samel_obter_se_atend_retorno(da.atendimento, 'C') = 'S' then 'RETORNO' 
 	                    else 
 	                        'NORMAL' 
 	                    end 
 	                 else 
 	                     '' 
 	         end as TIPOCONSULTA, 
	         da.apolice, 
	         da.contratante, 
	         upper(( 
	             select 
	                 ct.ds_contrato 
	             from samel.des_contrato_temp ct 
	             where 
	                 ct.cd_contrato = TO_NUMBER(SUBSTR(da.cod_beneficiario,1,4))) 
	         ) AS grupocontrato, 
	         da.cod_beneficiario, 
	         da.cod_pessoa_fisica, 
	         da.nome_paciente_prestador, 
	         da.beneficiario, 
	         da.sexo, 
	         da.datanascimento, 
	         case 
	             when da.ie_tipo_atendimento in (1,7) then upper(nvl(obter_nome_pf(pr_pr.CD_MEDICO_EXEC), obter_nome_pf(pr_me.cd_medico))) 
	             when da.ie_tipo_atendimento = 3 and pr_pr.nr_prescricao is not null then upper(nvl(obter_nome_pf(pr_me.cd_medico),obter_nome_pf(pr_pr.CD_MEDICO_EXEC))) 
	             else upper(obter_nome_pf(da.cd_medico_resp)) 
	         end AS prestador, 
	         nvl(upper(obter_desc_espec_agenda(CASE pr_pr.cd_procedimento 
	           WHEN 10101012 
	           THEN 
	                (SELECT t1.cd_especialidade FROM agenda t1 
	                 INNER JOIN agenda_consulta t2 ON t2.cd_agenda = t1.cd_agenda 
	                 WHERE   t2.nr_atendimento = da.atendimento AND ROWNUM = 1) 
	           WHEN 10101039 
	           THEN 55 
	           ELSE 
	                (SELECT   t1.cd_especialidade 
	                 FROM   agenda t1 INNER JOIN agenda_paciente t2 ON t2.cd_agenda = t1.cd_agenda 
	                 WHERE  t2.nr_atendimento = da.atendimento AND ROWNUM = 1) 
	         END)), 
             tasy.Obter_Desc_Espec_medica(da.cd_especialidade_sw)) as especialidade, 
	         pr_pr.qt_procedimento AS qtde, 
	         pa.vl_procedimento AS valortasy, 
	         (pa.vl_procedimento * pr_pr.qt_procedimento) AS valortotaltasy, 
	          case pr_pr.cd_procedimento when 10101012 then 
	                (SELECT case when t1.cd_procedencia = 17 then 'Telemedicina' else da.setor_atendimento end  FROM tasy.agenda t1 
	                 INNER JOIN tasy.agenda_consulta t2 ON t2.cd_agenda = t1.cd_agenda 
	                 WHERE   t2.nr_atendimento = da.atendimento AND ROWNUM = 1) 
	               else 
	                 da.setor_atendimento 
	          end as setor_atendimento , 
	          da.plano, 
	          da.titular, 
	          da.tipodependente , 
	          da.ie_continuidade, 
	          da.dt_adesao, 
	          da.dias_adesao , 
	          da.sub_estipulante, 
              pamb.vl_procedimento vl_procedimento_coparticipacao, 
              da.dt_contrato, 
              da.forma_chegada, 
              da.MAT_CLIENTE, 
              da.ds_grupo_receita 
	         from dados_atendimentos da 
	         join prescr_medica pr_me on (da.atendimento = pr_me.nr_atendimento) 
	         join tasy.prescr_procedimento pr_pr on (pr_pr.nr_prescricao = pr_me.nr_prescricao) 
	         --LEFT JOIN TASY.prescr_medica g on (pr_pa.nr_prescricao = g.nr_prescricao) -- Falta indice. Ficou muito lento. 
    outer apply( 
          select 
              a.cd_edicao_amb, 
              a.cd_procedimento, 
              a.vl_procedimento, 
              a.DT_INICIO_VIGENCIA, 
              a.DT_FINAL_VIGENCIA 
               from ( 
                   select ROW_NUMBER() over (partition by  a.cd_edicao_amb, a.CD_PROCEDIMENTO order by a.cd_edicao_amb, a.CD_PROCEDIMENTO,  c.DT_INICIO_VIGENCIA desc) num_order, 
                          a.cd_edicao_amb, 
                          a.cd_procedimento, 
                          round(a.vl_procedimento * nvl(c.TX_AJUSTE_GERAL, 1), 2) vl_procedimento, 
                          a.DT_INICIO_VIGENCIA, 
                          a.DT_FINAL_VIGENCIA 
                    from PRECO_AMB a 
                            join 
                        edicao_amb b on( 
                            b.cd_edicao_amb = a.cd_edicao_amb 
                            ) 
                            join 
                        convenio_amb c on( 
                            c.cd_edicao_amb = b.cd_edicao_amb 
                            ) 
                    where a.cd_edicao_amb in (6000, 6001, 6002) 
                        and pr_pr.DT_BAIXA between c.DT_INICIO_VIGENCIA and nvl(c.DT_FINAL_VIGENCIA, trunc(sysdate) + 0.99999) 
                        and pr_pr.DT_BAIXA between a.DT_INICIO_VIGENCIA and nvl(a.DT_FINAL_VIGENCIA, trunc(sysdate) + 0.99999) 
                        and c.CD_CATEGORIA = da.CD_CATEGORIA_CONVENIO 
                        and a.CD_PROCEDIMENTO = pr_pr.CD_PROCEDIMENTO 
                        -- and a.IE_ORIGEM_PROCED = pr_pr.IE_ORIGEM_PROCED 
                        and c.CD_CONVENIO = da.cd_convenio 
                ) a where num_order = 1 
        ) pa 
  outer apply( 
        select * 
        from( 
            select ROW_NUMBER() over(partition by  a.cd_edicao_amb, a.CD_PROCEDIMENTO order by a.cd_edicao_amb, a.CD_PROCEDIMENTO,  a.DT_INICIO_VIGENCIA desc) num_order, 
                  a.cd_edicao_amb, 
                  a.cd_procedimento, 
                  round(a.vl_procedimento * nvl(c.TX_AJUSTE_GERAL, 1), 2) vl_procedimento, 
                  a.DT_INICIO_VIGENCIA, 
                  a.DT_FINAL_VIGENCIA 
            from PRECO_AMB a 
                    left 
            join 
                edicao_amb b on ( 
                    b.cd_edicao_amb = a.cd_edicao_amb 
                    ) 
                    left 
            join 
                convenio_amb c on ( 
                    c.cd_edicao_amb = b.cd_edicao_amb 
                    ) 
            where a.cd_edicao_amb in (6004) 
                and c.dt_final_vigencia is null 
                and pr_pr.DT_BAIXA between nvl(c.DT_INICIO_VIGENCIA, pr_pr.DT_BAIXA) and nvl(c.DT_FINAL_VIGENCIA, trunc(pr_pr.DT_BAIXA) + 0.99999) 
                and pr_pr.DT_BAIXA between a.DT_INICIO_VIGENCIA and nvl(a.DT_FINAL_VIGENCIA, trunc(sysdate) + 0.99999) 
                and nvl(c.CD_CATEGORIA, da.CD_CATEGORIA_CONVENIO) = da.CD_CATEGORIA_CONVENIO 
                and a.CD_PROCEDIMENTO = pr_pr.CD_PROCEDIMENTO 
                -- and a.IE_ORIGEM_PROCED = pr_pr.IE_ORIGEM_PROCED 
                and nvl(c.CD_CONVENIO, da.cd_convenio) = da.cd_convenio 
        ) a where num_order = 1 
) pamb 
	          where 1=1 
	             and to_number(da.cd_setor_atendimento) in (164, 139, 295, 296, 297, 299) 
	 ), 
	 procedimentos_autorizados_pela_operadora as ( 
	     select 
             to_number(cc.cd_categoria) , 
            lt_pro_exec.dt_execucao as datareal 
             ,to_char(lt_pro_exec.dt_execucao, 'DD/MM/YYYY HH24:MI') as dataalta 
             ,to_char(lt_pro_exec.dt_execucao, 'dd/mm/yyyy hh24:mi:ss') as datahora 
             ,to_char(lt_pro_exec.dt_execucao, 'dd/mm/yyyy') as data 
             ,to_char(lt_pro_exec.dt_execucao, 'hh24:mi:ss') as hora 
             ,tasy.obter_valor_dominio(1761,lt_pro_exec.IE_TIPO_ATEND_TISS) AS tipo_internacao 
             ,case 
                  when (lt_pro_exec.IE_CARATER_INTERNACAO = 'E') then 'ELETIVO' 
                      else 'URGENCIA' 
                  end as carater_atendimento 
              ,null as tipo_conta 
              ,null as atendimento 
              ,pf.NR_PRONTUARIO 
              ,lt_pro_exec.cd_guia autorizacao_original 
              ,lt_pro_exec.ie_tipo_autorizacao 
              , lt_pro_exec.dt_execucao data_validacao_clinica_externa 
              ,to_char(lt_pro_exec.DT_SOLICITACAO, 'DD/MM/YYYY hh24:mi') dt_pocedimento 
              ,to_number(lt_pro_exec.cd_procedimento) as cod_tuss 
                ,p_proc.IE_ORIGEM_PROCED 
              ,null as nr_seq_proc_interno 
              ,trim(upper(proc.ds_procedimento)) as evento_tuss 
              ,trim(upper(proc.ds_procedimento)) as nm_proced 
              ,lt_pro_exec.IE_STATUS as status_cod 
              ,'Autorizado' as status_desc 
              ,upper(obter_tipo_procedimento(proc.cd_procedimento, proc.ie_origem_proced, 'D')) tiposervico 
              ,'' as tipo_consulta 
             ,lt_pro_exec.nr_contrato as apolice 
             ,pj.DS_RAZAO_SOCIAL AS contratante 
             ,null as grupo_contrato 
             ,psc.cd_usuario_plano as cod_beneficiario 
             ,pf.cd_pessoa_fisica as cod_pessoa_fisica 
             ,upper(pf.nm_pessoa_fisica) nome_paciente_prestador 
             ,upper(pf.nm_pessoa_fisica) AS beneficiario 
             ,upper(tasy.obter_desc_sexo_unid(pf.ie_sexo)) AS sexo 
             ,to_char(obter_data_nascto_pf(pf.cd_pessoa_fisica), 'DD/MM/YYYY') datanascimento 
             ,substr(pls_obter_dados_prestador(lt_pro_exec.nr_seq_prestador,'N'),1,255) prestador 
             ,tasy.obter_ds_especialidade(lt_pro_exec.cd_especialidade) as especialidade 
             ,nvl(lt_pro_exec.qtd_proced, p_proc.QT_AUTORIZADA) qtde 
             ,valor_procedimento.vl_procedimento valor 
             ,(valor_procedimento.vl_procedimento * nvl(lt_pro_exec.qtd_proced, p_proc.QT_AUTORIZADA)) AS valortotal 
             ,'' as setor_atendimento 
             ,tasy.pls_obter_nome_produto(tasy.pls_obter_produto_benef(lt_pro_exec.nr_seq_segurado, lt_pro_exec.DT_AUTORIZACAO)) plano 
             ,tasy.pls_obter_nome_titular(lt_pro_exec.nr_seq_titular, 'T') titular 
             ,case 
                 when lt_pro_exec.nr_seq_titular is null then 'TITULAR' 
                 else 'DEPENDENTE' 
             end tipodependente 
             ,info_contrato.ie_continuidade 
             ,info_contrato.dt_adesao 
             ,info_contrato.dias_adesao 
             ,substr(obter_nome_pf_pj(sub.cd_pessoa_fisica,sub.cd_cgc),1,200) sub_estipulante 
             ,valor_procedimento_coparticipacao.vl_procedimento vl_procedimento_coparticipacao 
             ,to_char(info_contrato.dt_contrato, 'DD/MM/YYYY') dt_contrato 
             ,null forma_chegada 
             ,lt_pro_exec.CD_MATRICULA_ESTIPULANTE MAT_CLIENTE 
	         ,tasy.Obter_Desc_Grupo_Rec(proc.NR_SEQ_GRUPO_REC) ds_grupo_receita 
        from ( 
        select 
                g.NR_SEQUENCIA                    nr_seq_guia_plano, 
                g.nr_seq_segurado, 
                ps.nr_seq_titular, 
                ps.cd_pessoa_fisica, 
                ps.DT_CONTRATACAO, 
                ps.DT_RESCISAO, 
                ps.DT_LIMITE_UTILIZACAO, 
                ps.CD_MATRICULA_ESTIPULANTE, 
                case 
                    when (tk.cd_guia = g.cd_senha) then 'cd_senha' 
                    when (tk.cd_guia = g.cd_guia) then 'cd_guia' 
                    else null 
                end                                     ie_tipo_link, 
                'via Token'                             ie_tipo_autorizacao, 
                g.cd_senha, 
                g.cd_guia, 
                replace(tk.PROCEDIMENTO, '.', '')   cd_procedimento, 
                g.DT_SOLICITACAO, 
                g.DT_AUTORIZACAO, 
                tk.DT_CONFIRMACAO                   dt_execucao, 
                pc.NR_CONTRATO, 
                ps.NR_SEQ_SUBESTIPULANTE, 
                pc.CD_CGC_ESTIPULANTE, 
                pc.DT_CONTRATO, 
                g.IE_TIPO_ATEND_TISS, 
                g.IE_CARATER_INTERNACAO, 
                g.IE_STATUS, 
                g.NR_SEQ_PRESTADOR, 
                g.CD_ESPECIALIDADE, 
                1 qtd_proced 
        from samel.token_clinica_externa tk 
        join pls_guia_plano g on ( 
           (tk.cd_guia = g.cd_senha or tk.cd_guia = g.cd_guia) 
               and tk.DT_CONFIRMACAO between 
                   trunc(TO_DATE(:DataInicio, 'DD/MM/YYYY')) 
               and trunc(TO_DATE(:DataFim, 'DD/MM/YYYY'))  + 0.99999 
           ) 
        join pls_segurado ps on (ps.nr_sequencia = g.nr_Seq_segurado) 
        join pls_contrato pc on (ps.nr_seq_contrato = pc.nr_sequencia) 
        where 1 = 1 
    and (pc.nr_contrato in (:nrContrato)) 
        union all 
            select 
                gg.NR_SEQUENCIA                   nr_seq_guia_plano, 
                gg.NR_SEQ_SEGURADO, 
                ps.nr_seq_titular, 
                ps.cd_pessoa_fisica, 
                ps.DT_CONTRATACAO, 
                ps.DT_RESCISAO, 
                ps.DT_LIMITE_UTILIZACAO, 
                ps.CD_MATRICULA_ESTIPULANTE, 
                case 
                    when (tg.NUMERO_GUIA = gg.cd_senha) then 'cd_senha' 
                    when (tg.NUMERO_GUIA = gg.cd_guia) then 'cd_guia' 
                    else null 
                    end                           ie_tipo_link, 
                'via Rec. Facial '                ie_tipo_autorizacao, 
                gg.cd_senha, 
                gg.cd_guia, 
                replace(tg.PROCEDIMENTO, '.', '') cd_procedimento, 
                gg.DT_SOLICITACAO, 
                gg.DT_AUTORIZACAO, 
                tg.DATA                           dt_execucao, 
                pc.NR_CONTRATO, 
                ps.NR_SEQ_SUBESTIPULANTE, 
                pc.CD_CGC_ESTIPULANTE, 
                pc.DT_CONTRATO, 
                gg.IE_TIPO_ATEND_TISS, 
                gg.IE_CARATER_INTERNACAO, 
                gg.IE_STATUS, 
                gg.NR_SEQ_PRESTADOR, 
                gg.CD_ESPECIALIDADE, 
                1 qtd_proced 
               from samel.consumo_guias_exames_externos tg 
                        join pls_guia_plano gg on ( 
                                (tg.NUMERO_GUIA = gg.cd_senha or tg.NUMERO_GUIA = gg.cd_guia) 
                            and tg.DATA between 
                                trunc(TO_DATE(:DataInicio, 'DD/MM/YYYY')) 
                            and trunc(TO_DATE(:DataFim, 'DD/MM/YYYY'))  + 0.99999  
                   ) 
                join pls_segurado ps on (ps.nr_sequencia = gg.nr_seq_segurado) 
                join pls_contrato pc on (pc.nr_sequencia = ps.nr_seq_contrato) 
                where 1=1 
    and (pc.nr_contrato in (:nrContrato)) 
                    and not exists ( 
                        select 
                            1 
                        from 
                            samel.token_clinica_externa sw 
                        where 
                                replace(sw.PROCEDIMENTO, '.','') = replace(tg.PROCEDIMENTO, '.', '') 
                            and tg.NUMERO_GUIA = sw.cd_guia 
                            and tg.DATA = sw.DT_CONFIRMACAO 
                ) 
                union all 
                select 
                    gg.NR_SEQUENCIA                   nr_seq_guia_plano, 
                    gg.NR_SEQ_SEGURADO, 
                    ps.nr_seq_titular, 
                    ps.cd_pessoa_fisica, 
                    ps.DT_CONTRATACAO, 
                    ps.DT_RESCISAO, 
                    ps.DT_LIMITE_UTILIZACAO, 
                    ps.CD_MATRICULA_ESTIPULANTE, 
                    null ie_tipo_link, 
                    ''                                   ie_tipo_autorizacao, 
                    gg.cd_senha, 
                    gg.cd_guia, 
                    to_char(pgp.cd_procedimento) cd_procedimento, 
                    gg.DT_SOLICITACAO, 
                    gg.DT_AUTORIZACAO, 
                    gg.DT_LIBERACAO                      dt_execucao, 
                    pc.NR_CONTRATO, 
                    ps.NR_SEQ_SUBESTIPULANTE, 
                    pc.CD_CGC_ESTIPULANTE, 
                    pc.DT_CONTRATO, 
                    gg.IE_TIPO_ATEND_TISS, 
                    gg.IE_CARATER_INTERNACAO, 
                    gg.IE_STATUS, 
                    gg.NR_SEQ_PRESTADOR, 
                    gg.CD_ESPECIALIDADE, 
                    null qtd_proced 
                from tasy.pls_guia_plano gg 
                join pls_segurado ps on (ps.nr_sequencia = gg.nr_seq_segurado) 
                join pls_contrato pc on (pc.nr_sequencia = ps.nr_seq_contrato) 
                join pls_guia_plano_proc pgp on (pgp.nr_seq_guia = gg.nr_sequencia) 
                where 1=1 
                    and gg.NR_SEQ_PRESTADOR in (63) 
                    and pc.nr_contrato in (1270, 1271, 1295) 
                    and pgp.cd_procedimento in (20103662, 20103670) 
    and (pc.nr_contrato in (:nrContrato)) 
                    and gg.DT_LIBERACAO between 
                        trunc(TO_DATE(:DataInicio, 'DD/MM/YYYY')) 
                    and trunc(TO_DATE(:DataFim, 'DD/MM/YYYY'))  + 0.99999 
        ) lt_pro_exec 
        join pls_guia_plano_proc p_proc on ( 
                lt_pro_exec.nr_seq_guia_plano = p_proc.NR_SEQ_GUIA 
            and lt_pro_exec.cd_procedimento =  p_proc.CD_PROCEDIMENTO 
            ) 
        join procedimento proc on  ( 
                proc.CD_PROCEDIMENTO = lt_pro_exec.cd_procedimento 
            and proc.IE_ORIGEM_PROCED = p_proc.IE_ORIGEM_PROCED 
            ) 
        join tasy.PLS_SEGURADO_CARTEIRA psc on (psc.NR_SEQ_SEGURADO = lt_pro_exec.nr_Seq_segurado ) 
        join tasy.PLS_SUB_ESTIPULANTE sub on (sub.NR_SEQUENCIA = lt_pro_exec.NR_SEQ_SUBESTIPULANTE) 
        join tasy.pls_segurado ps on(psc.nr_Seq_segurado = ps.NR_SEQUENCIA) 
        join tasy.categoria_plano cp  on(ps.nr_Seq_plano = cp.cd_plano and cp.IE_SITUACAO = 'A' and cp.CD_CONVENIO = 19) 
        join tasy.CATEGORIA_CONVENIO cc on(cc.CD_CATEGORIA = cp.CD_CATEGORIA and cc.CD_CONVENIO = cp.CD_CONVENIO) 
        join tasy.pessoa_juridica pj on (pj.CD_CGC = lt_pro_exec.CD_CGC_ESTIPULANTE) 
        join tasy.pessoa_fisica pf on (lt_pro_exec.CD_PESSOA_FISICA = pf.cd_pessoa_fisica) 
        outer apply( 
        select 
              case 
                  when( 
                          lt_pro_exec.DT_RESCISAO > lt_pro_exec.DT_AUTORIZACAO 
                      and lt_pro_exec.DT_LIMITE_UTILIZACAO > lt_pro_exec.DT_AUTORIZACAO 
                      ) then 'CONTINUIDADE' 
                  else 'NORMAL' 
              end ie_continuidade, 
              to_char(lt_pro_exec.dt_contratacao, 'DD/MM/YYYY') dt_adesao, 
              lt_pro_exec.DT_CONTRATO , 
              trunc(trunc(sysdate) - lt_pro_exec.dt_contratacao) dias_adesao 
          from dual 
                 ) info_contrato 
          outer apply( 
                 select 
                     a.cd_edicao_amb, 
                     a.cd_procedimento, 
                     a.vl_procedimento, 
                     a.DT_INICIO_VIGENCIA, 
                     a.DT_FINAL_VIGENCIA 
                      from( 
                          select ROW_NUMBER() over(partition by  a.cd_edicao_amb, a.CD_PROCEDIMENTO order by a.cd_edicao_amb, a.CD_PROCEDIMENTO,  c.DT_INICIO_VIGENCIA desc) num_order, 
                                a.cd_edicao_amb, 
                                a.cd_procedimento, 
                                round(a.vl_procedimento * nvl(c.TX_AJUSTE_GERAL, 1), 2) vl_procedimento, 
                                a.DT_INICIO_VIGENCIA, 
                                a.DT_FINAL_VIGENCIA 
                          from PRECO_AMB a 
                                  join 
                              edicao_amb b on ( 
                                  b.cd_edicao_amb = a.cd_edicao_amb 
                                  ) 
                                  join 
                              convenio_amb c on ( 
                                  c.cd_edicao_amb = b.cd_edicao_amb 
                                  ) 
                          where a.cd_edicao_amb in (6000, 6001, 6002) 
                              and lt_pro_exec.dt_execucao between c.DT_INICIO_VIGENCIA and nvl(c.DT_FINAL_VIGENCIA, trunc(sysdate) + 0.99999) 
                              and lt_pro_exec.dt_execucao between a.DT_INICIO_VIGENCIA and nvl(a.DT_FINAL_VIGENCIA, trunc(sysdate) + 0.99999) 
                              and p_proc.CD_PROCEDIMENTO = a.CD_PROCEDIMENTO 
                              -- and p_proc.IE_ORIGEM_PROCED = a.IE_ORIGEM_PROCED 
                              and to_number(c.CD_CATEGORIA) = to_number(cc.CD_CATEGORIA) 
                              and c.CD_CONVENIO = cp.CD_CONVENIO 
                      ) a where num_order = 1 
              ) valor_procedimento 
                  outer apply( 
                       select* 
                       from ( 
                           select ROW_NUMBER() over (partition by  a.cd_edicao_amb, a.CD_PROCEDIMENTO, a.IE_ORIGEM_PROCED order by a.cd_edicao_amb, a.CD_PROCEDIMENTO, a.IE_ORIGEM_PROCED, a.DT_INICIO_VIGENCIA desc) num_order, 
                                a.cd_edicao_amb, 
                                a.cd_procedimento, 
                                round(a.vl_procedimento * nvl(c.TX_AJUSTE_GERAL, 1), 2) vl_procedimento, 
                                a.DT_INICIO_VIGENCIA, 
                                a.DT_FINAL_VIGENCIA 
                          from PRECO_AMB a 
                                  left join 
                              edicao_amb b on( 
                                  b.cd_edicao_amb = a.cd_edicao_amb 
                                  ) 
                                  left join 
                              convenio_amb c on( 
                                  c.cd_edicao_amb = b.cd_edicao_amb 
                                  ) 
                          where 
                                  a.cd_edicao_amb in (6004) 
                              and c.dt_final_vigencia is null 
                              and lt_pro_exec.dt_execucao between nvl(c.DT_INICIO_VIGENCIA, lt_pro_exec.dt_execucao) and nvl(c.DT_FINAL_VIGENCIA, trunc(lt_pro_exec.dt_execucao) +0.99999) 
                              and lt_pro_exec.dt_execucao between a.DT_INICIO_VIGENCIA and nvl(a.DT_FINAL_VIGENCIA, trunc(sysdate) + 0.99999) 
                              and nvl(c.CD_CATEGORIA, cc.CD_CATEGORIA) = cc.CD_CATEGORIA 
                              and a.CD_PROCEDIMENTO = lt_pro_exec.cd_procedimento 
                              ----  and a.IE_ORIGEM_PROCED = pr_pr.IE_ORIGEM_PROCED 
                              and nvl(c.CD_CONVENIO, cc.cd_convenio)= cc.cd_convenio 
                      ) a where num_order = 1 
              ) valor_procedimento_coparticipacao 
        where 
                1=1 
 ) 
	select distinct a.*, 
	       nvl((select 
	           listagg(cd.ds_doenca_cid, ',') within group(order by dd.nr_atendimento) 
	           from diagnostico_doenca dd 
	           join cid_doenca cd on (cd_doenca_cid = dd.cd_doenca) 
	           where nr_atendimento in (a.atendimento)), ' ') cid_doenca 
	    from procedimento_paciente_passo a where atendimento not in (select atendimento from medicacoes_quimioterapia_fisioterapia) 
	    union all 
	 select distinct c.*, 
	      nvl((select 
 
	          listagg(cd.ds_doenca_cid, ',') within group(order by dd.nr_atendimento) 
 
	          from diagnostico_doenca dd 
 
	          join cid_doenca cd on (cd_doenca_cid = dd.cd_doenca) 
 
	          where nr_atendimento in (c.atendimento)), ' ') cid_doenca 
	  from parecer_medico_passo c where 1=1   AND atendimento not in (select atendimento from medicacoes_quimioterapia_fisioterapia) 
	 union all 
	 select 
         distinct b.*, 
         nvl((select 
         listagg(cd.ds_doenca_cid, ',') within group(order by dd.nr_atendimento) 
         from diagnostico_doenca dd 
         join cid_doenca cd on (cd_doenca_cid = dd.cd_doenca) 
         where nr_atendimento in (b.atendimento)), ' ' ) cid_doenca 
	 from medicacoes_quimioterapia_fisioterapia b 
	 union all 
	select distinct c.*, ' ' as cid_doenca  from procedimentos_autorizados_pela_operadora c 
)