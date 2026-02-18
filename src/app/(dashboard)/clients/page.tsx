import { ClientsPageClient } from "./ClientsPageClient";

export default function ClientsPage() {
	return (
		<div>
			<h1 className="font-bold text-2xl">Clients</h1>
			<p className="mt-1 text-muted-foreground">
				Gestion des profils clients et historique des sejours
			</p>
			<div className="mt-6">
				<ClientsPageClient />
			</div>
		</div>
	);
}
