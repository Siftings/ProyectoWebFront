FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY angular.json tsconfig.json tsconfig.app.json tsconfig.spec.json ./
COPY src/ src/
COPY public/ public/
RUN npm run build && rm dist/frontAngular/browser/config.json

FROM nginx:alpine
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --chmod=755 docker/40-config.sh /docker-entrypoint.d/40-config.sh
COPY --from=build /app/dist/frontAngular/browser /usr/share/nginx/html
EXPOSE 80
