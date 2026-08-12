import type { Role } from "./utils/cargo-scope.js";

declare global {
  namespace Express {
    interface User {
      id: string;
      nombre: string;
      email: string;
      role: Role;
      cargoId: number | null;
      sessionId?: string;
    }

    interface Request {
      user?: User;
    }
  }
}

export {};
