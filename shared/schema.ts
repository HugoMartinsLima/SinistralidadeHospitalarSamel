import { z } from "zod";

// Schema para sinistros (claims)
export const sinistroSchema = z.object({
  id: z.number(),
  numeroSinistro: z.string(),
  pacienteId: z.number(),
  pacienteNome: z.string(),
  dataOcorrencia: z.string(),
  dataRegistro: z.string(),
  status: z.enum(['PENDENTE', 'EM_ANALISE', 'APROVADO', 'REJEITADO', 'PAGO']),
  valorTotal: z.number(),
  tipoSinistro: z.string(),
  descricao: z.string().optional(),
  hospital: z.string().optional(),
});

export type Sinistro = z.infer<typeof sinistroSchema>;

// Schema para criar sinistro
export const insertSinistroSchema = z.object({
  numeroSinistro: z.string().min(1, "Número do sinistro é obrigatório"),
  pacienteId: z.number().positive("ID do paciente deve ser positivo"),
  dataOcorrencia: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD"),
  status: z.enum(['PENDENTE', 'EM_ANALISE', 'APROVADO', 'REJEITADO', 'PAGO']).default('PENDENTE'),
  valorTotal: z.number().positive("Valor deve ser positivo"),
  tipoSinistro: z.string().min(1, "Tipo de sinistro é obrigatório"),
  descricao: z.string().optional(),
  hospital: z.string().optional(),
});

export type InsertSinistro = z.infer<typeof insertSinistroSchema>;

// Schema para atualizar sinistro
export const updateSinistroSchema = insertSinistroSchema.partial();

// Schema para pacientes
export const pacienteSchema = z.object({
  id: z.number(),
  nome: z.string(),
  cpf: z.string(),
  dataNascimento: z.string(),
  plano: z.string(),
  numeroCarteirinha: z.string(),
  telefone: z.string().optional(),
  email: z.string().optional(),
});

export type Paciente = z.infer<typeof pacienteSchema>;

// Schema para criar paciente
export const insertPacienteSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  cpf: z.string().regex(/^\d{3}\.\d{3}\.\d{3}-\d{2}$/, "CPF deve estar no formato XXX.XXX.XXX-XX"),
  dataNascimento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD"),
  plano: z.string().min(1, "Plano é obrigatório"),
  numeroCarteirinha: z.string().min(1, "Número da carteirinha é obrigatório"),
  telefone: z.string().optional(),
  email: z.string().email("Email inválido").optional(),
});

export type InsertPaciente = z.infer<typeof insertPacienteSchema>;

// Schema para atualizar paciente
export const updatePacienteSchema = insertPacienteSchema.partial();

// Schema para estatísticas
export const estatisticasSchema = z.object({
  totalSinistros: z.number(),
  sinistrosPendentes: z.number(),
  sinistrosAprovados: z.number(),
  sinistrosRejeitados: z.number(),
  valorTotalSinistros: z.number(),
  valorMedioPorSinistro: z.number(),
  tempoMedioProcessamento: z.number().optional(),
});

export type Estatisticas = z.infer<typeof estatisticasSchema>;

// Schema para filtros de consulta
export const filtroSinistrosSchema = z.object({
  status: z.string().optional(),
  dataInicio: z.string().optional(),
  dataFim: z.string().optional(),
  pacienteId: z.number().optional(),
  limit: z.number().default(50),
  offset: z.number().default(0),
});

export type FiltroSinistros = z.infer<typeof filtroSinistrosSchema>;

// Schema para contratos
export const contratoSchema = z.object({
  id: z.number(),
  codigo: z.string(),
  descricao: z.string(),
  ativo: z.string().optional(),
});

export type Contrato = z.infer<typeof contratoSchema>;

// Schema para criar contrato
export const insertContratoSchema = z.object({
  codigo: z.string().min(1, "Código é obrigatório"),
  descricao: z.string().min(1, "Descrição é obrigatória"),
  ativo: z.string().optional(),
});

export type InsertContrato = z.infer<typeof insertContratoSchema>;

// Schema para atualizar contrato
export const updateContratoSchema = insertContratoSchema.partial();
