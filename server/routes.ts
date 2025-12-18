import type { Express } from "express";
import { createServer, type Server } from "http";
import { z } from "zod";
import { executeQuery, executeUpdate, testConnection, initializePool } from "./oracle-db";
import type { Sinistro, Paciente, Estatisticas, FiltroSinistros, Contrato, FiltroDetalhamentoApolice } from "@shared/schema";
import { filtroSinistrosSchema, insertSinistroSchema, updateSinistroSchema, insertPacienteSchema, updatePacienteSchema, filtroDetalhamentoApoliceSchema } from "@shared/schema";
import { getDetalhamentoApolice, getDetalhamentoApoliceNoDistinct, getDetalhamentoApoliceDeduplicado } from "./queries/detalhamento-apolice";
import { buscaPacientePorNome, listarClassificacoes, getDetalhamentoConsolidadoPorClassificacao, getResumoContratos } from "./queries/novas-apis";
import { insertSinistralidade, truncateSinistralidade, countSinistralidade } from "./queries/samel-inserts";
import { listarBreakevens, getBreakevenPorContrato, upsertBreakeven, deleteBreakeven, upsertBreakevensBatch } from "./queries/breakeven";
import { getResumoContratosImport, getDetalhamentoImport, buscaPacienteImport, getGruposReceitaImport, getGruposReceitaRanking } from "./queries/sinistralidade-import";
import { listarEvolucaoContrato, buscarEvolucaoContrato, inserirEvolucaoContrato, atualizarEvolucaoContrato, excluirEvolucaoContrato, upsertEvolucaoContrato, buscarEvolucaoConsolidada } from "./queries/evolucao-contrato";
import { sinistralityImportRequestSchema, insertBreakevenSchema } from "@shared/schema";

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

  // Busca de paciente por nome em todos os contratos (DEVE VIR ANTES de /api/pacientes/:id)
  app.get("/api/pacientes/busca", async (req, res) => {
    try {
      const nome = req.query.nome as string;
      const dataInicio = req.query.dataInicio as string;
      const dataFim = req.query.dataFim as string;
      const grupoReceita = req.query.grupoReceita as string | undefined;

      if (!nome || nome.trim().length < 3) {
        return res.status(400).json({
          error: "Parâmetro inválido",
          message: "O nome do paciente deve ter pelo menos 3 caracteres"
        });
      }

      if (!dataInicio || !dataFim) {
        return res.status(400).json({
          error: "Parâmetros obrigatórios",
          message: "dataInicio e dataFim são obrigatórios (formato DD/MM/YYYY)"
        });
      }

      const resultados = await buscaPacientePorNome({
        nome: nome.trim(),
        dataInicio,
        dataFim,
        grupoReceita
      });

      res.json({
        data: resultados,
        total: resultados.length,
        paciente: nome.trim().toUpperCase(),
        filters: {
          dataInicio,
          dataFim,
          grupoReceita: grupoReceita || 'TODOS'
        }
      });
    } catch (error) {
      console.error('Erro ao buscar paciente:', error);
      res.status(500).json({
        error: "Erro ao buscar paciente",
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

  // Resumo de contratos para dashboard
  app.get("/api/contratos/resumo", async (req, res) => {
    try {
      const dataInicio = req.query.dataInicio as string;
      const dataFim = req.query.dataFim as string;
      const contratos = req.query.contratos as string | undefined;
      const grupoReceita = req.query.grupoReceita as string | undefined;

      if (!dataInicio || !dataFim) {
        return res.status(400).json({
          error: "Parâmetros obrigatórios",
          message: "dataInicio e dataFim são obrigatórios (formato DD/MM/YYYY)"
        });
      }

      const resultados = await getResumoContratos({
        dataInicio,
        dataFim,
        contratos,
        grupoReceita
      });

      res.json({
        data: resultados,
        total: resultados.length,
        filters: {
          dataInicio,
          dataFim,
          contratos: contratos || 'TODOS',
          grupoReceita: grupoReceita || 'TODOS'
        }
      });
    } catch (error) {
      console.error('Erro ao buscar resumo de contratos:', error);
      res.status(500).json({
        error: "Erro ao buscar resumo de contratos",
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
      let whereClause = 'WHERE 1=1 AND a.cd_classif_contrato NOT IN (3) AND a.ie_situacao NOT IN (4)';

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
  // Endpoint DEBUG: exportar IDs únicos para comparação
  app.get("/api/apolices/:nrContrato/detalhamento/debug-ids", async (req, res) => {
    try {
      const nrContrato = Number(req.params.nrContrato);
      
      const filtros = filtroDetalhamentoApoliceSchema.parse({
        nrContrato,
        dataInicio: req.query.dataInicio || '01/10/2025',
        dataFim: req.query.dataFim || '31/10/2025',
        limit: 10000,
        offset: 0,
      });

      const resultados = await getDetalhamentoApolice(filtros);
      
      // Gerar identificadores únicos para cada registro
      const ids = resultados.map((r, idx) => ({
        index: idx + 1,
        atendimento: r.atendimento,
        data: r.data,
        hora: r.hora,
        cod_tuss: r.cod_tuss,
        nm_proced: r.nm_proced,
        beneficiario: r.beneficiario,
        prestador: r.prestador,
        valor: r.valor,
        // Fingerprint único combinando campos principais
        fingerprint: `${r.atendimento}|${r.data}|${r.hora}|${r.cod_tuss}|${r.nm_proced}|${r.beneficiario}`
      }));
      
      res.json({
        total: ids.length,
        message: `Exportando ${ids.length} identificadores únicos para comparação com SQL Developer (esperado: 526)`,
        ids: ids
      });
    } catch (error) {
      res.status(500).json({
        error: "Erro ao exportar IDs",
        message: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  });

  // Endpoint PRINCIPAL DEDUPLICADO: retornar dados deduplicados em JavaScript
  app.get("/api/apolices/:nrContrato/detalhamento-deduplicado", async (req, res) => {
    try {
      const nrContrato = Number(req.params.nrContrato);
      
      if (isNaN(nrContrato)) {
        return res.status(400).json({
          error: "Número de contrato inválido",
          message: "O número do contrato deve ser um número válido"
        });
      }

      const filtros = filtroDetalhamentoApoliceSchema.parse({
        nrContrato,
        dataInicio: req.query.dataInicio || '01/10/2025',
        dataFim: req.query.dataFim || '31/10/2025',
        grupoReceita: req.query.grupoReceita as string | undefined,
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        offset: req.query.offset ? Number(req.query.offset) : 0,
      });

      // Buscar e deduplicar
      const { deduplicated, duplicates } = await getDetalhamentoApoliceDeduplicado(filtros);
      
      // Aplicar filtro de grupo receita se fornecido
      let filtered = deduplicated;
      if (filtros.grupoReceita && filtros.grupoReceita.toUpperCase() !== 'TODAS') {
        filtered = deduplicated.filter(
          r => r.gruporeceita?.toUpperCase() === filtros.grupoReceita?.toUpperCase()
        );
      }

      // Aplicar paginação
      let paginated = filtered;
      if (filtros.limit !== undefined) {
        const start = filtros.offset || 0;
        const end = start + filtros.limit;
        paginated = filtered.slice(start, end);
      }
      
      // Calcular somas
      const somaValor = filtered.reduce((acc, r) => acc + (Number(r.valor) || 0), 0);
      const somaValorTotal = filtered.reduce((acc, r) => acc + (Number(r.valortotal) || 0), 0);
      
      res.json({
        data: paginated,
        pagination: {
          limit: filtros.limit || filtered.length,
          offset: filtros.offset,
          total: filtered.length,
        },
        totals: {
          somaValor: somaValor.toFixed(2),
          somaValorTotal: somaValorTotal.toFixed(2)
        },
        deduplication: {
          totalOriginal: deduplicated.length + duplicates.length,
          totalDeduplicado: deduplicated.length,
          duplicatasRemovidas: duplicates.length,
          exemploDuplicatas: duplicates.slice(0, 3)
        },
        filters: {
          nrContrato: filtros.nrContrato,
          dataInicio: filtros.dataInicio,
          dataFim: filtros.dataFim,
          grupoReceita: filtros.grupoReceita || 'TODAS'
        }
      });
    } catch (error) {
      console.error('Erro ao buscar detalhamento deduplicado:', error);
      
      if (error && typeof error === 'object' && 'issues' in error) {
        res.status(400).json({
          error: "Erro de validação",
          message: "Os parâmetros fornecidos são inválidos",
          details: error
        });
      } else {
        res.status(500).json({
          error: "Erro ao buscar detalhamento",
          message: error instanceof Error ? error.message : "Erro desconhecido"
        });
      }
    }
  });

  // Endpoint ANÁLISE COMPLETA: compara 3 versões (COM DISTINCT vs SEM DISTINCT vs DEDUPLICADO)
  app.get("/api/apolices/:nrContrato/detalhamento/analise-completa", async (req, res) => {
    try {
      const nrContrato = Number(req.params.nrContrato);
      
      if (isNaN(nrContrato)) {
        return res.status(400).json({
          error: "Número de contrato inválido"
        });
      }

      const filtros = filtroDetalhamentoApoliceSchema.parse({
        nrContrato,
        dataInicio: req.query.dataInicio || '01/10/2025',
        dataFim: req.query.dataFim || '31/10/2025',
      });

      console.log('🔬 ANÁLISE COMPLETA: 3 VERSÕES (COM DISTINCT | SEM DISTINCT | DEDUPLICADO JS)');
      
      // Executar todas as versões
      const [comDistinct, semDistinct, resultadoDedup] = await Promise.all([
        getDetalhamentoApolice(filtros),
        getDetalhamentoApoliceNoDistinct(filtros),
        getDetalhamentoApoliceDeduplicado(filtros)
      ]);
      
      const { deduplicated, duplicates } = resultadoDedup;
      
      // Calcular somas para cada versão
      const calcularSomas = (registros: any[]) => ({
        somaValor: registros.reduce((acc, r) => acc + (Number(r.valor) || 0), 0),
        somaValorTotal: registros.reduce((acc, r) => acc + (Number(r.valortotal) || 0), 0)
      });
      
      const somasComDistinct = calcularSomas(comDistinct);
      const somasSemDistinct = calcularSomas(semDistinct);
      const somasDeduplicado = calcularSomas(deduplicated);
      
      res.json({
        filters: {
          nrContrato: filtros.nrContrato,
          dataInicio: filtros.dataInicio,
          dataFim: filtros.dataFim,
        },
        analise: {
          versaoComDistinct: {
            descricao: "SQL original com 9 DISTINCTs (versão produção)",
            totalRegistros: comDistinct.length,
            somaValor: somasComDistinct.somaValor.toFixed(2),
            somaValorTotal: somasComDistinct.somaValorTotal.toFixed(2)
          },
          versaoSemDistinct: {
            descricao: "SQL sem nenhum DISTINCT (todos os registros incluindo duplicatas)",
            totalRegistros: semDistinct.length,
            somaValor: somasSemDistinct.somaValor.toFixed(2),
            somaValorTotal: somasSemDistinct.somaValorTotal.toFixed(2)
          },
          versaoDeduplicadaJS: {
            descricao: "SQL sem DISTINCT + deduplicação em JavaScript (ROW_NUMBER lógico)",
            totalRegistros: deduplicated.length,
            duplicatasRemovidas: duplicates.length,
            somaValor: somasDeduplicado.somaValor.toFixed(2),
            somaValorTotal: somasDeduplicado.somaValorTotal.toFixed(2),
            chaveDeduplica: "atendimento|data|hora|cod_tuss|nm_proced|beneficiario"
          }
        },
        comparacao: {
          distictVsDeduplicado: {
            diferencaRegistros: deduplicated.length - comDistinct.length,
            diferencaValorTotal: (somasDeduplicado.somaValorTotal - somasComDistinct.somaValorTotal).toFixed(2),
            mensagem: deduplicated.length === comDistinct.length 
              ? "✅ MESMA quantidade de registros" 
              : deduplicated.length > comDistinct.length
                ? `⚠️ Deduplicado tem ${deduplicated.length - comDistinct.length} registros A MAIS`
                : `⚠️ Deduplicado tem ${comDistinct.length - deduplicated.length} registros A MENOS`
          },
          sqlDeveloperComparacao: {
            esperado: 526,
            obtidoComDistinct: comDistinct.length,
            obtidoDeduplicado: deduplicated.length,
            statusDistinct: comDistinct.length >= 526 ? "✅ OK" : `❌ Faltam ${526 - comDistinct.length} registros`,
            statusDeduplicado: deduplicated.length >= 526 ? "✅ OK" : `❌ Faltam ${526 - deduplicated.length} registros`
          }
        },
        duplicatasDetalhadas: {
          total: duplicates.length,
          exemplos: duplicates.slice(0, 5).map(d => ({
            chave: d.chave,
            diferencaValor: d.diferencaValor.toFixed(2),
            diferencaValorTotal: d.diferencaValorTotal.toFixed(2)
          }))
        },
        recomendacao: deduplicated.length >= comDistinct.length 
          ? "✅ Recomendamos usar versão DEDUPLICADA que preserva mais dados"
          : "⚠️ Revisar: versão deduplicada está removendo mais registros que DISTINCT"
      });
    } catch (error) {
      console.error('Erro na análise completa:', error);
      res.status(500).json({
        error: "Erro na análise",
        message: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  });

  // Endpoint DEBUG: retornar dados SEM DISTINCT (todos os registros incluindo duplicatas)
  app.get("/api/apolices/:nrContrato/detalhamento/debug-full", async (req, res) => {
    try {
      const nrContrato = Number(req.params.nrContrato);
      
      if (isNaN(nrContrato)) {
        return res.status(400).json({
          error: "Número de contrato inválido",
          message: "O número do contrato deve ser um número válido"
        });
      }

      const filtros = filtroDetalhamentoApoliceSchema.parse({
        nrContrato,
        dataInicio: req.query.dataInicio || '01/10/2025',
        dataFim: req.query.dataFim || '31/10/2025',
      });

      // Buscar usando SQL SEM DISTINCT
      const resultados = await getDetalhamentoApoliceNoDistinct(filtros);
      
      // Calcular soma de valores
      const somaValor = resultados.reduce((acc, r) => acc + (Number(r.valor) || 0), 0);
      const somaValorTotal = resultados.reduce((acc, r) => acc + (Number(r.valortotal) || 0), 0);
      
      res.json({
        data: resultados,
        totals: {
          registros: resultados.length,
          somaValor: somaValor.toFixed(2),
          somaValorTotal: somaValorTotal.toFixed(2)
        },
        filters: {
          nrContrato: filtros.nrContrato,
          dataInicio: filtros.dataInicio,
          dataFim: filtros.dataFim,
        },
        warning: "⚠️ Estes dados INCLUEM possíveis duplicatas (SQL executado SEM DISTINCT)"
      });
    } catch (error) {
      console.error('Erro ao buscar detalhamento sem DISTINCT:', error);
      
      if (error && typeof error === 'object' && 'issues' in error) {
        res.status(400).json({
          error: "Erro de validação",
          message: "Os parâmetros fornecidos são inválidos",
          details: error
        });
      } else {
        res.status(500).json({
          error: "Erro ao buscar detalhamento",
          message: error instanceof Error ? error.message : "Erro desconhecido"
        });
      }
    }
  });

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
        limit: req.query.limit ? Number(req.query.limit) : undefined,
        offset: req.query.offset ? Number(req.query.offset) : 0,
      });

      // Buscar detalhamento usando o módulo de queries
      const resultados = await getDetalhamentoApolice(filtros);

      console.log('📤 RESPOSTA FINAL ENVIADA AO CLIENTE:');
      console.log('   → data.length:', resultados.length);
      console.log('   → pagination.total:', resultados.length);
      console.log('   → pagination.limit:', filtros.limit || resultados.length);
      console.log('   → pagination.offset:', filtros.offset);

      res.json({
        data: resultados,
        pagination: {
          limit: filtros.limit || resultados.length,
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

  // ============================================
  // NOVAS APIs PARA LOVABLE
  // ============================================

  // API 2: Listar classificações de contratos com contagem
  app.get("/api/classificacoes", async (req, res) => {
    try {
      const classificacoes = await listarClassificacoes();

      res.json({
        data: classificacoes,
        total: classificacoes.length
      });
    } catch (error) {
      console.error('Erro ao listar classificações:', error);
      res.status(500).json({
        error: "Erro ao listar classificações",
        message: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  });

  // API 3: Detalhamento consolidado por classificação
  app.get("/api/classificacao/:dsClassificacao/detalhamento-consolidado", async (req, res) => {
    try {
      const dsClassificacao = decodeURIComponent(req.params.dsClassificacao);
      const dataInicio = req.query.dataInicio as string;
      const dataFim = req.query.dataFim as string;
      const grupoReceita = req.query.grupoReceita as string | undefined;

      if (!dataInicio || !dataFim) {
        return res.status(400).json({
          error: "Parâmetros obrigatórios",
          message: "dataInicio e dataFim são obrigatórios (formato DD/MM/YYYY)"
        });
      }

      const { data, contratosIncluidos } = await getDetalhamentoConsolidadoPorClassificacao({
        dsClassificacao,
        dataInicio,
        dataFim,
        grupoReceita
      });

      res.json({
        data,
        total: data.length,
        classificacao: dsClassificacao,
        contratos_incluidos: contratosIncluidos.length,
        lista_contratos: contratosIncluidos,
        filters: {
          dataInicio,
          dataFim,
          grupoReceita: grupoReceita || 'TODOS'
        }
      });
    } catch (error) {
      console.error('Erro ao buscar detalhamento consolidado:', error);
      res.status(500).json({
        error: "Erro ao buscar detalhamento consolidado",
        message: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  });

  // ============================================
  // ENDPOINTS DE IMPORTAÇÃO - SAMEL
  // ============================================

  // POST /api/sinistralidade/import - Importar registros para SAMEL.SINISTRALIDADE_IMPORT
  app.post("/api/sinistralidade/import", async (req, res) => {
    try {
      console.log('📥 POST /api/sinistralidade/import');
      console.log('Body recebido:', JSON.stringify(req.body).substring(0, 500));

      // Validar request body
      const validatedData = sinistralityImportRequestSchema.safeParse(req.body);
      
      if (!validatedData.success) {
        console.error('❌ Erro de validação:', validatedData.error.errors);
        return res.status(400).json({
          error: "Erro de validação",
          details: validatedData.error.errors,
        });
      }

      const { registros } = validatedData.data;
      console.log(`✅ Validação OK - ${registros.length} registros`);

      // Executar insert
      const result = await insertSinistralidade(registros);

      if (result.success) {
        res.json({
          success: true,
          message: `${result.insertedCount} registros inseridos com sucesso`,
          insertedCount: result.insertedCount,
          failedCount: result.failedCount,
        });
      } else {
        res.status(207).json({
          success: false,
          message: `Inserção parcial: ${result.insertedCount} inseridos, ${result.failedCount} falharam`,
          insertedCount: result.insertedCount,
          failedCount: result.failedCount,
          errors: result.errors.slice(0, 10), // Limitar a 10 erros
        });
      }
    } catch (error) {
      console.error('❌ Erro ao importar sinistralidade:', error);
      res.status(500).json({
        error: "Erro ao importar sinistralidade",
        message: error instanceof Error ? error.message : "Erro desconhecido",
      });
    }
  });

  // DELETE /api/sinistralidade/import - Limpar tabela (TRUNCATE)
  app.delete("/api/sinistralidade/import", async (req, res) => {
    try {
      console.log('🗑️  DELETE /api/sinistralidade/import (TRUNCATE)');
      
      await truncateSinistralidade();
      
      res.json({
        success: true,
        message: "Tabela SAMEL.SINISTRALIDADE_IMPORT limpa com sucesso",
      });
    } catch (error) {
      console.error('❌ Erro ao limpar tabela:', error);
      res.status(500).json({
        error: "Erro ao limpar tabela",
        message: error instanceof Error ? error.message : "Erro desconhecido",
      });
    }
  });

  // GET /api/sinistralidade/import/count - Contar registros na tabela
  app.get("/api/sinistralidade/import/count", async (req, res) => {
    try {
      const count = await countSinistralidade();
      
      res.json({
        count,
        message: `${count} registros na tabela SAMEL.SINISTRALIDADE_IMPORT`,
      });
    } catch (error) {
      console.error('❌ Erro ao contar registros:', error);
      res.status(500).json({
        error: "Erro ao contar registros",
        message: error instanceof Error ? error.message : "Erro desconhecido",
      });
    }
  });

  // ============================================
  // ENDPOINTS DE BREAKEVEN
  // ============================================

  // GET /api/breakeven - Listar todos os breakevens
  app.get("/api/breakeven", async (req, res) => {
    try {
      const breakevens = await listarBreakevens();
      res.json({
        data: breakevens,
        total: breakevens.length,
      });
    } catch (error) {
      console.error('❌ Erro ao listar breakevens:', error);
      res.status(500).json({
        error: "Erro ao listar breakevens",
        message: error instanceof Error ? error.message : "Erro desconhecido",
      });
    }
  });

  // GET /api/breakeven/:nrContrato - Buscar breakeven de um contrato
  app.get("/api/breakeven/:nrContrato", async (req, res) => {
    try {
      const { nrContrato } = req.params;
      
      const breakeven = await getBreakevenPorContrato(nrContrato);
      
      if (!breakeven) {
        return res.status(404).json({
          error: "Breakeven não encontrado",
          message: `Nenhum breakeven cadastrado para o contrato ${nrContrato}`,
        });
      }
      
      res.json(breakeven);
    } catch (error) {
      console.error('❌ Erro ao buscar breakeven:', error);
      res.status(500).json({
        error: "Erro ao buscar breakeven",
        message: error instanceof Error ? error.message : "Erro desconhecido",
      });
    }
  });

  // POST /api/breakeven - Criar ou atualizar breakeven (upsert)
  app.post("/api/breakeven", async (req, res) => {
    try {
      // Validar body
      const validatedData = insertBreakevenSchema.safeParse(req.body);
      
      if (!validatedData.success) {
        return res.status(400).json({
          error: "Erro de validação",
          details: validatedData.error.errors,
        });
      }
      
      const result = await upsertBreakeven(validatedData.data);
      
      res.status(result.action === 'inserted' ? 201 : 200).json({
        success: true,
        action: result.action,
        message: result.action === 'inserted' 
          ? `Breakeven criado para contrato ${validatedData.data.nrContrato}`
          : `Breakeven atualizado para contrato ${validatedData.data.nrContrato}`,
        data: validatedData.data,
      });
    } catch (error) {
      console.error('❌ Erro ao salvar breakeven:', error);
      res.status(500).json({
        error: "Erro ao salvar breakeven",
        message: error instanceof Error ? error.message : "Erro desconhecido",
      });
    }
  });

  // POST /api/breakeven/batch - Criar ou atualizar múltiplos breakevens
  app.post("/api/breakeven/batch", async (req, res) => {
    try {
      const { registros } = req.body;
      
      if (!Array.isArray(registros) || registros.length === 0) {
        return res.status(400).json({
          error: "Erro de validação",
          message: "Body deve conter um array 'registros' com pelo menos 1 item",
        });
      }
      
      // Validar cada registro
      const validatedRecords: Array<{ nrContrato: string; dsEstipulante?: string | null; breakeven: number }> = [];
      const validationErrors: Array<{ index: number; errors: any }> = [];
      
      registros.forEach((registro: any, index: number) => {
        const result = insertBreakevenSchema.safeParse(registro);
        if (result.success) {
          validatedRecords.push(result.data);
        } else {
          validationErrors.push({ index, errors: result.error.errors });
        }
      });
      
      if (validationErrors.length > 0) {
        return res.status(400).json({
          error: "Erro de validação em alguns registros",
          validationErrors: validationErrors.slice(0, 10),
        });
      }
      
      const result = await upsertBreakevensBatch(validatedRecords);
      
      const responseData = {
        success: result.failed === 0,
        inserted: result.inserted,
        updated: result.updated,
        failed: result.failed,
        total: registros.length,
        errors: result.errors.slice(0, 10),
      };
      
      // Retornar status 207 (Multi-Status) quando há falhas parciais
      if (result.failed > 0) {
        res.status(207).json(responseData);
      } else {
        res.json(responseData);
      }
    } catch (error) {
      console.error('❌ Erro ao salvar breakevens em lote:', error);
      res.status(500).json({
        error: "Erro ao salvar breakevens em lote",
        message: error instanceof Error ? error.message : "Erro desconhecido",
      });
    }
  });

  // DELETE /api/breakeven/:nrContrato - Remover breakeven de um contrato
  app.delete("/api/breakeven/:nrContrato", async (req, res) => {
    try {
      const { nrContrato } = req.params;
      
      const deleted = await deleteBreakeven(nrContrato);
      
      if (!deleted) {
        return res.status(404).json({
          error: "Breakeven não encontrado",
          message: `Nenhum breakeven cadastrado para o contrato ${nrContrato}`,
        });
      }
      
      res.json({
        success: true,
        message: `Breakeven removido para o contrato ${nrContrato}`,
      });
    } catch (error) {
      console.error('❌ Erro ao remover breakeven:', error);
      res.status(500).json({
        error: "Erro ao remover breakeven",
        message: error instanceof Error ? error.message : "Erro desconhecido",
      });
    }
  });

  // ========== ENDPOINTS SINISTRALIDADE IMPORT (Análise) ==========

  // GET /api/sinistralidade/contratos/resumo - Resumo agregado por contrato
  app.get("/api/sinistralidade/contratos/resumo", async (req, res) => {
    try {
      const dataInicio = req.query.dataInicio as string;
      const dataFim = req.query.dataFim as string;
      const contratos = req.query.contratos as string | undefined;
      const grupoReceita = req.query.grupoReceita as string | undefined;

      if (!dataInicio || !dataFim) {
        return res.status(400).json({
          error: "Parâmetros obrigatórios",
          message: "dataInicio e dataFim são obrigatórios (formato DD/MM/YYYY)"
        });
      }

      const resultados = await getResumoContratosImport({
        dataInicio,
        dataFim,
        contratos,
        grupoReceita,
      });

      res.json({
        data: resultados,
        total: resultados.length,
        filters: {
          dataInicio,
          dataFim,
          contratos: contratos || 'TODOS',
          grupoReceita: grupoReceita || 'TODOS',
        }
      });
    } catch (error) {
      console.error('❌ Erro ao buscar resumo de contratos:', error);
      res.status(500).json({
        error: "Erro ao buscar resumo de contratos",
        message: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  });

  // GET /api/sinistralidade/detalhamento - Detalhamento com todos os campos
  app.get("/api/sinistralidade/detalhamento", async (req, res) => {
    try {
      const nrContrato = Number(req.query.nrContrato);
      const dataInicio = req.query.dataInicio as string;
      const dataFim = req.query.dataFim as string;
      const grupoReceita = req.query.grupoReceita as string | undefined;
      const limit = req.query.limit ? Number(req.query.limit) : undefined;
      const offset = req.query.offset ? Number(req.query.offset) : undefined;

      if (!nrContrato || isNaN(nrContrato)) {
        return res.status(400).json({
          error: "Parâmetro inválido",
          message: "nrContrato é obrigatório e deve ser um número"
        });
      }

      if (!dataInicio || !dataFim) {
        return res.status(400).json({
          error: "Parâmetros obrigatórios",
          message: "dataInicio e dataFim são obrigatórios (formato DD/MM/YYYY)"
        });
      }

      const resultado = await getDetalhamentoImport({
        nrContrato,
        dataInicio,
        dataFim,
        grupoReceita,
        limit,
        offset,
      });

      res.json({
        data: resultado.data,
        total: resultado.total,
        pagination: {
          limit: limit || 'ALL',
          offset: offset || 0,
        },
        filters: {
          nrContrato,
          dataInicio,
          dataFim,
          grupoReceita: grupoReceita || 'TODOS',
        }
      });
    } catch (error) {
      console.error('❌ Erro ao buscar detalhamento:', error);
      res.status(500).json({
        error: "Erro ao buscar detalhamento",
        message: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  });

  // GET /api/sinistralidade/pacientes/busca - Busca de paciente por nome
  app.get("/api/sinistralidade/pacientes/busca", async (req, res) => {
    try {
      const nome = req.query.nome as string;
      const dataInicio = req.query.dataInicio as string;
      const dataFim = req.query.dataFim as string;
      const grupoReceita = req.query.grupoReceita as string | undefined;

      if (!nome || nome.trim().length < 3) {
        return res.status(400).json({
          error: "Parâmetro inválido",
          message: "O nome do paciente deve ter pelo menos 3 caracteres"
        });
      }

      if (!dataInicio || !dataFim) {
        return res.status(400).json({
          error: "Parâmetros obrigatórios",
          message: "dataInicio e dataFim são obrigatórios (formato DD/MM/YYYY)"
        });
      }

      const resultados = await buscaPacienteImport({
        nome: nome.trim(),
        dataInicio,
        dataFim,
        grupoReceita,
      });

      res.json({
        data: resultados,
        total: resultados.length,
        paciente: nome.trim().toUpperCase(),
        filters: {
          dataInicio,
          dataFim,
          grupoReceita: grupoReceita || 'TODOS',
        }
      });
    } catch (error) {
      console.error('❌ Erro ao buscar paciente:', error);
      res.status(500).json({
        error: "Erro ao buscar paciente",
        message: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  });

  // GET /api/sinistralidade/grupos-receita/ranking - Ranking dos grupos mais caros
  app.get("/api/sinistralidade/grupos-receita/ranking", async (req, res) => {
    try {
      const { dataInicio, dataFim, limit, contratos } = req.query;
      
      if (!dataInicio || !dataFim) {
        return res.status(400).json({
          error: "Parâmetros obrigatórios",
          message: "dataInicio e dataFim são obrigatórios (formato DD/MM/YYYY)"
        });
      }
      
      // Validar limit se fornecido
      let parsedLimit = 10;
      if (limit !== undefined && limit !== '') {
        parsedLimit = parseInt(String(limit), 10);
        if (isNaN(parsedLimit) || parsedLimit < 1) {
          return res.status(400).json({
            error: "Parâmetro inválido",
            message: "limit deve ser um número inteiro positivo"
          });
        }
      }
      
      const resultado = await getGruposReceitaRanking({
        dataInicio: String(dataInicio),
        dataFim: String(dataFim),
        limit: parsedLimit,
        contratos: contratos ? String(contratos) : undefined,
      });
      
      res.json(resultado);
    } catch (error) {
      console.error('❌ Erro ao buscar ranking de grupos de receita:', error);
      res.status(500).json({
        error: "Erro ao buscar ranking de grupos de receita",
        message: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  });

  // GET /api/sinistralidade/grupos-receita - Lista grupos de receita distintos
  app.get("/api/sinistralidade/grupos-receita", async (req, res) => {
    try {
      const grupos = await getGruposReceitaImport();

      res.json({
        data: grupos,
        total: grupos.length,
      });
    } catch (error) {
      console.error('❌ Erro ao listar grupos de receita:', error);
      res.status(500).json({
        error: "Erro ao listar grupos de receita",
        message: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  });

  // TEMPORÁRIO: Endpoint para verificar nomes das colunas da tabela SINISTRALIDADE_IMPORT
  app.get("/api/sinistralidade/colunas", async (req, res) => {
    try {
      const sql = `SELECT column_name, data_type FROM all_tab_columns WHERE table_name = 'SINISTRALIDADE_IMPORT' AND owner = 'SAMEL' ORDER BY column_id`;
      const { executeQuery } = await import('./oracle-db');
      const colunas = await executeQuery<{ COLUMN_NAME: string; DATA_TYPE: string }>(sql);

      res.json({
        data: colunas,
        total: colunas.length,
      });
    } catch (error) {
      console.error('❌ Erro ao listar colunas:', error);
      res.status(500).json({
        error: "Erro ao listar colunas",
        message: error instanceof Error ? error.message : "Erro desconhecido"
      });
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
        { method: "GET", path: "/api/pacientes/busca", description: "Buscar paciente por nome em todos os contratos (query: nome, dataInicio, dataFim, grupoReceita)" },
        { method: "GET", path: "/api/classificacoes", description: "Listar classificações de contratos com contagem" },
        { method: "GET", path: "/api/classificacao/:dsClassificacao/detalhamento-consolidado", description: "Detalhamento consolidado por classificação (query: dataInicio, dataFim, grupoReceita)" },
        { method: "GET", path: "/api/contratos/resumo", description: "Resumo de contratos com agregações (query: dataInicio, dataFim, contratos, grupoReceita)" },
        { method: "POST", path: "/api/sinistralidade/import", description: "Importar registros para SAMEL.SINISTRALIDADE_IMPORT" },
        { method: "DELETE", path: "/api/sinistralidade/import", description: "Limpar tabela SAMEL.SINISTRALIDADE_IMPORT (TRUNCATE)" },
        { method: "GET", path: "/api/sinistralidade/import/count", description: "Contar registros na tabela SAMEL.SINISTRALIDADE_IMPORT" },
        { method: "GET", path: "/api/breakeven", description: "Listar todos os breakevens cadastrados" },
        { method: "GET", path: "/api/breakeven/:nrContrato", description: "Buscar breakeven de um contrato específico" },
        { method: "POST", path: "/api/breakeven", description: "Criar ou atualizar breakeven (upsert)" },
        { method: "POST", path: "/api/breakeven/batch", description: "Criar ou atualizar múltiplos breakevens em lote" },
        { method: "DELETE", path: "/api/breakeven/:nrContrato", description: "Remover breakeven de um contrato" },
        { method: "GET", path: "/api/sinistralidade/contratos/resumo", description: "Resumo agregado por contrato da sinistralidade importada (query: dataInicio, dataFim, contratos, grupoReceita)" },
        { method: "GET", path: "/api/sinistralidade/detalhamento", description: "Detalhamento completo da sinistralidade importada (query: nrContrato, dataInicio, dataFim, grupoReceita, limit, offset)" },
        { method: "GET", path: "/api/sinistralidade/pacientes/busca", description: "Busca de paciente por nome na sinistralidade importada (query: nome, dataInicio, dataFim, grupoReceita)" },
        { method: "GET", path: "/api/sinistralidade/grupos-receita/ranking", description: "Ranking dos grupos de receita mais caros (query: dataInicio, dataFim, limit)" },
        { method: "GET", path: "/api/sinistralidade/grupos-receita", description: "Lista grupos de receita distintos da sinistralidade importada" },
        { method: "GET", path: "/api/evolucao-contrato/consolidado", description: "Dados consolidados para dashboard (query: dataInicio, dataFim, contratos)" },
        { method: "GET", path: "/api/evolucao-contrato/:nrContrato", description: "Listar evolução mensal de um contrato" },
        { method: "GET", path: "/api/evolucao-contrato/:nrContrato/:periodo", description: "Buscar registro específico de evolução" },
        { method: "POST", path: "/api/evolucao-contrato", description: "Inserir ou atualizar evolução contrato (upsert)" },
        { method: "PUT", path: "/api/evolucao-contrato/:nrContrato/:periodo", description: "Atualizar evolução contrato existente" },
        { method: "DELETE", path: "/api/evolucao-contrato/:nrContrato/:periodo", description: "Remover evolução contrato" },
      ]
    });
  });

  // ============================================================
  // ENDPOINTS EVOLUÇÃO CONTRATO (SINI_EVOLUCAO_CONTRATO)
  // ============================================================

  // GET /api/evolucao-contrato/consolidado - Dados consolidados para dashboard
  app.get("/api/evolucao-contrato/consolidado", async (req, res) => {
    try {
      const { dataInicio, dataFim, contratos } = req.query;
      
      if (!dataInicio || !dataFim) {
        return res.status(400).json({
          error: "Parâmetros obrigatórios",
          message: "dataInicio e dataFim são obrigatórios (formato DD/MM/YYYY)"
        });
      }
      
      let listaContratos: number[] | undefined;
      if (contratos && typeof contratos === 'string' && contratos.trim()) {
        listaContratos = contratos.split(',').map(c => Number(c.trim())).filter(c => !isNaN(c));
      }
      
      const resultado = await buscarEvolucaoConsolidada(
        String(dataInicio),
        String(dataFim),
        listaContratos
      );
      
      res.json(resultado);
    } catch (error) {
      console.error('❌ Erro ao buscar evolução consolidada:', error);
      res.status(500).json({
        error: "Erro ao buscar evolução consolidada",
        message: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  });

  // GET /api/evolucao-contrato/:nrContrato - Listar todos os registros de um contrato
  app.get("/api/evolucao-contrato/:nrContrato", async (req, res) => {
    try {
      const nrContrato = Number(req.params.nrContrato);
      
      if (isNaN(nrContrato)) {
        return res.status(400).json({
          error: "Parâmetro inválido",
          message: "nrContrato deve ser um número"
        });
      }
      
      const registros = await listarEvolucaoContrato(nrContrato);
      
      res.json({
        data: registros,
        total: registros.length,
        nrContrato
      });
    } catch (error) {
      console.error('❌ Erro ao listar evolução contrato:', error);
      res.status(500).json({
        error: "Erro ao listar evolução contrato",
        message: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  });

  // GET /api/evolucao-contrato/:nrContrato/:periodo - Buscar registro específico
  app.get("/api/evolucao-contrato/:nrContrato/:periodo", async (req, res) => {
    try {
      const nrContrato = Number(req.params.nrContrato);
      const periodo = req.params.periodo;
      
      if (isNaN(nrContrato)) {
        return res.status(400).json({
          error: "Parâmetro inválido",
          message: "nrContrato deve ser um número"
        });
      }
      
      const registro = await buscarEvolucaoContrato(nrContrato, periodo);
      
      if (!registro) {
        return res.status(404).json({
          error: "Não encontrado",
          message: `Registro não encontrado para contrato ${nrContrato} período ${periodo}`
        });
      }
      
      res.json(registro);
    } catch (error) {
      console.error('❌ Erro ao buscar evolução contrato:', error);
      res.status(500).json({
        error: "Erro ao buscar evolução contrato",
        message: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  });

  // POST /api/evolucao-contrato - Inserir ou atualizar (upsert)
  app.post("/api/evolucao-contrato", async (req, res) => {
    try {
      const dados = req.body;
      
      if (!dados.nrContrato || !dados.periodo) {
        return res.status(400).json({
          error: "Parâmetros obrigatórios",
          message: "nrContrato e periodo são obrigatórios"
        });
      }
      
      const resultado = await upsertEvolucaoContrato({
        nrContrato: Number(dados.nrContrato),
        periodo: dados.periodo,
        vlPremio: dados.vlPremio ?? 0,
        vlPremioContinuidade: dados.vlPremioContinuidade ?? 0,
        vlPremioTotal: dados.vlPremioTotal ?? 0,
        vlSinistro: dados.vlSinistro ?? 0,
        pcSinistralidade: dados.pcSinistralidade ?? 0,
        vlLimitadorTecnico: dados.vlLimitadorTecnico ?? 0,
        pcDistorcao: dados.pcDistorcao ?? 0,
        vlAporteFinanceiro: dados.vlAporteFinanceiro ?? 0,
      });
      
      res.status(resultado.action === 'insert' ? 201 : 200).json(resultado);
    } catch (error) {
      console.error('❌ Erro ao salvar evolução contrato:', error);
      res.status(500).json({
        error: "Erro ao salvar evolução contrato",
        message: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  });

  // PUT /api/evolucao-contrato/:nrContrato/:periodo - Atualizar registro existente
  app.put("/api/evolucao-contrato/:nrContrato/:periodo", async (req, res) => {
    try {
      const nrContrato = Number(req.params.nrContrato);
      const periodo = req.params.periodo;
      const dados = req.body;
      
      if (isNaN(nrContrato)) {
        return res.status(400).json({
          error: "Parâmetro inválido",
          message: "nrContrato deve ser um número"
        });
      }
      
      // Buscar registro atual para preservar valores não enviados
      const registroAtual = await buscarEvolucaoContrato(nrContrato, periodo);
      
      if (!registroAtual) {
        return res.status(404).json({
          error: "Não encontrado",
          message: `Registro não encontrado para contrato ${nrContrato} período ${periodo}`
        });
      }
      
      const resultado = await atualizarEvolucaoContrato(nrContrato, periodo, {
        vlPremio: dados.vlPremio !== undefined ? dados.vlPremio : registroAtual.vlPremio,
        vlPremioContinuidade: dados.vlPremioContinuidade !== undefined ? dados.vlPremioContinuidade : registroAtual.vlPremioContinuidade,
        vlPremioTotal: dados.vlPremioTotal !== undefined ? dados.vlPremioTotal : registroAtual.vlPremioTotal,
        vlSinistro: dados.vlSinistro !== undefined ? dados.vlSinistro : registroAtual.vlSinistro,
        pcSinistralidade: dados.pcSinistralidade !== undefined ? dados.pcSinistralidade : registroAtual.pcSinistralidade,
        vlLimitadorTecnico: dados.vlLimitadorTecnico !== undefined ? dados.vlLimitadorTecnico : registroAtual.vlLimitadorTecnico,
        pcDistorcao: dados.pcDistorcao !== undefined ? dados.pcDistorcao : registroAtual.pcDistorcao,
        vlAporteFinanceiro: dados.vlAporteFinanceiro !== undefined ? dados.vlAporteFinanceiro : registroAtual.vlAporteFinanceiro,
      });
      
      res.json(resultado);
    } catch (error) {
      console.error('❌ Erro ao atualizar evolução contrato:', error);
      res.status(500).json({
        error: "Erro ao atualizar evolução contrato",
        message: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  });

  // DELETE /api/evolucao-contrato/:nrContrato/:periodo - Remover registro
  app.delete("/api/evolucao-contrato/:nrContrato/:periodo", async (req, res) => {
    try {
      const nrContrato = Number(req.params.nrContrato);
      const periodo = req.params.periodo;
      
      if (isNaN(nrContrato)) {
        return res.status(400).json({
          error: "Parâmetro inválido",
          message: "nrContrato deve ser um número"
        });
      }
      
      const resultado = await excluirEvolucaoContrato(nrContrato, periodo);
      
      if (!resultado.success) {
        return res.status(404).json({
          error: "Não encontrado",
          message: resultado.message
        });
      }
      
      res.json(resultado);
    } catch (error) {
      console.error('❌ Erro ao excluir evolução contrato:', error);
      res.status(500).json({
        error: "Erro ao excluir evolução contrato",
        message: error instanceof Error ? error.message : "Erro desconhecido"
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
