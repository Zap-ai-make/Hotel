import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const chambreRouter = createTRPCRouter({
	list: protectedProcedure.query(async ({ ctx }) => {
		return ctx.db.chambre.findMany({
			orderBy: { numero: "asc" },
		});
	}),
});
