/**
 * Types globaux etendus pour l'application
 * Les types Prisma sont generes automatiquement.
 * Ajouter ici les types UI et session personnalises.
 */

// Re-export du type Role depuis Prisma generated
export { Role } from "../../generated/prisma";

/** Alias pour compatibilite avec le code existant */
export type UserRole = "RECEPTIONNISTE" | "MANAGER" | "ADMIN";
