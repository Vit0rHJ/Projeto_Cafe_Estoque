// middlewares/: funções que rodam antes do controller, no meio do caminho
// da requisição (por isso "middleware"). Usadas para tarefas transversais
// a várias rotas, como autenticação, validação genérica, logs, etc.
//
// auth.js: protege rotas exigindo um token JWT válido no header
// "Authorization: Bearer <token>". Se o token for válido, libera a
// requisição (next()) e disponibiliza os dados do usuário logado em
// req.usuario para os controllers seguintes usarem.

const jwt = require('jsonwebtoken');

function autenticar(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ erro: 'Token nao fornecido' });
  }

  // Header vem como "Bearer <token>" — pegamos só a parte do token.
  const token = header.split(' ')[1];

  try {
    // jwt.verify confere a assinatura e a validade (expiração) do token.
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = { id: payload.id, nome: payload.nome };
    next(); // token ok, segue para a rota/controller de destino
  } catch (err) {
    return res.status(401).json({ erro: 'Token invalido ou expirado' });
  }
}

module.exports = autenticar;