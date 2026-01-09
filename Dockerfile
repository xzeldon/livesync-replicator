FROM denoland/deno:alpine-2.6.2

RUN apk add --no-cache su-exec

WORKDIR /app

COPY deno.json deps.ts setup.ts ./

COPY lib ./lib

RUN deno cache --sloppy-imports deps.ts

COPY . .

RUN deno run --allow-read --allow-write setup.ts
RUN deno cache --sloppy-imports main.ts

COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

ENV LIVESYNC_LOCAL_DIR="/app/vault" \
	LIVESYNC_DRY_RUN="false" \
	PUID=1000 \
	PGID=1000

VOLUME ["/app/vault"]

ENTRYPOINT ["entrypoint.sh"]
