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
JWT_HABILITADO=false ./mvnw spring-boot:run
```

Arranca en el puerto 8080 con datos demo. En esta entrega no hay login: el backend atiende todas las peticiones como un usuario fijo, `admin@demo.com` por defecto. Swagger queda en `http://localhost:8080/swagger-ui/index.html`.

Usuarios demo: `admin@demo.com` y `admin@beta.com`, los dos con la clave `admin123`. Son de empresas distintas. Los datos demo aparecen justo después del arranque, así que si la primera petición da 401, hay que repetirla.

## Frontend

```bash
npm install
npm start
```

Abrir `http://localhost:4200`. La dirección del backend y el usuario salen de `public/config.json`:

```json
{
  "apiUrl": "http://localhost:8080/api/v1",
  "usuarioFijo": { "email": "admin@demo.com", "rolAcceso": "ADMINISTRADOR" }
}
```

## Cambiar de usuario

Reiniciar el backend con `USUARIO_FIJO=admin@beta.com` y poner ese mismo correo, con su rol, en `public/config.json`. El rol puede ser `ADMINISTRADOR`, `EDITOR` o `SOLO_LECTURA`.

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
  -e USUARIO_FIJO_EMAIL=admin@demo.com \
  -e USUARIO_FIJO_ROL=ADMINISTRADOR \
  frontangular
```

Las tres variables son obligatorias. `API_URL` la usa el navegador de quien abre la app, así que debe ser una dirección a la que ese navegador llegue. El backend también necesita configuración (`CORS_ALLOWED_ORIGINS`, `JWT_HABILITADO` y `USUARIO_FIJO`); está explicada en la página de despliegue de la wiki.

## Documentación

Arquitectura del front, Swagger, Postman y despliegue en dos máquinas están en la [wiki](https://github.com/Siftings/ProyectoWebFront/wiki).
