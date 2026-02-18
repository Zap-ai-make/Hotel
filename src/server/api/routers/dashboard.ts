import {
	endOfDay,
	endOfMonth,
	endOfWeek,
	startOfDay,
	startOfMonth,
	startOfWeek,
} from "date-fns";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const dashboardRouter = createTRPCRouter({
	// KPIs principaux
	kpis: protectedProcedure.query(async ({ ctx }) => {
		const now = new Date();
		const aujourdHui = startOfDay(now);
		const finAujourdHui = endOfDay(now);
		const debutSemaine = startOfWeek(now, { weekStartsOn: 1 });
		const finSemaine = endOfWeek(now, { weekStartsOn: 1 });
		const debutMois = startOfMonth(now);
		const finMois = endOfMonth(now);

		// Taux d'occupation
		const [totalChambres, reservationsAujourdHui] = await Promise.all([
			ctx.db.chambre.count(),
			ctx.db.reservation.findMany({
				where: {
					statut: { not: "ANNULEE" },
					dateArrivee: { lte: aujourdHui },
					dateDepart: { gt: aujourdHui },
				},
				select: { chambreId: true },
			}),
		]);

		const chambresOccupees = new Set(
			reservationsAujourdHui.map((r) => r.chambreId),
		).size;
		const tauxOccupation =
			totalChambres > 0
				? Math.round((chambresOccupees / totalChambres) * 100)
				: 0;

		// Chiffre d'affaires (paiements recus) - single query on the month, filter JS for day/week
		const paiementsMois = await ctx.db.paiement.findMany({
			where: {
				createdAt: { gte: debutMois, lte: finMois },
			},
			select: { montant: true, createdAt: true },
		});

		let caJour = 0;
		let caSemaine = 0;
		let caMois = 0;
		for (const p of paiementsMois) {
			const montant = Number(p.montant);
			caMois += montant;
			if (p.createdAt >= debutSemaine && p.createdAt <= finSemaine) {
				caSemaine += montant;
			}
			if (p.createdAt >= aujourdHui && p.createdAt <= finAujourdHui) {
				caJour += montant;
			}
		}

		return {
			tauxOccupation,
			chambresOccupees,
			totalChambres,
			caJour,
			caSemaine,
			caMois,
			misAJour: now.toISOString(),
		};
	}),

	// Arrivees du jour
	arriveesJour: protectedProcedure.query(async ({ ctx }) => {
		const aujourdHui = startOfDay(new Date());
		const finJour = endOfDay(new Date());

		return ctx.db.reservation.findMany({
			where: {
				statut: { not: "ANNULEE" },
				dateArrivee: { gte: aujourdHui, lte: finJour },
			},
			select: {
				id: true,
				clientNom: true,
				clientTelephone: true,
				dateArrivee: true,
				chambre: { select: { numero: true, type: true } },
			},
			orderBy: { dateArrivee: "asc" },
		});
	}),

	// Departs du jour
	departsJour: protectedProcedure.query(async ({ ctx }) => {
		const aujourdHui = startOfDay(new Date());
		const finJour = endOfDay(new Date());

		const reservations = await ctx.db.reservation.findMany({
			where: {
				statut: { not: "ANNULEE" },
				dateDepart: { gte: aujourdHui, lte: finJour },
			},
			select: {
				id: true,
				clientNom: true,
				clientTelephone: true,
				prixTotal: true,
				dateDepart: true,
				chambre: { select: { numero: true, type: true } },
				paiements: { select: { montant: true } },
			},
			orderBy: { dateDepart: "asc" },
		});

		// Calculer le solde pour chaque depart
		return reservations.map((r) => {
			const totalPaye = r.paiements.reduce(
				(sum, p) => sum + Number(p.montant),
				0,
			);
			const solde = Number(r.prixTotal) - totalPaye;
			return {
				id: r.id,
				clientNom: r.clientNom,
				clientTelephone: r.clientTelephone,
				chambre: r.chambre,
				prixTotal: Number(r.prixTotal),
				totalPaye,
				solde,
				estSolde: solde <= 0,
			};
		});
	}),
});
