"use client";

import { Search } from "lucide-react";
import { useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "~/components/ui/table";
import {
	RESERVATION_STATUS_COLORS,
	STATUT_RESERVATION_LABELS,
} from "~/lib/constants";
import { formatDate, formatMoney } from "~/lib/utils";
import { api } from "~/trpc/react";
import { PaiementDetail } from "./PaiementDetail";

export function PaiementsPageClient() {
	const [selectedReservationId, setSelectedReservationId] = useState<
		string | null
	>(null);
	const [query, setQuery] = useState("");

	const { data: reservations, isLoading } = api.reservation.search.useQuery({
		query: query.trim() || undefined,
	});

	// Filtrer seulement les reservations non annulees par defaut
	const filtered = reservations?.filter((r) => r.statut !== "ANNULEE");

	return (
		<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
			{/* Liste des reservations */}
			<div className="lg:col-span-1">
				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-base">Reservations</CardTitle>
						<div className="relative mt-2">
							<Search className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
							<Input
								className="pl-9"
								onChange={(e) => setQuery(e.target.value)}
								placeholder="Rechercher un client..."
								value={query}
							/>
						</div>
					</CardHeader>
					<CardContent className="max-h-[600px] overflow-y-auto">
						{isLoading ? (
							<p className="py-6 text-center text-muted-foreground text-sm">
								Chargement...
							</p>
						) : !filtered?.length ? (
							<p className="py-6 text-center text-muted-foreground text-sm">
								Aucune reservation trouvee.
							</p>
						) : (
							<div className="space-y-1">
								{filtered.map((r) => (
									<button
										className={`w-full rounded-md border p-3 text-left transition-colors hover:bg-muted/50 ${
											selectedReservationId === r.id
												? "border-primary bg-primary/5"
												: ""
										}`}
										key={r.id}
										onClick={() => setSelectedReservationId(r.id)}
										type="button"
									>
										<div className="flex items-center justify-between">
											<p className="font-medium text-sm">{r.clientNom}</p>
											<Badge
												className={`text-[10px] ${RESERVATION_STATUS_COLORS[r.statut] ?? ""}`}
												variant="outline"
											>
												{STATUT_RESERVATION_LABELS[r.statut] ?? r.statut}
											</Badge>
										</div>
										<p className="text-muted-foreground text-xs">
											Ch. {r.chambre.numero} — {formatDate(r.dateArrivee)} au{" "}
											{formatDate(r.dateDepart)}
										</p>
										<p className="mt-0.5 font-medium text-xs">
											{formatMoney(Number(r.prixTotal))}
										</p>
									</button>
								))}
							</div>
						)}
					</CardContent>
				</Card>
			</div>

			{/* Detail paiements */}
			<div className="lg:col-span-2">
				{selectedReservationId ? (
					<PaiementDetail reservationId={selectedReservationId} />
				) : (
					<Card>
						<CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
							<p className="text-sm">
								Selectionnez une reservation pour voir les paiements
							</p>
						</CardContent>
					</Card>
				)}
			</div>
		</div>
	);
}
