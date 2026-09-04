Café Estoque — Sistema de Controle de Estoque para Café Colonial

Sistema de controle de estoque desenvolvido para um café colonial. Permite cadastrar produtos, categorias e fornecedores, registrar as entradas (compras e entregas) e as saídas (uso do dia a dia), fazer a contagem de inventário comparando o estoque físico com o do sistema, e acompanhar os gastos por período. O acesso é direto, sem login, porque o sistema roda dentro do próprio café e todo mundo que usa tem a mesma permissão.

GERAL:

os testes do back estão sendo feitos com curl/postman batendo direto nas rotas. o mysql está sem senha por enquanto para facilitar na fase de desenvolvimento, senha será adicionada antes do deploy. o backend usa commonJS (require/module.exports), não ES modules. o .env nunca deve ser commitado no github pois contém informações sensíveis. o sistema não tem login: todas as rotas são públicas e ninguém precisa se autenticar para usar.

sobraram da fase em que o projeto tinha login: auth.controller.js, auth.routes.js, middlewares/auth.js e o script criarUsuario.js. eles continuam na pasta mas NÃO estão registrados no server.js, ou seja, não fazem parte do fluxo atual. a variável JWT_SECRET no .env também é resquício disso e hoje não é usada por nada.

para rodar o mysql pelo terminal: & "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root

para rodar o servidor: cd Backend npm run dev

servidor disponível em: http://localhost:3001

para rodar o frontend: cd Frontend npm run dev

frontend disponível em: http://localhost:5173 (se a porta estiver ocupada o vite sobe na próxima livre, ex: 5174 — olhe a URL que aparece no terminal)

COMO SUBIR O PROJETO DO ZERO:

instalar mysql server 8.0 e deixar rodando na porta 3306.
criar o banco rodando o arquivo Backend/database/schema.sql inteiro (ele já cria o banco "cafe_estoque", as tabelas, as duas views e as categorias iniciais). & "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe" -u root < Backend/database/schema.sql
se o banco JÁ existia de antes (da época do login), rodar também Backend/database/migration_sem_login.sql, que solta o campo usuario_id das tabelas entradas, saidas e contagens.
dentro de Backend, criar um arquivo .env com: PORT=3001 DB_HOST=localhost DB_PORT=3306 DB_USER=root DB_PASSWORD= DB_NAME=cafe_estoque
cd Backend && npm install && npm run dev
cd Frontend && npm install && npm run dev
acessar http://localhost:5173 e usar o sistema direto, sem login.

BANCO DE DADOS:

estamos utilizando o mysql server rodando em segundo plano na porta 3306. o mysql2 é a biblioteca do node que usamos para falar com o servidor diretamente sem precisar abrir o workbench. o pool é criado com decimalNumbers: true, para as colunas DECIMAL voltarem como número no javascript em vez de string.

tabelas: categorias, fornecedores, produtos, entradas, entrada_itens, contagens, contagem_itens, saidas e usuarios (essa última é resquício da fase com login e não é mais usada). views: vw_estoque_atual e vw_gastos.

PRODUTOS: repare que NÃO existe uma coluna "estoque_atual" na tabela de produtos. o estoque nunca é guardado, ele é sempre calculado a partir das movimentações (ver COMO O ESTOQUE É CALCULADO abaixo). o produto guarda só o que é fixo dele: nome, categoria, unidade (kg, g, L, ml, un, pct, cx) e estoque_minimo, que é o valor abaixo do qual o item entra em alerta.

ENTRADAS E ENTRADA_ITENS: uma entrada é uma compra/entrega (a "nota"), e os itens dela ficam em entrada_itens. o preço fica no ITEM, não no produto, de propósito: o preço muda a cada compra, então guardando por item temos o histórico real de quanto foi pago em cada uma.

CONTAGENS E CONTAGEM_ITENS: o inventário. cada item guarda o que o sistema achava que tinha (estoque_esperado) e o que a pessoa realmente encontrou na prateleira (estoque_contado). a diferença vira uma saída de ajuste (ver REGRA DA CONTAGEM abaixo).

