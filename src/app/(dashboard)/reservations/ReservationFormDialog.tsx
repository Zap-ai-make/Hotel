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

	const tarifNumber = chambre ? Number(chambre.tarif) : 0;
	// Convert ISO date to YYYY-MM-DD for input[type="date"]
	const dateArriveeYmd = dateArrivee
		? format(parseISO(dateArrivee), "yyyy-MM-dd")
		: "";
	const lendemain = dateArrivee
		? format(addDays(parseISO(dateArrivee), 1), "yyyy-MM-dd")
		: "";

	const nuits = calculerNuits(dateArriveeYmd, dateDepart);
	const prixTotal = nuits > 0 ? nuits * tarifNumber : 0;

	// Verification de conflits en temps reel (hook AVANT le early return)
	const { data: conflits } = api.reservation.checkConflits.useQuery(
		{
			chambreId: chambre?.id ?? "",
			dateArrivee: dateArriveeYmd,
			dateDepart,
		},
		{
			enabled: !!chambre && !!dateArrivee && !!dateDepart && nuits > 0,
		},
	);

	const hasConflits = (conflits?.length ?? 0) > 0;

	if (!chambre || !dateArrivee) return null;

	const isFormValid =
		clientNom.length > 0 &&
		clientTelephone.length > 0 &&
		dateDepart.length > 0 &&
		nuits > 0 &&
		!hasConflits;

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
			onOpenChange={(v) => {
				if (!v && isPending) return;
				onOpenChange(v);
			}}
			open={open}
		>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Nouvelle reservation</DialogTitle>
				</DialogHeader>
				<form className="space-y-4" onSubmit={handleSubmit}>
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
							disabled={isPending}
							id="resa-client-nom"
							onChange={(e) => setClientNom(e.target.value)}
							placeholder="Nom complet"
							required
							value={clientNom}
						/>
					</div>

					{/* Telephone */}
					<div className="space-y-2">
						<Label htmlFor="resa-client-tel">Telephone *</Label>
						<Input
							disabled={isPending}
							id="resa-client-tel"
							onChange={(e) => setClientTelephone(e.target.value)}
							placeholder="Numero de telephone"
							required
							type="tel"
							value={clientTelephone}
						/>
					</div>

					{/* Date depart */}
					<div className="space-y-2">
						<Label htmlFor="resa-date-depart">Date de depart *</Label>
						<Input
							disabled={isPending}
							id="resa-date-depart"
							min={lendemain}
							onChange={(e) => setDateDepart(e.target.value)}
							required
							type="date"
							value={dateDepart}
						/>
					</div>

					{/* Alerte conflit */}
					{hasConflits && conflits && (
						<div className="rounded-md border border-orange-300 bg-orange-50 p-3">
							<p className="font-medium text-orange-800 text-sm">
								Conflit de reservation detecte
							</p>
							{conflits.map((c) => (
								<p className="text-orange-700 text-sm" key={c.id}>
									Chambre {chambre.numero} deja reservee du{" "}
									{formatDate(new Date(c.dateArrivee))} au{" "}
									{formatDate(new Date(c.dateDepart))} par {c.clientNom}
								</p>
							))}
						</div>
					)}

					{/* Calcul prix */}
					{nuits > 0 && !hasConflits && (
						<div className="rounded-md border border-blue-200 bg-blue-50 p-3">
							<div className="flex items-center justify-between">
								<span className="text-sm">
									{nuits} nuit{nuits > 1 ? "s" : ""} x{" "}
									{formatMoney(tarifNumber)}
								</span>
								<span className="font-semibold">{formatMoney(prixTotal)}</span>
							</div>
						</div>
					)}

					{/* Notes */}
					<div className="space-y-2">
						<Label htmlFor="resa-notes">Notes (optionnel)</Label>
						<Input
							disabled={isPending}
							id="resa-notes"
							onChange={(e) => setNotes(e.target.value)}
							placeholder="Notes supplementaires"
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
