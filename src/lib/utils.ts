import { clsx, type ClassValue } from "clsx";
import { format, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/** Formate une date en dd/MM/yyyy */
export function formatDate(date: Date | string): string {
	return format(new Date(date), "dd/MM/yyyy", { locale: fr });
}

/** Formate une date avec l'heure en dd/MM/yyyy HH:mm */
export function formatDateTime(date: Date | string): string {
	return format(new Date(date), "dd/MM/yyyy HH:mm", { locale: fr });
}

/** Formate un montant en FCFA */
export function formatMoney(amount: number): string {
	return new Intl.NumberFormat("fr-FR", {
		style: "decimal",
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(amount) + " FCFA";
}

/** Distance relative depuis une date (ex: "il y a 5 minutes") */
export function formatRelativeTime(date: Date | string): string {
	return formatDistanceToNow(new Date(date), { addSuffix: true, locale: fr });
}
