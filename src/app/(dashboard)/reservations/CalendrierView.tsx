"use client";

import { useState } from "react";
import { CalendrierGrid } from "./CalendrierGrid";
import { ChambresDisponibles } from "./ChambresDisponibles";

export function CalendrierView() {
	const now = new Date();
	const [mois, setMois] = useState(now.getMonth() + 1); // 1-12
	const [annee, setAnnee] = useState(now.getFullYear());
	const [dateSelectionnee, setDateSelectionnee] = useState<string | null>(null);

	function naviguerMois(direction: -1 | 1) {
		let nouveauMois = mois + direction;
		let nouvelleAnnee = annee;
		if (nouveauMois < 1) {
			nouveauMois = 12;
			nouvelleAnnee -= 1;
		} else if (nouveauMois > 12) {
			nouveauMois = 1;
			nouvelleAnnee += 1;
		}
		setMois(nouveauMois);
		setAnnee(nouvelleAnnee);
		setDateSelectionnee(null);
	}

	return (
		<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
			<div className="lg:col-span-2">
				<CalendrierGrid
					mois={mois}
					annee={annee}
					dateSelectionnee={dateSelectionnee}
					onNaviguer={naviguerMois}
					onDateClick={setDateSelectionnee}
				/>
			</div>
			<div>
				<ChambresDisponibles date={dateSelectionnee} />
			</div>
		</div>
	);
}
