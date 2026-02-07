import type { DefaultSession, NextAuthConfig } from "next-auth";
import type { Role } from "~/types";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
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
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 * Note: Credentials provider sera configure dans Story 1.3
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authConfig = {
	providers: [],
	callbacks: {
		session: ({ session }) => session,
	},
} satisfies NextAuthConfig;
