import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
	adminProcedure,
	createTRPCRouter,
	protectedProcedure,
} from "~/server/api/trpc";
import { logAction } from "./audit";

export const recuRouter = createTRPCRouter({
	// Liste des recus pour une reservation
	listByReservation: protectedProcedure
		.input(z.object({ reservationId: z.string() }))
		.query(async ({ ctx, input }) => {
			return ctx.db.recu.findMany({
				where: { reservationId: input.reservationId },
				include: { createdBy: true },
				orderBy: { createdAt: "desc" },
			});
		}),

	// Generer un recu
	create: protectedProcedure
		.input(
			z.object({
				reservationId: z.string().min(1),
				montant: z.number().positive(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			const reservation = await ctx.db.reservation.findUnique({
				where: { id: input.reservationId },
				include: { chambre: true },
			});
			if (!reservation) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Reservation introuvable",
				});
			}

			const recu = await ctx.db.recu.create({
				data: {
					reservationId: input.reservationId,
					montant: input.montant,
					createdById: ctx.session.user.id,
				},
				include: {
					reservation: { include: { chambre: true } },
					createdBy: true,
				},
			});

			await logAction(ctx.db, {
				userId: ctx.session.user.id,
				action: "CREATION",
				entite: "Recu",
				entiteId: recu.id,
				details: { montant: input.montant, reservationId: input.reservationId },
			});

			return recu;
		}),

	// Generer un duplicata
	duplicate: protectedProcedure
		.input(z.object({ recuId: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const original = await ctx.db.recu.findUnique({
				where: { id: input.recuId },
			});
			if (!original) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Recu introuvable",
				});
			}

			return ctx.db.recu.create({
				data: {
					reservationId: original.reservationId,
					montant: original.montant,
					estDuplicate: true,
					createdById: ctx.session.user.id,
				},
				include: {
					reservation: { include: { chambre: true } },
					createdBy: true,
				},
			});
		}),

	// Obtenir un recu par ID (pour impression)
	getById: protectedProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ ctx, input }) => {
			const recu = await ctx.db.recu.findUnique({
				where: { id: input.id },
				include: {
					reservation: { include: { chambre: true } },
					createdBy: true,
				},
			});
			if (!recu) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Recu introuvable",
				});
			}
			return recu;
		}),

	// Config hotel
	getConfig: protectedProcedure.query(async ({ ctx }) => {
		let config = await ctx.db.configHotel.findFirst();
		if (!config) {
			config = await ctx.db.configHotel.create({ data: {} });
		}
		return config;
	}),

	updateConfig: adminProcedure
		.input(
			z.object({
				nom: z.string().min(1),
				adresse: z.string(),
				telephone: z.string(),
				email: z.string(),
			}),
		)
		.mutation(async ({ ctx, input }) => {
			let config = await ctx.db.configHotel.findFirst();
			if (!config) {
				config = await ctx.db.configHotel.create({ data: input });
			} else {
				config = await ctx.db.configHotel.update({
					where: { id: config.id },
					data: input,
				});
			}
			return config;
		}),

	// Export data (pour Excel - retourne les donnees brutes)
	exportData: adminProcedure
		.input(
			z.object({
				dateDebut: z.string(),
				dateFin: z.string(),
			}),
		)
		.query(async ({ ctx, input }) => {
			const dateDebut = new Date(input.dateDebut);
			const dateFin = new Date(input.dateFin);

			const reservations = await ctx.db.reservation.findMany({
				where: {
					createdAt: { gte: dateDebut, lte: dateFin },
				},
				select: {
					clientNom: true,
					clientTelephone: true,
					dateArrivee: true,
					dateDepart: true,
					prixTotal: true,
					statut: true,
					chambre: { select: { numero: true, type: true } },
					paiements: { select: { montant: true, mode: true } },
					createdBy: { select: { nom: true } },
				},
				orderBy: { dateArrivee: "asc" },
			});

			return reservations.map((r) => ({
				clientNom: r.clientNom,
				clientTelephone: r.clientTelephone,
				chambre: r.chambre.numero,
				typeChambre: r.chambre.type,
				dateArrivee: r.dateArrivee,
				dateDepart: r.dateDepart,
				prixTotal: Number(r.prixTotal),
				statut: r.statut,
				totalPaye: r.paiements.reduce((sum, p) => sum + Number(p.montant), 0),
				solde:
					Number(r.prixTotal) -
					r.paiements.reduce((sum, p) => sum + Number(p.montant), 0),
				modesPaiement: [...new Set(r.paiements.map((p) => p.mode))].join(", "),
				creePar: r.createdBy.nom,
			}));
		}),
});
