const { v4: uuidv4 } = require("uuid");
const { getCategorias, getCategoriasData } = require("./categoriesController");
const sendEmail = require("../utils/emailSender");

const categorias = getCategoriasData();

// Base de datos simulada
let posts = [
  {
    id: uuidv4(),
    titulo: "Bienvenido al Blog",
    contenido: "Este es el primer post de nuestro blog...",
    autor: "admin",
    etiquetas: ["bienvenida", "blog"],
    categoriaId: 4,
    estado: "publicado",
    fechaCreacion: new Date().toISOString(),
    fechaActualizacion: new Date().toISOString(),
    visitas: 0,
  },
  {
    id: uuidv4(),
    titulo: "Bases de Javascript",
    contenido: "Este post contempla las bases de Javascript",
    autor: "admin",
    etiquetas: ["javascript", "fundamentos", "programacion"],
    categoriaId: 5,
    estado: "borrador",
    fechaCreacion: new Date().toISOString(),
    fechaActualizacion: new Date().toISOString(),
    visitas: 0,
  },
];

async function publishPost(req, res) {
  try {
    const { id } = req.params;
    const post = posts.find((p) => p.id === id);

    if (!post) {
      return res.status(404).json({
        error: "Post no encontrado",
      });
    }

    if (post.autor !== req.user.username && req.user.role !== "admin") {
      return res.status(403).json({
        error: "No tienes permisos para publicar este post",
      });
    }

    try {
      post.estado =
        post.estado.toLocaleLowerCase() === "borrador"
          ? (post.estado = "publicado")
          : "borrador";
      post.fechaActualizacion = new Date().toISOString();
      sendEmail(post);
    } catch (emailError) {
      console.error("Error enviando notificación");
    }

    res.status(200).json({
      message: `Post ${
        post.estado === "publicado" ? "publicado" : "despublicado"
      } exitosamente`,
      post,
    });
  } catch (error) {
    console.error("Error publicando el post:", error);
    res.status(500).json({
      error: "Error interno del servidor",
    });
  }
}

// Obtener todos los posts
async function getPosts(req, res) {
  try {
    let resultados = [...posts];
    const {
      q,
      fields = ["titulo", "contenido"],
      autor,
      estado,
      etiqueta,
      etiquetas,
      categoria_id,
      fechaDesde,
      fechaHasta,
      ordenar = "relevancia",
      pagina = 1,
      limite = 10,
      busqueda,
    } = req.query;

    let puntajes = new Map();

    // Filtros
    if (autor) {
      resultados = resultados.filter((p) => p.autor === autor);
    }

    if (estado) {
      resultados = resultados.filter((p) => p.estado === estado);
    }

    if (etiqueta) {
      resultados = resultados.filter((p) => p.etiquetas.includes(etiqueta));
    }

    if (etiquetas) {
      const etiquetasBuscar = Array.isArray(etiquetas)
        ? etiquetas
        : [etiquetas];

      resultados - resultados.filter((e) => etiquetasBuscar.includes(e));
    }
    if (categoria_id) {
      resultados = resultados.filter(
        (t) => t.categoriaId === parseInt(req.query.categoria_id)
      );
    }

    if (fechaDesde) {
      resultados = resultados.filter(
        (p) => p.fechaCreacion >= new Date(fechaDesde)
      );
    }
    if (fechaHasta) {
      resultados = resultados.filter(
        (p) => p.fechaCreacion <= new Date(fechaHasta)
      );
    }
    // Búsqueda
    if (busqueda) {
      const termino = busqueda.toLowerCase();
      const palabras = termino.split(" ").filter(Boolean);
      const camposBusqueda = Array.isArray(fields) ? fields : [fields];

      resultados = resultados.filter((post) => {
        let puntaje = 0;
        1;

        camposBusqueda.forEach((campo) => {
          if (post[campo]) {
            const textoCompleto = post[campo].toLowerCase();

            if (textoCompleto.includes(termino)) {
              puntaje += 10;
            }

            palabras.forEach((palabra) => {
              if (textoCompleto.includes(palabra)) {
                puntaje += 3;
              }
            });
            if (campo === "titulo" && textoCompleto.includes(termino)) {
              puntaje += 5;
            }
          }
        });

        if (puntaje > 0) {
          puntajes.set(post.id, puntaje);
          return true;
        }
        return false;
      });
    }

    // Ordenamiento
    resultados.sort((a, b) => {
      switch (ordenar) {
        case "titulo":
          return a.titulo.localeCompare(b.titulo);
        case "visitas":
          return b.visitas - a.visitas;

        case "relevancia": {
          if (busqueda) {
            return (puntajes.get(b.id) || 0) - (puntajes.get(a.id) || 0);
          }
          return new Date(b.fechaCreacion) - new Date(a.fechaCreacion);
        }
        case "fechaCreacion":
        default:
          return new Date(b.fechaCreacion) - new Date(a.fechaCreacion);
      }
    });

    // Paginación
    const paginaNum = parseInt(pagina);
    const limiteNum = parseInt(limite);
    const inicio = (paginaNum - 1) * limiteNum;
    const paginados = resultados.slice(inicio, inicio + limiteNum);

    resultadosFinales = busqueda
      ? paginados.map((post) => ({
          ...post,
          _puntajes: puntajes.get(post.id) || 0,
        }))
      : paginados;

    res.json({
      posts: resultadosFinales,
      meta: {
        total: resultados.length,
        pagina: paginaNum,
        limite: limiteNum,
        paginasTotal: Math.ceil(resultados.length / limiteNum),
      },
      filtros: req.query,
    });
  } catch (error) {
    console.error("Error obteniendo posts:", error);
    res.status(500).json({
      error: "Error interno del servidor",
    });
  }
}

