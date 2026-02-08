"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import { api } from "~/trpc/react";
import { ChambreCard } from "./ChambreCard";

type StatutFilter = "TOUTES" | "LIBRE" | "OCCUPE";

const FILTERS: { value: StatutFilter; label: string }[] = [
	{ value: "TOUTES", label: "Toutes" },
	{ value: "LIBRE", label: "Libres" },
	{ value: "OCCUPE", label: "Occupees" },
];

export function ChambresList() {
	const [filtre, setFiltre] = useState<StatutFilter>("TOUTES");
	const { data: chambres, isLoading } = api.chambre.list.useQuery();

	const chambresFiltrees =
		filtre === "TOUTES"
			? chambres
			: chambres?.filter((c) => c.statut === filtre);

	return (
		<div>
			<div className="flex gap-2">
				{FILTERS.map((f) => (
					<Button
						key={f.value}
						variant={filtre === f.value ? "default" : "outline"}
						size="sm"
						onClick={() => setFiltre(f.value)}
					>
						{f.label}
					</Button>
				))}
			</div>

			{isLoading ? (
				<p className="mt-6 text-muted-foreground">Chargement...</p>
			) : !chambresFiltrees?.length ? (
				<p className="mt-6 text-muted-foreground">
					Aucune chambre trouvee.
				</p>
			) : (
				<div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
					{chambresFiltrees.map((chambre) => (
						<ChambreCard key={chambre.id} chambre={chambre} />
					))}
				</div>
			)}
		</div>
	);
}