SAIDAS: tem dois tipos. MANUAL é a retirada do dia a dia ("peguei 5kg de açúcar"). AJUSTE_CONTAGEM é gerada automaticamente pelo sistema quando uma contagem encontra menos produto do que o esperado, e nesse caso o campo contagem_id aponta para a contagem que gerou o ajuste.

DELETES: nenhuma entidade é apagada de verdade. categorias, fornecedores e produtos têm um campo ativo (1/0), e o "excluir" da tela só marca ativo = 0. assim o histórico de compras e movimentações nunca quebra por falta de referência.

COMO O ESTOQUE É CALCULADO:

o estoque de cada produto nunca fica salvo em lugar nenhum. ele é calculado pela view vw_estoque_atual, que faz:

estoque_atual = soma(quantidade das entradas do produto) - soma(quantidade das saídas do produto)

a mesma view já devolve o campo em_alerta, que vale 1 quando o estoque_atual está menor ou igual ao estoque_minimo cadastrado no produto.

a vantagem de calcular em vez de guardar é que não existe risco do número desencontrar: não tem update de saldo para dar errado no meio do caminho, o estoque é sempre a soma real das movimentações registradas. o custo é que toda leitura passa pela view, mas no volume de um café isso é irrelevante.

o valor total em estoque que aparece no dashboard é calculado no estoque.controller.js: para cada produto, multiplica o estoque_atual pelo preço da ÚLTIMA entrada registrada daquele produto (um ROW_NUMBER pega só a compra mais recente). ou seja, é o valor a preço de reposição, não a média histórica.

REGRA DA CONTAGEM (INVENTÁRIO):

quando alguém registra uma contagem, o backend compara, item a item, o esperado com o contado:

contado < esperado (faltou produto) -> gera automaticamente uma saída do tipo AJUSTE_CONTAGEM com a diferença, vinculada àquela contagem. o estoque do sistema cai e passa a bater com a prateleira.
contado = esperado -> não faz nada, só registra que bateu.
contado > esperado (sobrou produto) -> registra o achado no item da contagem, mas NÃO mexe no estoque.

o motivo de sobra não gerar movimentação é que a única forma de aumentar estoque no sistema é uma entrada, e toda entrada exige fornecedor e preço pago — informação que não existe numa sobra de contagem. então a sobra fica documentada na contagem para a pessoa investigar (normalmente é saída que alguém esqueceu de lançar), sem inventar uma compra que não aconteceu.

toda a contagem roda dentro de uma transação: ou grava o cabeçalho, todos os itens e todos os ajustes, ou não grava nada. isso evita uma contagem pela metade caso algo falhe no meio.

BACKEND:

PACKAGE.JSON: configura as dependências do projeto e os scripts para rodar o servidor. é basicamente o documento de identidade do backend. scripts: dev (nodemon), start (node) e criar-usuario (resquício da fase com login).

.ENV: guarda as informações sensíveis do projeto como porta do servidor e dados de conexão com o banco. nunca vai para o github (tem o .env.example versionado como modelo).

CONFIG/DB.JS: cria a conexão com o banco usando um pool de conexões. todo arquivo que precisar consultar o banco importa esse arquivo. um pool reaproveita conexões já abertas em vez de abrir/fechar uma nova a cada consulta.

SERVER.JS: inicia o servidor, configura o cors para o react conseguir se comunicar com o backend, e registra todas as rotas. quando rodamos npm run dev é esse arquivo que o node executa. o cors está liberado para qualquer origem, porque o app do celular acessa a api pelo IP da rede local.

CONTROLLERS/CATEGORIA.JS: crud de categorias. as categorias são uma tabela (e não um ENUM) justamente para o café poder criar categoria nova depois sem ninguém precisar mexer no código. o delete é soft delete (ativo = 0).

CONTROLLERS/FORNECEDOR.JS: crud de fornecedores. o campo tipo separa EMPRESA (quem entrega) de MERCADO (compra direta feita por alguém do café). delete também é soft delete.

CONTROLLERS/PRODUTO.JS: crud de produtos, com filtro opcional por categoria na listagem. delete é soft delete, então o produto some das telas mas continua ligado ao histórico de entradas e saídas dele.

