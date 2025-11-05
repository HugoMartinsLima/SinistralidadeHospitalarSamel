-- ================================================
-- QUERIES SQL PARA BANCO DE DADOS ORACLE
-- Sistema de Sinistralidade Hospitalar
-- ================================================

-- ================================================
-- CRIAÇÃO DAS TABELAS (caso ainda não existam)
-- ================================================

-- Tabela de Pacientes
CREATE TABLE pacientes (
  id NUMBER PRIMARY KEY,
  nome VARCHAR2(200) NOT NULL,
  cpf VARCHAR2(14) NOT NULL UNIQUE,
  data_nascimento DATE NOT NULL,
  plano VARCHAR2(100) NOT NULL,
  numero_carteirinha VARCHAR2(50) NOT NULL UNIQUE,
  telefone VARCHAR2(20),
  email VARCHAR2(100)
);

-- Tabela de Sinistros
CREATE TABLE sinistros (
  id NUMBER PRIMARY KEY,
  numero_sinistro VARCHAR2(50) NOT NULL UNIQUE,
  paciente_id NUMBER NOT NULL,
  data_ocorrencia DATE NOT NULL,
  data_registro DATE NOT NULL,
  status VARCHAR2(20) NOT NULL CHECK (status IN ('PENDENTE', 'EM_ANALISE', 'APROVADO', 'REJEITADO', 'PAGO')),
  valor_total NUMBER(10,2) NOT NULL,
  tipo_sinistro VARCHAR2(100) NOT NULL,
  descricao VARCHAR2(500),
  hospital VARCHAR2(200),
  CONSTRAINT fk_sinistro_paciente FOREIGN KEY (paciente_id) REFERENCES pacientes(id)
);

-- Sequences para auto-incremento
CREATE SEQUENCE seq_pacientes START WITH 1 INCREMENT BY 1;
CREATE SEQUENCE seq_sinistros START WITH 1 INCREMENT BY 1;

-- Índices para melhorar performance
CREATE INDEX idx_sinistros_status ON sinistros(status);
CREATE INDEX idx_sinistros_paciente ON sinistros(paciente_id);
CREATE INDEX idx_sinistros_data_ocorrencia ON sinistros(data_ocorrencia);
CREATE INDEX idx_pacientes_cpf ON pacientes(cpf);
CREATE INDEX idx_pacientes_carteirinha ON pacientes(numero_carteirinha);

-- ================================================
-- INSERÇÃO DE DADOS DE EXEMPLO (OPCIONAL)
-- ================================================

-- Inserir pacientes de exemplo
INSERT INTO pacientes (id, nome, cpf, data_nascimento, plano, numero_carteirinha, telefone, email)
VALUES (seq_pacientes.NEXTVAL, 'João Silva', '123.456.789-00', TO_DATE('1980-05-15', 'YYYY-MM-DD'), 'Premium', '123456789', '(11) 98765-4321', 'joao.silva@email.com');

INSERT INTO pacientes (id, nome, cpf, data_nascimento, plano, numero_carteirinha, telefone, email)
VALUES (seq_pacientes.NEXTVAL, 'Maria Santos', '987.654.321-00', TO_DATE('1975-08-22', 'YYYY-MM-DD'), 'Standard', '987654321', '(11) 91234-5678', 'maria.santos@email.com');

INSERT INTO pacientes (id, nome, cpf, data_nascimento, plano, numero_carteirinha, telefone, email)
VALUES (seq_pacientes.NEXTVAL, 'Pedro Oliveira', '456.789.123-00', TO_DATE('1990-03-10', 'YYYY-MM-DD'), 'Basic', '456789123', '(11) 99876-5432', 'pedro.oliveira@email.com');

-- Inserir sinistros de exemplo
INSERT INTO sinistros (id, numero_sinistro, paciente_id, data_ocorrencia, data_registro, status, valor_total, tipo_sinistro, descricao, hospital)
VALUES (seq_sinistros.NEXTVAL, 'SIN-2025-001', 1, TO_DATE('2025-01-15', 'YYYY-MM-DD'), TO_DATE('2025-01-16', 'YYYY-MM-DD'), 'PENDENTE', 5000.00, 'CONSULTA', 'Consulta cardiológica', 'Hospital São Lucas');

