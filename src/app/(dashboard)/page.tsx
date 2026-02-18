import { DashboardClient } from "./DashboardClient";

export default function DashboardPage() {
	return (
		<div>
			<h1 className="font-bold text-2xl">Dashboard</h1>
			<p className="mt-1 text-muted-foreground">
				Bienvenue sur le tableau de bord
			</p>
			<div className="mt-6">
				<DashboardClient />
			</div>
		</div>
	);
}
