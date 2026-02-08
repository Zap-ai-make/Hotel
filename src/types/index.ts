/**
 * Types globaux etendus pour l'application
 * Les types Prisma sont generes automatiquement.
 * Ajouter ici les types UI et session personnalises.
 */

// Re-export des types depuis Prisma generated
export { Role, TypeChambre, StatutChambre } from "../../generated/prisma";

/** Alias pour compatibilite avec le code existant */
export type UserRole = "RECEPTIONNISTE" | "MANAGER" | "ADMIN";
