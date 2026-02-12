import { TRPCError } from "@trpc/server";
import {
	addDays,
	eachDayOfInterval,
	endOfMonth,
	startOfDay,
	startOfMonth,
} from "date-fns";
import { z } from "zod";
import { createReservationSchema } from "~/lib/validators";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const reservationRouter = createTRPCRouter({
	list: protectedProcedure.query(async ({ ctx }) => {
		return ctx.db.reservation.findMany({
			include: { chambre: true, createdBy: true },
			orderBy: { dateArrivee: "desc" },
		});
	}),

	getById: protectedProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ ctx, input }) => {
			const reservation = await ctx.db.reservation.findUnique({
				where: { id: input.id },
				include: { chambre: true, createdBy: true },
			});
			if (!reservation) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Reservation introuvable",
				});
			}
			return reservation;
		}),

	getDisponibilitesMensuelles: protectedProcedure
		.input(
			z.object({
				mois: z.number().min(1).max(12),
				annee: z.number().min(2020),
			}),
		)
		.query(async ({ ctx, input }) => {
			const debut = startOfMonth(new Date(input.annee, input.mois - 1));
			const fin = endOfMonth(debut);
			// Extend fin by 1 day for the < comparison
			const finPlusUn = addDays(fin, 1);

			const [totalChambres, reservations] = await Promise.all([
				ctx.db.chambre.count(),
				ctx.db.reservation.findMany({
					where: {
						statut: { not: "ANNULEE" },
						dateArrivee: { lt: finPlusUn },
						dateDepart: { gt: debut },
					},
					select: {
						chambreId: true,
						dateArrivee: true,
						dateDepart: true,
					},
				}),
			]);

			const jours = eachDayOfInterval({ start: debut, end: fin });

			return {
				totalChambres,
				jours: jours.map((jour) => {
					const jourStart = startOfDay(jour);
					// Count unique rooms occupied on this day
					// A room is occupied if dateArrivee <= jour < dateDepart
					const chambresOccupees = new Set(
						reservations
							.filter(
								(r) => r.dateArrivee <= jourStart && r.dateDepart > jourStart,
							)
							.map((r) => r.chambreId),
					).size;

					return {
						date: jour.toISOString(),
						chambresLibres: totalChambres - chambresOccupees,
						chambresOccupees,
					};
				}),
			};
		}),

	getChambresParDate: protectedProcedure
		.input(
			z.object({
				date: z.string(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const jour = startOfDay(new Date(input.date));

			const [chambres, reservations] = await Promise.all([
				ctx.db.chambre.findMany({
					orderBy: { numero: "asc" },
					select: { id: true, numero: true, type: true, tarif: true },
				}),
				ctx.db.reservation.findMany({
					where: {
						statut: { not: "ANNULEE" },
						dateArrivee: { lte: jour },
						dateDepart: { gt: jour },
					},
					select: {
						chambreId: true,
						clientNom: true,
						statut: true,
					},
				}),
			]);

			// Build a map chambreId -> reservation for quick lookup
			const reservationParChambre = new Map(
				reservations.map((r) => [r.chambreId, r]),
			);

			return chambres.map((chambre) => {
				const resa = reservationParChambre.get(chambre.id);
				return {
					id: chambre.id,
					numero: chambre.numero,
					type: chambre.type,
					tarif: chambre.tarif,
					disponible: !resa,
					reservation: resa
						? { clientNom: resa.clientNom, statut: resa.statut }
						: null,
				};
			});
		}),

	create: protectedProcedure
		.input(createReservationSchema)
		.mutation(async ({ ctx, input }) => {
			// 1. Verifier que la chambre existe et recuperer le tarif
			const chambre = await ctx.db.chambre.findUnique({
				where: { id: input.chambreId },
			});
			if (!chambre) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Chambre introuvable",
				});
			}

			// 2. Valider les dates
			const dateArrivee = startOfDay(new Date(input.dateArrivee));
			const dateDepart = startOfDay(new Date(input.dateDepart));
			if (dateDepart <= dateArrivee) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "La date de depart doit etre apres la date d'arrivee",
				});
			}

			// 3. Calculer le prix total (nuits x tarif)
			const nuits = Math.round(
				(dateDepart.getTime() - dateArrivee.getTime()) /
					(1000 * 60 * 60 * 24),
			);
			const prixTotal = Number(chambre.tarif) * nuits;

			// 4. Creer la reservation avec statut CONFIRMEE
			return ctx.db.reservation.create({
				data: {
					clientNom: input.clientNom,
					clientTelephone: input.clientTelephone,
					chambreId: input.chambreId,
					dateArrivee,
					dateDepart,
					prixTotal,
					notes: input.notes ?? null,
					createdById: ctx.session.user.id,
				},
				include: { chambre: true },
			});
		}),
});
