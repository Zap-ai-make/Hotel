/**
 * Schemas Zod partages frontend/backend
 * Ajouter les schemas de validation ici au fur et a mesure des stories.
 */
import { z } from "zod";

/** Schema de validation email */
export const emailSchema = z.string().email("Format email invalide");

/** Schema de validation mot de passe */
export const passwordSchema = z
	.string()
	.min(8, "Le mot de passe doit contenir au moins 8 caracteres");
