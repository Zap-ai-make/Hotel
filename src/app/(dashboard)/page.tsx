import { auth } from "~/server/auth";

export default async function DashboardPage() {
	const session = await auth();

	return (
		<div>
			<h1 className="font-bold text-2xl">Dashboard</h1>
			<p className="mt-2 text-muted-foreground">
				Bienvenue, {session?.user?.name ?? "Utilisateur"}
			</p>
		</div>
	);
}
