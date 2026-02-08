import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { Sidebar } from "~/components/layout/Sidebar";

const roleLabels: Record<string, string> = {
	RECEPTIONNISTE: "Receptionniste",
	MANAGER: "Manager",
	ADMIN: "Administrateur",
};

export default async function DashboardLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	const session = await auth();

	if (!session?.user) {
		redirect("/login");
	}

	const userName = session.user.name ?? session.user.email ?? "Utilisateur";
	const userRole = roleLabels[session.user.role] ?? session.user.role;

	return (
		<div className="min-h-screen">
			<Sidebar userName={userName} userRole={userRole} />
			<main className="ml-60 min-h-screen p-6">{children}</main>
		</div>
	);
}
