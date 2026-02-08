import bcrypt from "bcrypt";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { adminProcedure, createTRPCRouter } from "~/server/api/trpc";

const createUserSchema = z.object({
	nom: z.string().min(1, "Le nom est requis"),
	email: z.string().email("Email invalide"),
	password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caracteres"),
	role: z.enum(["RECEPTIONNISTE", "MANAGER", "ADMIN"]),
});

const updateRoleSchema = z.object({
	id: z.string(),
	role: z.enum(["RECEPTIONNISTE", "MANAGER", "ADMIN"]),
});

const toggleActiveSchema = z.object({
	id: z.string(),
});

export const userRouter = createTRPCRouter({
	list: adminProcedure.query(async ({ ctx }) => {
		return ctx.db.user.findMany({
			select: {
				id: true,
				nom: true,
				email: true,
				role: true,
				active: true,
				createdAt: true,
			},
			orderBy: { createdAt: "desc" },
		});
	}),

	create: adminProcedure.input(createUserSchema).mutation(async ({ ctx, input }) => {
		const existing = await ctx.db.user.findUnique({
			where: { email: input.email },
		});
		if (existing) {
			throw new TRPCError({
				code: "CONFLICT",
				message: "Un utilisateur avec cet email existe deja",
			});
		}

		const hashedPassword = await bcrypt.hash(input.password, 12);
		return ctx.db.user.create({
			data: {
				nom: input.nom,
				email: input.email,
				password: hashedPassword,
				role: input.role,
			},
			select: {
				id: true,
				nom: true,
				email: true,
				role: true,
				active: true,
				createdAt: true,
			},
		});
	}),

	updateRole: adminProcedure.input(updateRoleSchema).mutation(async ({ ctx, input }) => {
		return ctx.db.user.update({
			where: { id: input.id },
			data: { role: input.role },
			select: {
				id: true,
				nom: true,
				email: true,
				role: true,
				active: true,
				createdAt: true,
			},
		});
	}),

	toggleActive: adminProcedure.input(toggleActiveSchema).mutation(async ({ ctx, input }) => {
		const user = await ctx.db.user.findUnique({ where: { id: input.id } });
		if (!user) {
			throw new TRPCError({ code: "NOT_FOUND", message: "Utilisateur non trouve" });
		}
		if (user.id === ctx.session.user.id) {
			throw new TRPCError({
				code: "BAD_REQUEST",
				message: "Vous ne pouvez pas vous desactiver vous-meme",
			});
		}
		return ctx.db.user.update({
			where: { id: input.id },
			data: { active: !user.active },
			select: {
				id: true,
				nom: true,
				email: true,
				role: true,
				active: true,
				createdAt: true,
			},
		});
	}),
});
