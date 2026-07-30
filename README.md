# Café Estoque

Sistema de controle de estoque para um café colonial: cadastro de produtos,
categorias e fornecedores, com registro de entradas (compras/entregas) e
saídas, e controle de estoque mínimo. O acesso ao sistema é direto, sem
necessidade de login.

## Status atual do projeto

O que já está implementado (back-end):

- **CRUD de categorias** (`/api/categorias`)
- **CRUD de fornecedores** (`/api/fornecedores`)
- **CRUD de produtos** (`/api/produtos`), com filtro por categoria
- **Schema completo do banco** (`Backend/database/schema.sql`), incluindo
  tabelas de entradas, saídas e contagens de estoque, além das views
  `vw_estoque_atual` (estoque calculado + alerta de estoque mínimo) e
  `vw_gastos` (relatório de gastos por compra)

O que existe no banco mas **ainda não tem rotas/controllers** na API:
registro de entradas, registro de saídas e contagens de estoque
(inventário). O front-end (`Frontend/`) ainda não foi iniciado.

## Tecnologias

- Node.js + Express
- MySQL (via `mysql2/promise`)
- Autenticação com `jsonwebtoken` + senhas com `bcryptjs`
- `dotenv` para variáveis de ambiente, `cors`, `nodemon` em desenvolvimento

## Estrutura do projeto

```
Backend/
├── database/
│   └── schema.sql          # script de criação do banco (tabelas + views)
├── scripts/
│   └── criarUsuario.js     # cria usuário direto no banco (uso via CLI)
├── src/
│   ├── config/
│   │   └── db.js           # pool de conexão com o MySQL
│   ├── controllers/        # lógica de cada entidade (auth, categoria, fornecedor, produto)
│   ├── middlewares/
│   │   └── auth.js         # valida o token JWT nas rotas protegidas
│   ├── routes/              # mapeamento de URL/verbo HTTP -> controller
│   └── server.js            # ponto de entrada da API
├── .env.example
└── package.json
Frontend/                    # ainda não iniciado
```

## Como rodar o projeto

### 1. Banco de dados

Crie o banco executando o script SQL em um servidor MySQL 8.x:

```bash
mysql -u root -p < Backend/database/schema.sql
```

### 2. Backend

```bash
cd Backend
npm install
cp .env.example .env   # depois preencha DB_USER, DB_PASSWORD e JWT_SECRET
npm run dev             # inicia com nodemon em http://localhost:3001
```

## Endpoints da API

Todas as rotas abaixo são públicas — não é exigido login para acessá-las.

| Método | Rota                    | Descrição                          |
|--------|--------------------------|-------------------------------------|
| GET    | `/api/categorias`        | Lista categorias ativas             |
| POST   | `/api/categorias`        | Cria categoria                      |
| PUT    | `/api/categorias/:id`    | Atualiza categoria                  |
| DELETE | `/api/categorias/:id`    | Desativa categoria (soft delete)    |
| GET    | `/api/fornecedores`      | Lista fornecedores ativos           |
| POST   | `/api/fornecedores`      | Cria fornecedor                     |
| PUT    | `/api/fornecedores/:id`  | Atualiza fornecedor                 |
| DELETE | `/api/fornecedores/:id`  | Desativa fornecedor (soft delete)   |
| GET    | `/api/produtos`          | Lista produtos (filtro `?categoria_id=`) |
| GET    | `/api/produtos/:id`      | Busca produto por id                |
| POST   | `/api/produtos`          | Cria produto                        |
| PUT    | `/api/produtos/:id`      | Atualiza produto                    |
| DELETE | `/api/produtos/:id`      | Desativa produto (soft delete)      |
| GET    | `/api/ping`              | Testa se a API está no ar           |

## Próximos passos

- Rotas/controllers de entradas (registro de compras/entregas)
- Rotas/controllers de saídas e contagens (inventário)
- Endpoints que exponham `vw_estoque_atual` e `vw_gastos`
- Início do front-end



Para rodar o projeto, abra dois terminais separados:

Backend (pasta Backend):


cd Backend
npm install
npm run dev
(npm run dev usa nodemon, reiniciando o servidor automaticamente a cada alteração; npm start roda sem watch)

Frontend (pasta Frontend):


cd Frontend
npm install
npm run dev