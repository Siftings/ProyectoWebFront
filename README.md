# Procesos BPMN (frontend)

Cliente web para modelar procesos BPMN de varias empresas. Consume la API REST del backend, que está en [ProyectoWebBack](https://github.com/Siftings/ProyectoWebBack).

## Stack

Angular, CSS propio, nginx y Docker.

## Requisitos

- Node.js y npm
- Java, para el backend
- Docker (opcional)

## Backend

En el repositorio del backend:

```bash
git switch feat/modo-sin-jwt
./mvnw spring-boot:run
```

Arranca en el puerto 8080 con datos demo y con el JWT habilitado. Swagger queda en `http://localhost:8080/swagger-ui/index.html`. Sin `JWT_SECRET` el backend genera una clave al arrancar y las sesiones abiertas dejan de servir en cada reinicio; para un servidor conviene fijarla.

Usuarios demo: `admin@demo.com` y `admin@beta.com`, los dos con la clave `admin123`. Son de empresas distintas. Los datos demo aparecen justo después del arranque, así que si la primera petición da 401, hay que repetirla.

## Frontend

```bash
npm install
npm start
```

Abrir `http://localhost:4200` e iniciar sesión con un usuario demo. La dirección del backend sale de `public/config.json`:

```json
{
  "apiUrl": "http://localhost:8080/api/v1"
}
```

La sesión dura 30 minutos y se guarda en el navegador, así que recargar la página no la cierra. Cuando vence, la app vuelve al login.

## Build y pruebas

```bash
npm run build
npm test
```

## Docker

```bash
docker build -t frontangular .
docker run -p 80:80 \
  -e API_URL=http://<ip-vm-back>:8080/api/v1 \
  frontangular
```

`API_URL` es obligatoria. La usa el navegador de quien abre la app, así que debe ser una dirección a la que ese navegador llegue. El backend también necesita configuración (`CORS_ALLOWED_ORIGINS` y `JWT_SECRET`); está explicada en la página de despliegue de la wiki.

## Documentación

Arquitectura del front, Swagger, Postman y despliegue en dos máquinas están en la [wiki](https://github.com/Siftings/ProyectoWebFront/wiki).