CONTROLLERS/ESTOQUE.JS: só leitura, não grava nada. consulta a view vw_estoque_atual para listar o estoque calculado de cada produto e monta o resumo usado no dashboard (total de produtos, total de categorias, total de fornecedores, quantos itens estão em alerta e o valor total em estoque).

CONTROLLERS/ENTRADA.JS: registra entrada de estoque. cada chamada cria uma entrada (a nota) com um item dentro, dentro de uma transação. valida que o produto e o fornecedor existem e estão ativos, e que quantidade e preço são números válidos, antes de gravar qualquer coisa.

CONTROLLERS/SAIDA.JS: registra saída manual de estoque (o uso do dia a dia). valida produto e quantidade e grava com tipo MANUAL.

CONTROLLERS/CONTAGEM.JS: contagens de inventário. lista as contagens já feitas (com quantos itens e quantos ajustes cada uma gerou), abre o detalhe de uma contagem (esperado x contado x diferença por produto) e registra uma contagem nova. é aqui que fica a regra de gerar a saída de AJUSTE_CONTAGEM quando falta produto (ver REGRA DA CONTAGEM acima). tudo roda em transação.

CONTROLLERS/GASTO.JS: relatório de gastos. só consulta a view vw_gastos, com filtros opcionais de período (data_inicio/data_fim), categoria e fornecedor, e devolve também um resumo com o total gasto e o total por categoria. os mesmos filtros valem para a lista e para o resumo.

ROTAS DA API:

todas as rotas abaixo são públicas — não é exigido login para acessar nenhuma delas.

GET /api/categorias listar categorias ativas POST /api/categorias criar categoria PUT /api/categorias/:id atualizar categoria DELETE /api/categorias/:id desativar categoria (soft delete)

GET /api/fornecedores listar fornecedores ativos POST /api/fornecedores criar fornecedor PUT /api/fornecedores/:id atualizar fornecedor DELETE /api/fornecedores/:id desativar fornecedor (soft delete)

GET /api/produtos listar produtos (filtro opcional ?categoria_id=) GET /api/produtos/:id buscar produto por id POST /api/produtos criar produto PUT /api/produtos/:id atualizar produto DELETE /api/produtos/:id desativar produto (soft delete)

GET /api/estoque estoque atual por produto (view vw_estoque_atual) GET /api/estoque/resumo totais usados no dashboard

POST /api/entradas registrar entrada (compra/entrega) de um produto POST /api/saidas registrar saída manual de um produto

GET /api/contagens listar contagens já feitas GET /api/contagens/:id detalhe da contagem (itens: esperado x contado x diferença) POST /api/contagens registrar contagem; gera saídas de AJUSTE_CONTAGEM para os produtos com falta

GET /api/gastos listar gastos (view vw_gastos), filtros ?data_inicio= &data_fim= &categoria_id= &fornecedor_id= GET /api/gastos/resumo total gasto e total por categoria (mesmos filtros)

GET /api/ping testa se a api está no ar

TESTES:

não existe suíte de testes automatizados no projeto, os testes são manuais batendo nas rotas com curl ou postman. como não tem login, não precisa de token em lugar nenhum: é só mandar a requisição.

fluxo completo de teste:

GET /api/ping conferir que a api subiu
POST /api/categorias criar uma categoria
POST /api/fornecedores criar um fornecedor
POST /api/produtos criar um produto nessa categoria
POST /api/entradas registrar uma entrada de 10 unidades desse produto
GET /api/estoque conferir que o estoque do produto está 10
POST /api/contagens registrar uma contagem com estoque_contado 7 para esse produto
GET /api/estoque conferir que o estoque caiu para 7 (o ajuste automático de 3 foi gerado)
GET /api/contagens/:id conferir o detalhe da contagem, com diferença -3
GET /api/gastos e GET /api/gastos/resumo conferir o relatório de gastos

exemplo de corpo da contagem: {"data_contagem":"2026-08-26","observacao":"contagem de segunda","itens":[{"produto_id":3,"estoque_contado":7}]}

FRONTEND:

react 19 + vite + react router 7 + axios. o css é escrito à mão (index.css com as variáveis de cor do tema café/dourado, e App.css com os componentes visuais), sem framework de estilo.

