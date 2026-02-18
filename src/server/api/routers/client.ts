import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { logAction } from "./audit";

const createClientSchema = z.object({
	nom: z.string().trim().min(1, "Le nom est requis"),
	telephone: z.string().trim().min(1, "Le telephone est requis"),
	email: z.string().email("Format email invalide").optional().or(z.literal("")),
	notes: z.string().optional(),
});

const updateClientSchema = z.object({
	id: z.string().min(1),
	nom: z.string().trim().min(1, "Le nom est requis"),
	telephone: z.string().trim().min(1, "Le telephone est requis"),
	email: z.string().email("Format email invalide").optional().or(z.literal("")),
	notes: z.string().optional(),
});

export const clientRouter = createTRPCRouter({
	list: protectedProcedure.query(async ({ ctx }) => {
		return ctx.db.client.findMany({
			include: { _count: { select: { reservations: true } } },
			orderBy: { nom: "asc" },
			take: 200,
		});
	}),

	getById: protectedProcedure
		.input(z.object({ id: z.string() }))
		.query(async ({ ctx, input }) => {
			const client = await ctx.db.client.findUnique({
				where: { id: input.id },
				include: {
					reservations: {
						select: {
							id: true,
							dateArrivee: true,
							dateDepart: true,
							prixTotal: true,
							statut: true,
							chambre: { select: { numero: true, type: true } },
						},
						orderBy: { dateArrivee: "desc" },
						take: 20,
					},
				},
			});
			if (!client) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Client introuvable",
				});
			}
			return client;
		}),

	search: protectedProcedure
		.input(z.object({ query: z.string().optional() }))
		.query(async ({ ctx, input }) => {
			const q = input.query?.trim();
			if (!q || q.length === 0) {
				return ctx.db.client.findMany({
					include: { _count: { select: { reservations: true } } },
					orderBy: { nom: "asc" },
					take: 50,
				});
			}

			return ctx.db.client.findMany({
				where: {
					OR: [
						{ nom: { contains: q, mode: "insensitive" } },
						{ telephone: { contains: q } },
					],
				},
				include: { _count: { select: { reservations: true } } },
				orderBy: { nom: "asc" },
				take: 50,
			});
		}),

	create: protectedProcedure
		.input(createClientSchema)
		.mutation(async ({ ctx, input }) => {
			// Verifier unicite telephone
			const existing = await ctx.db.client.findUnique({
				where: { telephone: input.telephone },
			});
			if (existing) {
				throw new TRPCError({
					code: "CONFLICT",
					message: "Un client avec ce numero de telephone existe deja",
				});
			}

			const created = await ctx.db.client.create({
				data: {
					nom: input.nom,
					telephone: input.telephone,
					email: input.email || null,
					notes: input.notes || null,
				},
			});

			await logAction(ctx.db, {
				userId: ctx.session.user.id,
				action: "CREATION",
				entite: "Client",
				entiteId: created.id,
				details: { nom: input.nom, telephone: input.telephone },
			});

			return created;
		}),

	update: protectedProcedure
		.input(updateClientSchema)
		.mutation(async ({ ctx, input }) => {
			const client = await ctx.db.client.findUnique({
				where: { id: input.id },
			});
			if (!client) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Client introuvable",
				});
			}

			// Verifier unicite telephone si change
			if (input.telephone !== client.telephone) {
				const existing = await ctx.db.client.findUnique({
					where: { telephone: input.telephone },
				});
				if (existing) {
					throw new TRPCError({
						code: "CONFLICT",
						message: "Un client avec ce numero de telephone existe deja",
					});
				}
			}

			const updated = await ctx.db.client.update({
				where: { id: input.id },
				data: {
					nom: input.nom,
					telephone: input.telephone,
					email: input.email || null,
					notes: input.notes || null,
				},
			});

			await logAction(ctx.db, {
				userId: ctx.session.user.id,
				action: "MODIFICATION",
				entite: "Client",
				entiteId: input.id,
				details: { nom: input.nom, telephone: input.telephone },
			});

			return updated;
		}),
});
