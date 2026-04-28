FROM oven/bun:1.3.10-alpine

WORKDIR /app

COPY installer-site/server.ts ./server.ts
COPY installer-site/favicon-v3.svg ./favicon-v3.svg
COPY install.sh ./install.sh

EXPOSE 3000

CMD ["bun", "run", "server.ts"]
