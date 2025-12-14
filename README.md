# 📝 API de Blog Completa

API REST con Express.js para gestión de posts, comentarios y categorías.

## 🚀 Características

- ✅ Autenticación JWT
- ✅ CRUD de Posts con búsqueda avanzada
- ✅ Sistema de Categorías
- ✅ Comentarios en posts
- ✅ Notificaciones por correo (Ethereal)
- ✅ Rate limiting
- ✅ Validación de datos
- ✅ Paginación

## 📦 Instalación

```bash
npm install
```

## 🏃 Ejecutar

```bash
# Desarrollo
npm run dev

# Producción
npm start
```

La API estará disponible en `http://localhost:3000`

## 🔐 Usuarios de Prueba

| Usuario | Password | Rol    |
| ------- | -------- | ------ |
| admin   | admin123 | admin  |
| autor   | autor123 | author |

## 📚 Endpoints Principales

### Autenticación

- `POST /api/auth/login` - Iniciar sesión

### Posts

- `GET /api/posts` - Listar posts (con búsqueda avanzada)
- `GET /api/posts/:id` - Obtener post
- `POST /api/posts` - Crear post (requiere auth)
- `PUT /api/posts/:id` - Actualizar post (requiere auth)
- `POST /api/posts/publish/:id` - Publicar/despublicar (requiere auth)
- `DELETE /api/posts/:id` - Eliminar post (requiere auth)

### Categorías

- `GET /api/categories` - Listar categorías
- `GET /api/categories/:id` - Obtener categoría
- `POST /api/categories` - Crear categoría (admin)
- `PUT /api/categories/:id` - Actualizar categoría (admin)
- `DELETE /api/categories/:id` - Eliminar categoría (admin)

### Comentarios

- `GET /api/comments/:postId` - Listar comentarios
- `POST /api/comments/:postId` - Crear comentario

## 🔍 Búsqueda Avanzada

```
GET /api/posts?busqueda=javascript&ordenar=relevancia&categoria_id=1
```

**Parámetros disponibles:**

- `busqueda` - Texto a buscar
- `fields` - Campos donde buscar (titulo, contenido)
- `autor` - Filtrar por autor
- `estado` - borrador, publicado, archivado
- `categoria_id` - ID de categoría
- `etiquetas` - Filtrar por etiquetas
- `fechaDesde` / `fechaHasta` - Rango de fechas
- `ordenar` - relevancia, fecha, visitas, titulo
- `pagina` - Número de página
- `limite` - Items por página

## 📧 Notificaciones

Al publicar un post, se envía automáticamente un correo de notificación usando Ethereal (correos de prueba). El link para ver el correo aparece en la consola.

## 🛠️ Tecnologías

- Express.js
- JWT (jsonwebtoken)
- bcryptjs
- express-validator
- Nodemailer
- express-rate-limit
- Helmet
- CORS

## 📖 Documentación

Visita `http://localhost:3000` para ver la documentación interactiva completa.

OpenAPI JSON: `http://localhost:3000/api/docs`

## 🧪 Testing con Postman

### Configuración Inicial

1. **Crear variables de entorno:**

   - `baseURL` = `http://localhost:3000/api`
   - `token` = (vacío inicialmente)

2. **Importar colección** (opcional): Puedes crear requests manualmente siguiendo los ejemplos abajo.

### Ejemplos de Requests

#### 1. Login

```
POST {{baseURL}}/auth/login
Content-Type: application/json

Body:
{
  "username": "admin",
  "password": "admin123"
}

Tests (guardar token automáticamente):
pm.environment.set("token", pm.response.json().token);
```

#### 2. Listar Posts

```
GET {{baseURL}}/posts
```

#### 3. Búsqueda Avanzada

```
GET {{baseURL}}/posts?busqueda=javascript&ordenar=relevancia&categoria_id=1
```

#### 4. Crear Post

```
POST {{baseURL}}/posts
Authorization: Bearer {{token}}
Content-Type: application/json

Body:
{
  "titulo": "Mi Nuevo Post",
  "contenido": "Este es el contenido completo del post",
  "categoriaId": 1,
  "etiquetas": ["javascript", "nodejs"],
  "estado": "borrador"
}
```

#### 5. Publicar Post

```
POST {{baseURL}}/posts/publish/:postId
Authorization: Bearer {{token}}
```

#### 6. Crear Categoría (Admin)

```
POST {{baseURL}}/categories
Authorization: Bearer {{token}}
Content-Type: application/json

Body:
{
  "nombre": "Tecnología"
}
```

#### 7. Crear Comentario

```
POST {{baseURL}}/comments/:postId
Content-Type: application/json

Body:
{
  "autor": "Juan Pérez",
  "email": "juan@example.com",
  "contenido": "Excelente artículo!"
}
```

#### 8. Filtrar Posts por Categoría

```
GET {{baseURL}}/posts?categoria_id=1&estado=publicado
```

