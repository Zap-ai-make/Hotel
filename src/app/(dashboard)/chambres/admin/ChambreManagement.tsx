"use client";

import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "~/components/ui/badge";
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
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "~/components/ui/table";
import { ROOM_STATUS_COLORS, TYPE_CHAMBRE_LABELS } from "~/lib/constants";
import { formatMoney } from "~/lib/utils";
import { api } from "~/trpc/react";

const STATUT_LABELS: Record<string, string> = {
	LIBRE: "Libre",
	OCCUPE: "Occupee",
};

interface ChambreFormData {
	numero: string;
	type: "SIMPLE" | "DOUBLE" | "SUITE";
	tarif: string;
	caracteristiques: string;
}

const defaultForm: ChambreFormData = {
	numero: "",
	type: "SIMPLE",
	tarif: "",
	caracteristiques: "",
};

export function ChambreManagement() {
	const utils = api.useUtils();
	const { data: chambres, isLoading } = api.chambre.list.useQuery();

	const [createOpen, setCreateOpen] = useState(false);
	const [editChambre, setEditChambre] = useState<{
		id: string;
		numero: string;
		type: string;
		tarif: unknown;
		caracteristiques: string[];
	} | null>(null);
	const [deleteConfirm, setDeleteConfirm] = useState<{
		id: string;
		numero: string;
	} | null>(null);
	const [form, setForm] = useState<ChambreFormData>(defaultForm);

	const createMutation = api.chambre.create.useMutation({
		onSuccess: (created) => {
			void utils.chambre.list.invalidate();
			toast.success(`Chambre ${created.numero} creee`);
			setCreateOpen(false);
			setForm(defaultForm);
		},
		onError: (err) => toast.error(err.message),
	});

	const updateMutation = api.chambre.update.useMutation({
		onSuccess: (updated) => {
			void utils.chambre.list.invalidate();
			void utils.chambre.getById.invalidate({ id: updated.id });
			toast.success(`Chambre ${updated.numero} modifiee`);
			setEditChambre(null);
		},
		onError: (err) => toast.error(err.message),
	});

	const deleteMutation = api.chambre.delete.useMutation({
		onSuccess: () => {
			void utils.chambre.list.invalidate();
			toast.success("Chambre supprimee");
			setDeleteConfirm(null);
		},
		onError: (err) => toast.error(err.message),
	});

	function parseCaracteristiques(str: string): string[] {
		return str
			.split(",")
			.map((s) => s.trim())
			.filter(Boolean);
	}

	function handleCreate() {
		createMutation.mutate({
			numero: form.numero,
			type: form.type,
			tarif: Number(form.tarif),
			caracteristiques: parseCaracteristiques(form.caracteristiques),
		});
	}

	function handleUpdate() {
		if (!editChambre) return;
		updateMutation.mutate({
			id: editChambre.id,
			numero: form.numero,
			type: form.type,
			tarif: Number(form.tarif),
			caracteristiques: parseCaracteristiques(form.caracteristiques),
		});
	}

	function openEdit(chambre: NonNullable<typeof editChambre>) {
		setEditChambre(chambre);
		setForm({
			numero: chambre.numero,
			type: chambre.type as ChambreFormData["type"],
			tarif: String(Number(chambre.tarif)),
			caracteristiques: chambre.caracteristiques.join(", "),
		});
	}

	if (isLoading) {
		return <p className="text-muted-foreground">Chargement...</p>;
	}

	return (
		<div className="space-y-4">
			<div className="flex justify-end">
				<Button
					onClick={() => {
						setForm(defaultForm);
						setCreateOpen(true);
					}}
				>
					<Plus className="mr-2 h-4 w-4" />
					Nouvelle Chambre
				</Button>
			</div>

			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Numero</TableHead>
							<TableHead>Type</TableHead>
							<TableHead>Tarif / nuit</TableHead>
							<TableHead>Statut</TableHead>
							<TableHead>Caracteristiques</TableHead>
							<TableHead className="text-right">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{chambres?.map((chambre) => (
							<TableRow key={chambre.id}>
								<TableCell className="font-medium">{chambre.numero}</TableCell>
								<TableCell>
									{TYPE_CHAMBRE_LABELS[chambre.type] ?? chambre.type}
								</TableCell>
								<TableCell>{formatMoney(Number(chambre.tarif))}</TableCell>
								<TableCell>
									<Badge
										className={ROOM_STATUS_COLORS[chambre.statut]}
										variant="outline"
									>
										{STATUT_LABELS[chambre.statut] ?? chambre.statut}
									</Badge>
								</TableCell>
								<TableCell className="max-w-48 truncate text-muted-foreground text-sm">
									{chambre.caracteristiques.join(", ")}
								</TableCell>
								<TableCell className="text-right">
									<div className="flex justify-end gap-1">
										<Button
											onClick={() => openEdit(chambre)}
											size="sm"
											variant="ghost"
										>
											<Pencil className="h-4 w-4" />
										</Button>
										<Button
											onClick={() =>
												setDeleteConfirm({
													id: chambre.id,
													numero: chambre.numero,
												})
											}
											size="sm"
											variant="ghost"
										>
											<Trash2 className="h-4 w-4 text-destructive" />
										</Button>
									</div>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>

			{/* Dialog Creer */}
			<Dialog onOpenChange={setCreateOpen} open={createOpen}>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Nouvelle Chambre</DialogTitle>
					</DialogHeader>
					<div className="space-y-4 py-2">
						<div className="space-y-2">
							<Label htmlFor="numero">Numero</Label>
							<Input
								id="numero"
								onChange={(e) => setForm({ ...form, numero: e.target.value })}
								placeholder="ex: 105"
								value={form.numero}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="type">Type</Label>
							<Select
								onValueChange={(v) =>
									setForm({
										...form,
										type: v as ChambreFormData["type"],
									})
								}
								value={form.type}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="SIMPLE">Simple</SelectItem>
									<SelectItem value="DOUBLE">Double</SelectItem>
									<SelectItem value="SUITE">Suite</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label htmlFor="tarif">Tarif / nuit (FCFA)</Label>
							<Input
								id="tarif"
								onChange={(e) => setForm({ ...form, tarif: e.target.value })}
								placeholder="ex: 25000"
								type="number"
								value={form.tarif}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="carac">
								Caracteristiques (separees par virgule)
							</Label>
							<Input
								id="carac"
								onChange={(e) =>
									setForm({
										...form,
										caracteristiques: e.target.value,
									})
								}
								placeholder="Climatisation, TV, WiFi"
								value={form.caracteristiques}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button onClick={() => setCreateOpen(false)} variant="outline">
							Annuler
						</Button>
						<Button
							disabled={createMutation.isPending || !form.numero || !form.tarif}
							onClick={handleCreate}
						>
							{createMutation.isPending && (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							)}
							Creer
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Dialog Modifier */}
			<Dialog
				onOpenChange={(open) => !open && setEditChambre(null)}
				open={!!editChambre}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Modifier la Chambre</DialogTitle>
					</DialogHeader>
					<div className="space-y-4 py-2">
						<div className="space-y-2">
							<Label htmlFor="edit-numero">Numero</Label>
							<Input
								id="edit-numero"
								onChange={(e) => setForm({ ...form, numero: e.target.value })}
								value={form.numero}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="edit-type">Type</Label>
							<Select
								onValueChange={(v) =>
									setForm({
										...form,
										type: v as ChambreFormData["type"],
									})
								}
								value={form.type}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="SIMPLE">Simple</SelectItem>
									<SelectItem value="DOUBLE">Double</SelectItem>
									<SelectItem value="SUITE">Suite</SelectItem>
								</SelectContent>
							</Select>
						</div>
						<div className="space-y-2">
							<Label htmlFor="edit-tarif">Tarif / nuit (FCFA)</Label>
							<Input
								id="edit-tarif"
								onChange={(e) => setForm({ ...form, tarif: e.target.value })}
								type="number"
								value={form.tarif}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="edit-carac">
								Caracteristiques (separees par virgule)
							</Label>
							<Input
								id="edit-carac"
								onChange={(e) =>
									setForm({
										...form,
										caracteristiques: e.target.value,
									})
								}
								value={form.caracteristiques}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button onClick={() => setEditChambre(null)} variant="outline">
							Annuler
						</Button>
						<Button
							disabled={updateMutation.isPending || !form.numero || !form.tarif}
							onClick={handleUpdate}
						>
							{updateMutation.isPending && (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							)}
							Enregistrer
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Dialog Supprimer */}
			<Dialog
				onOpenChange={(open) => !open && setDeleteConfirm(null)}
				open={!!deleteConfirm}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Supprimer la chambre</DialogTitle>
					</DialogHeader>
					<p>
						Voulez-vous vraiment supprimer la chambre{" "}
						<strong>{deleteConfirm?.numero}</strong> ? Cette action est
						irreversible.
					</p>
					<DialogFooter>
						<Button onClick={() => setDeleteConfirm(null)} variant="outline">
							Annuler
						</Button>
						<Button
							disabled={deleteMutation.isPending}
							onClick={() =>
								deleteConfirm && deleteMutation.mutate({ id: deleteConfirm.id })
							}
							variant="destructive"
						>
							{deleteMutation.isPending && (
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							)}
							Supprimer
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
