const express = require("express");
const rateLimit = require("express-rate-limit");
const cors = require("cors");
const helmet = require("helmet");

// Importar rutas
const authRoutes = require("./src/routes/auth");
const postsRoutes = require("./src/routes/posts");
const commentsRoutes = require("./src/routes/comments");
const categoriesRoutes = require("./src/routes/categories")

// Crear aplicación
const app = express();

// Middleware de seguridad y configuración
app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 peticiones por IP
  message: {
    error: "Demasiadas peticiones desde esta IP",
    retryAfter: "15 minutos",
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/", limiter);

// Rate limiting más estricto para autenticación
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    error: "Demasiados intentos de login",
    retryAfter: "15 minutos",
  },
});

app.use("/api/auth/login", authLimiter);
// Documentación OpenAPI básica
app.get("/api/docs", (req, res) => {
  res.json({
    openapi: "3.0.0",
    info: {
      title: "API de Blog",
      version: "1.0.0",
      description: "API REST para gestión de posts y comentarios de blog",
    },
    servers: [
      {
        url: "http://localhost:3000/api",
        description: "Servidor de desarrollo",
      },
    ],
    paths: {
      "/auth/login": {
        post: {
          summary: "Iniciar sesión",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["username", "password"],
                  properties: {
                    username: { type: "string" },
                    password: { type: "string" },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: "Login exitoso",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      token: { type: "string" },
                      user: { type: "object" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/posts": {
        get: {
          summary: "Listar posts",
          parameters: [
            {
              name: "pagina",
              in: "query",
              schema: { type: "integer", minimum: 1 },
              description: "Número de página",
            },
            {
              name: "limite",
              in: "query",
              schema: { type: "integer", minimum: 1, maximum: 100 },
              description: "Elementos por página",
            },
          ],
          responses: {
            200: {
              description: "Lista de posts",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      posts: { type: "array" },
                      meta: { type: "object" },
                    },
                  },
                },
              },
            },
          },
        },
        post: {
          summary: "Crear post",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["titulo", "contenido"],
                  properties: {
                    titulo: { type: "string" },
                    contenido: { type: "string" },
                    etiquetas: { type: "array", items: { type: "string" } },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: "Post creado" },
          },
        },
      },
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  });
});

