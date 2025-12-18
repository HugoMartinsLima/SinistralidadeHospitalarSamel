# API de Sinistralidade Hospitalar

## Overview
This project is a RESTful API built with Node.js and Express, designed to manage hospital claims (sinistros). It serves as the backend for a frontend application and aims to provide a comprehensive solution for handling patient information, claim details, and various statistics related to hospital sinistrality. The vision is to streamline the management of healthcare claims, offering a robust and scalable backend for a critical administrative application.

## User Preferences
I prefer simple language and clear explanations. I want iterative development, so please ask before making major changes. I prefer detailed explanations for complex implementations.

## System Architecture
The API is built using Node.js with the Express framework, connecting to an Oracle Database (version 19c) via the `oracledb` driver with a connection pool.

**Key Architectural Decisions:**
- **Backend Framework**: Node.js and Express for performance and scalability.
- **Database**: Oracle Database (19c) with `oracledb` driver. Each connection is configured with `ALTER SESSION SET NLS_COMP=ANSI NLS_SORT=BINARY` to ensure binary collation for accurate `SELECT DISTINCT` results.
- **CORS**: Configured to allow requests from any origin.
- **Environment Management**: Replit Secrets for sensitive credentials.
- **Development Workflow**: `tsx` for direct TypeScript execution.
- **Route Isolation**: An Express sub-application separates API routes from frontend middleware.
- **Data Validation**: Zod schemas for input validation.
- **Security**: SQL queries use bind variables to prevent SQL Injection.
- **Feature Specifications**:
    - **CRUD Operations**: For `sinistros` and `pacientes`.
    - **Health Check**: Endpoint (`GET /api/health`) for API and DB connectivity.
    - **Filtering and Pagination**: Supported on listing endpoints.
    - **Statistical Endpoints**: General statistics on sinistros (`GET /api/estatisticas`).
    - **Contract Listing**: `GET /api/contratos` with optional classification, pagination, and search, excluding contracts with `cd_classif_contrato = 3`. Returns data in **camelCase**.
    - **Detailed Policy Information**: `GET /api/apolices/:nrContrato/detalhamento` provides comprehensive policy breakdown with extensive SQL queries. Optional pagination; if `limit` is not provided, all records are returned.
    - **Patient Search (Individual)**: `GET /api/pacientes/busca` searches across all contracts for a patient/beneficiary by name, using a two-step optimized query.
    - **Contract Summary**: `GET /api/contratos/resumo` provides aggregated data for dashboards.
    - **Contract Classifications**: `GET /api/classificacoes` lists classifications with contract counts.
    - **Consolidated Classification Details**: `GET /api/classificacao/:dsClassificacao/detalhamento-consolidado` consolidates data for all contracts within a classification.
    - **Sinistrality Import (SAMEL)**: Endpoints to import (`POST /api/sinistralidade/import`), count (`GET /api/sinistralidade/import/count`), and clear (`DELETE /api/sinistralidade/import`) data in `SAMEL.SINISTRALIDADE_IMPORT`. Supports batch inserts and various date formats.
    - **Breakeven Management**: CRUD endpoints (`/api/breakeven`, `/api/breakeven/:nrContrato`, `/api/breakeven/batch`) for `sini_empresa_breakeven` table, supporting UPSERT operations.
    - **Imported Sinistrality Analysis**:
        - `GET /api/sinistralidade/contratos/resumo`: Aggregated data including breakeven.
        - `GET /api/sinistralidade/detalhamento`: All 45 fields with optional pagination.
        - `GET /api/sinistralidade/pacientes/busca`: Case-insensitive patient search by name, limited to 500 records.
        - `GET /api/sinistralidade/grupos-receita`: Lists distinct revenue groups.
        - `GET /api/sinistralidade/grupos-receita/ranking`: Ranks revenue groups by cost.
    - **Monthly Contract Evolution**: CRUD endpoints for `SAMEL.SINI_EVOLUCAO_CONTRATO`.
        - `GET /api/evolucao-contrato/consolidado`: Consolidated data for dashboards.
        - `GET /api/evolucao-contrato/:nrContrato`: Lists all evolution records for a contract.
        - `GET /api/evolucao-contrato/:nrContrato/:periodo`: Retrieves a specific record.
        - `POST /api/evolucao-contrato`: Inserts or updates (UPSERT) a record.
        - `PUT /api/evolucao-contrato/:nrContrato/:periodo`: Updates an existing record.
        - `DELETE /api/evolucao-contrato/:nrContrato/:periodo`: Removes a record.
    - **Informative Endpoints**: `/api` for general API information.
    - **Development Endpoints**: `/api/contratos-teste` for fixed frontend data.
    - **Date Format**: All dates returned in ISO (YYYY-MM-DD) format.
    - **Lovable Integration**: Dedicated documentation for frontend integration (`PROMPT_LOVABLE_*.md` files).

## External Dependencies
- **Oracle Database**: Core persistent data store.
- **`oracledb`**: Official Oracle driver for Node.js.
- **Ngrok**: Exposes local API externally for frontend consumption.
- **Replit Secrets**: Securely manages environment variables.
- **Vite**: Frontend build tool (integrated with Express).
- **Zod**: Schema declaration and validation library.