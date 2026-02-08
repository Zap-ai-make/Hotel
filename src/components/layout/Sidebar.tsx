"use client";

import {
	BedDouble,
	CalendarDays,
	CreditCard,
	LayoutDashboard,
	LogOut,
	Users,
} from "lucide-react";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "~/lib/utils";
import { Button } from "~/components/ui/button";

const navItems = [
	{ href: "/", label: "Dashboard", icon: LayoutDashboard },
	{ href: "/reservations", label: "Reservations", icon: CalendarDays },
	{ href: "/chambres", label: "Chambres", icon: BedDouble },
	{ href: "/clients", label: "Clients", icon: Users },
	{ href: "/paiements", label: "Paiements", icon: CreditCard },
];

interface SidebarProps {
	userName: string;
	userRole: string;
}

export function Sidebar({ userName, userRole }: SidebarProps) {
	const pathname = usePathname();

	return (
		<aside className="fixed left-0 top-0 z-40 flex h-screen w-60 flex-col border-r bg-card">
			<div className="flex h-16 items-center border-b px-6">
				<h1 className="font-bold text-lg">Hotel Management</h1>
			</div>

			<nav className="flex-1 space-y-1 px-3 py-4">
				{navItems.map((item) => {
					const isActive =
						item.href === "/"
							? pathname === "/"
							: pathname.startsWith(item.href);
					return (
						<Link
							key={item.href}
							href={item.href}
							className={cn(
								"flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
								isActive
									? "bg-primary/10 text-primary"
									: "text-muted-foreground hover:bg-muted hover:text-foreground",
							)}
						>
							<item.icon className="size-5" />
							{item.label}
						</Link>
					);
				})}
			</nav>

			<div className="border-t p-4">
				<div className="mb-3 px-1">
					<p className="truncate font-medium text-sm">{userName}</p>
					<p className="text-muted-foreground text-xs">{userRole}</p>
				</div>
				<Button
					variant="ghost"
					className="w-full justify-start gap-3 text-muted-foreground"
					onClick={() => signOut({ callbackUrl: "/login" })}
				>
					<LogOut className="size-4" />
					Deconnexion
				</Button>
			</div>
		</aside>
	);
}
