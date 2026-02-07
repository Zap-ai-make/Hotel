import bcrypt from "bcrypt";
import { PrismaClient } from "../generated/prisma";

const prisma = new PrismaClient();

async function main() {
	const hashedPassword = await bcrypt.hash("admin123", 12);

	const admin = await prisma.user.upsert({
		where: { email: "admin@hotel.com" },
		update: {},
		create: {
			email: "admin@hotel.com",
			nom: "Administrateur",
			password: hashedPassword,
			role: "ADMIN",
		},
	});

	console.log(`Seed termine: ${admin.email} cree (role: ${admin.role})`);
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
