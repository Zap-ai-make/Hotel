"use client";

import { CalendarDays, List } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils";
import { CalendrierView } from "./CalendrierView";
import { ReservationsList } from "./ReservationsList";

type Tab = "calendrier" | "liste";

export function ReservationsPageClient() {
	const [tab, setTab] = useState<Tab>("calendrier");

	return (
		<div>
			<div className="mb-4 flex w-fit gap-1 rounded-lg border bg-muted/50 p-1">
				<Button
					className={cn(
						"gap-2",
						tab === "calendrier" && "bg-background shadow-sm",
					)}
					onClick={() => setTab("calendrier")}
					size="sm"
					variant="ghost"
				>
					<CalendarDays className="size-4" />
					Calendrier
				</Button>
				<Button
					className={cn("gap-2", tab === "liste" && "bg-background shadow-sm")}
					onClick={() => setTab("liste")}
					size="sm"
					variant="ghost"
				>
					<List className="size-4" />
					Liste
				</Button>
			</div>

			<div className={tab !== "calendrier" ? "hidden" : ""}>
				<CalendrierView />
			</div>
			<div className={tab !== "liste" ? "hidden" : ""}>
				<ReservationsList />
			</div>
		</div>
	);
}