INSERT INTO sinistros (id, numero_sinistro, paciente_id, data_ocorrencia, data_registro, status, valor_total, tipo_sinistro, descricao, hospital)
VALUES (seq_sinistros.NEXTVAL, 'SIN-2025-002', 2, TO_DATE('2025-01-10', 'YYYY-MM-DD'), TO_DATE('2025-01-11', 'YYYY-MM-DD'), 'APROVADO', 12000.00, 'CIRURGIA', 'Cirurgia ortopédica', 'Hospital Santa Maria');

INSERT INTO sinistros (id, numero_sinistro, paciente_id, data_ocorrencia, data_registro, status, valor_total, tipo_sinistro, descricao, hospital)
VALUES (seq_sinistros.NEXTVAL, 'SIN-2025-003', 3, TO_DATE('2025-01-20', 'YYYY-MM-DD'), TO_DATE('2025-01-21', 'YYYY-MM-DD'), 'EM_ANALISE', 3500.00, 'EXAME', 'Ressonância magnética', 'Hospital Brasil');

INSERT INTO sinistros (id, numero_sinistro, paciente_id, data_ocorrencia, data_registro, status, valor_total, tipo_sinistro, descricao, hospital)
VALUES (seq_sinistros.NEXTVAL, 'SIN-2025-004', 1, TO_DATE('2025-01-25', 'YYYY-MM-DD'), TO_DATE('2025-01-26', 'YYYY-MM-DD'), 'REJEITADO', 8000.00, 'INTERNACAO', 'Internação clínica', 'Hospital Geral');

COMMIT;

-- ================================================
-- QUERIES ÚTEIS PARA CONSULTA
-- ================================================

-- Listar todos os sinistros com informações do paciente
SELECT 
  s.id,
  s.numero_sinistro,
  s.paciente_id,
  p.nome as paciente_nome,
  TO_CHAR(s.data_ocorrencia, 'DD/MM/YYYY') as data_ocorrencia,
  TO_CHAR(s.data_registro, 'DD/MM/YYYY') as data_registro,
  s.status,
  s.valor_total,
  s.tipo_sinistro,
  s.descricao,
  s.hospital
FROM sinistros s
LEFT JOIN pacientes p ON s.paciente_id = p.id
ORDER BY s.data_registro DESC;

-- Buscar sinistros pendentes
SELECT * FROM sinistros WHERE status = 'PENDENTE' ORDER BY data_registro;

-- Buscar sinistros por período
SELECT * FROM sinistros 
WHERE data_ocorrencia BETWEEN TO_DATE('2025-01-01', 'YYYY-MM-DD') 
AND TO_DATE('2025-01-31', 'YYYY-MM-DD')
ORDER BY data_ocorrencia DESC;

-- Buscar sinistros de um paciente específico
SELECT s.*, p.nome as paciente_nome
FROM sinistros s
JOIN pacientes p ON s.paciente_id = p.id
WHERE p.cpf = '123.456.789-00'
ORDER BY s.data_ocorrencia DESC;

-- Estatísticas gerais
SELECT 
  COUNT(*) as total_sinistros,
  SUM(CASE WHEN status = 'PENDENTE' THEN 1 ELSE 0 END) as pendentes,
  SUM(CASE WHEN status = 'APROVADO' THEN 1 ELSE 0 END) as aprovados,
  SUM(CASE WHEN status = 'REJEITADO' THEN 1 ELSE 0 END) as rejeitados,
  SUM(CASE WHEN status = 'PAGO' THEN 1 ELSE 0 END) as pagos,
  SUM(valor_total) as valor_total,
  AVG(valor_total) as valor_medio
FROM sinistros;

-- Estatísticas por tipo de sinistro
SELECT 
  tipo_sinistro,
  COUNT(*) as quantidade,
  SUM(valor_total) as valor_total,
  AVG(valor_total) as valor_medio
FROM sinistros
GROUP BY tipo_sinistro
ORDER BY valor_total DESC;

-- Estatísticas por hospital
SELECT 
  hospital,
  COUNT(*) as quantidade_sinistros,
  SUM(valor_total) as valor_total,
  AVG(valor_total) as valor_medio
FROM sinistros
WHERE hospital IS NOT NULL
GROUP BY hospital
ORDER BY quantidade_sinistros DESC;

