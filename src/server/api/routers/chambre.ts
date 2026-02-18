import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
	adminProcedure,
	createTRPCRouter,
	protectedProcedure,
} from "~/server/api/trpc";
import { logAction } from "./audit";

const createChambreSchema = z.object({
	numero: z.string().min(1, "Le numero est requis"),
	type: z.enum(["SIMPLE", "DOUBLE", "SUITE"]),
	tarif: z.number().positive("Le tarif doit etre positif"),
	caracteristiques: z.array(z.string()).default([]),
});

const updateChambreSchema = z.object({
	id: z.string(),
	numero: z.string().min(1, "Le numero est requis"),
	type: z.enum(["SIMPLE", "DOUBLE", "SUITE"]),
	tarif: z.number().positive("Le tarif doit etre positif"),
	caracteristiques: z.array(z.string()).default([]),
});

export const chambreRouter = createTRPCRouter({
	list: protectedProcedure.query(async ({ ctx }) => {
		return ctx.db.chambre.findMany({
			orderBy: { numero: "asc" },
		});
	}),

	getById: protectedProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ ctx, input }) => {
			const chambre = await ctx.db.chambre.findUnique({
				where: { id: input.id },
			});
			if (!chambre) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Chambre introuvable",
				});
			}
			return chambre;
		}),

	toggleStatut: protectedProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const chambre = await ctx.db.chambre.findUnique({
				where: { id: input.id },
			});
			if (!chambre) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Chambre introuvable",
				});
			}
			const nouveauStatut = chambre.statut === "LIBRE" ? "OCCUPE" : "LIBRE";
			const updated = await ctx.db.chambre.update({
				where: { id: input.id },
				data: { statut: nouveauStatut },
			});

			await logAction(ctx.db, {
				userId: ctx.session.user.id,
				action: "MODIFICATION",
				entite: "Chambre",
				entiteId: input.id,
				details: { numero: chambre.numero, statut: nouveauStatut },
			});

			return updated;
		}),

	create: adminProcedure
		.input(createChambreSchema)
		.mutation(async ({ ctx, input }) => {
			const existing = await ctx.db.chambre.findUnique({
				where: { numero: input.numero },
			});
			if (existing) {
				throw new TRPCError({
					code: "CONFLICT",
					message: `Le numero ${input.numero} existe deja`,
				});
			}
			const created = await ctx.db.chambre.create({
				data: {
					numero: input.numero,
					type: input.type,
					tarif: input.tarif,
					caracteristiques: input.caracteristiques,
				},
			});

			await logAction(ctx.db, {
				userId: ctx.session.user.id,
				action: "CREATION",
				entite: "Chambre",
				entiteId: created.id,
				details: { numero: input.numero, type: input.type },
			});

			return created;
		}),

	update: adminProcedure
		.input(updateChambreSchema)
		.mutation(async ({ ctx, input }) => {
			const existing = await ctx.db.chambre.findFirst({
				where: { numero: input.numero, NOT: { id: input.id } },
			});
			if (existing) {
				throw new TRPCError({
					code: "CONFLICT",
					message: `Le numero ${input.numero} existe deja`,
				});
			}
			const updated = await ctx.db.chambre.update({
				where: { id: input.id },
				data: {
					numero: input.numero,
					type: input.type,
					tarif: input.tarif,
					caracteristiques: input.caracteristiques,
				},
			});

			await logAction(ctx.db, {
				userId: ctx.session.user.id,
				action: "MODIFICATION",
				entite: "Chambre",
				entiteId: input.id,
				details: { numero: input.numero, type: input.type },
			});

			return updated;
		}),

	delete: adminProcedure
		.input(z.object({ id: z.string() }))
		.mutation(async ({ ctx, input }) => {
			const chambre = await ctx.db.chambre.findUnique({
				where: { id: input.id },
			});
			if (!chambre) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Chambre introuvable",
				});
			}

			// H5: Verifier qu'il n'y a pas de reservations actives
			const activeReservations = await ctx.db.reservation.count({
				where: {
					chambreId: input.id,
					statut: { in: ["CONFIRMEE", "EN_COURS"] },
				},
			});
			if (activeReservations > 0) {
				throw new TRPCError({
					code: "BAD_REQUEST",
					message: `Impossible de supprimer: ${activeReservations} reservation(s) active(s) sur cette chambre`,
				});
			}

			const deleted = await ctx.db.chambre.delete({ where: { id: input.id } });

			await logAction(ctx.db, {
				userId: ctx.session.user.id,
				action: "SUPPRESSION",
				entite: "Chambre",
				entiteId: input.id,
				details: { numero: chambre.numero },
			});

			return deleted;
		}),
});
