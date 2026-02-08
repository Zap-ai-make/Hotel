"use client";

import { Loader2 } from "lucide-react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";

export function LoginForm() {
	const router = useRouter();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [isLoading, setIsLoading] = useState(false);

	const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
	const isFormValid = isEmailValid && password.length > 0;

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!isFormValid) return;

		setIsLoading(true);
		setError("");

		const result = await signIn("credentials", {
			email,
			password,
			redirect: false,
		});

		if (result?.error) {
			setError("Email ou mot de passe incorrect");
			setIsLoading(false);
		} else {
			router.push("/");
			router.refresh();
		}
	}

	return (
		<Card>
			<form onSubmit={handleSubmit}>
				<CardHeader>
					<h2 className="font-semibold text-xl">Se connecter</h2>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="email">Email *</Label>
						<Input
							id="email"
							type="email"
							placeholder="votre@email.com"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							disabled={isLoading}
							autoComplete="email"
							required
						/>
						{email.length > 0 && !isEmailValid && (
							<p className="text-destructive text-sm">
								Format email invalide
							</p>
						)}
					</div>
					<div className="space-y-2">
						<Label htmlFor="password">Mot de passe *</Label>
						<Input
							id="password"
							type="password"
							placeholder="Votre mot de passe"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							disabled={isLoading}
							autoComplete="current-password"
							required
						/>
					</div>
					{error && (
						<p className="text-center text-destructive text-sm">{error}</p>
					)}
				</CardContent>
				<CardFooter>
					<Button
						type="submit"
						className="h-12 w-full"
						disabled={!isFormValid || isLoading}
					>
						{isLoading ? (
							<>
								<Loader2 className="animate-spin" />
								Connexion en cours...
							</>
						) : (
							"Se connecter"
						)}
					</Button>
				</CardFooter>
			</form>
		</Card>
	);
}
