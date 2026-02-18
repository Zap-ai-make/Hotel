"use client";

import { ArrowLeft, ArrowRightLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { ROOM_STATUS_COLORS, TYPE_CHAMBRE_LABELS } from "~/lib/constants";
import { formatMoney } from "~/lib/utils";
import { api } from "~/trpc/react";

const STATUT_LABELS: Record<string, string> = {
	LIBRE: "Libre",
	OCCUPE: "Occupee",
};

export function ChambreDetail({ id }: { id: string }) {
	const utils = api.useUtils();
	const { data: chambre, isLoading } = api.chambre.getById.useQuery({ id });
	const toggleStatut = api.chambre.toggleStatut.useMutation({
		onSuccess: (updated) => {
			void utils.chambre.getById.invalidate({ id });
			void utils.chambre.list.invalidate();
			const label = updated.statut === "LIBRE" ? "Libre" : "Occupee";
			toast.success(`Chambre ${updated.numero} → ${label}`);
		},
	});

	if (isLoading) {
		return <p className="text-muted-foreground">Chargement...</p>;
	}

	if (!chambre) {
		return (
			<div className="space-y-4">
				<p className="text-muted-foreground">Chambre introuvable.</p>
				<Button asChild variant="outline">
					<Link href="/chambres">
						<ArrowLeft className="mr-2 h-4 w-4" />
						Retour a la liste
					</Link>
				</Button>
			</div>
		);
	}

	const statutColor = ROOM_STATUS_COLORS[chambre.statut];
	const tarifNumber = Number(chambre.tarif);

	return (
		<div className="space-y-6">
			<Button asChild variant="outline">
				<Link href="/chambres">
					<ArrowLeft className="mr-2 h-4 w-4" />
					Retour a la liste
				</Link>
			</Button>

			<Card>
				<CardHeader className="flex-row items-center justify-between gap-4">
					<div>
						<CardTitle className="text-3xl">Chambre {chambre.numero}</CardTitle>
						<p className="mt-1 text-muted-foreground">
							{TYPE_CHAMBRE_LABELS[chambre.type] ?? chambre.type}
						</p>
					</div>
					<Badge
						className={`${statutColor} px-3 py-1 text-sm`}
						variant="outline"
					>
						{STATUT_LABELS[chambre.statut] ?? chambre.statut}
					</Badge>
				</CardHeader>
				<CardContent className="space-y-6">
					<div>
						<h3 className="font-semibold text-muted-foreground text-sm uppercase tracking-wide">
							Tarif
						</h3>
						<p className="mt-1 font-bold text-2xl">
							{formatMoney(tarifNumber)}
							<span className="font-normal text-base text-muted-foreground">
								{" "}
								/ nuit
							</span>
						</p>
					</div>

					{chambre.caracteristiques.length > 0 && (
						<div>
							<h3 className="font-semibold text-muted-foreground text-sm uppercase tracking-wide">
								Caracteristiques
							</h3>
							<div className="mt-2 flex flex-wrap gap-2">
								{chambre.caracteristiques.map((c) => (
									<span
										className="rounded-md bg-muted px-3 py-1.5 text-sm"
										key={c}
									>
										{c}
									</span>
								))}
							</div>
						</div>
					)}
				</CardContent>

				<div className="flex justify-end px-6 pb-2">
					<Button
						disabled={toggleStatut.isPending}
						onClick={() => toggleStatut.mutate({ id: chambre.id })}
						variant={chambre.statut === "LIBRE" ? "destructive" : "default"}
					>
						<ArrowRightLeft className="mr-2 h-4 w-4" />
						{chambre.statut === "LIBRE" ? "Marquer Occupee" : "Marquer Libre"}
					</Button>
				</div>
			</Card>
		</div>
	);
}
