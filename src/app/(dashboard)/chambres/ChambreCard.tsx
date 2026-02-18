"use client";

import { ArrowRightLeft } from "lucide-react";
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

interface ChambreCardProps {
	chambre: {
		id: string;
		numero: string;
		type: string;
		tarif: unknown;
		statut: "LIBRE" | "OCCUPE";
		caracteristiques: string[];
	};
}

export function ChambreCard({ chambre }: ChambreCardProps) {
	const utils = api.useUtils();
	const toggleStatut = api.chambre.toggleStatut.useMutation({
		onSuccess: (updated) => {
			void utils.chambre.list.invalidate();
			const label = updated.statut === "LIBRE" ? "Libre" : "Occupee";
			toast.success(`Chambre ${updated.numero} → ${label}`);
		},
	});

	const statutColor = ROOM_STATUS_COLORS[chambre.statut];
	const tarifNumber = Number(chambre.tarif);

	return (
		<Card className="gap-3 py-4 transition-shadow hover:shadow-md">
			<Link href={`/chambres/${chambre.id}`}>
				<CardHeader className="flex-row items-center justify-between gap-2 pb-0">
					<CardTitle className="text-xl">{chambre.numero}</CardTitle>
					<Badge className={statutColor} variant="outline">
						{STATUT_LABELS[chambre.statut] ?? chambre.statut}
					</Badge>
				</CardHeader>
				<CardContent className="space-y-2">
					<p className="text-muted-foreground text-sm">
						{TYPE_CHAMBRE_LABELS[chambre.type] ?? chambre.type}
					</p>
					<p className="font-semibold">
						{formatMoney(tarifNumber)}
						<span className="font-normal text-muted-foreground text-sm">
							{" "}
							/ nuit
						</span>
					</p>
					{chambre.caracteristiques.length > 0 && (
						<div className="flex flex-wrap gap-1 pt-1">
							{chambre.caracteristiques.map((c) => (
								<span
									className="rounded bg-muted px-1.5 py-0.5 text-muted-foreground text-xs"
									key={c}
								>
									{c}
								</span>
							))}
						</div>
					)}
				</CardContent>
			</Link>
			<div className="px-6">
				<Button
					className="w-full"
					disabled={toggleStatut.isPending}
					onClick={(e) => {
						e.preventDefault();
						toggleStatut.mutate({ id: chambre.id });
					}}
					size="sm"
					variant="outline"
				>
					<ArrowRightLeft className="mr-2 h-3.5 w-3.5" />
					{chambre.statut === "LIBRE" ? "Marquer Occupee" : "Marquer Libre"}
				</Button>
			</div>
		</Card>
	);
}
