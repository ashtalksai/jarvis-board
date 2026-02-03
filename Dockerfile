FROM node:20-alpine AS base

# Dependencies - build native modules for Linux
FROM base AS deps
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --build-from-source

# Build
FROM base AS builder
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN mkdir -p data
RUN npm run build

# Runner
FROM base AS runner
RUN apk add --no-cache nginx apache2-utils
WORKDIR /app
ENV NODE_ENV=production
ENV DB_PATH=/app/data/jarvis.db

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Copy the native better-sqlite3 module
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/better-sqlite3 ./node_modules/better-sqlite3

RUN mkdir -p /app/data && chown nextjs:nodejs /app/data

# Nginx config with Basic Auth
RUN echo 'events {} \
http { \
    include /etc/nginx/mime.types; \
    upstream nextjs { server localhost:3333; } \
    server { \
        listen 80; \
        \
        # Static files - no auth needed \
        location /_next/static { \
            alias /app/.next/static; \
            expires 1y; \
            add_header Cache-Control "public, immutable"; \
        } \
        \
        # API routes - check for Bearer token, fallback to Basic Auth \
        location /api/ { \
            auth_basic "Jarvis Board"; \
            auth_basic_user_file /app/.htpasswd; \
            \
            # Allow API tokens to bypass Basic Auth \
            if ($http_authorization ~* "^Bearer ") { \
                set $auth_basic off; \
            } \
            \
            proxy_pass http://nextjs; \
            proxy_http_version 1.1; \
            proxy_set_header Host $host; \
            proxy_set_header Authorization $http_authorization; \
        } \
        \
        # All other routes - Basic Auth required \
        location / { \
            auth_basic "Jarvis Board"; \
            auth_basic_user_file /app/.htpasswd; \
            \
            proxy_pass http://nextjs; \
            proxy_http_version 1.1; \
            proxy_set_header Host $host; \
        } \
    } \
}' > /etc/nginx/nginx.conf

# Create startup script with auth setup
RUN echo '#!/bin/sh' > /start.sh && \
    echo 'set -e' >> /start.sh && \
    echo '' >> /start.sh && \
    echo '# Generate htpasswd if credentials provided' >> /start.sh && \
    echo 'if [ -n "$BASIC_AUTH_USER" ] && [ -n "$BASIC_AUTH_PASS" ]; then' >> /start.sh && \
    echo '  htpasswd -bc /app/.htpasswd "$BASIC_AUTH_USER" "$BASIC_AUTH_PASS"' >> /start.sh && \
    echo '  echo "✓ HTTP Basic Auth enabled for user: $BASIC_AUTH_USER"' >> /start.sh && \
    echo 'else' >> /start.sh && \
    echo '  echo "⚠ WARNING: No BASIC_AUTH_USER/PASS set - authentication disabled!"' >> /start.sh && \
    echo '  echo "auth_basic off;" > /etc/nginx/conf.d/disable-auth.conf' >> /start.sh && \
    echo 'fi' >> /start.sh && \
    echo '' >> /start.sh && \
    echo '# Check API tokens' >> /start.sh && \
    echo 'if [ -n "$API_TOKENS" ]; then' >> /start.sh && \
    echo '  TOKEN_COUNT=$(echo "$API_TOKENS" | tr "," "\n" | wc -l)' >> /start.sh && \
    echo '  echo "✓ API tokens configured: $TOKEN_COUNT token(s)"' >> /start.sh && \
    echo 'else' >> /start.sh && \
    echo '  echo "⚠ WARNING: No API_TOKENS set - token auth disabled!"' >> /start.sh && \
    echo 'fi' >> /start.sh && \
    echo '' >> /start.sh && \
    echo 'su -s /bin/sh nextjs -c "cd /app && PORT=3333 HOSTNAME=0.0.0.0 node server.js" &' >> /start.sh && \
    echo 'exec nginx -g '"'"'daemon off;'"'"'' >> /start.sh && \
    chmod +x /start.sh

EXPOSE 80
CMD ["/start.sh"]
