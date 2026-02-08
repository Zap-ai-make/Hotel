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

	console.log(`Seed: ${admin.email} cree (role: ${admin.role})`);

	// Chambres de l'hotel
	const chambres = [
		{ numero: "101", type: "SIMPLE" as const, tarif: 25000, caracteristiques: ["Climatisation", "TV", "WiFi"] },
		{ numero: "102", type: "SIMPLE" as const, tarif: 25000, caracteristiques: ["Climatisation", "TV", "WiFi"] },
		{ numero: "103", type: "SIMPLE" as const, tarif: 28000, caracteristiques: ["Climatisation", "TV", "WiFi", "Coffre-fort"] },
		{ numero: "104", type: "SIMPLE" as const, tarif: 28000, caracteristiques: ["Climatisation", "TV", "WiFi", "Vue jardin"] },
		{ numero: "201", type: "DOUBLE" as const, tarif: 40000, caracteristiques: ["Climatisation", "TV", "WiFi", "Minibar"] },
		{ numero: "202", type: "DOUBLE" as const, tarif: 40000, caracteristiques: ["Climatisation", "TV", "WiFi", "Minibar"] },
		{ numero: "203", type: "DOUBLE" as const, tarif: 45000, caracteristiques: ["Climatisation", "TV", "WiFi", "Minibar", "Balcon"] },
		{ numero: "204", type: "DOUBLE" as const, tarif: 45000, caracteristiques: ["Climatisation", "TV", "WiFi", "Minibar", "Vue ville"] },
		{ numero: "301", type: "SUITE" as const, tarif: 65000, caracteristiques: ["Climatisation", "TV", "WiFi", "Minibar", "Balcon", "Coffre-fort"] },
		{ numero: "302", type: "SUITE" as const, tarif: 65000, caracteristiques: ["Climatisation", "TV", "WiFi", "Minibar", "Balcon", "Vue ville"] },
		{ numero: "303", type: "SUITE" as const, tarif: 75000, caracteristiques: ["Climatisation", "TV", "WiFi", "Minibar", "Balcon", "Coffre-fort", "Vue jardin"] },
		{ numero: "304", type: "SUITE" as const, tarif: 75000, caracteristiques: ["Climatisation", "TV", "WiFi", "Minibar", "Balcon", "Coffre-fort", "Vue ville", "Baignoire"] },
	];

	for (const chambre of chambres) {
		await prisma.chambre.upsert({
			where: { numero: chambre.numero },
			update: {},
			create: {
				numero: chambre.numero,
				type: chambre.type,
				tarif: chambre.tarif,
				statut: "LIBRE",
				caracteristiques: chambre.caracteristiques,
			},
		});
	}

	console.log(`Seed: ${chambres.length} chambres creees`);
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
