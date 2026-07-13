const bcrypt = require('bcryptjs');
const pool = require('../src/config/db');

async function main() {
  const nome = process.argv[2];
  const email = process.argv[3];
  const senha = process.argv[4];

  if (!nome || !email || !senha) {
    console.log('Uso: node scripts/criarUsuario.js "Vitor" vitor@email.com senha123');
    process.exit(1);
  }

  const senhaHash = await bcrypt.hash(senha, 10);

  try {
    await pool.query(
      'INSERT INTO usuarios (nome, email, senha_hash) VALUES (?, ?, ?)',
      [nome, email, senhaHash]
    );
    console.log(`Usuario "${nome}" criado com sucesso.`);
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      console.log('Ja existe um usuario com esse email.');
    } else {
      console.error('Erro ao criar usuario:', err.message);
    }
  } finally {
    process.exit(0);
  }
}

main();