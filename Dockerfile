FROM node:18-bullseye AS builder
WORKDIR /app

# Copia package.json e package-lock (se existir) para aproveitar cache de layers
COPY package.json package-lock.json* ./

# Instala todas as dependências (inclui prisma em devDependencies para gerar client)
RUN npm ci --silent

# Copia o restante do código
COPY . .

# Gera o client do Prisma para a plataforma do container
RUN npx prisma generate

### Image final menor
FROM node:18-bullseye-slim
WORKDIR /app

ENV NODE_ENV=production

# Copia node_modules e aplicação do estágio builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app .

# Porta padrão usada pela aplicação
EXPOSE 3000

# Variáveis de ambiente recomendadas (definir em runtime/host): DATABASE_URL, BASE_URL, PORT

CMD ["node", "src/server.js"]
