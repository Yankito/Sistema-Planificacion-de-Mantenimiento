
import oracledb from 'oracledb';
import dotenv from 'dotenv';

dotenv.config();

// Recuperar campos CLOB como String para facilitar el manejo en JavaScript
oracledb.fetchAsString = [oracledb.CLOB];

/**
 * Ejecuta una sentencia SQL con parámetros opcionales sobre Oracle DB.
 * Abre y cierra la conexión por cada llamada (sin pool).
 * Retorna null en caso de error (el error se loguea internamente).
 */
export const query = async (
  sql: string,
  params: oracledb.BindParameters = [],
  options: oracledb.ExecuteOptions = {}
) => {
  let connection;
  try {
    connection = await oracledb.getConnection({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: `${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_SERVICE}`
    });

    const result = await connection.execute(sql, params, {
      autoCommit: true,
      outFormat: oracledb.OUT_FORMAT_OBJECT,
      ...options
    });
    return result;
  } catch (err) {
    const error = err as Error;
    console.error("DATABASE ERROR:");
    console.error("SQL:", sql);
    console.error("PARAMS:", JSON.stringify(params));
    console.error("MSG:", error.message);
    return null;
  } finally {
    if (connection) {
      await connection.close();
    }
  }
};

/**
 * Ejecuta una inserción/actualización masiva usando executeMany.
 * Ideal para cargar grandes volúmenes de datos en Oracle (lotes de registros).
 * Retorna null en caso de error.
 */
export const executeMany = async (
  sql: string,
  binds: Record<string, unknown>[] | unknown[][],
  options: oracledb.ExecuteManyOptions = {}
) => {
  let connection;
  try {
    connection = await oracledb.getConnection({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: `${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_SERVICE}`
    });

    const result = await connection.executeMany(sql, binds, {
      autoCommit: true,
      ...options
    });
    return result;
  } catch (err) {
    const error = err as Error;
    console.error("DATABASE BATCH ERROR:");
    console.error("SQL:", sql);
    console.error("MSG:", error.message);
    return null;
  } finally {
    if (connection) {
      await connection.close();
    }
  }
};

/**
 * Abre una conexión Oracle y la pasa a un callback para ejecutar múltiples operaciones
 * bajo la misma conexión (evita abrir/cerrar por cada query en operaciones compuestas).
 * Cierra la conexión automáticamente al terminar. Lanza el error si el callback falla.
 */
export const withConnection = async <T>(callback: (conn: oracledb.Connection) => Promise<T>): Promise<T> => {
  let connection;
  try {
    connection = await oracledb.getConnection({
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      connectString: `${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_SERVICE}`
    });
    return await callback(connection);
  } catch (err) {
    const error = err as Error;
    console.error("CONNECTION ERROR:", error.message);
    throw error;
  } finally {
    if (connection) {
      await connection.close();
    }
  }
};
