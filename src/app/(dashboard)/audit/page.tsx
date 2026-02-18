import { AuditPageClient } from "./AuditPageClient";

export default function AuditPage() {
	return (
		<div>
			<h1 className="font-bold text-2xl">Journal d'audit</h1>
			<p className="mt-1 text-muted-foreground">
				Historique de toutes les actions effectuees dans le systeme
			</p>
			<div className="mt-6">
				<AuditPageClient />
			</div>
		</div>
	);
}
