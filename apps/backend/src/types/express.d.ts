import type { AdminSession } from "../modules/auth/auth.types";

declare global {
  namespace Express {
    interface Request {
      adminUser?: AdminSession;
    }
  }
}

export {};
