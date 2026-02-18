"use client";

import { Loader2, Pencil, Plus, Search, User } from "lucide-react";
import { useEffect, useState } from "react";
import { useDebounce } from "~/lib/hooks";
import { toast } from "sonner";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
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

export function ClientsPageClient() {
	const [query, setQuery] = useState("");
	const debouncedQuery = useDebounce(query.trim(), 300);
	const [createOpen, setCreateOpen] = useState(false);
	const [editId, setEditId] = useState<string | null>(null);
	const [detailId, setDetailId] = useState<string | null>(null);

	const { data: clients, isLoading } = api.clientele.search.useQuery({
		query: debouncedQuery || undefined,
	});

	return (
		<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
			{/* Liste clients */}
			<div className="lg:col-span-1">
				<Card>
					<CardHeader className="pb-3">
						<div className="flex items-center justify-between">
							<CardTitle className="text-base">Clients</CardTitle>
							<Button
								className="gap-1"
								onClick={() => setCreateOpen(true)}
								size="sm"
							>
								<Plus className="size-3.5" />
								Nouveau
							</Button>
						</div>
						<div className="relative mt-2">
							<Search className="absolute top-2.5 left-2.5 size-4 text-muted-foreground" />
							<Input
								className="pl-9"
								onChange={(e) => setQuery(e.target.value)}
								placeholder="Nom ou telephone..."
								value={query}
							/>
						</div>
					</CardHeader>
					<CardContent className="max-h-[600px] overflow-y-auto">
						{isLoading ? (
							<p className="py-6 text-center text-muted-foreground text-sm">
								Chargement...
							</p>
						) : !clients?.length ? (
							<p className="py-6 text-center text-muted-foreground text-sm">
								Aucun client trouve.
							</p>
						) : (
							<div className="space-y-1">
								{clients.map((c) => (
									<button
										className={`w-full rounded-md border p-3 text-left transition-colors hover:bg-muted/50 ${
											detailId === c.id ? "border-primary bg-primary/5" : ""
										}`}
										key={c.id}
										onClick={() => setDetailId(c.id)}
										type="button"
									>
										<div className="flex items-center justify-between">
											<p className="font-medium text-sm">{c.nom}</p>
											<Badge className="text-[10px]" variant="outline">
												{c._count.reservations} sejour
												{c._count.reservations > 1 ? "s" : ""}
											</Badge>
										</div>
										<p className="text-muted-foreground text-xs">
											{c.telephone}
										</p>
									</button>
								))}
							</div>
						)}
					</CardContent>
				</Card>
			</div>

			{/* Detail client */}
			<div className="lg:col-span-2">
				{detailId ? (
					<ClientDetail
						clientId={detailId}
						onEdit={() => setEditId(detailId)}
					/>
				) : (
					<Card>
						<CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
							<User className="mb-3 size-10 opacity-50" />
							<p className="text-sm">
								Selectionnez un client pour voir son profil
							</p>
						</CardContent>
					</Card>
				)}
			</div>

			<ClientFormDialog onOpenChange={setCreateOpen} open={createOpen} />

			{editId && (
				<ClientFormDialog
					clientId={editId}
					onOpenChange={(open) => {
						if (!open) setEditId(null);
					}}
					open={!!editId}
				/>
			)}
		</div>
	);
}

