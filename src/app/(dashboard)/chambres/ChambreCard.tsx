"use client";

import Link from "next/link";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { ROOM_STATUS_COLORS } from "~/lib/constants";
import { formatMoney } from "~/lib/utils";

const TYPE_LABELS: Record<string, string> = {
	SIMPLE: "Simple",
	DOUBLE: "Double",
	SUITE: "Suite",
};

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
	const statutColor = ROOM_STATUS_COLORS[chambre.statut];
	const tarifNumber = Number(chambre.tarif);

	return (
		<Link href={`/chambres/${chambre.id}`}>
		<Card className="gap-3 py-4 transition-shadow hover:shadow-md cursor-pointer">
			<CardHeader className="flex-row items-center justify-between gap-2 pb-0">
				<CardTitle className="text-xl">{chambre.numero}</CardTitle>
				<Badge variant="outline" className={statutColor}>
					{STATUT_LABELS[chambre.statut] ?? chambre.statut}
				</Badge>
			</CardHeader>
			<CardContent className="space-y-2">
				<p className="text-muted-foreground text-sm">
					{TYPE_LABELS[chambre.type] ?? chambre.type}
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
								key={c}
								className="rounded bg-muted px-1.5 py-0.5 text-muted-foreground text-xs"
							>
								{c}
							</span>
						))}
					</div>
				)}
			</CardContent>
		</Card>
		</Link>
	);
}
