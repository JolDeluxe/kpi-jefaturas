import { logger } from "./logger.js";

export type AuditEvent =
  | "LOGIN_SUCCESS"
  | "LOGIN_FAILURE"
  | "LOGOUT"
  | "PASSWORD_CHANGED"
  | "USER_CREATED"
  | "USER_DISABLED"
  | "ROLE_CHANGED"
  | "CARGO_CHANGED"
  | "ACCESS_DENIED"
  | "CSV_IMPORT_SUCCESS"
  | "CSV_IMPORT_FAILURE"
  | "SYNC_AUTH_FAILURE";

export const audit = (event: AuditEvent, details: Record<string, unknown> = {}) => {
  logger.info({ auditEvent: event, ...details }, "audit");
};
