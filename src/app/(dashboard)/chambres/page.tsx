import { auth } from "~/server/auth";
import { redirect } from "next/navigation";
import { ChambresList } from "./ChambresList";

export default async function ChambresPage() {
	const session = await auth();

	if (!session?.user) {
		redirect("/login");
	}

	return (
		<div>
			<h1 className="font-bold text-2xl">Chambres</h1>
			<p className="mt-1 text-muted-foreground">
				Vue d'ensemble des chambres et de leur disponibilite
			</p>
			<div className="mt-6">
				<ChambresList />
			</div>
		</div>
	);
}
