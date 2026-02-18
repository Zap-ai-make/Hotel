"use client";

import { Loader2, Plus, UserCog } from "lucide-react";
import { useEffect, useState } from "react";
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
import { api } from "~/trpc/react";

const roleLabels: Record<string, string> = {
	RECEPTIONNISTE: "Receptionniste",
	MANAGER: "Manager",
	ADMIN: "Administrateur",
};

interface UserManagementProps {
	currentUserId: string;
}

export function UserManagement({ currentUserId }: UserManagementProps) {
	const utils = api.useUtils();
	const { data: users, isLoading } = api.user.list.useQuery();

	const [createOpen, setCreateOpen] = useState(false);
	const [editRoleUser, setEditRoleUser] = useState<{
		id: string;
		nom: string;
		role: string;
	} | null>(null);

	const createMutation = api.user.create.useMutation({
		onSuccess: () => {
			void utils.user.list.invalidate();
			setCreateOpen(false);
			toast.success("Utilisateur cree avec succes");
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	const updateRoleMutation = api.user.updateRole.useMutation({
		onSuccess: () => {
			void utils.user.list.invalidate();
			setEditRoleUser(null);
			toast.success("Role modifie avec succes");
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	const toggleActiveMutation = api.user.toggleActive.useMutation({
		onSuccess: (data) => {
			void utils.user.list.invalidate();
			toast.success(
				data.active ? "Utilisateur reactive" : "Utilisateur desactive",
			);
		},
		onError: (error) => {
			toast.error(error.message);
		},
	});

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-12">
				<Loader2 className="size-6 animate-spin text-muted-foreground" />
			</div>
		);
	}

	return (
		<>
			<div className="mb-4 flex justify-end">
				<Button onClick={() => setCreateOpen(true)}>
					<Plus className="size-4" />
					Nouvel utilisateur
				</Button>
			</div>

			<div className="rounded-md border">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Nom</TableHead>
							<TableHead>Email</TableHead>
							<TableHead>Role</TableHead>
							<TableHead>Statut</TableHead>
							<TableHead>Date de creation</TableHead>
							<TableHead className="text-right">Actions</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{users?.map((user) => (
							<TableRow key={user.id}>
								<TableCell className="font-medium">{user.nom}</TableCell>
								<TableCell>{user.email}</TableCell>
								<TableCell>
									<Badge variant="secondary">
										{roleLabels[user.role] ?? user.role}
									</Badge>
								</TableCell>
								<TableCell>
									<Badge variant={user.active ? "default" : "destructive"}>
										{user.active ? "Actif" : "Inactif"}
									</Badge>
								</TableCell>
								<TableCell>
									{new Date(user.createdAt).toLocaleDateString("fr-FR")}
								</TableCell>
								<TableCell className="text-right">
									<div className="flex justify-end gap-2">
										<Button
											onClick={() =>
												setEditRoleUser({
													id: user.id,
													nom: user.nom,
													role: user.role,
												})
											}
											size="sm"
											variant="ghost"
										>
											<UserCog className="size-4" />
											Role
										</Button>
										{user.id !== currentUserId && (
											<Button
												disabled={toggleActiveMutation.isPending}
												onClick={() =>
													toggleActiveMutation.mutate({ id: user.id })
												}
												size="sm"
												variant="ghost"
											>
												{user.active ? "Desactiver" : "Reactiver"}
											</Button>
										)}
									</div>
								</TableCell>
							</TableRow>
						))}
						{users?.length === 0 && (
							<TableRow>
								<TableCell
									className="text-center text-muted-foreground"
									colSpan={6}
								>
									Aucun utilisateur
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			<CreateUserDialog
				isPending={createMutation.isPending}
				onOpenChange={setCreateOpen}
				onSubmit={(data) => createMutation.mutate(data)}
				open={createOpen}
			/>

			<EditRoleDialog
				isPending={updateRoleMutation.isPending}
				onOpenChange={(open) => !open && setEditRoleUser(null)}
				onSubmit={(id, role) => updateRoleMutation.mutate({ id, role })}
				user={editRoleUser}
			/>
		</>
	);
}

function CreateUserDialog({
	open,
	onOpenChange,
	onSubmit,
	isPending,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSubmit: (data: {
		nom: string;
		email: string;
		password: string;
		role: "RECEPTIONNISTE" | "MANAGER" | "ADMIN";
	}) => void;
	isPending: boolean;
}) {
	const [nom, setNom] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [role, setRole] = useState<"RECEPTIONNISTE" | "MANAGER" | "ADMIN">(
		"RECEPTIONNISTE",
	);

	const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
	const isFormValid = nom.length > 0 && isEmailValid && password.length >= 8;

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!isFormValid) return;
		onSubmit({ nom, email, password, role });
		setNom("");
		setEmail("");
		setPassword("");
		setRole("RECEPTIONNISTE");
	}

	return (
		<Dialog onOpenChange={onOpenChange} open={open}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Nouvel utilisateur</DialogTitle>
				</DialogHeader>
				<form className="space-y-4" onSubmit={handleSubmit}>
					<div className="space-y-2">
						<Label htmlFor="create-nom">Nom *</Label>
						<Input
							disabled={isPending}
							id="create-nom"
							onChange={(e) => setNom(e.target.value)}
							placeholder="Nom complet"
							required
							value={nom}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="create-email">Email *</Label>
						<Input
							disabled={isPending}
							id="create-email"
							onChange={(e) => setEmail(e.target.value)}
							placeholder="email@exemple.com"
							required
							type="email"
							value={email}
						/>
						{email.length > 0 && !isEmailValid && (
							<p className="text-destructive text-sm">Format email invalide</p>
						)}
					</div>
					<div className="space-y-2">
						<Label htmlFor="create-password">Mot de passe *</Label>
						<Input
							disabled={isPending}
							id="create-password"
							onChange={(e) => setPassword(e.target.value)}
							placeholder="Minimum 8 caracteres"
							required
							type="password"
							value={password}
						/>
						{password.length > 0 && password.length < 8 && (
							<p className="text-destructive text-sm">
								Minimum 8 caracteres requis
							</p>
						)}
					</div>
					<div className="space-y-2">
						<Label htmlFor="create-role">Role *</Label>
						<Select
							disabled={isPending}
							onValueChange={(v) =>
								setRole(v as "RECEPTIONNISTE" | "MANAGER" | "ADMIN")
							}
							value={role}
						>
							<SelectTrigger className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="RECEPTIONNISTE">Receptionniste</SelectItem>
								<SelectItem value="MANAGER">Manager</SelectItem>
								<SelectItem value="ADMIN">Administrateur</SelectItem>
							</SelectContent>
						</Select>
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
								"Creer"
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}

function EditRoleDialog({
	user,
	onOpenChange,
	onSubmit,
	isPending,
}: {
	user: { id: string; nom: string; role: string } | null;
	onOpenChange: (open: boolean) => void;
	onSubmit: (id: string, role: "RECEPTIONNISTE" | "MANAGER" | "ADMIN") => void;
	isPending: boolean;
}) {
	const [role, setRole] = useState<"RECEPTIONNISTE" | "MANAGER" | "ADMIN">(
		(user?.role as "RECEPTIONNISTE" | "MANAGER" | "ADMIN") ?? "RECEPTIONNISTE",
	);

	// Sync role when user changes
	const currentUserId = user?.id;
	const currentUserRole = user?.role;
	useEffect(() => {
		if (currentUserRole) {
			setRole(currentUserRole as "RECEPTIONNISTE" | "MANAGER" | "ADMIN");
		}
	}, [currentUserRole]);

	return (
		<Dialog onOpenChange={onOpenChange} open={!!user}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Modifier le role de {user?.nom}</DialogTitle>
				</DialogHeader>
				<div className="space-y-4 py-2">
					<div className="space-y-2">
						<Label htmlFor="edit-role">Nouveau role</Label>
						<Select
							disabled={isPending}
							onValueChange={(v) =>
								setRole(v as "RECEPTIONNISTE" | "MANAGER" | "ADMIN")
							}
							value={role}
						>
							<SelectTrigger className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="RECEPTIONNISTE">Receptionniste</SelectItem>
								<SelectItem value="MANAGER">Manager</SelectItem>
								<SelectItem value="ADMIN">Administrateur</SelectItem>
							</SelectContent>
						</Select>
					</div>
				</div>
				<DialogFooter>
					<Button
						disabled={isPending}
						onClick={() => onOpenChange(false)}
						variant="outline"
					>
						Annuler
					</Button>
					<Button
						disabled={isPending || role === currentUserRole}
						onClick={() => currentUserId && onSubmit(currentUserId, role)}
					>
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
			</DialogContent>
		</Dialog>
	);
}
