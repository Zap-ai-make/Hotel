"use client";

import { differenceInDays, format, parseISO } from "date-fns";
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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "~/components/ui/select";
import { TYPE_CHAMBRE_LABELS } from "~/lib/constants";
import { formatMoney } from "~/lib/utils";
import { api } from "~/trpc/react";

interface ReservationEditDialogProps {
	reservationId: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function ReservationEditDialog({
	reservationId,
	open,
	onOpenChange,
}: ReservationEditDialogProps) {
	const [clientNom, setClientNom] = useState("");
	const [clientTelephone, setClientTelephone] = useState("");
	const [chambreId, setChambreId] = useState("");
	const [dateArrivee, setDateArrivee] = useState("");
	const [dateDepart, setDateDepart] = useState("");
	const [notes, setNotes] = useState("");
	const [initialized, setInitialized] = useState(false);

	const utils = api.useUtils();

	const { data: reservation, isLoading: isLoadingReservation } =
		api.reservation.getById.useQuery({ id: reservationId }, { enabled: open });

	const { data: chambres } = api.chambre.list.useQuery(undefined, {
		enabled: open,
	});

	// Init form with reservation data
	useEffect(() => {
		if (reservation && !initialized) {
			setClientNom(reservation.clientNom);
			setClientTelephone(reservation.clientTelephone);
			setChambreId(reservation.chambreId);
			setDateArrivee(format(new Date(reservation.dateArrivee), "yyyy-MM-dd"));
			setDateDepart(format(new Date(reservation.dateDepart), "yyyy-MM-dd"));
			setNotes(reservation.notes ?? "");
			setInitialized(true);
		}
	}, [reservation, initialized]);

	// Reset initialized when dialog closes
	useEffect(() => {
		if (!open) setInitialized(false);
	}, [open]);

	const updateMutation = api.reservation.update.useMutation({
		onSuccess: () => {
			void utils.reservation.search.invalidate();
			void utils.reservation.list.invalidate();
			void utils.reservation.getById.invalidate();
			void utils.reservation.getChambresParDate.invalidate();
			void utils.reservation.getDisponibilitesMensuelles.invalidate();
			toast.success("Reservation modifiee avec succes");
			onOpenChange(false);
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	// Calcul nuits et prix
	const selectedChambre = chambres?.find((c) => c.id === chambreId);
	const tarifNumber = selectedChambre ? Number(selectedChambre.tarif) : 0;
	const nuits =
		dateArrivee && dateDepart
			? Math.max(
					0,
					differenceInDays(parseISO(dateDepart), parseISO(dateArrivee)),
				)
			: 0;
	const prixTotal = nuits * tarifNumber;

	// Verification conflits en temps reel
	const { data: conflits } = api.reservation.checkConflits.useQuery(
		{
			chambreId,
			dateArrivee,
			dateDepart,
			excludeReservationId: reservationId,
		},
		{
			enabled: !!chambreId && !!dateArrivee && !!dateDepart && nuits > 0,
		},
	);

	const hasConflits = (conflits?.length ?? 0) > 0;

	const isFormValid =
		clientNom.length > 0 &&
		clientTelephone.length > 0 &&
		chambreId.length > 0 &&
		dateArrivee.length > 0 &&
		dateDepart.length > 0 &&
		nuits > 0 &&
		!hasConflits;

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!isFormValid) return;
		updateMutation.mutate({
			id: reservationId,
			clientNom,
			clientTelephone,
			chambreId,
			dateArrivee,
			dateDepart,
			notes: notes.trim() || undefined,
		});
	}

	const isPending = updateMutation.isPending;

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
					<DialogTitle>Modifier la reservation</DialogTitle>
				</DialogHeader>

				{isLoadingReservation ? (
					<div className="flex items-center justify-center py-8">
						<Loader2 className="size-6 animate-spin text-muted-foreground" />
					</div>
				) : (
					<form className="space-y-4" onSubmit={handleSubmit}>
						{/* Nom client */}
						<div className="space-y-2">
							<Label htmlFor="edit-client-nom">Nom du client *</Label>
							<Input
								disabled={isPending}
								id="edit-client-nom"
								onChange={(e) => setClientNom(e.target.value)}
								placeholder="Nom complet"
								required
								value={clientNom}
							/>
						</div>

						{/* Telephone */}
						<div className="space-y-2">
							<Label htmlFor="edit-client-tel">Telephone *</Label>
							<Input
								disabled={isPending}
								id="edit-client-tel"
								onChange={(e) => setClientTelephone(e.target.value)}
								placeholder="Numero de telephone"
								required
								type="tel"
								value={clientTelephone}
							/>
						</div>

						{/* Chambre */}
						<div className="space-y-2">
							<Label>Chambre *</Label>
							<Select
								disabled={isPending}
								onValueChange={setChambreId}
								value={chambreId}
							>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="Choisir une chambre" />
								</SelectTrigger>
								<SelectContent>
									{chambres?.map((c) => (
										<SelectItem key={c.id} value={c.id}>
											{c.numero} — {TYPE_CHAMBRE_LABELS[c.type] ?? c.type} (
											{formatMoney(Number(c.tarif))}/nuit)
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						{/* Dates */}
						<div className="grid grid-cols-2 gap-3">
							<div className="space-y-2">
								<Label htmlFor="edit-date-arrivee">Date d'arrivee *</Label>
								<Input
									disabled={isPending}
									id="edit-date-arrivee"
									onChange={(e) => setDateArrivee(e.target.value)}
									required
									type="date"
									value={dateArrivee}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="edit-date-depart">Date de depart *</Label>
								<Input
									disabled={isPending}
									id="edit-date-depart"
									onChange={(e) => setDateDepart(e.target.value)}
									required
									type="date"
									value={dateDepart}
								/>
							</div>
						</div>

						{/* Alerte conflit */}
						{hasConflits && conflits && (
							<div className="rounded-md border border-orange-300 bg-orange-50 p-3">
								<p className="font-medium text-orange-800 text-sm">
									Conflit de reservation detecte
								</p>
								{conflits.map((c) => (
									<p className="text-orange-700 text-sm" key={c.id}>
										Chambre deja reservee du{" "}
										{format(new Date(c.dateArrivee), "dd/MM/yyyy")} au{" "}
										{format(new Date(c.dateDepart), "dd/MM/yyyy")} par{" "}
										{c.clientNom}
									</p>
								))}
							</div>
						)}

						{/* Calcul prix */}
						{nuits > 0 && !hasConflits && tarifNumber > 0 && (
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
							<Label htmlFor="edit-notes">Notes (optionnel)</Label>
							<Input
								disabled={isPending}
								id="edit-notes"
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
										Modification...
									</>
								) : (
									"Enregistrer"
								)}
							</Button>
						</DialogFooter>
					</form>
				)}
			</DialogContent>
		</Dialog>
	);
}
