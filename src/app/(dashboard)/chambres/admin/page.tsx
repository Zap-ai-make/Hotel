import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { ChambreManagement } from "./ChambreManagement";

export default async function ChambresAdminPage() {
	const session = await auth();

	if (!session?.user || session.user.role !== "ADMIN") {
		redirect("/");
	}

	return (
		<div>
			<h1 className="font-bold text-2xl">Gestion des Chambres</h1>
			<p className="mt-1 text-muted-foreground">
				Ajouter, modifier ou supprimer des chambres
			</p>
			<div className="mt-6">
				<ChambreManagement />
			</div>
		</div>
	);
}
