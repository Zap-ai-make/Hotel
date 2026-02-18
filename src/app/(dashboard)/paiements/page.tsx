import { PaiementsPageClient } from "./PaiementsPageClient";

export default function PaiementsPage() {
	return (
		<div>
			<h1 className="font-bold text-2xl">Paiements</h1>
			<p className="mt-1 text-muted-foreground">
				Enregistrer et suivre les paiements des reservations
			</p>
			<div className="mt-6">
				<PaiementsPageClient />
			</div>
		</div>
	);
}
