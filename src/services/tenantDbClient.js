import pool from '../config/database.js';

// Regex estricto para identificadores seguros de esquemas en PostgreSQL (letras, números y guiones bajos)
const SAFE_SCHEMA_REGEX = /^[a-zA-Z_][a-zA-Z0-9_]{0,62}$/;

/**
 * Ejecuta un callback dentro de una transacción con el search_path aislado para el tenant.
 * Garantiza COMMIT o ROLLBACK y asegura la liberación del cliente al pool en el bloque finally.
 *
 * @param {string} schemaName - Nombre del esquema correspondiente al tenant
 * @param {(client: import('pg').PoolClient) => Promise<any>} callback - Operación que ejecutará las consultas
 * @returns {Promise<any>} Resultado del callback
 */
export async function withTenantContext(schemaName, callback) {
  if (!schemaName || typeof schemaName !== 'string') {
    throw new Error('Invalid schema name: schema name must be a non-empty string.');
  }

  // Validación estricta contra inyección SQL y formato de identificador PostgreSQL
  if (!SAFE_SCHEMA_REGEX.test(schemaName)) {
    throw new Error(`Invalid schema name format: "${schemaName}". Only alphanumeric characters and underscores are allowed.`);
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Asignación de search_path local a la transacción: esquema del tenant primero, luego public
    await client.query(`SET LOCAL search_path TO "${schemaName}", public;`);

    const result = await callback(client);

    await client.query('COMMIT');
    return result;
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackError) {
      console.error('Error during transaction rollback:', rollbackError.message);
    }
    throw error;
  } finally {
    // Liberación obligatoria para evitar fugas de conexiones en serverless/Neon
    client.release();
  }
}

export default {
  withTenantContext
};
