"use client";

import {
	eachDayOfInterval,
	endOfMonth,
	format,
	getDay,
	isBefore,
	startOfDay,
	startOfMonth,
} from "date-fns";
import { fr } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useMemo } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { cn } from "~/lib/utils";
import { api } from "~/trpc/react";

const JOURS_SEMAINE = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

function getDisponibiliteColor(chambresLibres: number, total: number): string {
	if (chambresLibres === 0) return "bg-red-100 text-red-700";
	if (chambresLibres <= total * 0.3) return "bg-orange-100 text-orange-700";
	return "bg-green-100 text-green-700";
}

interface CalendrierGridProps {
	mois: number;
	annee: number;
	dateSelectionnee: string | null;
	onNaviguer: (direction: -1 | 1) => void;
	onDateClick: (date: string) => void;
}

export function CalendrierGrid({
	mois,
	annee,
	dateSelectionnee,
	onNaviguer,
	onDateClick,
}: CalendrierGridProps) {
	const { data, isLoading } =
		api.reservation.getDisponibilitesMensuelles.useQuery({ mois, annee });

	const debut = startOfMonth(new Date(annee, mois - 1));
	const fin = endOfMonth(debut);
	const joursCalendrier = useMemo(
		() => eachDayOfInterval({ start: debut, end: fin }),
		[debut.getTime(), fin.getTime()],
	);
	const aujourdHui = startOfDay(new Date());

	// Monday = 0 offset: (getDay returns 0=Sun, we want 0=Mon)
	const premierJourOffset = (getDay(debut) + 6) % 7;

	// Build a map date ISO -> disponibilite for quick lookup
	const dispoMap = useMemo(
		() =>
			new Map(
				data?.jours.map((j) => [
					startOfDay(new Date(j.date)).toISOString(),
					j,
				]),
			),
		[data],
	);

	const moisLabel = format(debut, "MMMM yyyy", { locale: fr });
	// Capitalize first letter
	const moisLabelCapitalized =
		moisLabel.charAt(0).toUpperCase() + moisLabel.slice(1);

	return (
		<Card>
			<CardHeader className="flex-row items-center justify-between pb-4">
				<Button
					aria-label="Mois precedent"
					onClick={() => onNaviguer(-1)}
					size="icon"
					variant="outline"
				>
					<ChevronLeft className="size-4" />
				</Button>
				<CardTitle className="text-lg">{moisLabelCapitalized}</CardTitle>
				<Button
					aria-label="Mois suivant"
					onClick={() => onNaviguer(1)}
					size="icon"
					variant="outline"
				>
					<ChevronRight className="size-4" />
				</Button>
			</CardHeader>
			<CardContent>
				{/* Header jours de la semaine */}
				<div className="mb-1 grid grid-cols-7 gap-1">
					{JOURS_SEMAINE.map((jour) => (
						<div
							className="py-2 text-center font-medium text-muted-foreground text-xs"
							key={jour}
						>
							{jour}
						</div>
					))}
				</div>

				{isLoading ? (
					<p className="py-12 text-center text-muted-foreground">
						Chargement...
					</p>
				) : (
					<div className="grid grid-cols-7 gap-1">
						{/* Empty cells before the first day */}
						{Array.from({ length: premierJourOffset }).map((_, i) => (
							<div className="aspect-square" key={`vide-${i}`} />
						))}

						{/* Calendar days */}
						{joursCalendrier.map((jour) => {
							const jourISO = startOfDay(jour).toISOString();
							const estPasse = isBefore(jour, aujourdHui);
							const dispo = dispoMap.get(jourISO);
							const chambresLibres = dispo?.chambresLibres ?? 0;
							const totalChambres = data?.totalChambres ?? 0;
							const estSelectionne = dateSelectionnee === jourISO;

							return (
								<button
									className={cn(
										"flex aspect-square flex-col items-center justify-center rounded-md border text-sm transition-colors",
										estPasse &&
											"cursor-not-allowed border-transparent bg-muted/50 text-muted-foreground/50",
										!estPasse && "cursor-pointer hover:border-primary/50",
										!estPasse &&
											getDisponibiliteColor(chambresLibres, totalChambres),
										estSelectionne && "ring-2 ring-primary ring-offset-1",
									)}
									disabled={estPasse}
									key={jourISO}
									onClick={() => onDateClick(jourISO)}
									type="button"
								>
									<span className="font-medium">{format(jour, "d")}</span>
									{!estPasse && totalChambres > 0 && (
										<span className="text-[10px] leading-tight">
											{chambresLibres} lib
										</span>
									)}
								</button>
							);
						})}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
