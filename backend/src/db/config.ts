
import oracledb from 'oracledb';
import dotenv from 'dotenv';

dotenv.config();

// Configuración global para recuperar CLOB como String automáticamente
oracledb.fetchAsString = [oracledb.CLOB];

// En una aplicación real, usarías un pool (createPool), pero mantenemos
// la estructura simple para compatibilidad con el entorno actual.

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
