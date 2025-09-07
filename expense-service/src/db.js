const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST || "postgres",
  user: process.env.DB_USER || "authuser",
  password: process.env.DB_PASSWORD || "secret123",
  database: process.env.DB_NAME || "authdb",
  port: Number(process.env.DB_PORT) || 5432,
});

module.exports = pool;