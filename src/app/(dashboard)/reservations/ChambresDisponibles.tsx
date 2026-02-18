"use client";

import { CalendarDays, Plus } from "lucide-react";
import { useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { ROOM_STATUS_COLORS, TYPE_CHAMBRE_LABELS } from "~/lib/constants";
import { formatDate, formatMoney } from "~/lib/utils";
import { api } from "~/trpc/react";
import {
	type ChambreInfo,
	ReservationFormDialog,
} from "./ReservationFormDialog";

interface ChambresDisponiblesProps {
	date: string | null;
}

export function ChambresDisponibles({ date }: ChambresDisponiblesProps) {
	const [chambreSelectionnee, setChambreSelectionnee] =
		useState<ChambreInfo | null>(null);

	const { data: chambres, isLoading } =
		api.reservation.getChambresParDate.useQuery(
			{ date: date! },
			{ enabled: !!date },
		);

	if (!date) {
		return (
			<Card>
				<CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
					<CalendarDays className="mb-3 size-10 opacity-50" />
					<p className="text-sm">Selectionnez une date</p>
					<p className="text-xs">pour voir les chambres disponibles</p>
				</CardContent>
			</Card>
		);
	}

	const dateFormatee = formatDate(new Date(date));
	const libres = chambres?.filter((c) => c.disponible).length ?? 0;
	const total = chambres?.length ?? 0;

	return (
		<>
			<Card>
				<CardHeader className="pb-3">
					<CardTitle className="text-base">Chambres — {dateFormatee}</CardTitle>
					{chambres && (
						<p className="text-muted-foreground text-sm">
							{libres} libre{libres !== 1 ? "s" : ""} sur {total}
						</p>
					)}
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<p className="py-6 text-center text-muted-foreground text-sm">
							Chargement...
						</p>
					) : !chambres?.length ? (
						<p className="py-6 text-center text-muted-foreground text-sm">
							Aucune chambre configuree.
						</p>
					) : (
						<div className="space-y-2">
							{chambres.map((chambre) => {
								const tarifNumber = Number(chambre.tarif);
								const statutColor = chambre.disponible
									? ROOM_STATUS_COLORS.LIBRE
									: ROOM_STATUS_COLORS.OCCUPE;

								return (
									<div
										className="flex items-center justify-between rounded-md border p-3"
										key={chambre.id}
									>
										<div>
											<p className="font-medium text-sm">{chambre.numero}</p>
											<p className="text-muted-foreground text-xs">
												{TYPE_CHAMBRE_LABELS[chambre.type] ?? chambre.type} —{" "}
												{formatMoney(tarifNumber)}/nuit
											</p>
											{chambre.reservation && (
												<p className="mt-0.5 text-muted-foreground text-xs">
													{chambre.reservation.clientNom}
												</p>
											)}
										</div>
										<div className="flex items-center gap-2">
											{chambre.disponible && (
												<Button
													onClick={() => setChambreSelectionnee(chambre)}
													size="sm"
													variant="ghost"
												>
													<Plus className="size-3.5" />
													Reserver
												</Button>
											)}
											<Badge className={statutColor} variant="outline">
												{chambre.disponible ? "Libre" : "Occupee"}
											</Badge>
										</div>
									</div>
								);
							})}
						</div>
					)}
				</CardContent>
			</Card>

			<ReservationFormDialog
				chambre={chambreSelectionnee}
				dateArrivee={date}
				onOpenChange={(open) => {
					if (!open) setChambreSelectionnee(null);
				}}
				onSuccess={() => setChambreSelectionnee(null)}
				open={!!chambreSelectionnee}
			/>
		</>
	);
}
