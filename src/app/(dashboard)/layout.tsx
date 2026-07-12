import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { 
  LayoutDashboard, 
  Truck, 
  Users, 
  Map, 
  Wrench, 
  Receipt, 
  LineChart, 
  Settings,
  LogOut,
  Menu
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Fleet", href: "/fleet", icon: Truck },
  { name: "Drivers", href: "/drivers", icon: Users },
  { name: "Trips", href: "/trips", icon: Map },
  { name: "Maintenance", href: "/maintenance", icon: Wrench },
  { name: "Expenses", href: "/expenses", icon: Receipt },
  { name: "Analytics", href: "/analytics", icon: LineChart },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-64 flex-col border-r bg-white dark:bg-zinc-900 md:flex">
        <div className="flex h-16 shrink-0 items-center border-b px-6">
          <div className="flex items-center gap-2 font-bold text-xl">
            <span className="text-primary">▣</span>
            TransitOps
          </div>
        </div>
        
        <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
              >
                <Icon className="h-5 w-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>
        
        <div className="border-t p-4">
          <div className="flex items-center gap-3 rounded-lg px-3 py-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary font-bold uppercase">
              {session.user.name?.charAt(0) || "U"}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium">{session.user.name}</span>
              {/* @ts-ignore */}
              <span className="text-xs text-zinc-500">{session.user.role || "Admin"}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:pl-64">
        {/* Mobile Header */}
        <header className="flex h-16 shrink-0 items-center justify-between border-b bg-white px-4 dark:bg-zinc-900 md:hidden">
          <div className="flex items-center gap-2 font-bold">
            <span className="text-primary">▣</span>
            TransitOps
          </div>
          <Button variant="ghost" size="icon">
            <Menu className="h-5 w-5" />
          </Button>
        </header>

        <div className="p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
