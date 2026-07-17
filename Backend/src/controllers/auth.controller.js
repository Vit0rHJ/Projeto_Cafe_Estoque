// controllers/: cada arquivo concentra a lógica de uma entidade da API:
// recebe a requisição (req), valida os dados, conversa com o banco
// através do pool (config/db.js) e devolve a resposta (res) em JSON.
// As rotas (routes/) apenas ligam uma URL/verbo HTTP a uma dessas funções.
//
// auth.controller.js: responsável pelo login. Não existe cadastro de
// usuário pela API (isso é feito manualmente via scripts/criarUsuario.js)
// porque todo usuário tem a mesma permissão — o login serve apenas para
// saber quem fez o quê, não para controlar acesso a funcionalidades.

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
    // Compara a senha digitada com o hash salvo no banco (nunca comparamos texto puro).
    const senhaOk = await bcrypt.compare(senha, usuario.senha_hash);

    if (!senhaOk) {
      // Mensagem genérica de propósito: não revela se o erro foi no email ou na senha.
      return res.status(401).json({ erro: 'Email ou senha incorretos' });
    }

    // Gera o token JWT que o front-end vai enviar em "Authorization: Bearer <token>"
    // em toda requisição às rotas protegidas (ver middlewares/auth.js).
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