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

/** Labels francais des statuts reservation */
export const STATUT_RESERVATION_LABELS: Record<string, string> = {
	CONFIRMEE: "Confirmee",
	EN_COURS: "En cours",
	TERMINEE: "Terminee",
	ANNULEE: "Annulee",
};

/** Labels francais des types de chambre */
export const TYPE_CHAMBRE_LABELS: Record<string, string> = {
	SIMPLE: "Simple",
	DOUBLE: "Double",
	SUITE: "Suite",
};

/** Couleurs des statuts reservation */
export const RESERVATION_STATUS_COLORS: Record<string, string> = {
	CONFIRMEE: "text-blue-600 bg-blue-50",
	EN_COURS: "text-green-600 bg-green-50",
	TERMINEE: "text-gray-600 bg-gray-50",
	ANNULEE: "text-red-600 bg-red-50",
};
