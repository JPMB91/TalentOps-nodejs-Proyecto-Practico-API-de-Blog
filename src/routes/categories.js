const express = require("express");
const { body, param, query, validationResult } = require("express-validator");
const {
  getCategorias,
  getCategoriaById,
  createCategoria,
  updateCategoria,
  deleteCategoria,
} = require("../controllers/categoriesController");
const { authenticate, authorize } = require("../middleware/auth");

const router = express.Router();

//Middleware de validacion de errores

const validarErrores = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: "Datos de entrada inválidos",
      details: errors.array(),
    });
  }
  next();
};

// get /api/categories/ - Listar categorias ( público)
router.get("/", getCategorias);

router.post(
  "/",
  authenticate,
  authorize("author", "admin"),
  [
    body("nombre")
      .trim()
      .isLength({ min: 3, max: 60 })
      .withMessage("Nombre debe tener entre 3 y 60 caracteres"),
  ],
  validarErrores,
  createCategoria
);

router.get(
  "/:id",
  param("id").isInt({ min: 1 }).withMessage("ID debe ser un número positivo"),
  validarErrores,
  getCategoriaById
);

router.put(
  "/:id",
  authenticate,
  authorize("admin"),
  [
    param("id").isInt({ min: 1 }).withMessage("ID debe ser un número positivo"),
    body("nombre")
      .trim()
      .isLength({ min: 3, max: 60 })
      .withMessage("Nombre debe tener entre 2 y 50 caracteres"),
  ],
  validarErrores,
  updateCategoria
);

router.delete(
  "/:id",
  authenticate,
  authorize("admin"),
  [param("id").isInt({ min: 1 }).withMessage("ID debe ser un número positivo")],
  validarErrores,
  deleteCategoria
);
module.exports = router;