// -- Detail Client --
function ClientDetail({
	clientId,
	onEdit,
}: {
	clientId: string;
	onEdit: () => void;
}) {
	const { data: client, isLoading } = api.clientele.getById.useQuery({
		id: clientId,
	});

	if (isLoading) {
		return (
			<Card>
				<CardContent className="flex items-center justify-center py-16">
					<Loader2 className="size-6 animate-spin text-muted-foreground" />
				</CardContent>
			</Card>
		);
	}

	if (!client) return null;

	return (
		<div className="space-y-4">
			{/* Profil */}
			<Card>
				<CardHeader className="pb-3">
					<div className="flex items-center justify-between">
						<CardTitle className="text-base">{client.nom}</CardTitle>
						<Button
							className="gap-1"
							onClick={onEdit}
							size="sm"
							variant="outline"
						>
							<Pencil className="size-3.5" />
							Modifier
						</Button>
					</div>
				</CardHeader>
				<CardContent className="space-y-2">
					<div className="grid grid-cols-2 gap-4">
						<div>
							<p className="text-muted-foreground text-xs">Telephone</p>
							<p className="font-medium text-sm">{client.telephone}</p>
						</div>
						<div>
							<p className="text-muted-foreground text-xs">Email</p>
							<p className="font-medium text-sm">{client.email ?? "—"}</p>
						</div>
					</div>
					{client.notes && (
						<div>
							<p className="text-muted-foreground text-xs">Notes</p>
							<p className="rounded-md bg-muted/50 p-2 text-sm">
								{client.notes}
							</p>
						</div>
					)}
				</CardContent>
			</Card>

			{/* Historique sejours */}
			<Card>
				<CardHeader className="pb-3">
					<CardTitle className="text-base">
						Historique des sejours ({client.reservations.length})
					</CardTitle>
				</CardHeader>
				<CardContent>
					{client.reservations.length === 0 ? (
						<p className="py-4 text-center text-muted-foreground text-sm">
							Aucun sejour enregistre.
						</p>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Chambre</TableHead>
									<TableHead>Arrivee</TableHead>
									<TableHead>Depart</TableHead>
									<TableHead>Prix</TableHead>
									<TableHead>Statut</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{client.reservations.map((r) => (
									<TableRow key={r.id}>
										<TableCell>
											<p className="font-medium">{r.chambre.numero}</p>
											<p className="text-muted-foreground text-xs">
												{TYPE_CHAMBRE_LABELS[r.chambre.type] ?? r.chambre.type}
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
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>
		</div>
	);
}

// -- Form Dialog (Create/Edit) --
function ClientFormDialog({
	clientId,
	open,
	onOpenChange,
}: {
	clientId?: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const isEdit = !!clientId;
	const [nom, setNom] = useState("");
	const [telephone, setTelephone] = useState("");
	const [email, setEmail] = useState("");
	const [notes, setNotes] = useState("");
	const [initialized, setInitialized] = useState(false);

	const utils = api.useUtils();

	const { data: client } = api.clientele.getById.useQuery(
		{ id: clientId! },
		{ enabled: isEdit && open },
	);

	// Init form for edit
	useEffect(() => {
		if (client && !initialized && isEdit) {
			setNom(client.nom);
			setTelephone(client.telephone);
			setEmail(client.email ?? "");
			setNotes(client.notes ?? "");
			setInitialized(true);
		}
	}, [client, initialized, isEdit]);

	// Reset on close
	useEffect(() => {
		if (!open) {
			setInitialized(false);
			setNom("");
			setTelephone("");
			setEmail("");
			setNotes("");
		}
	}, [open]);

	const createMutation = api.clientele.create.useMutation({
		onSuccess: () => {
			void utils.clientele.search.invalidate();
			void utils.clientele.list.invalidate();
			toast.success("Client cree avec succes");
			onOpenChange(false);
		},
		onError: (error) => toast.error(error.message),
	});

	const updateMutation = api.clientele.update.useMutation({
		onSuccess: () => {
			void utils.clientele.search.invalidate();
			void utils.clientele.list.invalidate();
			void utils.clientele.getById.invalidate();
			toast.success("Client modifie avec succes");
			onOpenChange(false);
		},
		onError: (error) => toast.error(error.message),
	});

	const isPending = createMutation.isPending || updateMutation.isPending;
	const isFormValid = nom.trim().length > 0 && telephone.trim().length > 0;

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!isFormValid) return;

		const data = {
			nom: nom.trim(),
			telephone: telephone.trim(),
			email: email.trim() || undefined,
			notes: notes.trim() || undefined,
		};

		if (isEdit && clientId) {
			updateMutation.mutate({ id: clientId, ...data });
		} else {
			createMutation.mutate(data);
		}
	}

	return (
		<Dialog
			onOpenChange={(v) => {
				if (!v && isPending) return;
				onOpenChange(v);
			}}
			open={open}
		>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>
						{isEdit ? "Modifier le client" : "Nouveau client"}
					</DialogTitle>
				</DialogHeader>
				<form className="space-y-4" onSubmit={handleSubmit}>
					<div className="space-y-2">
						<Label htmlFor="client-nom">Nom *</Label>
						<Input
							disabled={isPending}
							id="client-nom"
							onChange={(e) => setNom(e.target.value)}
							placeholder="Nom complet"
							required
							value={nom}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="client-tel">Telephone *</Label>
						<Input
							disabled={isPending}
							id="client-tel"
							onChange={(e) => setTelephone(e.target.value)}
							placeholder="Numero de telephone"
							required
							type="tel"
							value={telephone}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="client-email">Email</Label>
						<Input
							disabled={isPending}
							id="client-email"
							onChange={(e) => setEmail(e.target.value)}
							placeholder="email@exemple.com"
							type="email"
							value={email}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="client-notes">Notes</Label>
						<Input
							disabled={isPending}
							id="client-notes"
							onChange={(e) => setNotes(e.target.value)}
							placeholder="Preferences, remarques..."
							value={notes}
						/>
					</div>
					<DialogFooter>
						<Button
							disabled={isPending}
							onClick={() => onOpenChange(false)}
							type="button"
							variant="outline"
						>
							Annuler
						</Button>
						<Button disabled={!isFormValid || isPending} type="submit">
							{isPending ? (
								<>
									<Loader2 className="animate-spin" />
									{isEdit ? "Modification..." : "Creation..."}
								</>
							) : isEdit ? (
								"Enregistrer"
							) : (
								"Creer"
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
