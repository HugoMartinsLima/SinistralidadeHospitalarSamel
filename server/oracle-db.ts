import oracledb from 'oracledb';

// Configuração do Oracle Database
const dbConfig = {
  user: process.env.ORACLE_USER,
  password: process.env.ORACLE_PASSWORD,
  connectString: `${process.env.ORACLE_HOST}:${process.env.ORACLE_PORT}/${process.env.ORACLE_SERVICE}`,
};

// Configuração do pool de conexões
const poolConfig = {
  user: dbConfig.user,
  password: dbConfig.password,
  connectString: dbConfig.connectString,
  poolMin: 2,
  poolMax: 10,
  poolIncrement: 1,
  poolTimeout: 60,
};

let pool: oracledb.Pool | null = null;

// Inicializar pool de conexões
export async function initializePool() {
  try {
    // Configurar o modo de saída para objetos (mais fácil de trabalhar)
    oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
    
    // Criar pool de conexões
    pool = await oracledb.createPool(poolConfig);
    console.log('✅ Pool de conexões Oracle criado com sucesso');
    console.log(`📊 Conectado ao Oracle: ${dbConfig.connectString}`);
    return pool;
  } catch (err) {
    console.error('❌ Erro ao criar pool de conexões Oracle:', err);
    throw err;
  }
}

// Obter conexão do pool
export async function getConnection() {
  try {
    if (!pool) {
      await initializePool();
    }
    return await pool!.getConnection();
  } catch (err) {
    console.error('❌ Erro ao obter conexão do pool:', err);
    throw err;
  }
}

// Fechar pool de conexões
export async function closePool() {
  try {
    if (pool) {
      await pool.close(10);
      pool = null;
      console.log('✅ Pool de conexões Oracle fechado');
    }
  } catch (err) {
    console.error('❌ Erro ao fechar pool de conexões:', err);
    throw err;
  }
}

// Executar query com tratamento de erro
export async function executeQuery<T = any>(
  sql: string,
  binds: any = {},
  options: oracledb.ExecuteOptions = {}
): Promise<T[]> {
  let connection;
  try {
    connection = await getConnection();
    const result = await connection.execute(sql, binds, {
      outFormat: oracledb.OUT_FORMAT_OBJECT,
      ...options,
    });
    return (result.rows as T[]) || [];
  } catch (err) {
    console.error('❌ Erro ao executar query:', err);
    console.error('SQL:', sql);
    console.error('Binds:', binds);
    throw err;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('❌ Erro ao fechar conexão:', err);
      }
    }
  }
}

// Executar comando de modificação (INSERT, UPDATE, DELETE) com transação
export async function executeUpdate(
  sql: string,
  binds: any = {},
  options: oracledb.ExecuteOptions = {}
): Promise<oracledb.Result<any>> {
  let connection;
  try {
    connection = await getConnection();
    const result = await connection.execute(sql, binds, {
      autoCommit: true, // Commit automático
      ...options,
    });
    return result;
  } catch (err) {
    console.error('❌ Erro ao executar comando de modificação:', err);
    console.error('SQL:', sql);
    console.error('Binds:', binds);
    throw err;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error('❌ Erro ao fechar conexão:', err);
      }
    }
  }
}

// Verificar conexão com o banco
export async function testConnection(): Promise<boolean> {
  try {
    const result = await executeQuery('SELECT 1 as test FROM DUAL');
    return result.length > 0;
  } catch (err) {
    console.error('❌ Falha no teste de conexão:', err);
    return false;
  }
}
