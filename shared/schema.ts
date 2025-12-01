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

// Schema para contratos (baseado em pls_contrato)
export const contratoSchema = z.object({
  nrContrato: z.number(),
  cdCgcEstipulante: z.string(),
  dsEstipulante: z.string(),
  cdClassifContrato: z.string().nullable(),
  dsClassificacao: z.string().nullable(),
});

export type Contrato = z.infer<typeof contratoSchema>;

// Schema para filtros de detalhamento de apólice
export const filtroDetalhamentoApoliceSchema = z.object({
  nrContrato: z.number().positive("Número do contrato deve ser positivo"),
  dataInicio: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/, "Data início deve estar no formato DD/MM/YYYY"),
  dataFim: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/, "Data fim deve estar no formato DD/MM/YYYY"),
  grupoReceita: z.string().optional(),
  limit: z.number().positive().optional(), // Sem valor padrão - retorna TODOS os registros se não fornecido
  offset: z.number().nonnegative().optional(), // Sem valor padrão - começa do início se não fornecido
});

export type FiltroDetalhamentoApolice = z.infer<typeof filtroDetalhamentoApoliceSchema>;

// Schema para importação de sinistralidade (tabela SAMEL.SINISTRALIDADE_IMPORT)
// Todos os campos são opcionais para permitir flexibilidade na importação
export const sinistralityImportSchema = z.object({
  data: z.string().nullable().optional(),
  hora: z.string().max(8).nullable().optional(),
  dataAlta: z.string().nullable().optional(),
  tipoInternacao: z.string().max(50).nullable().optional(),
  caraterAtendimento: z.string().max(50).nullable().optional(),
  tipoConta: z.string().max(50).nullable().optional(),
  atendimento: z.number().nullable().optional(),
  autorizacaoOriginal: z.number().nullable().optional(),
  tipoValidacaoClinicaExterna: z.string().max(50).nullable().optional(),
  dataValidacaoClinicaExterna: z.string().nullable().optional(),
  dtProcedimento: z.string().nullable().optional(),
  codTuss: z.number().nullable().optional(),
  ieOrigemProced: z.number().nullable().optional(),
  eventoTuss: z.string().max(20).nullable().optional(),
  nrSeqProcInterno: z.number().nullable().optional(),
  nmProced: z.string().max(255).nullable().optional(),
  tipoServico: z.string().max(100).nullable().optional(),
  grupoReceita: z.string().max(100).nullable().optional(),
  tipoConsulta: z.string().max(50).nullable().optional(),
  apolice: z.number().nullable().optional(),
  contratante: z.string().max(150).nullable().optional(),
  plano: z.string().max(100).nullable().optional(),
  codBeneficiario: z.string().max(50).nullable().optional(),
  nomePacientePrestador: z.string().max(255).nullable().optional(),
  beneficiario: z.string().max(255).nullable().optional(),
  sexo: z.string().max(20).nullable().optional(),
  dataNascimento: z.string().nullable().optional(),
  faixaEtaria: z.string().max(20).nullable().optional(),
  matCliente: z.number().nullable().optional(),
  tipoDependente: z.string().max(50).nullable().optional(),
  titular: z.string().max(255).nullable().optional(),
  prestador: z.string().max(255).nullable().optional(),
  especialidade: z.string().max(100).nullable().optional(),
  qtde: z.number().nullable().optional(),
  valor: z.number().nullable().optional(),
  valorTotal: z.number().nullable().optional(),
  setorAtendimento: z.string().max(100).nullable().optional(),
  seContinuidade: z.string().max(20).nullable().optional(),
  dtContratacao: z.string().nullable().optional(),
  dtContrato: z.string().nullable().optional(),
  diasAdesao: z.number().nullable().optional(),
  cidDoenca: z.string().max(255).nullable().optional(),
  subEstipulante: z.string().max(150).nullable().optional(),
  formaChegada: z.string().max(100).nullable().optional(),
  vlProcedimentoCoparticipacao: z.number().nullable().optional(),
});

export type SinistralityImport = z.infer<typeof sinistralityImportSchema>;

// Schema para request de importação (array de registros)
export const sinistralityImportRequestSchema = z.object({
  registros: z.array(sinistralityImportSchema).min(1, "Deve conter pelo menos 1 registro"),
});

export type SinistralityImportRequest = z.infer<typeof sinistralityImportRequestSchema>;
