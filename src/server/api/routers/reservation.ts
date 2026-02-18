import { TRPCError } from "@trpc/server";
import {
	addDays,
	eachDayOfInterval,
	endOfMonth,
	format,
	startOfDay,
	startOfMonth,
} from "date-fns";
import { z } from "zod";
import {
	checkConflitsSchema,
	createReservationSchema,
	searchReservationsSchema,
	updateReservationSchema,
} from "~/lib/validators";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { logAction } from "./audit";

const reservationListSelect = {
	id: true,
	clientNom: true,
	clientTelephone: true,
	dateArrivee: true,
	dateDepart: true,
	prixTotal: true,
	statut: true,
	notes: true,
	chambreId: true,
	chambre: { select: { numero: true, type: true } },
} as const;

export const reservationRouter = createTRPCRouter({
	list: protectedProcedure.query(async ({ ctx }) => {
		return ctx.db.reservation.findMany({
			select: reservationListSelect,
			orderBy: { dateArrivee: "desc" },
			take: 200,
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

	checkConflits: protectedProcedure
		.input(checkConflitsSchema)
		.query(async ({ ctx, input }) => {
			const dateArrivee = startOfDay(new Date(input.dateArrivee));
			const dateDepart = startOfDay(new Date(input.dateDepart));

			return ctx.db.reservation.findMany({
				where: {
					chambreId: input.chambreId,
					statut: { not: "ANNULEE" },
					dateArrivee: { lt: dateDepart },
					dateDepart: { gt: dateArrivee },
					...(input.excludeReservationId
						? { id: { not: input.excludeReservationId } }
						: {}),
				},
				select: {
					id: true,
					clientNom: true,
					dateArrivee: true,
					dateDepart: true,
				},
				orderBy: { dateArrivee: "asc" },
			});
		}),

	create: protectedProcedure
		.input(createReservationSchema)
		.mutation(async ({ ctx, input }) => {
			const dateArrivee = startOfDay(new Date(input.dateArrivee));
			const dateDepart = startOfDay(new Date(input.dateDepart));
			if (dateDepart <= dateArrivee) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "La date de depart doit etre apres la date d'arrivee",
				});
			}

			return ctx.db.$transaction(async (tx) => {
				// 1. Verifier que la chambre existe et recuperer le tarif
				const chambre = await tx.chambre.findUnique({
					where: { id: input.chambreId },
				});
				if (!chambre) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Chambre introuvable",
					});
				}

				// 2. Calculer le prix total (nuits x tarif)
				const nuits = Math.round(
					(dateDepart.getTime() - dateArrivee.getTime()) /
						(1000 * 60 * 60 * 24),
				);
				const prixTotal = Number(chambre.tarif) * nuits;

				// 3. Verifier les conflits dans la transaction (atomique)
				const conflits = await tx.reservation.findMany({
					where: {
						chambreId: input.chambreId,
						statut: { not: "ANNULEE" },
						dateArrivee: { lt: dateDepart },
						dateDepart: { gt: dateArrivee },
					},
					select: { clientNom: true, dateArrivee: true, dateDepart: true },
					take: 1,
				});

				if (conflits.length > 0) {
					const c = conflits[0]!;
					throw new TRPCError({
						code: "CONFLICT",
						message: `Chambre deja reservee du ${format(c.dateArrivee, "dd/MM/yyyy")} au ${format(c.dateDepart, "dd/MM/yyyy")} par ${c.clientNom}`,
					});
				}

				// 4. Rechercher le client existant par telephone
				const existingClient = await tx.client.findUnique({
					where: { telephone: input.clientTelephone },
					select: { id: true },
				});

				// 5. Creer la reservation avec statut CONFIRMEE
				const reservation = await tx.reservation.create({
					data: {
						clientNom: input.clientNom,
						clientTelephone: input.clientTelephone,
						chambreId: input.chambreId,
						clientId: existingClient?.id ?? null,
						dateArrivee,
						dateDepart,
						prixTotal,
						notes: input.notes ?? null,
						createdById: ctx.session.user.id,
					},
					select: {
						id: true,
						clientNom: true,
						chambreId: true,
						chambre: { select: { numero: true } },
					},
				});

				await logAction(tx, {
					userId: ctx.session.user.id,
					action: "CREATION",
					entite: "Reservation",
					entiteId: reservation.id,
					details: {
						clientNom: input.clientNom,
						chambre: reservation.chambre.numero,
					},
				});

				return reservation;
			});
		}),

	update: protectedProcedure
		.input(updateReservationSchema)
		.mutation(async ({ ctx, input }) => {
			const dateArrivee = startOfDay(new Date(input.dateArrivee));
			const dateDepart = startOfDay(new Date(input.dateDepart));
			if (dateDepart <= dateArrivee) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "La date de depart doit etre apres la date d'arrivee",
				});
			}

			return ctx.db.$transaction(async (tx) => {
				// 1. Verifier que la reservation existe
				const existing = await tx.reservation.findUnique({
					where: { id: input.id },
				});
				if (!existing) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Reservation introuvable",
					});
				}
				if (existing.statut === "ANNULEE") {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: "Impossible de modifier une reservation annulee",
					});
				}

				// 2. Verifier que la chambre existe et recuperer le tarif
				const chambre = await tx.chambre.findUnique({
					where: { id: input.chambreId },
				});
				if (!chambre) {
					throw new TRPCError({
						code: "NOT_FOUND",
						message: "Chambre introuvable",
					});
				}

				// 3. Calculer le prix
				const nuits = Math.round(
					(dateDepart.getTime() - dateArrivee.getTime()) /
						(1000 * 60 * 60 * 24),
				);
				const prixTotal = Number(chambre.tarif) * nuits;

				// 4. Verifier les conflits dans la transaction (atomique)
				const conflits = await tx.reservation.findMany({
					where: {
						chambreId: input.chambreId,
						statut: { not: "ANNULEE" },
						dateArrivee: { lt: dateDepart },
						dateDepart: { gt: dateArrivee },
						id: { not: input.id },
					},
					select: { clientNom: true, dateArrivee: true, dateDepart: true },
					take: 1,
				});

				const conflit = conflits[0];
				if (conflit) {
					throw new TRPCError({
						code: "CONFLICT",
						message: `Chambre deja reservee du ${format(conflit.dateArrivee, "dd/MM/yyyy")} au ${format(conflit.dateDepart, "dd/MM/yyyy")} par ${conflit.clientNom}`,
					});
				}

				// 5. Rechercher le client existant par telephone
				const existingClient = await tx.client.findUnique({
					where: { telephone: input.clientTelephone },
					select: { id: true },
				});

				// 6. Mettre a jour
				const updated = await tx.reservation.update({
					where: { id: input.id },
					data: {
						clientNom: input.clientNom,
						clientTelephone: input.clientTelephone,
						chambreId: input.chambreId,
						clientId: existingClient?.id ?? null,
						dateArrivee,
						dateDepart,
						prixTotal,
						notes: input.notes ?? null,
					},
					select: {
						id: true,
						clientNom: true,
						chambreId: true,
						chambre: { select: { numero: true, type: true } },
					},
				});

				await logAction(tx, {
					userId: ctx.session.user.id,
					action: "MODIFICATION",
					entite: "Reservation",
					entiteId: input.id,
					details: {
						clientNom: input.clientNom,
						chambre: updated.chambre.numero,
					},
				});

				return updated;
			});
		}),

	cancel: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const reservation = await ctx.db.reservation.findUnique({
				where: { id: input.id },
			});
			if (!reservation) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Reservation introuvable",
				});
			}
			if (reservation.statut === "ANNULEE") {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: "Cette reservation est deja annulee",
				});
			}

			const cancelled = await ctx.db.reservation.update({
				where: { id: input.id },
				data: { statut: "ANNULEE" },
				select: {
					id: true,
					clientNom: true,
					chambre: { select: { numero: true } },
				},
			});

			await logAction(ctx.db, {
				userId: ctx.session.user.id,
				action: "ANNULATION",
				entite: "Reservation",
				entiteId: input.id,
				details: { clientNom: cancelled.clientNom },
			});

			return cancelled;
		}),

	search: protectedProcedure
		.input(searchReservationsSchema)
		.query(async ({ ctx, input }) => {
			// biome-ignore lint/suspicious/noExplicitAny: Prisma where builder
			const where: any = {};

			if (input.statut) {
				where.statut = input.statut;
			}

			if (input.dateDebut) {
				where.dateArrivee = {
					gte: startOfDay(new Date(input.dateDebut)),
				};
			}
			if (input.dateFin) {
				where.dateDepart = {
					lte: addDays(startOfDay(new Date(input.dateFin)), 1),
				};
			}

			if (input.query && input.query.trim().length > 0) {
				const q = input.query.trim();
				where.OR = [
					{ clientNom: { contains: q, mode: "insensitive" } },
					{ clientTelephone: { contains: q } },
				];
			}

			return ctx.db.reservation.findMany({
				where,
				select: reservationListSelect,
				orderBy: { dateArrivee: "desc" },
				take: 50,
			});
		}),
});