// Obtener post por ID
async function getPostById(req, res) {
  try {
    const { id } = req.params;
    const post = posts.find((p) => p.id === id);

    if (!post) {
      return res.status(404).json({
        error: "Post no encontrado",
      });
    }

    // Incrementar visitas
    post.visitas += 1;

    res.json(post);
  } catch (error) {
    console.error("Error obteniendo post:", error);
    res.status(500).json({
      error: "Error interno del servidor",
    });
  }
}

// Crear nuevo post
async function createPost(req, res) {
  try {
    const { titulo, contenido, etiquetas, estado, categoriaId } = req.body;
    const autor = req.user.username;

    if (categoriaId) {
      const categoria = categorias.find((c) => c.id === parseInt(categoriaId));
      if (!categoria) {
        return res.status(404).json({
          error: "Categoría no encontrada",
        });
      }
    }

    const nuevoPost = {
      id: uuidv4(),
      titulo: titulo.trim(),
      contenido: contenido.trim(),
      autor,
      etiquetas: etiquetas || [],
      categoriaId: categoriaId || 4,
      estado: estado || "borrador",
      fechaCreacion: new Date().toISOString(),
      fechaActualizacion: new Date().toISOString(),
      visitas: 0,
    };

    posts.push(nuevoPost);

    res.status(201).json({
      message: "Post creado exitosamente",
      post: nuevoPost,
    });
  } catch (error) {
    console.error("Error creando post:", error);
    res.status(500).json({
      error: "Error interno del servidor",
    });
  }
}

// Actualizar post
async function updatePost(req, res) {
  try {
    const { id } = req.params;
    const post = posts.find((p) => p.id === id);

    if (!post) {
      return res.status(404).json({
        error: "Post no encontrado",
      });
    }

    // Verificar permisos (solo autor o admin pueden editar)
    if (post.autor !== req.user.username && req.user.role !== "admin") {
      return res.status(403).json({
        error: "No tienes permisos para editar este post",
      });
    }

    const { titulo, contenido, etiquetas, estado, categoriaId } = req.body;

    // Actualizar campos
    if (titulo) post.titulo = titulo.trim();
    if (contenido) post.contenido = contenido.trim();
    if (etiquetas) post.etiquetas = etiquetas;
    if (estado) post.estado = estado;
    if (categoriaId) post.categoriaId = categoriaId;

    post.fechaActualizacion = new Date().toISOString();

    res.json({
      message: "Post actualizado exitosamente",
      post,
    });
  } catch (error) {
    console.error("Error actualizando post:", error);
    res.status(500).json({
      error: "Error interno del servidor",
    });
  }
}

// Eliminar post
async function deletePost(req, res) {
  try {
    const { id } = req.params;
    const indice = posts.findIndex((p) => p.id === id);

    if (indice === -1) {
      return res.status(404).json({
        error: "Post no encontrado",
      });
    }

    const post = posts[indice];

    // Verificar permisos
    if (post.autor !== req.user.username && req.user.role !== "admin") {
      return res.status(403).json({
        error: "No tienes permisos para eliminar este post",
      });
    }

    posts.splice(indice, 1);

    res.json({
      message: "Post eliminado exitosamente",
      post,
    });
  } catch (error) {
    console.error("Error eliminando post:", error);
    res.status(500).json({
      error: "Error interno del servidor",
    });
  }
}

function getPostsData() {
  return [...posts];
}

module.exports = {
  getPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
  getPostsData,
  publishPost,
};
