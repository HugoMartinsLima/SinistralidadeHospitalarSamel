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
    - **Detailed Policy Information**: A complex endpoint (`GET /api/apolices/:nrContrato/detalhamento`) for comprehensive policy breakdown, involving extensive SQL queries (CTEs, JOINs).
    - **Informative Endpoints**: `/api` provides general API information and available endpoints.
    - **Development Endpoints**: `/api/contratos-teste` provides fixed data for frontend development without database dependency.
    - **Date Format**: All dates are returned in ISO (YYYY-MM-DD) format.

## External Dependencies
- **Oracle Database**: The core persistent data store for sinistros and patient information.
- **`oracledb`**: Official Oracle driver for Node.js, managing database connections and queries.
- **Ngrok**: Used to expose the locally running API externally via HTTPS for frontend consumption.
- **Replit Secrets**: Integrated for securely managing environment variables like database credentials (`ORACLE_HOST`, `ORACLE_PORT`, `ORACLE_USER`, `ORACLE_PASSWORD`, `ORACLE_SERVICE`).
- **Vite**: Frontend build tool (used in conjunction with Express for route handling).
- **Zod**: Library for schema declaration and validation.