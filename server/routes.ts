import type { Express } from "express";
import { createServer, type Server } from "http";
import { executeQuery, testConnection, initializePool } from "./oracle-db";
import type { Sinistro, Paciente, Estatisticas, FiltroSinistros } from "@shared/schema";
import { filtroSinistrosSchema } from "@shared/schema";

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
        { method: "GET", path: "/api/pacientes", description: "Listar pacientes" },
        { method: "GET", path: "/api/pacientes/:id", description: "Obter detalhes de um paciente" },
        { method: "GET", path: "/api/estatisticas", description: "Obter estatísticas gerais" },
      ]
    });
  });

  const httpServer = createServer(app);

  return httpServer;
}
