-- =====================================================
-- Cafe_Estoque - Banco de dados (MySQL 8.x)
-- =====================================================

CREATE DATABASE IF NOT EXISTS cafe_estoque
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;   -- utf8mb4 = aceita acento e emoji sem quebrar

USE cafe_estoque;

-- ---------------------------------------------------
-- USUÁRIOS
-- Todos têm a MESMA permissão. O login não serve para
-- restringir, e sim para registrar QUEM fez cada ação.
-- ---------------------------------------------------
CREATE TABLE usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,   -- UNIQUE = não deixa dois emails iguais
  senha_hash VARCHAR(255) NOT NULL,     -- guardamos o HASH, nunca a senha pura
  ativo TINYINT(1) NOT NULL DEFAULT 1,  -- 1 = ativo, 0 = desativado (nunca deletamos)
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ---------------------------------------------------
-- CATEGORIAS
-- Tabela (não ENUM) para o café poder criar categorias
-- novas depois sem precisar mexer no código.
-- ---------------------------------------------------
CREATE TABLE categorias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(80) NOT NULL UNIQUE,
  ativo TINYINT(1) NOT NULL DEFAULT 1
);

-- ---------------------------------------------------
-- FORNECEDORES
-- Empresas que entregam OU mercados de compra direta.
-- O 'tipo' ajuda a diferenciar as duas origens.
-- ---------------------------------------------------
CREATE TABLE fornecedores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(120) NOT NULL,
  tipo ENUM('EMPRESA', 'MERCADO') NOT NULL DEFAULT 'EMPRESA',
  telefone VARCHAR(20) NULL,
  ativo TINYINT(1) NOT NULL DEFAULT 1
);

-- ---------------------------------------------------
-- PRODUTOS
-- Repare: NÃO existe coluna "estoque_atual" aqui.
-- O estoque é CALCULADO (veremos na VIEW no final).
-- ---------------------------------------------------
CREATE TABLE produtos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(120) NOT NULL,
  categoria_id INT NOT NULL,
  unidade ENUM('kg','g','L','ml','un','pct','cx') NOT NULL DEFAULT 'un',
  estoque_minimo DECIMAL(10,3) NOT NULL DEFAULT 0,  -- abaixo disso, dispara alerta
  ativo TINYINT(1) NOT NULL DEFAULT 1,
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (categoria_id) REFERENCES categorias(id)
  -- FOREIGN KEY = garante que a categoria realmente existe
);

-- ---------------------------------------------------
-- ENTRADAS (cabeçalho da compra/entrega)
-- Uma entrada = uma nota/compra, que tem VÁRIOS itens.
-- ---------------------------------------------------
CREATE TABLE entradas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  fornecedor_id INT NOT NULL,
  usuario_id INT NOT NULL,               -- quem registrou
  tipo ENUM('ENTREGA','COMPRA_DIRETA') NOT NULL,
  data_entrada DATE NOT NULL,
  foto_nota VARCHAR(255) NULL,           -- caminho do arquivo da foto (opcional)
  observacao TEXT NULL,
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (fornecedor_id) REFERENCES fornecedores(id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- ---------------------------------------------------
-- ITENS DA ENTRADA
-- O PREÇO fica AQUI, no item, não no produto.
-- Motivo: o preço muda a cada compra. Guardando por
-- item, temos o histórico real de quanto foi pago.
-- ---------------------------------------------------
CREATE TABLE entrada_itens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  entrada_id INT NOT NULL,
  produto_id INT NOT NULL,
  quantidade DECIMAL(10,3) NOT NULL,
  preco_unitario DECIMAL(10,2) NOT NULL,
  conferido TINYINT(1) NOT NULL DEFAULT 0,  -- bateu com a nota? (conferência)
  FOREIGN KEY (entrada_id) REFERENCES entradas(id) ON DELETE CASCADE,
  -- ON DELETE CASCADE = se apagar a entrada, apaga os itens dela junto
  FOREIGN KEY (produto_id) REFERENCES produtos(id),
  CHECK (quantidade > 0)   -- impede quantidade zero ou negativa
);

