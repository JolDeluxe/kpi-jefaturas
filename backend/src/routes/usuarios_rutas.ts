import { Router } from "express";
import { z } from "zod";
import { authenticate } from "../middlewares/authenticate.js";
import { authorize } from "../middlewares/authorize.js";
import { createUsuario, listUsuarios, patchUsuario } from "../modules/usuarios/service.js";

const router = Router();
const roleSchema = z.enum(["ADMIN", "DIRECCION", "GERENTE", "JEFE", "CONSULTA"]);
const createSchema = z.object({ nombre: z.string().min(1), email: z.string().email(), password: z.string().min(1), role: roleSchema, cargoId: z.number().int().nullable().optional() });
const patchSchema = createSchema.partial();

router.use(authenticate, authorize("ADMIN"));

router.get("/", async (_req, res, next) => {
  try {
    res.json({ usuarios: await listUsuarios() });
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Datos invalidos", issues: parsed.error.flatten() });
    res.status(201).json({ usuario: await createUsuario(parsed.data) });
  } catch (error) {
    next(error);
  }
});

router.patch("/:id", async (req, res, next) => {
  try {
    const parsed = patchSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Datos invalidos", issues: parsed.error.flatten() });
    res.json({ usuario: await patchUsuario(req.params.id, parsed.data) });
  } catch (error) {
    next(error);
  }
});

export default router;
