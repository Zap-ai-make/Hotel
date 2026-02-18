import { ChambreDetail } from "./ChambreDetail";

export default async function ChambreDetailPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;

	return <ChambreDetail id={id} />;
}
