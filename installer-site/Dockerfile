FROM oven/bun:1.3.10-alpine

WORKDIR /app

COPY installer-site/server.ts ./server.ts
COPY installer-site/favicon-v3.svg ./favicon-v3.svg
COPY install.sh ./install.sh
COPY packages/opencode-maas ./opencode-maas
RUN mkdir -p /tmp/opencode-maas/package \
  && cp -R /app/opencode-maas/src /tmp/opencode-maas/package/src \
  && cp /app/opencode-maas/README.md /tmp/opencode-maas/package/README.md \
  && bun -e 'const pkg = await Bun.file("/app/opencode-maas/package.json").json(); delete pkg.scripts; delete pkg.devDependencies; await Bun.write("/tmp/opencode-maas/package/package.json", JSON.stringify(pkg, null, 2) + "\n")' \
  && tar -czf /app/hwcli-opencode-maas-1.14.28.tgz -C /tmp/opencode-maas package

EXPOSE 3000

CMD ["bun", "run", "server.ts"]
