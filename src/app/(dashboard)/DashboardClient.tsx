"use client";

import {
	AlertTriangle,
	BedDouble,
	CheckCircle,
	Clock,
	LogIn,
	LogOut,
	TrendingUp,
} from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "~/components/ui/table";
import { TYPE_CHAMBRE_LABELS } from "~/lib/constants";
import { formatMoney, formatRelativeTime } from "~/lib/utils";
import { api } from "~/trpc/react";

export function DashboardClient() {
	const { data: kpis, isLoading: isLoadingKpis } = api.dashboard.kpis.useQuery(
		undefined,
		{
			refetchInterval: 120_000,
		},
	);

	const { data: arrivees, isLoading: isLoadingArrivees } =
		api.dashboard.arriveesJour.useQuery(undefined, {
			refetchInterval: 120_000,
		});

	const { data: departs, isLoading: isLoadingDeparts } =
		api.dashboard.departsJour.useQuery(undefined, {
			refetchInterval: 120_000,
		});

	return (
		<div className="space-y-6">
			{/* KPIs */}
			<div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center gap-3">
							<div className="rounded-md bg-blue-50 p-2">
								<BedDouble className="size-5 text-blue-600" />
							</div>
							<div>
								<p className="text-muted-foreground text-xs">
									Taux d'occupation
								</p>
								<p className="font-bold text-2xl">
									{isLoadingKpis ? "..." : `${kpis?.tauxOccupation}%`}
								</p>
								{kpis && (
									<p className="text-muted-foreground text-xs">
										{kpis.chambresOccupees}/{kpis.totalChambres} chambres
									</p>
								)}
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center gap-3">
							<div className="rounded-md bg-green-50 p-2">
								<TrendingUp className="size-5 text-green-600" />
							</div>
							<div>
								<p className="text-muted-foreground text-xs">CA du jour</p>
								<p className="font-bold text-2xl">
									{isLoadingKpis ? "..." : formatMoney(kpis?.caJour ?? 0)}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center gap-3">
							<div className="rounded-md bg-purple-50 p-2">
								<TrendingUp className="size-5 text-purple-600" />
							</div>
							<div>
								<p className="text-muted-foreground text-xs">CA semaine</p>
								<p className="font-bold text-2xl">
									{isLoadingKpis ? "..." : formatMoney(kpis?.caSemaine ?? 0)}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="pt-6">
						<div className="flex items-center gap-3">
							<div className="rounded-md bg-orange-50 p-2">
								<TrendingUp className="size-5 text-orange-600" />
							</div>
							<div>
								<p className="text-muted-foreground text-xs">CA du mois</p>
								<p className="font-bold text-2xl">
									{isLoadingKpis ? "..." : formatMoney(kpis?.caMois ?? 0)}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Timestamp */}
			{kpis && (
				<p className="flex items-center gap-1 text-muted-foreground text-xs">
					<Clock className="size-3" />
					Mis a jour {formatRelativeTime(kpis.misAJour)}
				</p>
			)}

			{/* Arrivees et Departs */}
			<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
				{/* Arrivees */}
				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="flex items-center gap-2 text-base">
							<LogIn className="size-4 text-green-600" />
							Arrivees du jour
							{arrivees && (
								<Badge className="bg-green-50 text-green-600" variant="outline">
									{arrivees.length}
								</Badge>
							)}
						</CardTitle>
					</CardHeader>
					<CardContent>
						{isLoadingArrivees ? (
							<p className="py-4 text-center text-muted-foreground text-sm">
								Chargement...
							</p>
						) : !arrivees?.length ? (
							<p className="py-4 text-center text-muted-foreground text-sm">
								Aucune arrivee prevue aujourd'hui.
							</p>
						) : (
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Client</TableHead>
										<TableHead>Chambre</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{arrivees.map((r) => (
										<TableRow key={r.id}>
											<TableCell>
												<p className="font-medium">{r.clientNom}</p>
												<p className="text-muted-foreground text-xs">
													{r.clientTelephone}
												</p>
											</TableCell>
											<TableCell>
												<p className="font-medium">{r.chambre.numero}</p>
												<p className="text-muted-foreground text-xs">
													{TYPE_CHAMBRE_LABELS[r.chambre.type] ??
														r.chambre.type}
												</p>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						)}
					</CardContent>
				</Card>

				{/* Departs */}
				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="flex items-center gap-2 text-base">
							<LogOut className="size-4 text-red-600" />
							Departs du jour
							{departs && (
								<Badge className="bg-red-50 text-red-600" variant="outline">
									{departs.length}
								</Badge>
							)}
						</CardTitle>
					</CardHeader>
					<CardContent>
						{isLoadingDeparts ? (
							<p className="py-4 text-center text-muted-foreground text-sm">
								Chargement...
							</p>
						) : !departs?.length ? (
							<p className="py-4 text-center text-muted-foreground text-sm">
								Aucun depart prevu aujourd'hui.
							</p>
						) : (
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Client</TableHead>
										<TableHead>Chambre</TableHead>
										<TableHead>Paiement</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{departs.map((r) => (
										<TableRow key={r.id}>
											<TableCell>
												<p className="font-medium">{r.clientNom}</p>
												<p className="text-muted-foreground text-xs">
													{r.clientTelephone}
												</p>
											</TableCell>
											<TableCell>
												<p className="font-medium">{r.chambre.numero}</p>
												<p className="text-muted-foreground text-xs">
													{TYPE_CHAMBRE_LABELS[r.chambre.type] ??
														r.chambre.type}
												</p>
											</TableCell>
											<TableCell>
												{r.estSolde ? (
													<Badge
														className="bg-green-50 text-green-600"
														variant="outline"
													>
														<CheckCircle className="mr-1 size-3" />
														Solde
													</Badge>
												) : (
													<Badge
														className="bg-red-50 text-red-600"
														variant="outline"
													>
														<AlertTriangle className="mr-1 size-3" />
														{formatMoney(r.solde)}
													</Badge>
												)}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						)}
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
