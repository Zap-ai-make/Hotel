import bcrypt from "bcrypt";
import type { DefaultSession, NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

import { db } from "~/server/db";
import type { Role } from "~/types";

/**
 * Module augmentation for `next-auth` types.
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
	interface Session extends DefaultSession {
		user: {
			id: string;
			role: Role;
		} & DefaultSession["user"];
	}

	interface User {
		role: Role;
	}
}

/**
 * Options for NextAuth.js - Credentials provider (email + password)
 * @see https://next-auth.js.org/configuration/options
 */
export const authConfig = {
	providers: [
		CredentialsProvider({
			name: "credentials",
			credentials: {
				email: { label: "Email", type: "email" },
				password: { label: "Mot de passe", type: "password" },
			},
			async authorize(credentials) {
				if (!credentials?.email || !credentials?.password) return null;

				const user = await db.user.findUnique({
					where: { email: credentials.email as string },
				});
				if (!user) return null;

				const isValid = await bcrypt.compare(
					credentials.password as string,
					user.password,
				);
				if (!isValid) return null;

				return {
					id: user.id,
					email: user.email,
					name: user.nom,
					role: user.role,
				};
			},
		}),
	],
	session: {
		strategy: "jwt",
		maxAge: 28800, // 8 heures (NFR7)
	},
	pages: {
		signIn: "/login",
	},
	callbacks: {
		jwt({ token, user }) {
			if (user) {
				token.id = user.id;
				token.role = (user as { role: Role }).role;
			}
			return token;
		},
		session({ session, token }) {
			if (session.user) {
				session.user.id = token.id as string;
				session.user.role = token.role as Role;
			}
			return session;
		},
	},
} satisfies NextAuthConfig;
