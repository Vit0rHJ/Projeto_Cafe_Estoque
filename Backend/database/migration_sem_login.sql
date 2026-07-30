-- =====================================================
-- Migração: sistema passou a ter acesso direto, sem login.
-- Torna usuario_id opcional em entradas/saidas, já que não
-- há mais um usuário autenticado para preencher esse campo.
-- Rode isto se o banco já existia antes dessa mudança.
-- =====================================================

USE cafe_estoque;

ALTER TABLE entradas MODIFY usuario_id INT NULL;
ALTER TABLE saidas MODIFY usuario_id INT NULL;
