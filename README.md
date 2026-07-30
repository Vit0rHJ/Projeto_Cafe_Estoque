# Café Estoque

Sistema de controle de estoque para um café colonial: cadastro de produtos,
categorias e fornecedores, com registro de entradas (compras/entregas) e
saídas, e controle de estoque mínimo. O acesso ao sistema é direto, sem
necessidade de login.

## Status atual do projeto

O que já está implementado:

- **CRUD de categorias, fornecedores e produtos** (back-end + interface)
- **Registro de entradas e saídas de estoque** (`/api/entradas`, `/api/saidas`),
  usados para calcular o estoque atual de cada produto
- **Dashboard** com totais, valor em estoque e alerta de estoque baixo
- **Schema completo do banco** (`Backend/database/schema.sql`), incluindo a
  view `vw_estoque_atual` (estoque calculado + alerta de estoque mínimo) e
  `vw_gastos` (relatório de gastos por compra)
- **Front-end em React** (`Frontend/`), com opção de gerar um app Android
  (ver [App no celular](#app-no-celular-android) abaixo)

O que existe no banco mas ainda não tem rotas/controllers na API: contagens
de estoque (inventário).

## Tecnologias

- Backend: Node.js + Express, MySQL (via `mysql2/promise`), `dotenv`, `cors`, `nodemon` em desenvolvimento
- Frontend: React + Vite, React Router, axios
- App Android: [Capacitor](https://capacitorjs.com) empacotando o mesmo front-end

## Estrutura do projeto

```
Backend/
├── database/
│   ├── schema.sql          # script de criação do banco (tabelas + views)
│   └── migration_sem_login.sql
├── src/
│   ├── config/
│   │   └── db.js           # pool de conexão com o MySQL
│   ├── controllers/        # lógica de cada entidade (categoria, fornecedor, produto, entrada, saida, estoque)
│   ├── routes/              # mapeamento de URL/verbo HTTP -> controller
│   └── server.js            # ponto de entrada da API
├── .env.example
└── package.json
Frontend/
├── src/
│   ├── pages/               # Dashboard, Produtos, Categorias, Fornecedores
│   ├── components/          # Layout (sidebar), Modal
│   └── services/api.js      # instância axios (baseURL vem de VITE_API_URL)
├── android/                  # projeto nativo gerado pelo Capacitor
├── build-android.ps1         # gera o .apk (ver "App no celular" abaixo)
└── capacitor.config.json
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

### 3. Frontend

```bash
cd Frontend
npm install
npm run dev             # abre em http://localhost:5173 (ou porta livre seguinte)
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
| GET    | `/api/estoque`           | Lista estoque atual por produto (view `vw_estoque_atual`) |
| GET    | `/api/estoque/resumo`    | Totais usados no dashboard          |
| POST   | `/api/entradas`          | Registra entrada (compra/entrega) de um produto |
| POST   | `/api/saidas`            | Registra saída (uso/retirada) de um produto |
| GET    | `/api/ping`              | Testa se a API está no ar           |

## Próximos passos

- Rotas/controllers de contagens de estoque (inventário)
- Endpoint que exponha `vw_gastos` (relatório de gastos)

## App no celular (Android)

O front-end também pode virar um app Android instalável (via
[Capacitor](https://capacitorjs.com)), que roda em tela cheia sem barra de
navegador. O projeto nativo fica em `Frontend/android/`.

Como o app roda no celular, ele **não** enxerga `localhost` do PC — precisa
do IP do PC na rede Wi-Fi. Esse IP fica em `Frontend/.env`
(`VITE_API_URL=http://SEU_IP:3001/api`; veja `Frontend/.env.example`). Se o
IP do PC mudar, atualize esse arquivo antes de gerar o app de novo.

O PC também precisa aceitar conexões de fora na porta 3001. Isso normalmente
exige liberar a porta no firewall do Windows (uma vez só, como
administrador):

```powershell
New-NetFirewallRule -DisplayName "Cafe_Estoque Backend" -Direction Inbound -Protocol TCP -LocalPort 3001 -Action Allow -Profile Private
```

Para gerar o `.apk`:

```powershell
cd Frontend
.\build-android.ps1
```

O script compila o site, sincroniza com o projeto Android e gera
`Cafe_Estoque.apk` na pasta acima do projeto (Área de Trabalho). Copie esse
arquivo para o celular (cabo, WhatsApp, Drive...), abra-o e permita
"instalar de fontes desconhecidas" quando o Android pedir.

Requisitos para o app funcionar: celular e PC na mesma rede Wi-Fi, e o
backend (`npm run dev` na pasta `Backend`) rodando no PC.

Detalhes de como o build foi configurado (JDK, Android SDK, e por que existe
o script em vez de rodar `gradlew` direto) estão comentados no topo de
`Frontend/build-android.ps1`.