
# SmartLink (Comblink)

Aplicação simples para gerar "smart links" que redirecionam clientes móveis para o app apropriado (iOS/Android) ou uma URL de desktop. Inclui geração de QR codes, registro de cliques (com plataforma, user-agent e IP) e endpoints administrativos mínimos para criação e listagem de links.

> Implementado com Node.js (Express), Prisma (Postgres) e QR code estático. Projeto em português.

## Visão geral

- Rotas principais:
	- GET /l/:slug — redireciona de acordo com a plataforma (iOS, Android, Desktop) e registra o clique.
	- GET /qr/:slug.png — retorna imagem PNG do QR code para o smart link.
	- POST /api/links — cria ou atualiza um smart link (aceita JSON e form-url-encoded).
	- POST /admin/links — interface mínima administrativa para criar/atualizar links (JSON).
	- GET /admin/links — lista todos os links.
	- GET /admin/links/:slug/clicks — lista cliques de um link.
	- GET /create — página de formulário (UI mínima) para criar links.

- Banco de dados: Prisma com modelos Link e Click. O enum Platform inclui IOS, ANDROID, DESKTOP e UNKNOWN.

## Requisitos

- Node.js 18+ (recomenda-se a LTS mais recente)
- Postgres (ou outro suportado alterando o datasource)
- yarn ou npm

## Instalação

1. Clone o repositório e entre na pasta do projeto:

```powershell
git clone <repo-url> comblink
cd comblink
```

2. Instale dependências:

```powershell
npm install
```

3. Configure variáveis de ambiente (crie um arquivo `.env` na raiz):

Exemplo mínimo `.env`:

```
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
PORT=3000
BASE_URL=http://localhost:3000
```

4. Gere cliente Prisma e rode migrações (opcional se já houver banco/migrations):

```powershell
npx prisma generate
npx prisma migrate dev --name init
npm run seed
```

> O projeto já contém a pasta `generated/prisma` com artefatos do client. Se preferir usar o client gerado incluído, não é necessário rodar `prisma generate` localmente.

## Scripts úteis

- npm run dev — inicia com nodemon (monitoramento) — `nodemon src/server.js`
- npm start — inicia com Node — `node src/server.js`
- npm run prisma:generate — executa `prisma generate`
- npm run prisma:migrate — roda `prisma migrate dev --name init`
- npm run seed — roda o seed (`tsx prisma/seed.ts`)

## Como usar

1. Inicie o servidor:

```powershell
npm run dev
```

2. Criar link via API (exemplo usando curl / HTTP):

Requisição JSON (também aceita form-url-encoded):

```json
POST /api/links
{
	"slug": "meulink",
	"iosUrl": "https://apps.apple.com/app/id...",
	"androidUrl": "https://play.google.com/store/apps/details?id=...",
	"desktopUrl": "https://example.com/desktop-fallback"
}
```

Resposta de sucesso contém o slug, smartUrl absoluto e o caminho do QR (`qrPng`).

3. Acessar o smart link:

Abra `http://localhost:3000/l/meulink` — o servidor detectará o user-agent e redirecionará para a URL correta. Para dispositivos desktop sem `desktopUrl`, é exibida a página `views/open-on-desktop.html`.

4. Baixar/visualizar QR:

Abra `http://localhost:3000/qr/meulink.png` para obter o QR code PNG.

## Endpoints (resumo)

- GET / — rota de verificação (retorna "OK – Smart Link rodando").
- GET /l/:slug — redireciona pelo slug e registra clique.
- GET /qr/:slug.png — gera QR code PNG do smart link.
- GET /create — formulário HTML para criar links (views/create.html).
- POST /api/links — cria/atualiza link (JSON ou form).
- POST /admin/links — cria/atualiza link via admin (JSON).
- GET /admin/links — lista links.
- GET /admin/links/:slug/clicks — lista cliques do link.

## Variáveis de ambiente

- DATABASE_URL — string de conexão do Postgres.
- PORT — porta onde o servidor escuta (padrão 3000).
- BASE_URL — URL base usada para montar o smartUrl nos QR codes (opcional; padrão http://localhost:3000).

## Observações de implementação

- O arquivo `src/routes.js` contém a lógica principal: detecção de platform via user-agent (`src/device.js`), registro de clicks com Prisma e geração de QR com o pacote `qrcode`.
- As validações para criação de links são básicas: exige `iosUrl` e `androidUrl`, valida formatos com `new URL()` e gera um slug aleatório curto quando não informado.
- O endpoint administrativo não tem autenticação — em produção deve ser protegido (token, autenticação, CORS restrito, etc.).

## Melhores próximos passos / melhorias

- Proteger rotas administrativas (API key, JWT, etc.).
- Adicionar paginação e filtros para os clicks e logs.
- Suporte a métricas agregadas (gráficos simples por plataforma/data).
- Testes automatizados para as rotas críticas.

## Contribuição

1. Fork e clone o repositório.
2. Crie uma branch com a feature/bugfix.
3. Abra PR explicando as mudanças.

## Licença

Este repositório não contém um arquivo de licença explicitado. Adicione um `LICENSE` se for necessário.

---

Se quiser, posso ajustar o README com exemplos de cURL mais completos, instruções para deploy (Docker/Heroku) ou adicionar um badge de status. Diga qual desses você prefere que eu adicione a seguir.
