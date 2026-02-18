"use client";

import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "~/components/ui/dialog";
import { TYPE_CHAMBRE_LABELS } from "~/lib/constants";
import { formatDate, formatMoney } from "~/lib/utils";
import { api } from "~/trpc/react";

interface ReservationCancelDialogProps {
	reservationId: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function ReservationCancelDialog({
	reservationId,
	open,
	onOpenChange,
}: ReservationCancelDialogProps) {
	const utils = api.useUtils();

	const { data: reservation, isLoading } = api.reservation.getById.useQuery(
		{ id: reservationId },
		{ enabled: open },
	);

	const cancelMutation = api.reservation.cancel.useMutation({
		onSuccess: () => {
			void utils.reservation.search.invalidate();
			void utils.reservation.list.invalidate();
			void utils.reservation.getById.invalidate();
			void utils.reservation.getChambresParDate.invalidate();
			void utils.reservation.getDisponibilitesMensuelles.invalidate();
			toast.success("Reservation annulee");
			onOpenChange(false);
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	const isPending = cancelMutation.isPending;

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
					<DialogTitle>Annuler la reservation</DialogTitle>
					<DialogDescription>
						Cette action est irreversible. La chambre sera liberee.
					</DialogDescription>
				</DialogHeader>

				{isLoading || !reservation ? (
					<div className="flex items-center justify-center py-4">
						<Loader2 className="size-6 animate-spin text-muted-foreground" />
					</div>
				) : (
					<div className="space-y-1 rounded-md border bg-muted/50 p-3">
						<p className="font-medium text-sm">
							{reservation.clientNom} — {reservation.clientTelephone}
						</p>
						<p className="text-muted-foreground text-sm">
							Chambre {reservation.chambre.numero} (
							{TYPE_CHAMBRE_LABELS[reservation.chambre.type] ??
								reservation.chambre.type}
							)
						</p>
						<p className="text-muted-foreground text-sm">
							Du {formatDate(reservation.dateArrivee)} au{" "}
							{formatDate(reservation.dateDepart)}
						</p>
						<p className="font-medium text-sm">
							{formatMoney(Number(reservation.prixTotal))}
						</p>
					</div>
				)}

				<DialogFooter>
					<Button
						disabled={isPending}
						onClick={() => onOpenChange(false)}
						variant="outline"
					>
						Non, garder
					</Button>
					<Button
						disabled={isPending || isLoading}
						onClick={() => cancelMutation.mutate({ id: reservationId })}
						variant="destructive"
					>
						{isPending ? (
							<>
								<Loader2 className="animate-spin" />
								Annulation...
							</>
						) : (
							"Oui, annuler"
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
