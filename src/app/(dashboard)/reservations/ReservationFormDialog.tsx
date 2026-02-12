"use client";

import { addDays, differenceInDays, format, parseISO } from "date-fns";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { TYPE_CHAMBRE_LABELS } from "~/lib/constants";
import { formatDate, formatMoney } from "~/lib/utils";
import { api } from "~/trpc/react";

function calculerNuits(dateArrivee: string, dateDepart: string): number {
	if (!dateArrivee || !dateDepart) return 0;
	const arrivee = parseISO(dateArrivee);
	const depart = parseISO(dateDepart);
	const diff = differenceInDays(depart, arrivee);
	return diff > 0 ? diff : 0;
}

export interface ChambreInfo {
	id: string;
	numero: string;
	type: string;
	tarif: unknown;
}

interface ReservationFormDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	chambre: ChambreInfo | null;
	dateArrivee: string | null;
	onSuccess: () => void;
}

export function ReservationFormDialog({
	open,
	onOpenChange,
	chambre,
	dateArrivee,
	onSuccess,
}: ReservationFormDialogProps) {
	const [clientNom, setClientNom] = useState("");
	const [clientTelephone, setClientTelephone] = useState("");
	const [dateDepart, setDateDepart] = useState("");
	const [notes, setNotes] = useState("");

	const utils = api.useUtils();

	const createMutation = api.reservation.create.useMutation({
		onSuccess: () => {
			void utils.reservation.getChambresParDate.invalidate();
			void utils.reservation.getDisponibilitesMensuelles.invalidate();
			void utils.reservation.list.invalidate();
			toast.success("Reservation creee avec succes");
			onSuccess();
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	// Reset form when dialog opens
	useEffect(() => {
		if (open) {
			setClientNom("");
			setClientTelephone("");
			setDateDepart("");
			setNotes("");
		}
	}, [open]);

	if (!chambre || !dateArrivee) return null;

	const tarifNumber = Number(chambre.tarif);
	// Convert ISO date to YYYY-MM-DD for input[type="date"]
	const dateArriveeYmd = format(parseISO(dateArrivee), "yyyy-MM-dd");
	const lendemain = format(addDays(parseISO(dateArrivee), 1), "yyyy-MM-dd");

	const nuits = calculerNuits(dateArriveeYmd, dateDepart);
	const prixTotal = nuits > 0 ? nuits * tarifNumber : 0;

	const isFormValid =
		clientNom.length > 0 &&
		clientTelephone.length > 0 &&
		dateDepart.length > 0 &&
		nuits > 0;

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!isFormValid || !chambre) return;
		createMutation.mutate({
			clientNom,
			clientTelephone,
			chambreId: chambre.id,
			dateArrivee: dateArriveeYmd,
			dateDepart,
			notes: notes.trim() || undefined,
		});
	}

	const isPending = createMutation.isPending;

	return (
		<Dialog
			open={open}
			onOpenChange={(v) => {
				if (!v && isPending) return;
				onOpenChange(v);
			}}
		>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Nouvelle reservation</DialogTitle>
				</DialogHeader>
				<form onSubmit={handleSubmit} className="space-y-4">
					{/* Infos chambre (lecture seule) */}
					<div className="rounded-md border bg-muted/50 p-3">
						<p className="font-medium text-sm">
							Chambre {chambre.numero} —{" "}
							{TYPE_CHAMBRE_LABELS[chambre.type] ?? chambre.type}
						</p>
						<p className="text-muted-foreground text-sm">
							{formatMoney(tarifNumber)} / nuit
						</p>
						<p className="text-muted-foreground text-sm">
							Arrivee : {formatDate(new Date(dateArrivee))}
						</p>
					</div>

					{/* Nom client */}
					<div className="space-y-2">
						<Label htmlFor="resa-client-nom">Nom du client *</Label>
						<Input
							id="resa-client-nom"
							value={clientNom}
							onChange={(e) => setClientNom(e.target.value)}
							placeholder="Nom complet"
							disabled={isPending}
							required
						/>
					</div>

					{/* Telephone */}
					<div className="space-y-2">
						<Label htmlFor="resa-client-tel">Telephone *</Label>
						<Input
							id="resa-client-tel"
							type="tel"
							value={clientTelephone}
							onChange={(e) => setClientTelephone(e.target.value)}
							placeholder="Numero de telephone"
							disabled={isPending}
							required
						/>
					</div>

					{/* Date depart */}
					<div className="space-y-2">
						<Label htmlFor="resa-date-depart">Date de depart *</Label>
						<Input
							id="resa-date-depart"
							type="date"
							value={dateDepart}
							onChange={(e) => setDateDepart(e.target.value)}
							min={lendemain}
							disabled={isPending}
							required
						/>
					</div>

					{/* Calcul prix */}
					{nuits > 0 && (
						<div className="rounded-md border border-blue-200 bg-blue-50 p-3">
							<div className="flex items-center justify-between">
								<span className="text-sm">
									{nuits} nuit{nuits > 1 ? "s" : ""} x{" "}
									{formatMoney(tarifNumber)}
								</span>
								<span className="font-semibold">
									{formatMoney(prixTotal)}
								</span>
							</div>
						</div>
					)}

					{/* Notes */}
					<div className="space-y-2">
						<Label htmlFor="resa-notes">Notes (optionnel)</Label>
						<Input
							id="resa-notes"
							value={notes}
							onChange={(e) => setNotes(e.target.value)}
							placeholder="Notes supplementaires"
							disabled={isPending}
						/>
					</div>

					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => onOpenChange(false)}
							disabled={isPending}
						>
							Annuler
						</Button>
						<Button type="submit" disabled={!isFormValid || isPending}>
							{isPending ? (
								<>
									<Loader2 className="animate-spin" />
									Creation...
								</>
							) : (
								"Reserver"
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
