import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { executeQuery, executeUpdate, testConnection, initializePool } from "./oracle-db";
import type { Sinistro, Paciente, Estatisticas, FiltroSinistros, Contrato, FiltroDetalhamentoApolice } from "@shared/schema";
import { filtroSinistrosSchema, insertSinistroSchema, updateSinistroSchema, insertPacienteSchema, updatePacienteSchema, filtroDetalhamentoApoliceSchema } from "@shared/schema";
import { getDetalhamentoApolice } from "./queries/detalhamento-apolice";

export async function registerRoutes(app: Express): Promise<Server> {
  // Inicializar pool de conexões Oracle
  try {
    await initializePool();
  } catch (error) {
    console.error('❌ Falha ao inicializar pool Oracle:', error);
  }

  // Health check endpoint - verifica conexão com Oracle
  app.get("/api/health", async (req, res) => {
    try {
      const isConnected = await testConnection();
      
      if (isConnected) {
        res.json({
          status: "healthy",
          oracle: "connected",
          timestamp: new Date().toISOString(),
          message: "API e banco de dados Oracle funcionando corretamente"
        });
      } else {
        res.status(503).json({
          status: "unhealthy",
          oracle: "disconnected",
          timestamp: new Date().toISOString(),
          message: "Falha na conexão com o banco de dados Oracle"
        });
      }
    } catch (error) {
      console.error('Health check error:', error);
      res.status(503).json({
        status: "error",
        oracle: "error",
        timestamp: new Date().toISOString(),
        message: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  });

  // Listar sinistros com filtros opcionais
  app.get("/api/sinistros", async (req, res) => {
    try {
      // Validar e extrair parâmetros de query
      const filters = filtroSinistrosSchema.parse({
        status: req.query.status,
        dataInicio: req.query.dataInicio,
        dataFim: req.query.dataFim,
        pacienteId: req.query.pacienteId ? Number(req.query.pacienteId) : undefined,
        limit: req.query.limit ? Number(req.query.limit) : 50,
        offset: req.query.offset ? Number(req.query.offset) : 0,
      });

      // Query SQL dinâmica baseada nos filtros
      let sql = `
        SELECT 
          s.id,
          s.numero_sinistro as "numeroSinistro",
          s.paciente_id as "pacienteId",
          p.nome as "pacienteNome",
          TO_CHAR(s.data_ocorrencia, 'YYYY-MM-DD') as "dataOcorrencia",
          TO_CHAR(s.data_registro, 'YYYY-MM-DD') as "dataRegistro",
          s.status,
          s.valor_total as "valorTotal",
          s.tipo_sinistro as "tipoSinistro",
          s.descricao,
          s.hospital
        FROM sinistros s
        LEFT JOIN pacientes p ON s.paciente_id = p.id
        WHERE 1=1
      `;

      const binds: any = {};
      
      if (filters.status) {
        sql += ` AND s.status = :status`;
        binds.status = filters.status;
      }

      if (filters.dataInicio) {
        sql += ` AND s.data_ocorrencia >= TO_DATE(:dataInicio, 'YYYY-MM-DD')`;
        binds.dataInicio = filters.dataInicio;
      }

      if (filters.dataFim) {
        sql += ` AND s.data_ocorrencia <= TO_DATE(:dataFim, 'YYYY-MM-DD')`;
        binds.dataFim = filters.dataFim;
      }

      if (filters.pacienteId) {
        sql += ` AND s.paciente_id = :pacienteId`;
        binds.pacienteId = filters.pacienteId;
      }

      sql += ` ORDER BY s.data_registro DESC`;
      sql += ` OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY`;
      binds.offset = filters.offset;
      binds.limit = filters.limit;

      const sinistros = await executeQuery<Sinistro>(sql, binds);

      res.json({
        data: sinistros,
        pagination: {
          limit: filters.limit,
          offset: filters.offset,
          total: sinistros.length,
        }
      });
    } catch (error) {
      console.error('Erro ao buscar sinistros:', error);
      res.status(500).json({
        error: "Erro ao buscar sinistros",
        message: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  });

  // Obter detalhes de um sinistro específico
  app.get("/api/sinistros/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);

      const sql = `
        SELECT 
          s.id,
          s.numero_sinistro as "numeroSinistro",
          s.paciente_id as "pacienteId",
          p.nome as "pacienteNome",
          TO_CHAR(s.data_ocorrencia, 'YYYY-MM-DD') as "dataOcorrencia",
          TO_CHAR(s.data_registro, 'YYYY-MM-DD') as "dataRegistro",
          s.status,
          s.valor_total as "valorTotal",
          s.tipo_sinistro as "tipoSinistro",
          s.descricao,
          s.hospital
        FROM sinistros s
        LEFT JOIN pacientes p ON s.paciente_id = p.id
        WHERE s.id = :id
      `;

      const result = await executeQuery<Sinistro>(sql, { id });

      if (result.length === 0) {
        return res.status(404).json({
          error: "Sinistro não encontrado",
          message: `Nenhum sinistro encontrado com ID ${id}`
        });
      }

      res.json(result[0]);
    } catch (error) {
      console.error('Erro ao buscar sinistro:', error);
      res.status(500).json({
        error: "Erro ao buscar sinistro",
        message: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  });

  // Listar pacientes
  app.get("/api/pacientes", async (req, res) => {
    try {
      const limit = Number(req.query.limit) || 50;
      const offset = Number(req.query.offset) || 0;
      const search = req.query.search as string;

      let sql = `
        SELECT 
          id,
          nome,
          cpf,
          TO_CHAR(data_nascimento, 'YYYY-MM-DD') as "dataNascimento",
          plano,
          numero_carteirinha as "numeroCarteirinha",
          telefone,
          email
        FROM pacientes
        WHERE 1=1
      `;

      const binds: any = { limit, offset };

      if (search) {
        sql += ` AND (LOWER(nome) LIKE LOWER(:search) OR cpf LIKE :search OR numero_carteirinha LIKE :search)`;
        binds.search = `%${search}%`;
      }

      sql += ` ORDER BY nome`;
      sql += ` OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY`;

      const pacientes = await executeQuery<Paciente>(sql, binds);

      res.json({
        data: pacientes,
        pagination: {
          limit,
          offset,
          total: pacientes.length,
        }
      });
    } catch (error) {
      console.error('Erro ao buscar pacientes:', error);
      res.status(500).json({
        error: "Erro ao buscar pacientes",
        message: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  });

  // Obter detalhes de um paciente específico
  app.get("/api/pacientes/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);

      const sql = `
        SELECT 
          id,
          nome,
          cpf,
          TO_CHAR(data_nascimento, 'YYYY-MM-DD') as "dataNascimento",
          plano,
          numero_carteirinha as "numeroCarteirinha",
          telefone,
          email
        FROM pacientes
        WHERE id = :id
      `;

      const result = await executeQuery<Paciente>(sql, { id });

      if (result.length === 0) {
        return res.status(404).json({
          error: "Paciente não encontrado",
          message: `Nenhum paciente encontrado com ID ${id}`
        });
      }

      res.json(result[0]);
    } catch (error) {
      console.error('Erro ao buscar paciente:', error);
      res.status(500).json({
        error: "Erro ao buscar paciente",
        message: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  });

  // Obter estatísticas gerais
  app.get("/api/estatisticas", async (req, res) => {
    try {
      const sql = `
        SELECT 
          COUNT(*) as "totalSinistros",
          SUM(CASE WHEN status = 'PENDENTE' THEN 1 ELSE 0 END) as "sinistrosPendentes",
          SUM(CASE WHEN status = 'APROVADO' THEN 1 ELSE 0 END) as "sinistrosAprovados",
          SUM(CASE WHEN status = 'REJEITADO' THEN 1 ELSE 0 END) as "sinistrosRejeitados",
          SUM(valor_total) as "valorTotalSinistros",
          AVG(valor_total) as "valorMedioPorSinistro"
        FROM sinistros
      `;

      const result = await executeQuery<Estatisticas>(sql);

      if (result.length === 0) {
        return res.json({
          totalSinistros: 0,
          sinistrosPendentes: 0,
          sinistrosAprovados: 0,
          sinistrosRejeitados: 0,
          valorTotalSinistros: 0,
          valorMedioPorSinistro: 0,
        });
      }

      res.json(result[0]);
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      res.status(500).json({
        error: "Erro ao buscar estatísticas",
        message: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  });

  // Criar novo sinistro
  app.post("/api/sinistros", async (req, res) => {
    try {
      const data = insertSinistroSchema.parse(req.body);

      const sql = `
        INSERT INTO sinistros (
          id, numero_sinistro, paciente_id, data_ocorrencia, data_registro, 
          status, valor_total, tipo_sinistro, descricao, hospital
        ) VALUES (
          seq_sinistros.NEXTVAL, :numeroSinistro, :pacienteId, 
          TO_DATE(:dataOcorrencia, 'YYYY-MM-DD'), SYSDATE, 
          :status, :valorTotal, :tipoSinistro, :descricao, :hospital
        ) RETURNING id INTO :id
      `;

      const binds = {
        numeroSinistro: data.numeroSinistro,
        pacienteId: data.pacienteId,
        dataOcorrencia: data.dataOcorrencia,
        status: data.status,
        valorTotal: data.valorTotal,
        tipoSinistro: data.tipoSinistro,
        descricao: data.descricao ?? null,
        hospital: data.hospital ?? null,
        id: { dir: 3003, type: 2002 }, // OUT parameter
      };

      const result = await executeUpdate(sql, binds);

      if (result.rowsAffected && result.rowsAffected > 0) {
        const newId = result.outBinds?.id;
        res.status(201).json({
          message: "Sinistro criado com sucesso",
          id: newId
        });
      } else {
        res.status(500).json({
          error: "Erro ao criar sinistro",
          message: "Nenhuma linha foi afetada"
        });
      }
    } catch (error) {
      console.error('Erro ao criar sinistro:', error);
      
      // Distinguir erros de validação de erros de banco de dados
      if (error && typeof error === 'object' && 'issues' in error) {
        // Erro Zod
        res.status(400).json({
          error: "Erro de validação",
          message: error instanceof Error ? error.message : "Dados inválidos",
          details: 'issues' in error ? error.issues : undefined
        });
      } else {
        res.status(500).json({
          error: "Erro ao criar sinistro",
          message: error instanceof Error ? error.message : "Erro desconhecido"
        });
      }
    }
  });

  // Atualizar sinistro existente
  app.put("/api/sinistros/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          error: "ID inválido",
          message: "O ID deve ser um número válido"
        });
      }

      const data = updateSinistroSchema.parse(req.body);

      // Construir SQL dinâmico baseado nos campos fornecidos
      const updates: string[] = [];
      const binds: any = { id };

      if (data.numeroSinistro !== undefined) {
        updates.push('numero_sinistro = :numeroSinistro');
        binds.numeroSinistro = data.numeroSinistro;
      }
      if (data.pacienteId !== undefined) {
        updates.push('paciente_id = :pacienteId');
        binds.pacienteId = data.pacienteId;
      }
      if (data.dataOcorrencia !== undefined) {
        updates.push('data_ocorrencia = TO_DATE(:dataOcorrencia, \'YYYY-MM-DD\')');
        binds.dataOcorrencia = data.dataOcorrencia;
      }
      if (data.status !== undefined) {
        updates.push('status = :status');
        binds.status = data.status;
      }
      if (data.valorTotal !== undefined) {
        updates.push('valor_total = :valorTotal');
        binds.valorTotal = data.valorTotal;
      }
      if (data.tipoSinistro !== undefined) {
        updates.push('tipo_sinistro = :tipoSinistro');
        binds.tipoSinistro = data.tipoSinistro;
      }
      if (data.descricao !== undefined) {
        updates.push('descricao = :descricao');
        binds.descricao = data.descricao;
      }
      if (data.hospital !== undefined) {
        updates.push('hospital = :hospital');
        binds.hospital = data.hospital;
      }

      if (updates.length === 0) {
        return res.status(400).json({
          error: "Nenhum campo para atualizar",
          message: "Forneça pelo menos um campo para atualizar"
        });
      }

      const sql = `UPDATE sinistros SET ${updates.join(', ')} WHERE id = :id`;
      const result = await executeUpdate(sql, binds);

      if (result.rowsAffected && result.rowsAffected > 0) {
        res.json({
          message: "Sinistro atualizado com sucesso",
          rowsAffected: result.rowsAffected
        });
      } else {
        res.status(404).json({
          error: "Sinistro não encontrado",
          message: `Nenhum sinistro encontrado com ID ${id}`
        });
      }
    } catch (error) {
      console.error('Erro ao atualizar sinistro:', error);
      
      // Distinguir erros de validação de erros de banco de dados
      if (error && typeof error === 'object' && 'issues' in error) {
        res.status(400).json({
          error: "Erro de validação",
          message: error instanceof Error ? error.message : "Dados inválidos"
        });
      } else {
        res.status(500).json({
          error: "Erro ao atualizar sinistro",
          message: error instanceof Error ? error.message : "Erro desconhecido"
        });
      }
    }
  });

  // Deletar sinistro
  app.delete("/api/sinistros/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          error: "ID inválido",
          message: "O ID deve ser um número válido"
        });
      }

      const sql = 'DELETE FROM sinistros WHERE id = :id';
      const result = await executeUpdate(sql, { id });

      if (result.rowsAffected && result.rowsAffected > 0) {
        res.json({
          message: "Sinistro deletado com sucesso",
          rowsAffected: result.rowsAffected
        });
      } else {
        res.status(404).json({
          error: "Sinistro não encontrado",
          message: `Nenhum sinistro encontrado com ID ${id}`
        });
      }
    } catch (error) {
      console.error('Erro ao deletar sinistro:', error);
      res.status(500).json({
        error: "Erro ao deletar sinistro",
        message: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  });

  // Criar novo paciente
  app.post("/api/pacientes", async (req, res) => {
    try {
      const data = insertPacienteSchema.parse(req.body);

      const sql = `
        INSERT INTO pacientes (
          id, nome, cpf, data_nascimento, plano, numero_carteirinha, telefone, email
        ) VALUES (
          seq_pacientes.NEXTVAL, :nome, :cpf, TO_DATE(:dataNascimento, 'YYYY-MM-DD'),
          :plano, :numeroCarteirinha, :telefone, :email
        ) RETURNING id INTO :id
      `;

      const binds = {
        nome: data.nome,
        cpf: data.cpf,
        dataNascimento: data.dataNascimento,
        plano: data.plano,
        numeroCarteirinha: data.numeroCarteirinha,
        telefone: data.telefone ?? null,
        email: data.email ?? null,
        id: { dir: 3003, type: 2002 }, // OUT parameter
      };

      const result = await executeUpdate(sql, binds);

      if (result.rowsAffected && result.rowsAffected > 0) {
        const newId = result.outBinds?.id;
        res.status(201).json({
          message: "Paciente criado com sucesso",
          id: newId
        });
      } else {
        res.status(500).json({
          error: "Erro ao criar paciente",
          message: "Nenhuma linha foi afetada"
        });
      }
    } catch (error) {
      console.error('Erro ao criar paciente:', error);
      
      // Distinguir erros de validação de erros de banco de dados
      if (error && typeof error === 'object' && 'issues' in error) {
        // Erro Zod
        res.status(400).json({
          error: "Erro de validação",
          message: error instanceof Error ? error.message : "Dados inválidos",
          details: 'issues' in error ? error.issues : undefined
        });
      } else {
        res.status(500).json({
          error: "Erro ao criar paciente",
          message: error instanceof Error ? error.message : "Erro desconhecido"
        });
      }
    }
  });

  // Atualizar paciente existente
  app.put("/api/pacientes/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          error: "ID inválido",
          message: "O ID deve ser um número válido"
        });
      }

      const data = updatePacienteSchema.parse(req.body);

      // Construir SQL dinâmico baseado nos campos fornecidos
      const updates: string[] = [];
      const binds: any = { id };

      if (data.nome !== undefined) {
        updates.push('nome = :nome');
        binds.nome = data.nome;
      }
      if (data.cpf !== undefined) {
        updates.push('cpf = :cpf');
        binds.cpf = data.cpf;
      }
      if (data.dataNascimento !== undefined) {
        updates.push('data_nascimento = TO_DATE(:dataNascimento, \'YYYY-MM-DD\')');
        binds.dataNascimento = data.dataNascimento;
      }
      if (data.plano !== undefined) {
        updates.push('plano = :plano');
        binds.plano = data.plano;
      }
      if (data.numeroCarteirinha !== undefined) {
        updates.push('numero_carteirinha = :numeroCarteirinha');
        binds.numeroCarteirinha = data.numeroCarteirinha;
      }
      if (data.telefone !== undefined) {
        updates.push('telefone = :telefone');
        binds.telefone = data.telefone;
      }
      if (data.email !== undefined) {
        updates.push('email = :email');
        binds.email = data.email;
      }

      if (updates.length === 0) {
        return res.status(400).json({
          error: "Nenhum campo para atualizar",
          message: "Forneça pelo menos um campo para atualizar"
        });
      }

      const sql = `UPDATE pacientes SET ${updates.join(', ')} WHERE id = :id`;
      const result = await executeUpdate(sql, binds);

      if (result.rowsAffected && result.rowsAffected > 0) {
        res.json({
          message: "Paciente atualizado com sucesso",
          rowsAffected: result.rowsAffected
        });
      } else {
        res.status(404).json({
          error: "Paciente não encontrado",
          message: `Nenhum paciente encontrado com ID ${id}`
        });
      }
    } catch (error) {
      console.error('Erro ao atualizar paciente:', error);
      
      // Distinguir erros de validação de erros de banco de dados
      if (error && typeof error === 'object' && 'issues' in error) {
        res.status(400).json({
          error: "Erro de validação",
          message: error instanceof Error ? error.message : "Dados inválidos"
        });
      } else {
        res.status(500).json({
          error: "Erro ao atualizar paciente",
          message: error instanceof Error ? error.message : "Erro desconhecido"
        });
      }
    }
  });

  // Deletar paciente
  app.delete("/api/pacientes/:id", async (req, res) => {
    try {
      const id = Number(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({
          error: "ID inválido",
          message: "O ID deve ser um número válido"
        });
      }

      const sql = 'DELETE FROM pacientes WHERE id = :id';
      const result = await executeUpdate(sql, { id });

      if (result.rowsAffected && result.rowsAffected > 0) {
        res.json({
          message: "Paciente deletado com sucesso",
          rowsAffected: result.rowsAffected
        });
      } else {
        res.status(404).json({
          error: "Paciente não encontrado",
          message: `Nenhum paciente encontrado com ID ${id}`
        });
      }
    } catch (error) {
      console.error('Erro ao deletar paciente:', error);
      res.status(500).json({
        error: "Erro ao deletar paciente",
        message: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  });

  // ============================================
  // ENDPOINTS DE CONTRATOS (Leitura apenas - tabela pls_contrato)
  // ============================================

  // ENDPOINT DE TESTE - Retorna dados fixos sem consultar Oracle
  app.get("/api/contratos-teste", async (req, res) => {
    try {
      console.log('🧪 Endpoint de teste /api/contratos-teste chamado');
      
      const dadosTeste = {
        data: [
          {
            nrContrato: 1270,
            cdCgcEstipulante: "04347163000148",
            dsEstipulante: "MOTO HONDA DA AMAZONIA LTDA"
          },
          {
            nrContrato: 2444,
            cdCgcEstipulante: "08281892000158",
            dsEstipulante: "2E DESPACHOS ADUANEIROS LTDA"
          },
          {
            nrContrato: 3501,
            cdCgcEstipulante: "12345678000190",
            dsEstipulante: "EMPRESA TESTE LTDA"
          }
        ],
        pagination: {
          limit: 50,
          offset: 0,
          total: 3
        }
      };
      
      console.log('✅ Retornando dados de teste:', dadosTeste.data.length, 'contratos');
      res.json(dadosTeste);
    } catch (error) {
      console.error('❌ Erro no endpoint de teste:', error);
      res.status(500).json({
        error: "Erro no endpoint de teste",
        message: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  });

  // Listar todos os contratos
  app.get("/api/contratos", async (req, res) => {
    try {
      const limit = req.query.limit ? Number(req.query.limit) : 50;
      const offset = req.query.offset ? Number(req.query.offset) : 0;
      const search = req.query.search as string | undefined;

      const binds: any = {};
      let whereClause = 'WHERE 1=1 AND a.cd_classif_contrato NOT IN (3)';

      // Filtro de busca (número do contrato ou razão social)
      if (search) {
        whereClause += ` AND (
          TO_CHAR(a.NR_CONTRATO) LIKE :search 
          OR EXISTS (
            SELECT 1 FROM pessoa_juridica pj 
            WHERE pj.cd_cgc = a.cd_cgc_estipulante 
            AND UPPER(pj.ds_razao_social) LIKE UPPER(:searchUpper)
          )
        )`;
        binds.search = `%${search}%`;
        binds.searchUpper = `%${search}%`;
      }

      // 1. Query de contagem total
      const countSql = `
        SELECT COUNT(*) as total
        FROM pls_contrato a
        ${whereClause}
      `;
      
      const countResult = await executeQuery<{ total: number }>(countSql, binds);
      const total = countResult[0]?.total || 0;

      // 2. Query de dados paginados
      const dataSql = `
        SELECT 
          a.NR_CONTRATO as "nrContrato",
          a.CD_CGC_ESTIPULANTE as "cdCgcEstipulante",
          (SELECT SUBSTR(ds_razao_social, 1, 255) 
           FROM pessoa_juridica x 
           WHERE x.cd_cgc = a.cd_cgc_estipulante) as "dsEstipulante",
          a.cd_classif_contrato as "cdClassifContrato",
          (SELECT SUBSTR(ds_classificacao, 1, 255) 
           FROM pls_classificacao_contrato x 
           WHERE x.cd_classificacao = a.cd_classif_contrato) as "dsClassificacao"
        FROM pls_contrato a
        ${whereClause}
        ORDER BY 3 ASC
        OFFSET :offset ROWS FETCH NEXT :limit ROWS ONLY
      `;
      
      binds.offset = offset;
      binds.limit = limit;

      const contratos = await executeQuery<Contrato>(dataSql, binds);

      // 3. Retornar com paginação
      res.json({
        data: contratos,
        pagination: {
          limit,
          offset,
          total
        }
      });
    } catch (error) {
      console.error('Erro ao buscar contratos:', error);
      res.status(500).json({
        error: "Erro ao buscar contratos",
        message: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  });

  // Buscar contrato por número
  app.get("/api/contratos/:nrContrato", async (req, res) => {
    try {
      const nrContrato = Number(req.params.nrContrato);

      if (isNaN(nrContrato)) {
        return res.status(400).json({
          error: "Número de contrato inválido",
          message: "O número do contrato deve ser um número válido"
        });
      }

      const sql = `
        SELECT 
          a.NR_CONTRATO as "nrContrato",
          a.CD_CGC_ESTIPULANTE as "cdCgcEstipulante",
          (SELECT SUBSTR(ds_razao_social, 1, 255) 
           FROM pessoa_juridica x 
           WHERE x.cd_cgc = a.cd_cgc_estipulante) as "dsEstipulante",
          a.cd_classif_contrato as "cdClassifContrato",
          (SELECT SUBSTR(ds_classificacao, 1, 255) 
           FROM pls_classificacao_contrato x 
           WHERE x.cd_classificacao = a.cd_classif_contrato) as "dsClassificacao"
        FROM pls_contrato a
        WHERE a.NR_CONTRATO = :nrContrato
      `;

      const contratos = await executeQuery<Contrato>(sql, { nrContrato });

      if (contratos.length === 0) {
        return res.status(404).json({
          error: "Contrato não encontrado",
          message: `Nenhum contrato encontrado com número ${nrContrato}`
        });
      }

      res.json(contratos[0]);
    } catch (error) {
      console.error('Erro ao buscar contrato:', error);
      res.status(500).json({
        error: "Erro ao buscar contrato",
        message: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  });

  // ============================================
  // ENDPOINTS DE GRUPOS DE RECEITA
  // ============================================

  // Listar grupos de receita ativos
  app.get("/api/grupos-receita", async (req, res) => {
    try {
      const sql = `
        SELECT DS_GRUPO_RECEITA as "dsGrupoReceita"
        FROM GRUPO_RECEITA
        WHERE 1=1
        AND IE_SITUACAO = 'A'
        ORDER BY DS_GRUPO_RECEITA ASC
      `;

      const gruposReceita = await executeQuery<{ dsGrupoReceita: string }>(sql);

      res.json({
        data: gruposReceita,
        total: gruposReceita.length
      });
    } catch (error) {
      console.error('Erro ao buscar grupos de receita:', error);
      res.status(500).json({
        error: "Erro ao buscar grupos de receita",
        message: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  });

  // ============================================
  // ENDPOINTS DE DETALHAMENTO DE APÓLICES
  // ============================================

  // Buscar detalhamento de uma apólice (procedimentos e atendimentos)
  app.get("/api/apolices/:nrContrato/detalhamento", async (req, res) => {
    try {
      const nrContrato = Number(req.params.nrContrato);

      if (isNaN(nrContrato)) {
        return res.status(400).json({
          error: "Número de contrato inválido",
          message: "O número do contrato deve ser um número válido"
        });
      }

      // Validar e extrair parâmetros de query
      const filtros = filtroDetalhamentoApoliceSchema.parse({
        nrContrato,
        dataInicio: req.query.dataInicio || '01/10/2025',
        dataFim: req.query.dataFim || '31/10/2025',
        grupoReceita: req.query.grupoReceita as string | undefined,
        limit: req.query.limit ? Number(req.query.limit) : 100,
        offset: req.query.offset ? Number(req.query.offset) : 0,
      });

      // Buscar detalhamento usando o módulo de queries
      const resultados = await getDetalhamentoApolice(filtros);

      res.json({
        data: resultados,
        pagination: {
          limit: filtros.limit,
          offset: filtros.offset,
          total: resultados.length,
        },
        filters: {
          nrContrato: filtros.nrContrato,
          dataInicio: filtros.dataInicio,
          dataFim: filtros.dataFim,
          grupoReceita: filtros.grupoReceita || 'TODAS'
        }
      });
    } catch (error) {
      console.error('Erro ao buscar detalhamento de apólice:', error);
      
      // Distinguir erros de validação de erros de banco de dados
      if (error && typeof error === 'object' && 'issues' in error) {
        res.status(400).json({
          error: "Erro de validação",
          message: error instanceof Error ? error.message : "Parâmetros inválidos"
        });
      } else {
        res.status(500).json({
          error: "Erro ao buscar detalhamento de apólice",
          message: error instanceof Error ? error.message : "Erro desconhecido"
        });
      }
    }
  });

  // Endpoint de informações da API
  app.get("/api", (req, res) => {
    res.json({
      name: "API de Sinistralidade Hospitalar",
      version: "1.0.0",
      description: "API REST para gerenciamento de sinistros hospitalares integrada com Oracle Database",
      endpoints: [
        { method: "GET", path: "/api/health", description: "Verificar status da API e conexão com Oracle" },
        { method: "GET", path: "/api/sinistros", description: "Listar sinistros com filtros opcionais" },
        { method: "GET", path: "/api/sinistros/:id", description: "Obter detalhes de um sinistro" },
        { method: "POST", path: "/api/sinistros", description: "Criar novo sinistro" },
        { method: "PUT", path: "/api/sinistros/:id", description: "Atualizar sinistro existente" },
        { method: "DELETE", path: "/api/sinistros/:id", description: "Deletar sinistro" },
        { method: "GET", path: "/api/pacientes", description: "Listar pacientes" },
        { method: "GET", path: "/api/pacientes/:id", description: "Obter detalhes de um paciente" },
        { method: "POST", path: "/api/pacientes", description: "Criar novo paciente" },
        { method: "PUT", path: "/api/pacientes/:id", description: "Atualizar paciente existente" },
        { method: "DELETE", path: "/api/pacientes/:id", description: "Deletar paciente" },
        { method: "GET", path: "/api/estatisticas", description: "Obter estatísticas gerais" },
        { method: "GET", path: "/api/contratos", description: "Listar contratos (pls_contrato)" },
        { method: "GET", path: "/api/contratos/:nrContrato", description: "Buscar contrato por número" },
        { method: "GET", path: "/api/grupos-receita", description: "Listar grupos de receita ativos" },
        { method: "GET", path: "/api/apolices/:nrContrato/detalhamento", description: "Buscar detalhamento de apólice (procedimentos e atendimentos)" },
      ]
    });
  });

  const httpServer = createServer(app);

  return httpServer;
}
