import { ReservationsPageClient } from "./ReservationsPageClient";

export default function ReservationsPage() {
	return (
		<div>
			<h1 className="font-bold text-2xl">Reservations</h1>
			<p className="mt-1 text-muted-foreground">
				Calendrier des disponibilites et gestion des reservations
			</p>
			<div className="mt-6">
				<ReservationsPageClient />
			</div>
		</div>
	);
}
