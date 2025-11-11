# Сборка
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm run build

# Nginx (меньше размер, быстрее, безопаснее)
FROM nginx:alpine
COPY --from=build /app/dist/spa /usr/share/nginx/html
# Правильный SPA роутинг
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80