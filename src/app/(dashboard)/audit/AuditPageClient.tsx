"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
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
import { formatDateTime } from "~/lib/utils";
import { api } from "~/trpc/react";

const ACTION_LABELS: Record<string, string> = {
	CREATION: "Creation",
	MODIFICATION: "Modification",
	SUPPRESSION: "Suppression",
	CONNEXION: "Connexion",
	DECONNEXION: "Deconnexion",
	ANNULATION: "Annulation",
};

const ACTION_COLORS: Record<string, string> = {
	CREATION: "text-green-600 bg-green-50",
	MODIFICATION: "text-blue-600 bg-blue-50",
	SUPPRESSION: "text-red-600 bg-red-50",
	CONNEXION: "text-purple-600 bg-purple-50",
	DECONNEXION: "text-gray-600 bg-gray-50",
	ANNULATION: "text-orange-600 bg-orange-50",
};

export function AuditPageClient() {
	const [action, setAction] = useState<string>("all");
	const [entite, setEntite] = useState<string>("all");
	const [page, setPage] = useState(0);

	const filters = {
		action:
			action !== "all"
				? (action as
						| "CREATION"
						| "MODIFICATION"
						| "SUPPRESSION"
						| "CONNEXION"
						| "DECONNEXION"
						| "ANNULATION")
				: undefined,
		entite: entite !== "all" ? entite : undefined,
		page,
	};

	const { data, isLoading } = api.audit.list.useQuery(filters);

	const totalPages = data ? Math.ceil(data.total / 50) : 0;

	return (
		<Card>
			<CardHeader className="pb-4">
				<CardTitle className="text-base">
					Actions ({data?.total ?? 0})
				</CardTitle>
			</CardHeader>
			<CardContent>
				{/* Filtres */}
				<div className="mb-4 flex flex-wrap gap-3">
					<Select
						onValueChange={(v) => {
							setAction(v);
							setPage(0);
						}}
						value={action}
					>
						<SelectTrigger className="w-[180px]">
							<SelectValue placeholder="Type d'action" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">Toutes les actions</SelectItem>
							<SelectItem value="CREATION">Creation</SelectItem>
							<SelectItem value="MODIFICATION">Modification</SelectItem>
							<SelectItem value="SUPPRESSION">Suppression</SelectItem>
							<SelectItem value="CONNEXION">Connexion</SelectItem>
							<SelectItem value="DECONNEXION">Deconnexion</SelectItem>
							<SelectItem value="ANNULATION">Annulation</SelectItem>
						</SelectContent>
					</Select>

					<Select
						onValueChange={(v) => {
							setEntite(v);
							setPage(0);
						}}
						value={entite}
					>
						<SelectTrigger className="w-[180px]">
							<SelectValue placeholder="Entite" />
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="all">Toutes les entites</SelectItem>
							<SelectItem value="Reservation">Reservation</SelectItem>
							<SelectItem value="Paiement">Paiement</SelectItem>
							<SelectItem value="Chambre">Chambre</SelectItem>
							<SelectItem value="User">Utilisateur</SelectItem>
							<SelectItem value="Client">Client</SelectItem>
						</SelectContent>
					</Select>
				</div>

				{/* Table */}
				{isLoading ? (
					<p className="py-8 text-center text-muted-foreground text-sm">
						Chargement...
					</p>
				) : !data?.logs.length ? (
					<p className="py-8 text-center text-muted-foreground text-sm">
						Aucune action enregistree.
					</p>
				) : (
					<>
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Date</TableHead>
									<TableHead>Utilisateur</TableHead>
									<TableHead>Action</TableHead>
									<TableHead>Entite</TableHead>
									<TableHead>Details</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{data.logs.map((log) => (
									<TableRow key={log.id}>
										<TableCell className="text-muted-foreground text-xs">
											{formatDateTime(log.createdAt)}
										</TableCell>
										<TableCell>
											<p className="font-medium text-sm">{log.user.nom}</p>
											<p className="text-muted-foreground text-xs">
												{log.user.email}
											</p>
										</TableCell>
										<TableCell>
											<Badge
												className={ACTION_COLORS[log.action] ?? ""}
												variant="outline"
											>
												{ACTION_LABELS[log.action] ?? log.action}
											</Badge>
										</TableCell>
										<TableCell>
											{log.entite}
											{log.entiteId && (
												<span className="ml-1 text-muted-foreground text-xs">
													#{log.entiteId.slice(0, 8)}
												</span>
											)}
										</TableCell>
										<TableCell className="max-w-[200px] truncate text-muted-foreground text-xs">
											{log.details ? JSON.stringify(log.details) : "—"}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>

						{/* Pagination */}
						{totalPages > 1 && (
							<div className="mt-4 flex items-center justify-between">
								<p className="text-muted-foreground text-sm">
									Page {page + 1} sur {totalPages}
								</p>
								<div className="flex gap-1">
									<Button
										disabled={page === 0}
										onClick={() => setPage(page - 1)}
										size="sm"
										variant="outline"
									>
										<ChevronLeft className="size-4" />
									</Button>
									<Button
										disabled={page >= totalPages - 1}
										onClick={() => setPage(page + 1)}
										size="sm"
										variant="outline"
									>
										<ChevronRight className="size-4" />
									</Button>
								</div>
							</div>
						)}
					</>
				)}
			</CardContent>
		</Card>
	);
}
