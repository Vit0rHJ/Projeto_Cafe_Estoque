const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

async function login(req, res) {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ erro: 'Informe email e senha' });
  }

  try {
    const [rows] = await pool.query(
      'SELECT id, nome, email, senha_hash FROM usuarios WHERE email = ? AND ativo = 1',
      [email]
    );

    if (rows.length === 0) {
      return res.status(401).json({ erro: 'Email ou senha incorretos' });
    }

    const usuario = rows[0];
    const senhaOk = await bcrypt.compare(senha, usuario.senha_hash);

    if (!senhaOk) {
      return res.status(401).json({ erro: 'Email ou senha incorretos' });
    }

    const token = jwt.sign(
      { id: usuario.id, nome: usuario.nome },
      process.env.JWT_SECRET,
      { expiresIn: '12h' }
    );

    return res.json({
      token,
      usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email }
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ erro: 'Erro interno no servidor' });
  }
}

module.exports = { login };