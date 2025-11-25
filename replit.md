# API de Sinistralidade Hospitalar

## Overview
This project is a RESTful API built with Node.js and Express, designed to manage hospital claims (sinistros). It serves as the backend for a frontend application being developed in Lovable. The API aims to provide a comprehensive solution for handling patient information, claim details, and various statistics related to hospital sinistrality. The vision is to streamline the management of healthcare claims, offering a robust and scalable backend for a critical administrative application.

## User Preferences
I prefer simple language and clear explanations. I want iterative development, so please ask before making major changes. I prefer detailed explanations for complex implementations.

## System Architecture
The API is built using Node.js with the Express framework. It connects to an Oracle Database (version 19c) using the official `oracledb` driver, utilizing a connection pool for efficient resource management (min 2, max 10 connections).

**Key Architectural Decisions:**
- **Backend Framework**: Node.js and Express for high performance and scalability.
- **Database**: Oracle Database (19c) for robust data management, accessed via a private network.
  - **Collation Configuration**: Each Oracle connection is configured with `ALTER SESSION SET NLS_COMP=ANSI NLS_SORT=BINARY` to match SQL Developer's binary collation. This ensures `SELECT DISTINCT` treats accented characters (á, é, ã) as different from unaccented ones (a, e, a), preventing data loss in query results. Without this setting, the linguistic collation would collapse rows with accent differences, causing discrepancies between SQL Developer (526 records) and Node.js driver (520 records).
- **CORS**: Configured to allow requests from any origin.
- **Environment Management**: Utilizes Replit Secrets for secure storage of sensitive credentials.
- **Development Workflow**: Uses `tsx` for direct TypeScript execution during development (`npm run dev`), avoiding compilation steps.
- **Route Isolation**: A dedicated Express sub-application (`clientApp`) is used to separate API routes (`/api`) from frontend middleware (Vite), resolving 404 issues during development.
- **Data Validation**: Zod schemas are employed for robust input validation, returning 400 for validation errors.
- **Security**: SQL queries use bind variables to prevent SQL Injection.
- **UI/UX (Implicit)**: The API supports frontend development with endpoints for dropdowns (e.g., `grupos-receita`) and detailed reports, anticipating the needs of a rich UI.
- **Feature Specifications**:
    - **CRUD Operations**: Complete CREATE, READ, UPDATE, and DELETE functionalities for `sinistros` and `pacientes`.
    - **Health Check**: An endpoint (`GET /api/health`) to monitor API and database connectivity.
    - **Filtering and Pagination**: Supported on listing endpoints (`/api/sinistros`, `/api/pacientes`, `/api/apolices/:nrContrato/detalhamento`).
    - **Statistical Endpoints**: Provides general statistics on sinistros (`GET /api/estatisticas`).
    - **Contract Listing**: Endpoints for listing contracts (`GET /api/contratos`) with optional classification information (cdClassifContrato, dsClassificacao) from `pls_classificacao_contrato` table. Supports pagination with total count, search by contract number or company name (razão social). Excludes contracts with classification code 3 (`cd_classif_contrato NOT IN (3)`). Returns data in **camelCase** format (`nrContrato`, `dsEstipulante`, `cdCgcEstipulante`) using quoted SQL aliases to preserve case.
    - **Detailed Policy Information**: A complex endpoint (`GET /api/apolices/:nrContrato/detalhamento`) for comprehensive policy breakdown, involving extensive SQL queries (CTEs, JOINs).
      - **IMPORTANTE**: Paginação é opcional - se `limit` não for enviado, retorna TODOS os registros
      - **Normalização de chaves**: SQL usa aliases sem aspas duplas, Oracle retorna MAIÚSCULAS. As funções de detalhamento normalizam localmente para lowercase sem afetar outros endpoints.
    - **Busca de Paciente (Pessoa Física)**: `GET /api/pacientes/busca` - Busca registros de um paciente/beneficiário em TODOS os contratos
      - Query params: `nome` (obrigatório, min 3 chars), `dataInicio`, `dataFim`, `grupoReceita` (opcional)
      - Busca por LIKE '%nome%' nos campos BENEFICIARIO e NOME_PACIENTE_PRESTADOR
      - Resposta: `{ data: [...], total: N, paciente: "NOME BUSCADO" }`
    - **Classificações de Contratos**: `GET /api/classificacoes` - Lista classificações com contagem de contratos
      - Resposta: `{ data: [{ dsClassificacao: "PLURAL PME", quantidade: 8 }], total: N }`
    - **Detalhamento Consolidado por Classificação**: `GET /api/classificacao/:dsClassificacao/detalhamento-consolidado`
      - Query params: `dataInicio`, `dataFim`, `grupoReceita` (opcional)
      - Consolida dados de todos os contratos de uma classificação
      - Resposta: `{ data: [...], total: N, classificacao: "...", contratos_incluidos: N, lista_contratos: [...] }`
    - **Informative Endpoints**: `/api` provides general API information and available endpoints.
    - **Development Endpoints**: `/api/contratos-teste` provides fixed data for frontend development without database dependency.
    - **Date Format**: All dates are returned in ISO (YYYY-MM-DD) format.
    - **Lovable Integration**: Documentation files created for frontend integration:
      - **Dropdowns/Filtros**:
        - `PROMPT_LOVABLE_DROPDOWN_EMPRESAS.md`: Complete guide for implementing company/contract dropdown using `/api/contratos`
        - `PROMPT_LOVABLE_EMPRESAS_RESUMIDO.txt`: Quick-start prompt for Lovable AI
        - `PROMPT_LOVABLE_DROPDOWN_GRUPOS.md`: Guide for implementing revenue groups dropdown
        - `API_GRUPOS_RECEITA.md`: Technical documentation for groups endpoint
      - **Página de Detalhamento**:
        - `PROMPT_LOVABLE_PAGINA_DETALHAMENTO.md`: Complete guide for building detailed claims analysis page with **45 columns** table, filters (date range, company, revenue group), totals summary, and pagination using `/api/apolices/:nrContrato/detalhamento`
        - `PROMPT_LOVABLE_DETALHAMENTO_RESUMIDO.txt`: Quick-start prompt with essential code for detalhamento page
        - **IMPORTANTE**: O SQL retorna exatamente **45 colunas** (não 47). As colunas `vl_procedimento_cobrado` e `vl_procedimento_a_pagar` não existem no SELECT original.

## External Dependencies
- **Oracle Database**: The core persistent data store for sinistros and patient information.
- **`oracledb`**: Official Oracle driver for Node.js, managing database connections and queries.
- **Ngrok**: Used to expose the locally running API externally via HTTPS for frontend consumption.
- **Replit Secrets**: Integrated for securely managing environment variables like database credentials (`ORACLE_HOST`, `ORACLE_PORT`, `ORACLE_USER`, `ORACLE_PASSWORD`, `ORACLE_SERVICE`).
- **Vite**: Frontend build tool (used in conjunction with Express for route handling).
- **Zod**: Library for schema declaration and validation.