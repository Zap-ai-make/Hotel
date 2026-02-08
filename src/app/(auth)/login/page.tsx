import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
	const session = await auth();

	if (session) {
		redirect("/");
	}

	return (
		<div className="w-full max-w-md px-4">
			<div className="mb-8 text-center">
				<h1 className="font-bold text-3xl tracking-tight">
					Hotel Management
				</h1>
				<p className="mt-2 text-muted-foreground">
					Connectez-vous pour acceder au systeme
				</p>
			</div>
			<LoginForm />
		</div>
	);
}
