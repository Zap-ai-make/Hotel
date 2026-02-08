import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { UserManagement } from "./UserManagement";

export default async function UtilisateursPage() {
	const session = await auth();

	if (!session?.user || session.user.role !== "ADMIN") {
		redirect("/");
	}

	return (
		<div>
			<h1 className="font-bold text-2xl">Utilisateurs</h1>
			<p className="mt-1 text-muted-foreground">
				Gerer les comptes utilisateurs et leurs roles
			</p>
			<div className="mt-6">
				<UserManagement currentUserId={session.user.id} />
			</div>
		</div>
	);
}
