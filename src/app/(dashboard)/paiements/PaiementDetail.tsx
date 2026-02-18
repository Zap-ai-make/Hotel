"use client";

import { CheckCircle, Loader2, Plus } from "lucide-react";
import { useState } from "react";
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
import { MODE_PAIEMENT_LABELS } from "~/lib/constants";
import { formatDateTime, formatMoney } from "~/lib/utils";
import { api } from "~/trpc/react";

interface PaiementDetailProps {
	reservationId: string;
}

export function PaiementDetail({ reservationId }: PaiementDetailProps) {
	const [dialogOpen, setDialogOpen] = useState(false);

	const { data: solde, isLoading: isLoadingSolde } =
		api.paiement.soldeReservation.useQuery({ reservationId });

	const { data: paiements, isLoading: isLoadingPaiements } =
		api.paiement.listByReservation.useQuery({ reservationId });

	const { data: reservation } = api.reservation.getById.useQuery({
		id: reservationId,
	});

	return (
		<div className="space-y-4">
			{/* Solde */}
			<Card>
				<CardHeader className="pb-3">
					<div className="flex items-center justify-between">
						<CardTitle className="text-base">
							{reservation
								? `${reservation.clientNom} — Ch. ${reservation.chambre.numero}`
								: "Chargement..."}
						</CardTitle>
						{solde && !solde.estSolde && (
							<Button
								className="gap-1"
								onClick={() => setDialogOpen(true)}
								size="sm"
							>
								<Plus className="size-3.5" />
								Enregistrer un paiement
							</Button>
						)}
					</div>
				</CardHeader>
				<CardContent>
					{isLoadingSolde ? (
						<p className="text-muted-foreground text-sm">Chargement...</p>
					) : solde ? (
						<div className="grid grid-cols-3 gap-4">
							<div className="rounded-md border p-3 text-center">
								<p className="text-muted-foreground text-xs">Total</p>
								<p className="font-semibold text-lg">
									{formatMoney(solde.prixTotal)}
								</p>
							</div>
							<div className="rounded-md border p-3 text-center">
								<p className="text-muted-foreground text-xs">Paye</p>
								<p className="font-semibold text-green-600 text-lg">
									{formatMoney(solde.totalPaye)}
								</p>
							</div>
							<div className="rounded-md border p-3 text-center">
								<p className="text-muted-foreground text-xs">Solde</p>
								<p
									className={`font-semibold text-lg ${solde.estSolde ? "text-green-600" : "text-red-600"}`}
								>
									{solde.estSolde ? (
										<span className="flex items-center justify-center gap-1">
											<CheckCircle className="size-4" />
											Solde
										</span>
									) : (
										formatMoney(solde.solde)
									)}
								</p>
							</div>
						</div>
					) : null}
				</CardContent>
			</Card>

			{/* Historique */}
			<Card>
				<CardHeader className="pb-3">
					<CardTitle className="text-base">Historique des paiements</CardTitle>
				</CardHeader>
				<CardContent>
					{isLoadingPaiements ? (
						<p className="py-4 text-center text-muted-foreground text-sm">
							Chargement...
						</p>
					) : !paiements?.length ? (
						<p className="py-4 text-center text-muted-foreground text-sm">
							Aucun paiement enregistre.
						</p>
					) : (
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Date</TableHead>
									<TableHead>Montant</TableHead>
									<TableHead>Mode</TableHead>
									<TableHead>Type</TableHead>
									<TableHead>Reference</TableHead>
									<TableHead>Enregistre par</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{paiements.map((p) => (
									<TableRow key={p.id}>
										<TableCell>{formatDateTime(p.createdAt)}</TableCell>
										<TableCell className="font-medium">
											{formatMoney(Number(p.montant))}
										</TableCell>
										<TableCell>
											{MODE_PAIEMENT_LABELS[p.mode] ?? p.mode}
										</TableCell>
										<TableCell>
											{p.estAcompte ? (
												<Badge
													className="bg-orange-50 text-orange-600"
													variant="outline"
												>
													Acompte
												</Badge>
											) : (
												<Badge
													className="bg-green-50 text-green-600"
													variant="outline"
												>
													Paiement
												</Badge>
											)}
										</TableCell>
										<TableCell className="text-muted-foreground">
											{p.reference ?? "—"}
										</TableCell>
										<TableCell className="text-muted-foreground">
											{p.createdBy.nom}
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					)}
				</CardContent>
			</Card>

			{/* Dialog ajout paiement */}
			{solde && (
				<PaiementFormDialog
					onOpenChange={setDialogOpen}
					open={dialogOpen}
					reservationId={reservationId}
					soldeRestant={solde.solde}
				/>
			)}
		</div>
	);
}

interface PaiementFormDialogProps {
	reservationId: string;
	soldeRestant: number;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

function PaiementFormDialog({
	reservationId,
	soldeRestant,
	open,
	onOpenChange,
}: PaiementFormDialogProps) {
	const [montant, setMontant] = useState("");
	const [mode, setMode] = useState<"ESPECES" | "MOBILE_MONEY">("ESPECES");
	const [estAcompte, setEstAcompte] = useState(false);
	const [reference, setReference] = useState("");

	const utils = api.useUtils();

	const createMutation = api.paiement.create.useMutation({
		onSuccess: () => {
			void utils.paiement.listByReservation.invalidate({ reservationId });
			void utils.paiement.soldeReservation.invalidate({ reservationId });
			toast.success("Paiement enregistre");
			onOpenChange(false);
			resetForm();
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	function resetForm() {
		setMontant("");
		setMode("ESPECES");
		setEstAcompte(false);
		setReference("");
	}

	const montantNum = Number(montant) || 0;
	const isFormValid = montantNum > 0 && montantNum <= soldeRestant + 0.01;
	const isPending = createMutation.isPending;

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!isFormValid) return;
		createMutation.mutate({
			reservationId,
			montant: montantNum,
			mode,
			estAcompte,
			reference: reference.trim() || undefined,
		});
	}

	return (
		<Dialog
			onOpenChange={(v) => {
				if (!v && isPending) return;
				if (!v) resetForm();
				onOpenChange(v);
			}}
			open={open}
		>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Enregistrer un paiement</DialogTitle>
				</DialogHeader>
				<form className="space-y-4" onSubmit={handleSubmit}>
					{/* Solde restant */}
					<div className="rounded-md border border-blue-200 bg-blue-50 p-3">
						<p className="text-sm">
							Solde restant :{" "}
							<span className="font-semibold">{formatMoney(soldeRestant)}</span>
						</p>
					</div>

					{/* Montant */}
					<div className="space-y-2">
						<Label htmlFor="paiement-montant">Montant (FCFA) *</Label>
						<Input
							disabled={isPending}
							id="paiement-montant"
							min="1"
							onChange={(e) => setMontant(e.target.value)}
							placeholder="Montant du paiement"
							required
							type="number"
							value={montant}
						/>
						{montantNum > 0 && (
							<div className="flex gap-2">
								<Button
									className="text-xs"
									disabled={isPending}
									onClick={() => setMontant(String(Math.round(soldeRestant)))}
									size="sm"
									type="button"
									variant="outline"
								>
									Payer le solde ({formatMoney(soldeRestant)})
								</Button>
							</div>
						)}
					</div>

					{/* Mode */}
					<div className="space-y-2">
						<Label>Mode de paiement *</Label>
						<Select
							disabled={isPending}
							onValueChange={(v) => setMode(v as "ESPECES" | "MOBILE_MONEY")}
							value={mode}
						>
							<SelectTrigger className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="ESPECES">Especes</SelectItem>
								<SelectItem value="MOBILE_MONEY">Mobile Money</SelectItem>
							</SelectContent>
						</Select>
					</div>

					{/* Reference (pour Mobile Money) */}
					{mode === "MOBILE_MONEY" && (
						<div className="space-y-2">
							<Label htmlFor="paiement-ref">Reference de transaction</Label>
							<Input
								disabled={isPending}
								id="paiement-ref"
								onChange={(e) => setReference(e.target.value)}
								placeholder="Numero de transaction"
								value={reference}
							/>
						</div>
					)}

					{/* Acompte */}
					<div className="flex items-center gap-2">
						<input
							checked={estAcompte}
							disabled={isPending}
							id="paiement-acompte"
							onChange={(e) => setEstAcompte(e.target.checked)}
							type="checkbox"
						/>
						<Label className="cursor-pointer" htmlFor="paiement-acompte">
							Marquer comme acompte
						</Label>
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
									Enregistrement...
								</>
							) : (
								"Enregistrer"
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
