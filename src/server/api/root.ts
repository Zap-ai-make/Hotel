import { auditRouter } from "~/server/api/routers/audit";
import { chambreRouter } from "~/server/api/routers/chambre";
import { clientRouter } from "~/server/api/routers/client";
import { dashboardRouter } from "~/server/api/routers/dashboard";
import { paiementRouter } from "~/server/api/routers/paiement";
import { recuRouter } from "~/server/api/routers/recu";
import { reservationRouter } from "~/server/api/routers/reservation";
import { userRouter } from "~/server/api/routers/user";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
	audit: auditRouter,
	chambre: chambreRouter,
	clientele: clientRouter,
	dashboard: dashboardRouter,
	paiement: paiementRouter,
	recu: recuRouter,
	reservation: reservationRouter,
	user: userRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
