"use client";

import { ArrowLeft, ArrowRightLeft } from "lucide-react";
import Link from "next/link";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { toast } from "sonner";
import { ROOM_STATUS_COLORS } from "~/lib/constants";
import { formatMoney } from "~/lib/utils";
import { api } from "~/trpc/react";

const TYPE_LABELS: Record<string, string> = {
	SIMPLE: "Simple",
	DOUBLE: "Double",
	SUITE: "Suite",
};

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
				<Button variant="outline" asChild>
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
			<Button variant="outline" asChild>
				<Link href="/chambres">
					<ArrowLeft className="mr-2 h-4 w-4" />
					Retour a la liste
				</Link>
			</Button>

			<Card>
				<CardHeader className="flex-row items-center justify-between gap-4">
					<div>
						<CardTitle className="text-3xl">
							Chambre {chambre.numero}
						</CardTitle>
						<p className="mt-1 text-muted-foreground">
							{TYPE_LABELS[chambre.type] ?? chambre.type}
						</p>
					</div>
					<Badge variant="outline" className={`${statutColor} text-sm px-3 py-1`}>
						{STATUT_LABELS[chambre.statut] ?? chambre.statut}
					</Badge>
				</CardHeader>
				<CardContent className="space-y-6">
					<div>
						<h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
							Tarif
						</h3>
						<p className="mt-1 text-2xl font-bold">
							{formatMoney(tarifNumber)}
							<span className="font-normal text-muted-foreground text-base">
								{" "}
								/ nuit
							</span>
						</p>
					</div>

					{chambre.caracteristiques.length > 0 && (
						<div>
							<h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
								Caracteristiques
							</h3>
							<div className="mt-2 flex flex-wrap gap-2">
								{chambre.caracteristiques.map((c) => (
									<span
										key={c}
										className="rounded-md bg-muted px-3 py-1.5 text-sm"
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
						variant={chambre.statut === "LIBRE" ? "destructive" : "default"}
						onClick={() => toggleStatut.mutate({ id: chambre.id })}
						disabled={toggleStatut.isPending}
					>
						<ArrowRightLeft className="mr-2 h-4 w-4" />
						{chambre.statut === "LIBRE"
							? "Marquer Occupee"
							: "Marquer Libre"}
					</Button>
				</div>
				</Card>
		</div>
	);
}