-- ---------------------------------------------------
-- CONTAGENS (o inventário de segunda-feira)
-- Cabeçalho: uma contagem feita num dia, por alguém.
-- ---------------------------------------------------
CREATE TABLE contagens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  data_contagem DATE NOT NULL,
  observacao TEXT NULL,
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- ---------------------------------------------------
-- ITENS DA CONTAGEM
-- Guarda o que o sistema ACHAVA (esperado) e o que a
-- pessoa REALMENTE encontrou (contado). A diferença
-- entre os dois vira uma saída de ajuste.
-- ---------------------------------------------------
CREATE TABLE contagem_itens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  contagem_id INT NOT NULL,
  produto_id INT NOT NULL,
  estoque_esperado DECIMAL(10,3) NOT NULL,
  estoque_contado DECIMAL(10,3) NOT NULL,
  FOREIGN KEY (contagem_id) REFERENCES contagens(id) ON DELETE CASCADE,
  FOREIGN KEY (produto_id) REFERENCES produtos(id)
);

-- ---------------------------------------------------
-- SAÍDAS
-- Duas origens:
--   MANUAL          = "peguei 5kg de açúcar" (na semana)
--   AJUSTE_CONTAGEM = gerada automaticamente pela
--                     diferença encontrada na contagem
-- ---------------------------------------------------
CREATE TABLE saidas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  produto_id INT NOT NULL,
  usuario_id INT NOT NULL,
  contagem_id INT NULL,   -- preenchido só quando vem de uma contagem
  tipo ENUM('MANUAL','AJUSTE_CONTAGEM') NOT NULL DEFAULT 'MANUAL',
  quantidade DECIMAL(10,3) NOT NULL,
  data_saida DATE NOT NULL,
  observacao TEXT NULL,
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (produto_id) REFERENCES produtos(id),
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
  FOREIGN KEY (contagem_id) REFERENCES contagens(id),
  CHECK (quantidade > 0)
);

-- ---------------------------------------------------
-- VIEW: estoque atual
-- Uma VIEW é uma "consulta salva" que se comporta como
-- se fosse uma tabela. Aqui ela calcula, para cada
-- produto: soma das entradas - soma das saídas.
-- Assim nunca precisamos guardar (nem atualizar) um
-- número de estoque — ele é sempre a verdade das
-- movimentações.
-- ---------------------------------------------------
CREATE VIEW vw_estoque_atual AS
SELECT
  p.id AS produto_id,
  p.nome,
  p.unidade,
  p.estoque_minimo,
  c.id AS categoria_id,
  c.nome AS categoria,
  COALESCE(e.total_entradas, 0) - COALESCE(s.total_saidas, 0) AS estoque_atual,
  -- COALESCE troca NULL por 0 (produto que nunca teve entrada/saída)
  CASE
    WHEN COALESCE(e.total_entradas,0) - COALESCE(s.total_saidas,0) <= p.estoque_minimo
    THEN 1 ELSE 0
  END AS em_alerta
FROM produtos p
JOIN categorias c ON c.id = p.categoria_id
LEFT JOIN (
  SELECT produto_id, SUM(quantidade) AS total_entradas
  FROM entrada_itens GROUP BY produto_id
) e ON e.produto_id = p.id
LEFT JOIN (
  SELECT produto_id, SUM(quantidade) AS total_saidas
  FROM saidas GROUP BY produto_id
) s ON s.produto_id = p.id
WHERE p.ativo = 1;

-- ---------------------------------------------------
-- VIEW: gastos
-- Junta item + entrada + produto + fornecedor e já
-- calcula o total de cada item (qtd x preço).
-- Deixa os relatórios de gasto prontos para consultar.
-- ---------------------------------------------------
CREATE VIEW vw_gastos AS
SELECT
  en.id AS entrada_id,
  en.data_entrada,
  en.tipo,
  f.nome AS fornecedor,
  c.nome AS categoria,
  p.nome AS produto,
  ei.quantidade,
  ei.preco_unitario,
  (ei.quantidade * ei.preco_unitario) AS total_item
FROM entrada_itens ei
JOIN entradas en ON en.id = ei.entrada_id
JOIN produtos p  ON p.id = ei.produto_id
JOIN categorias c ON c.id = p.categoria_id
JOIN fornecedores f ON f.id = en.fornecedor_id;

-- ---------------------------------------------------
-- Categorias iniciais
-- ---------------------------------------------------
INSERT INTO categorias (nome) VALUES
  ('Limpeza'), ('Congelados'), ('Verduras'), ('Confeitaria');