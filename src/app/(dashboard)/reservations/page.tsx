import { auth } from "~/server/auth";
import { redirect } from "next/navigation";
import { CalendrierView } from "./CalendrierView";

export default async function ReservationsPage() {
	const session = await auth();

	if (!session?.user) {
		redirect("/login");
	}

	return (
		<div>
			<h1 className="font-bold text-2xl">Reservations</h1>
			<p className="mt-1 text-muted-foreground">
				Calendrier des disponibilites et gestion des reservations
			</p>
			<div className="mt-6">
				<CalendrierView />
			</div>
		</div>
	);
}
