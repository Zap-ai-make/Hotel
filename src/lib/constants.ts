/**
 * Constantes globales de l'application
 */

/** Duree de session en heures (NFR7) */
export const SESSION_DURATION_HOURS = 8;

/** Delai de rafraichissement du dashboard manager en ms (30s) */
export const DASHBOARD_REFRESH_INTERVAL = 30_000;

/** Nombre max de resultats par page */
export const DEFAULT_PAGE_SIZE = 50;

/** Devise utilisee */
export const CURRENCY = "FCFA";

/** Couleurs semantiques des statuts chambre */
export const ROOM_STATUS_COLORS = {
	LIBRE: "text-green-600 bg-green-50",
	OCCUPE: "text-red-600 bg-red-50",
} as const;
