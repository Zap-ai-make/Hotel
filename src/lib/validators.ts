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

/** Schema de creation de reservation */
export const createReservationSchema = z.object({
	clientNom: z.string().trim().min(1, "Le nom du client est requis"),
	clientTelephone: z.string().trim().min(1, "Le telephone est requis"),
	chambreId: z.string().min(1, "La chambre est requise"),
	dateArrivee: z.string().min(1, "La date d'arrivee est requise"),
	dateDepart: z.string().min(1, "La date de depart est requise"),
	notes: z.string().optional(),
});
