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