-- Top 10 pacientes com mais sinistros
SELECT 
  p.nome,
  p.cpf,
  p.plano,
  COUNT(s.id) as quantidade_sinistros,
  SUM(s.valor_total) as valor_total
FROM pacientes p
JOIN sinistros s ON p.id = s.paciente_id
GROUP BY p.nome, p.cpf, p.plano
ORDER BY quantidade_sinistros DESC
FETCH FIRST 10 ROWS ONLY;

-- Buscar paciente por nome (parcial)
SELECT * FROM pacientes 
WHERE LOWER(nome) LIKE LOWER('%Silva%')
ORDER BY nome;

-- Buscar paciente por CPF
SELECT * FROM pacientes WHERE cpf = '123.456.789-00';

-- Sinistros por mês
SELECT 
  TO_CHAR(data_ocorrencia, 'YYYY-MM') as mes,
  COUNT(*) as quantidade,
  SUM(valor_total) as valor_total
FROM sinistros
GROUP BY TO_CHAR(data_ocorrencia, 'YYYY-MM')
ORDER BY mes DESC;

-- Tempo médio de processamento (dias entre registro e aprovação/rejeição)
SELECT 
  AVG(data_registro - data_ocorrencia) as tempo_medio_dias
FROM sinistros
WHERE status IN ('APROVADO', 'REJEITADO');

-- ================================================
-- QUERIES DE MANUTENÇÃO
-- ================================================

-- Verificar total de registros
SELECT 
  'Pacientes' as tabela, 
  COUNT(*) as total 
FROM pacientes
UNION ALL
SELECT 
  'Sinistros' as tabela, 
  COUNT(*) as total 
FROM sinistros;

-- Verificar integridade dos dados
SELECT 
  s.id,
  s.numero_sinistro,
  s.paciente_id
FROM sinistros s
LEFT JOIN pacientes p ON s.paciente_id = p.id
WHERE p.id IS NULL;

-- Limpar dados de teste (CUIDADO!)
-- DELETE FROM sinistros;
-- DELETE FROM pacientes;
-- COMMIT;

-- ================================================
-- QUERIES PARA RELATÓRIOS
-- ================================================

-- Relatório mensal de sinistros
SELECT 
  TO_CHAR(data_ocorrencia, 'YYYY-MM') as mes,
  status,
  COUNT(*) as quantidade,
  SUM(valor_total) as valor_total,
  AVG(valor_total) as valor_medio
FROM sinistros
WHERE data_ocorrencia >= ADD_MONTHS(SYSDATE, -12)
GROUP BY TO_CHAR(data_ocorrencia, 'YYYY-MM'), status
ORDER BY mes DESC, status;

-- Relatório de sinistros por plano
SELECT 
  p.plano,
  COUNT(s.id) as quantidade_sinistros,
  SUM(s.valor_total) as valor_total,
  AVG(s.valor_total) as valor_medio
FROM pacientes p
LEFT JOIN sinistros s ON p.id = s.paciente_id
GROUP BY p.plano
ORDER BY valor_total DESC;

-- Sinistros recentes (últimos 30 dias)
SELECT 
  s.numero_sinistro,
  p.nome as paciente,
  s.data_ocorrencia,
  s.status,
  s.valor_total,
  s.tipo_sinistro
FROM sinistros s
JOIN pacientes p ON s.paciente_id = p.id
WHERE s.data_ocorrencia >= SYSDATE - 30
ORDER BY s.data_ocorrencia DESC;

-- ================================================
-- NOTAS IMPORTANTES
-- ================================================

-- 1. Sempre use COMMIT após INSERT/UPDATE/DELETE
-- 2. Use índices para melhorar performance de consultas frequentes
-- 3. Para paginação, use OFFSET/FETCH ou ROWNUM
-- 4. Mantenha estatísticas do Oracle atualizadas para melhor performance
-- 5. Faça backup regular dos dados

-- Atualizar estatísticas (executar periodicamente)
-- EXEC DBMS_STATS.GATHER_TABLE_STATS('SEU_SCHEMA', 'SINISTROS');
-- EXEC DBMS_STATS.GATHER_TABLE_STATS('SEU_SCHEMA', 'PACIENTES');
