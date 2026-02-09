import { redirect } from "next/navigation";
import { auth } from "~/server/auth";
import { ChambreDetail } from "./ChambreDetail";

export default async function ChambreDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const session = await auth();

	if (!session?.user) {
		redirect("/login");
	}

	const { id } = await params;

	return <ChambreDetail id={id} />;
}
