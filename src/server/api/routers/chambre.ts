import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

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
			return ctx.db.chambre.update({
				where: { id: input.id },
				data: { statut: nouveauStatut },
			});
		}),
});