SERVICES/API.JS: instância do axios com a baseURL do backend. a URL vem da variável VITE_API_URL do .env e cai em http://localhost:3001/api quando ela não existe. isso é o que permite o mesmo código funcionar no navegador do PC (localhost) e no app do celular (IP do PC na rede).

COMPONENTS/LAYOUT.JSX: sidebar fixa com a marca e o menu, e o conteúdo de cada página renderizado ao lado. cada item do menu tem seu próprio ícone svg escrito na mão no arquivo. o item ativo é destacado pelo NavLink do react router.

COMPONENTS/MODAL.JSX: modal genérico usado pelos formulários. fecha ao clicar no fundo escuro, e o clique dentro da caixa não propaga para não fechar sem querer.

COMPONENTS/ERRORBOUNDARY.JSX: envolve o app inteiro no main.jsx. se algum componente quebrar, em vez da tela branca aparece um card de "algo deu errado" com um botão de tentar de novo. isso importa principalmente no app do celular, onde não dá para abrir o console para ver o erro.

PÁGINAS:

Dashboard.jsx: visão geral do estoque, com os cards de total de produtos, valor total em estoque, quantos itens estão com estoque baixo e a contagem de categorias/fornecedores, mais a lista dos itens em alerta. se o backend não responder, mostra um aviso explicando que pode ser o servidor desligado ou o celular fora da mesma rede wi-fi, com botão de tentar de novo.
Produtos.jsx: lista de produtos com o estoque atual de cada um (destacado em vermelho quando está em alerta). é a tela mais usada no dia a dia: além do cadastro/edição do produto, tem os botões de registrar entrada (+) e registrar saída (−) direto na linha de cada item.
Categorias.jsx: cadastro, edição e desativação de categorias.
Fornecedores.jsx: cadastro, edição e desativação de fornecedores, separando empresa de mercado.
Contagens.jsx: o inventário. tem três telas dentro dela: a lista das contagens já feitas (com quantos ajustes cada uma gerou), a tela de nova contagem, que lista todos os produtos ativos já preenchidos com o estoque esperado (a pessoa só corrige o que estiver diferente na prateleira) e ao salvar mostra um resumo dos ajustes que foram gerados, e a tela de detalhe de uma contagem antiga, com esperado x contado x diferença por produto.
Gastos.jsx: relatório de gastos, com filtro de período, card do total gasto, a quebra por categoria e a tabela de todos os lançamentos (data, fornecedor, produto, categoria, quantidade, preço unitário e total).
ROTAS (App.jsx): "/" (dashboard), "/produtos", "/categorias", "/fornecedores", "/contagens" e "/gastos". todas são públicas, e qualquer outra URL cai de volta no dashboard. não existe tela de login no sistema.

APP NO CELULAR (ANDROID):

o front-end também vira um app android instalável, empacotado com o capacitor, que roda em tela cheia sem barra de navegador. o projeto nativo fica em Frontend/android/ e é o MESMO código react do site, só empacotado.

como o app roda no celular, ele não enxerga o localhost do PC — precisa do IP do PC na rede wi-fi. esse IP fica no Frontend/.env (VITE_API_URL=http://SEU_IP:3001/api, ver Frontend/.env.example). se o IP do PC mudar, atualize esse arquivo antes de gerar o app de novo.

o PC também precisa aceitar conexões de fora na porta 3001, o que normalmente exige liberar a porta no firewall do windows (uma vez só, como administrador): New-NetFirewallRule -DisplayName "Cafe_Estoque Backend" -Direction Inbound -Protocol TCP -LocalPort 3001 -Action Allow -Profile Private

para gerar o apk: cd Frontend .\build-android.ps1

o script compila o site, sincroniza com o projeto android e gera o Cafe_Estoque.apk na pasta acima do projeto. copie esse arquivo para o celular (cabo, whatsapp, drive...), abra e permita "instalar de fontes desconhecidas" quando o android pedir. cada passo do script para na hora se falhar, em vez de seguir e gerar um apk com a versão velha do site.

requisitos para o app funcionar: celular e PC na mesma rede wi-fi, e o backend rodando no PC. os detalhes de como o build foi configurado (JDK, android SDK, e por que existe o script em vez de rodar o gradlew direto) estão comentados no topo do próprio build-android.ps1.