// Parsing de JSON
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Logging básico
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.url} - IP: ${req.ip}`);
  next();
});

// Rutas de la API
app.use("/api/auth", authRoutes);
app.use("/api/posts", postsRoutes);
app.use("/api/comments", commentsRoutes);
app.use("/api/categories", categoriesRoutes);

// Página de inicio
app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>API de Blog</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .endpoint { background: #f5f5f5; padding: 15px; margin: 10px 0; border-radius: 5px; }
        .method { font-weight: bold; color: #007acc; }
        .auth { color: #e74c3c; }
        .public { color: #27ae60; }
        code { background: #e8e8e8; padding: 2px 4px; border-radius: 3px; }
      </style>
    </head>
    <body>
      <h1>📝 API de Blog Completa</h1>
      <p>API REST con Express.js para gestión de posts, comentarios y categorías.</p>

      <h2>🔐 Autenticación</h2>
      <div class="endpoint">
        <span class="method">POST</span> <code>/api/auth/login</code> <span class="public">Público</span>
        <p>Iniciar sesión con credenciales.</p>
        <details>
          <summary>Ver ejemplo</summary>
          <pre>{
  "username": "admin",
  "password": "admin123"
}</pre>
        </details>
      </div>

      <h2>📄 Posts</h2>
      <div class="endpoint">
        <span class="method">GET</span> <code>/api/posts</code> <span class="public">Público</span>
        <p>Listar posts con filtros y paginación. Soporta búsqueda avanzada.</p>
        <details>
          <summary>Parámetros de búsqueda</summary>
          <ul>
            <li><code>busqueda</code> - Texto a buscar</li>
            <li><code>fields</code> - Campos donde buscar (titulo, contenido)</li>
            <li><code>autor</code> - Filtrar por autor</li>
            <li><code>estado</code> - Filtrar por estado</li>
            <li><code>categoria_id</code> - Filtrar por categoría</li>
            <li><code>etiquetas</code> - Filtrar por etiquetas</li>
            <li><code>fechaDesde / fechaHasta</code> - Rango de fechas</li>
            <li><code>ordenar</code> - relevancia, fecha, visitas, titulo</li>
          </ul>
        </details>
      </div>

      <div class="endpoint">
        <span class="method">GET</span> <code>/api/posts/:id</code> <span class="public">Público</span>
        <p>Obtener post específico.</p>
      </div>

      <div class="endpoint">
        <span class="method">POST</span> <code>/api/posts</code> <span class="auth">Requiere Auth</span>
        <p>Crear nuevo post (solo autores y admin).</p>
      </div>

      <div class="endpoint">
        <span class="method">PUT</span> <code>/api/posts/:id</code> <span class="auth">Requiere Auth</span>
        <p>Actualizar post (solo autor o admin).</p>
      </div>

      <div class="endpoint">
        <span class="method">POST</span> <code>/api/posts/publish/:id</code> <span class="auth">Requiere Auth</span>
        <p>Publicar/despublicar post (toggle estado). Envía notificación por correo.</p>
      </div>

      <div class="endpoint">
        <span class="method">DELETE</span> <code>/api/posts/:id</code> <span class="auth">Requiere Auth</span>
        <p>Eliminar post (solo autor o admin).</p>
      </div>

      <h2>🏷️ Categorías</h2>
      <div class="endpoint">
        <span class="method">GET</span> <code>/api/categories</code> <span class="public">Público</span>
        <p>Listar todas las categorías.</p>
      </div>

      <div class="endpoint">
        <span class="method">GET</span> <code>/api/categories/:id</code> <span class="public">Público</span>
        <p>Obtener categoría específica.</p>
      </div>

      <div class="endpoint">
        <span class="method">POST</span> <code>/api/categories</code> <span class="auth">Requiere Auth (Admin)</span>
        <p>Crear nueva categoría.</p>
      </div>

      <div class="endpoint">
        <span class="method">PUT</span> <code>/api/categories/:id</code> <span class="auth">Requiere Auth (Admin)</span>
        <p>Actualizar categoría.</p>
      </div>

      <div class="endpoint">
        <span class="method">DELETE</span> <code>/api/categories/:id</code> <span class="auth">Requiere Auth (Admin)</span>
        <p>Eliminar categoría.</p>
      </div>

      <h2>💬 Comentarios</h2>
      <div class="endpoint">
        <span class="method">GET</span> <code>/api/comments/:postId</code> <span class="public">Público</span>
        <p>Obtener comentarios de un post.</p>
      </div>

      <div class="endpoint">
        <span class="method">POST</span> <code>/api/comments/:postId</code> <span class="public">Público</span>
        <p>Crear comentario en un post.</p>
      </div>

      <h2>📚 Documentación</h2>
      <div class="endpoint">
        <span class="method">GET</span> <code>/api/docs</code> <span class="public">Público</span>
        <p>Documentación OpenAPI en formato JSON.</p>
      </div>

      <h2>🧪 Usuarios de Prueba</h2>
      <ul>
        <li><strong>Admin:</strong> username: "admin", password: "admin123"</li>
        <li><strong>Autor:</strong> username: "autor", password: "autor123"</li>
      </ul>

      <h2>🛠️ Testing con cURL</h2>
      <h3>1. Login:</h3>
      <code>curl -X POST http://localhost:3000/api/auth/login -H "Content-Type: application/json" -d '{"username":"admin","password":"admin123"}'</code>

      <h3>2. Listar posts:</h3>
      <code>curl http://localhost:3000/api/posts</code>

      <h3>3. Búsqueda avanzada:</h3>
      <code>curl "http://localhost:3000/api/posts?busqueda=javascript&ordenar=relevancia"</code>

      <h3>4. Crear categoría (admin):</h3>
      <code>curl -X POST http://localhost:3000/api/categories -H "Content-Type: application/json" -H "Authorization: Bearer TU_TOKEN" -d '{"nombre":"Tecnología"}'</code>

      <h3>5. Publicar post:</h3>
      <code>curl -X POST http://localhost:3000/api/posts/publish/POST_ID -H "Authorization: Bearer TU_TOKEN"</code>
    </body>
    </html>
  `);
});

// Middleware de error
app.use((error, req, res, next) => {
  console.error("Error:", error);

  if (error.name === "ValidationError") {
    return res.status(400).json({
      error: "Datos inválidos",
      details: error.errors,
    });
  }

  res.status(error.status || 500).json({
    error: error.message || "Error interno del servidor",
    ...(process.env.NODE_ENV === "development" && { stack: error.stack }),
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({
    error: "Ruta no encontrada",
    metodo: req.method,
    ruta: req.url,
  });
});

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 API de Blog ejecutándose en http://localhost:${PORT}`);
  console.log(`📖 Documentación: http://localhost:${PORT}`);
  console.log(`🔧 Interfaz web: http://localhost:${PORT}`);
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n👋 Cerrando servidor...");
  process.exit(0);
});
