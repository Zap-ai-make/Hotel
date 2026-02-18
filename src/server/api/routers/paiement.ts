import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createPaiementSchema } from "~/lib/validators";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { logAction } from "./audit";

export const paiementRouter = createTRPCRouter({
	// Liste des paiements pour une reservation
	listByReservation: protectedProcedure
		.input(z.object({ reservationId: z.string() }))
		.query(async ({ ctx, input }) => {
			return ctx.db.paiement.findMany({
				where: { reservationId: input.reservationId },
				select: {
					id: true,
					montant: true,
					mode: true,
					estAcompte: true,
					reference: true,
					createdAt: true,
					createdBy: { select: { nom: true } },
				},
				orderBy: { createdAt: "desc" },
			});
		}),

	// Solde d'une reservation (prixTotal - somme paiements)
	soldeReservation: protectedProcedure
		.input(z.object({ reservationId: z.string() }))
		.query(async ({ ctx, input }) => {
			const reservation = await ctx.db.reservation.findUnique({
				where: { id: input.reservationId },
				select: { prixTotal: true },
			});
			if (!reservation) {
				throw new TRPCError({
					code: "NOT_FOUND",
					message: "Reservation introuvable",
				});
			}

			const paiements = await ctx.db.paiement.findMany({
				where: { reservationId: input.reservationId },
				select: { montant: true },
			});

			const totalPaye = paiements.reduce(
				(sum, p) => sum + Number(p.montant),
				0,
			);
			const prixTotal = Number(reservation.prixTotal);

			return {
				prixTotal,
				totalPaye,
				solde: prixTotal - totalPaye,
				estSolde: totalPaye >= prixTotal,
			};
		}),

	// Creer un paiement (H2: dans une transaction pour eviter les race conditions)
	create: protectedProcedure
		.input(createPaiementSchema)
		.mutation(async ({ ctx, input }) => {
			return ctx.db.$transaction(async (tx) => {
				// Verifier que la reservation existe et n'est pas annulee
				const reservation = await tx.reservation.findUnique({
					where: { id: input.reservationId },
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
						message:
							"Impossible d'ajouter un paiement a une reservation annulee",
					});
				}

				// Verifier que le montant ne depasse pas le solde restant
				const paiementsExistants = await tx.paiement.findMany({
					where: { reservationId: input.reservationId },
					select: { montant: true },
				});
				const totalPaye = paiementsExistants.reduce(
					(sum, p) => sum + Number(p.montant),
					0,
				);
				const soldeRestant = Number(reservation.prixTotal) - totalPaye;

				if (input.montant > soldeRestant + 0.01) {
					throw new TRPCError({
						code: "BAD_REQUEST",
						message: `Le montant depasse le solde restant (${Math.round(soldeRestant)} FCFA)`,
					});
				}

				const paiement = await tx.paiement.create({
					data: {
						montant: input.montant,
						mode: input.mode,
						estAcompte: input.estAcompte,
						reference: input.reference ?? null,
						reservationId: input.reservationId,
						createdById: ctx.session.user.id,
					},
					select: {
						id: true,
						montant: true,
						mode: true,
						estAcompte: true,
						reference: true,
						createdAt: true,
						createdBy: { select: { nom: true } },
					},
				});

				await logAction(tx, {
					userId: ctx.session.user.id,
					action: "CREATION",
					entite: "Paiement",
					entiteId: paiement.id,
					details: {
						montant: input.montant,
						mode: input.mode,
						reservationId: input.reservationId,
					},
				});

				return paiement;
			});
		}),
});
