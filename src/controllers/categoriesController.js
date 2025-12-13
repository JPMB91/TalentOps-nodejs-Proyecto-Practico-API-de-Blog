let categorias = [
  { id: 1, nombre: "Deporte" },
  { id: 2, nombre: "Politica" },
  { id: 3, nombre: "Ciencia" },
  { id: 4, nombre: "Informaciones" },
];
let siguienteIdCategoria = 5;

async function getCategorias(req, res) {
  try {
    
    res.json({
      categorias,
      meta: { total: categorias.length },
    });
  } catch (error) {
    console.error("Error obteniendo categorías:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

async function getCategoriaById(req, res) {
  try {
    const { id } = req.params;

    const categoria = categorias.find((c) => c.id === parseInt(id));
    if (!categoria) {
      return res.status(403).json({ error: "Categoría no encontrada" });
    }

    res.json(categoria);
  } catch (error) {
    console.error("Error obteniendo categoría: ", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
}

async function createCategoria(req, res) {
  try {
    const { nombre } = req.body;

    const categoriaExiste = categorias.some(
      (c) => c.nombre.toLowerCase() === nombre.toLowerCase()
    );

    if (categoriaExiste) {
      return res.status(400).json({ error: "Esta categoría ya existe" });
    }

    const nuevaCategoria = {
      id: siguienteIdCategoria++,
      nombre: nombre.trim(),
    };

    categorias.push(nuevaCategoria);
    res.status(201).json({
      message: "Categoría creada exitosamente",
      categorias: nuevaCategoria,
    });
  } catch (error) {
    console.error("Error creando categoría:", error);
    res.status(500).json({
      error: "Error interno del servidor",
    });
  }
}

async function updateCategoria(req, res) {
  try {
    const { id } = req.params;

    const categoria = categorias.find((c) => c.id === parseInt(id));

    if (!categoria) {
      return res.status(400).json({ error: "Categoría no encontrada" });
    }

    // verificar permisos

    if (req.user.role !== "admin") {
      return res.status(403).json({
        error: "No tienes permisos suficientes para editar esta categoría",
      });
    }

    const { nombre } = req.body;

    if (nombre) categoria.nombre = nombre.trim();

    res.json({ message: "Categoría actualizada exitosamente", categoria });
  } catch (error) {
    console.error("Error actualizando categoría:", error);
    res.status(500).json({
      error: "Error interno del servidor",
    });
  }
}

async function deleteCategoria(req, res) {
  try {
    const { id } = req.params;
    const indice = categorias.findIndex((p) => p.id === parseInt(id));

    if (indice === -1) {
      return res.status(404).json({
        error: "Categoría no encontrada",
      });
    }

    const categoria = categorias[indice];

    // Verificar permisos
    if (req.user.role !== "admin") {
      return res.status(403).json({
        error: "No tienes permisos para eliminar esta categoría",
      });
    }

    categorias.splice(indice, 1);

    res.json({
      message: "Categoría eliminada exitosamente",
      categoria,
    });
  } catch (error) {
    console.error("Error eliminando categoría:", error);
    res.status(500).json({
      error: "Error interno del servidor",
    });
  }
}

function getCategoriasData() {
  return [...categorias];
}

module.exports = {
  getCategorias,
  getCategoriaById,
  createCategoria,
  updateCategoria,
  deleteCategoria,
  getCategoriasData,
};
