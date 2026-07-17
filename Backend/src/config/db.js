// config/db.js: cria e exporta o pool de conexões com o MySQL, usado por
// todos os controllers via pool.query(...). Um pool reaproveita conexões
// já abertas em vez de abrir/fechar uma nova a cada consulta, o que é bem
// mais eficiente sob várias requisições simultâneas. As credenciais vêm
// do arquivo .env (nunca comitado — ver .env.example).

const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10, // máximo de conexões simultâneas mantidas no pool
  decimalNumbers: true // retorna colunas DECIMAL como number em vez de string
});

module.exports = pool;