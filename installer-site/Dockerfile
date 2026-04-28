FROM oven/bun:1.3.10-alpine

WORKDIR /app

COPY server.ts ./server.ts
COPY favicon-v3.svg ./favicon-v3.svg

EXPOSE 3000

CMD ["bun", "run", "server.ts"]
