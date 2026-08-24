const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const mysql = require('mysql2/promise');
require('dotenv').config();

let dbInstance = null;
let currentDialect = process.env.DB_DIALECT || 'sqlite';

class DatabaseClient {
  constructor() {
    this.dialect = currentDialect;
    this.sqliteDb = null;
    this.mysqlPool = null;
  }

  async initialize() {
    if (this.dialect === 'mysql') {
      try {
        this.mysqlPool = mysql.createPool({
          host: process.env.DB_HOST || 'localhost',
          port: parseInt(process.env.DB_PORT || '3306', 10),
          user: process.env.DB_USER || 'root',
          password: process.env.DB_PASSWORD || '',
          database: process.env.DB_NAME || 'smarttable_db',
          waitForConnections: true,
          connectionLimit: 10,
          queueLimit: 0
        });

        // Test connection
        await this.mysqlPool.query('SELECT 1');
        console.log('✅ Connected to MySQL Database successfully.');
      } catch (err) {
        console.warn('⚠️ MySQL connection failed, seamlessly falling back to high-performance local SQLite engine:', err.message);
        this.dialect = 'sqlite';
      }
    }

    if (this.dialect === 'sqlite') {
      const dbPath = path.resolve(__dirname, 'smarttable.sqlite');
      const dbDir = path.dirname(dbPath);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      await new Promise((resolve, reject) => {
        this.sqliteDb = new sqlite3.Database(dbPath, (err) => {
          if (err) return reject(err);
          // Enable foreign keys
          this.sqliteDb.run('PRAGMA foreign_keys = ON;', (pragmaErr) => {
            if (pragmaErr) return reject(pragmaErr);
            console.log(`✅ Connected to SQLite Database at ${dbPath}`);
            resolve();
          });
        });
      });
    }

    await this.applySchema();
  }

  async applySchema() {
    const schemaPath = path.resolve(__dirname, 'schema.sql');
    if (!fs.existsSync(schemaPath)) return;

    const schemaSql = fs.readFileSync(schemaPath, 'utf-8');
    // Split into individual statements
    const statements = schemaSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const stmt of statements) {
      try {
        await this.run(stmt);
      } catch (err) {
        // Ignore duplicate table errors during schema creation
        if (!err.message.includes('already exists') && !err.message.includes('duplicate')) {
          console.error(`Schema initialization statement warning: ${err.message}`);
        }
      }
    }
    console.log('✅ Relational schema initialized successfully.');
  }

  // Execute a query and return all rows
  async query(sql, params = []) {
    if (this.dialect === 'mysql') {
      const [rows] = await this.mysqlPool.query(sql, params);
      return rows;
    } else {
      return new Promise((resolve, reject) => {
        this.sqliteDb.all(sql, params, (err, rows) => {
          if (err) return reject(err);
          resolve(rows || []);
        });
      });
    }
  }

  // Execute a query and return a single row
  async get(sql, params = []) {
    if (this.dialect === 'mysql') {
      const [rows] = await this.mysqlPool.query(sql, params);
      return rows && rows.length > 0 ? rows[0] : null;
    } else {
      return new Promise((resolve, reject) => {
        this.sqliteDb.get(sql, params, (err, row) => {
          if (err) return reject(err);
          resolve(row || null);
        });
      });
    }
  }

  // Execute an INSERT, UPDATE, or DELETE query
  async run(sql, params = []) {
    if (this.dialect === 'mysql') {
      const [result] = await this.mysqlPool.execute(sql, params);
      return {
        lastID: result.insertId,
        changes: result.affectedRows
      };
    } else {
      return new Promise((resolve, reject) => {
        this.sqliteDb.run(sql, params, function (err) {
          if (err) return reject(err);
          resolve({
            lastID: this.lastID,
            changes: this.changes
          });
        });
      });
    }
  }

  // Execute multiple operations within an atomic transaction
  async transaction(callback) {
    if (this.dialect === 'mysql') {
      const connection = await this.mysqlPool.getConnection();
      await connection.beginTransaction();
      try {
        const txClient = {
          query: async (sql, params = []) => {
            const [rows] = await connection.query(sql, params);
            return rows;
          },
          get: async (sql, params = []) => {
            const [rows] = await connection.query(sql, params);
            return rows[0] || null;
          },
          run: async (sql, params = []) => {
            const [result] = await connection.execute(sql, params);
            return { lastID: result.insertId, changes: result.affectedRows };
          }
        };
        const result = await callback(txClient);
        await connection.commit();
        return result;
      } catch (err) {
        await connection.rollback();
        throw err;
      } finally {
        connection.release();
      }
    } else {
      await this.run('BEGIN TRANSACTION');
      try {
        const result = await callback(this);
        await this.run('COMMIT');
        return result;
      } catch (err) {
        await this.run('ROLLBACK');
        throw err;
      }
    }
  }
}

const getDb = async () => {
  if (!dbInstance) {
    dbInstance = new DatabaseClient();
    await dbInstance.initialize();
  }
  return dbInstance;
};

module.exports = {
  getDb
};
