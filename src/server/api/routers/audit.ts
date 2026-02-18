import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const auditRouter = createTRPCRouter({
	list: protectedProcedure
		.input(
			z.object({
				userId: z.string().optional(),
				action: z
					.enum([
						"CREATION",
						"MODIFICATION",
						"SUPPRESSION",
						"CONNEXION",
						"DECONNEXION",
						"ANNULATION",
					])
					.optional(),
				entite: z.string().optional(),
				page: z.number().min(0).default(0),
			}),
		)
		.query(async ({ ctx, input }) => {
			// biome-ignore lint/suspicious/noExplicitAny: Prisma where builder
			const where: any = {};

			if (input.userId) where.userId = input.userId;
			if (input.action) where.action = input.action;
			if (input.entite) where.entite = input.entite;

			const [total, logs] = await Promise.all([
				ctx.db.actionLog.count({ where }),
				ctx.db.actionLog.findMany({
					where,
					include: { user: { select: { nom: true, email: true } } },
					orderBy: { createdAt: "desc" },
					take: 50,
					skip: input.page * 50,
				}),
			]);

			return { total, logs };
		}),
});

// Helper pour enregistrer une action (utilise dans les autres routers)
export async function logAction(
	// biome-ignore lint/suspicious/noExplicitAny: Prisma client instance
	db: any,
	params: {
		userId: string;
		action:
			| "CREATION"
			| "MODIFICATION"
			| "SUPPRESSION"
			| "CONNEXION"
			| "DECONNEXION"
			| "ANNULATION";
		entite: string;
		entiteId?: string;
		details?: Record<string, unknown>;
	},
) {
	try {
		await db.actionLog.create({
			data: {
				userId: params.userId,
				action: params.action,
				entite: params.entite,
				entiteId: params.entiteId ?? null,
				details: params.details ?? null,
			},
		});
	} catch (error) {
		console.error("[AUDIT] Erreur logAction:", error);
	}
}
