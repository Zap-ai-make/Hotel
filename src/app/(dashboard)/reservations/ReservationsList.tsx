"use client";

import { Pencil, Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useDebounce } from "~/lib/hooks";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
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
	TYPE_CHAMBRE_LABELS,
} from "~/lib/constants";
import { formatDate, formatMoney } from "~/lib/utils";
import { api } from "~/trpc/react";
import { ReservationCancelDialog } from "./ReservationCancelDialog";
import { ReservationEditDialog } from "./ReservationEditDialog";

export function ReservationsList() {
	const [query, setQuery] = useState("");
	const [statut, setStatut] = useState<string>("all");
	const [dateDebut, setDateDebut] = useState("");
	const [dateFin, setDateFin] = useState("");

	const debouncedQuery = useDebounce(query.trim(), 300);

	const [editId, setEditId] = useState<string | null>(null);
	const [cancelId, setCancelId] = useState<string | null>(null);

	const searchInput = useMemo(
		() => ({
			query: debouncedQuery || undefined,
			statut:
				statut !== "all"
					? (statut as "CONFIRMEE" | "EN_COURS" | "TERMINEE" | "ANNULEE")
					: undefined,
			dateDebut: dateDebut || undefined,
			dateFin: dateFin || undefined,
		}),
		[debouncedQuery, statut, dateDebut, dateFin],
	);

	const { data: reservations, isLoading } =
		api.reservation.search.useQuery(searchInput);

	const hasFilters =
		query.length > 0 ||
		statut !== "all" ||
		dateDebut.length > 0 ||
		dateFin.length > 0;

	function resetFilters() {
		setQuery("");
		setStatut("all");
		setDateDebut("");
		setDateFin("");
	}

	return (
		<>
			<Card>
				<CardHeader className="pb-4">
					<CardTitle className="text-base">
						Rechercher des reservations
					</CardTitle>
				</CardHeader>
				<CardContent>
					{/* Filtres */}
					<div className="flex flex-wrap items-end gap-3">
						<div className="min-w-[200px] flex-1">
							<div className="relative">
								<Search className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
								<Input
									className="pl-9"
									onChange={(e) => setQuery(e.target.value)}
									placeholder="Nom du client ou telephone..."
									value={query}
								/>
							</div>
						</div>
						<Select onValueChange={setStatut} value={statut}>
							<SelectTrigger className="w-[160px]">
								<SelectValue placeholder="Statut" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="all">Tous les statuts</SelectItem>
								<SelectItem value="CONFIRMEE">Confirmee</SelectItem>
								<SelectItem value="EN_COURS">En cours</SelectItem>
								<SelectItem value="TERMINEE">Terminee</SelectItem>
								<SelectItem value="ANNULEE">Annulee</SelectItem>
							</SelectContent>
						</Select>
						<Input
							className="w-[160px]"
							onChange={(e) => setDateDebut(e.target.value)}
							placeholder="Date debut"
							type="date"
							value={dateDebut}
						/>
						<Input
							className="w-[160px]"
							onChange={(e) => setDateFin(e.target.value)}
							placeholder="Date fin"
							type="date"
							value={dateFin}
						/>
						{hasFilters && (
							<Button
								className="gap-1"
								onClick={resetFilters}
								size="sm"
								variant="ghost"
							>
								<X className="size-3.5" />
								Effacer
							</Button>
						)}
					</div>

					{/* Table */}
					<div className="mt-4">
						{isLoading ? (
							<p className="py-8 text-center text-muted-foreground text-sm">
								Chargement...
							</p>
						) : !reservations?.length ? (
							<p className="py-8 text-center text-muted-foreground text-sm">
								Aucune reservation trouvee.
							</p>
						) : (
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Client</TableHead>
										<TableHead>Chambre</TableHead>
										<TableHead>Arrivee</TableHead>
										<TableHead>Depart</TableHead>
										<TableHead>Prix</TableHead>
										<TableHead>Statut</TableHead>
										<TableHead className="text-right">Actions</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{reservations.map((r) => (
										<TableRow
											className={r.statut === "ANNULEE" ? "opacity-50" : ""}
											key={r.id}
										>
											<TableCell>
												<div>
													<p className="font-medium">{r.clientNom}</p>
													<p className="text-muted-foreground text-xs">
														{r.clientTelephone}
													</p>
												</div>
											</TableCell>
											<TableCell>
												<p className="font-medium">{r.chambre.numero}</p>
												<p className="text-muted-foreground text-xs">
													{TYPE_CHAMBRE_LABELS[r.chambre.type] ??
														r.chambre.type}
												</p>
											</TableCell>
											<TableCell>{formatDate(r.dateArrivee)}</TableCell>
											<TableCell>{formatDate(r.dateDepart)}</TableCell>
											<TableCell>{formatMoney(Number(r.prixTotal))}</TableCell>
											<TableCell>
												<Badge
													className={RESERVATION_STATUS_COLORS[r.statut] ?? ""}
													variant="outline"
												>
													{STATUT_RESERVATION_LABELS[r.statut] ?? r.statut}
												</Badge>
											</TableCell>
											<TableCell className="text-right">
												{r.statut !== "ANNULEE" && (
													<div className="flex justify-end gap-1">
														<Button
															onClick={() => setEditId(r.id)}
															size="sm"
															variant="ghost"
														>
															<Pencil className="size-3.5" />
														</Button>
														<Button
															className="text-red-600 hover:text-red-700"
															onClick={() => setCancelId(r.id)}
															size="sm"
															variant="ghost"
														>
															<X className="size-3.5" />
														</Button>
													</div>
												)}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						)}
						{reservations && reservations.length > 0 && (
							<p className="mt-2 text-muted-foreground text-xs">
								{reservations.length} reservation
								{reservations.length > 1 ? "s" : ""}
							</p>
						)}
					</div>
				</CardContent>
			</Card>

			{editId && (
				<ReservationEditDialog
					onOpenChange={(open) => {
						if (!open) setEditId(null);
					}}
					open={!!editId}
					reservationId={editId}
				/>
			)}

			{cancelId && (
				<ReservationCancelDialog
					onOpenChange={(open) => {
						if (!open) setCancelId(null);
					}}
					open={!!cancelId}
					reservationId={cancelId}
				/>
			)}
		</>
	);
}
