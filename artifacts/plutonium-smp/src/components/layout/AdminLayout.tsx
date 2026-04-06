import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import {
  LayoutDashboard, Users, ShoppingBag, Ticket, CreditCard,
  Megaphone, Tag, ShieldCheck, Trophy, Settings, Shield,
} from "lucide-react";

const ADMIN_ROLES = ["admin", "owner"] as const;
const MOD_ROLES = ["moderator", "admin", "owner"] as const;

function isAdmin(role?: string) { return ADMIN_ROLES.includes(role as any); }
function isMod(role?: string) { return MOD_ROLES.includes(role as any); }

export function AdminLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { user, isLoading } = useAuth();

  if (isLoading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;

  if (!user || !isMod(user.role)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 text-center">
        <div className="max-w-md space-y-4">
          <ShieldCheck className="w-16 h-16 text-destructive mx-auto" />
          <h1 className="text-2xl font-bold font-display">Access Denied</h1>
          <p className="text-muted-foreground">You do not have permission to view the admin panel.</p>
          <Link href="/" className="text-primary hover:underline block mt-4">Return Home</Link>
        </div>
      </div>
    );
  }

  const allNavItems = [
    { name: "Dashboard",    href: "/admin/dashboard",     icon: LayoutDashboard, adminOnly: false },
    { name: "Users",        href: "/admin/users",          icon: Users,           adminOnly: true  },
    { name: "Leaderboard",  href: "/admin/leaderboard",    icon: Trophy,          adminOnly: false },
    { name: "Store Items",  href: "/admin/store",          icon: ShoppingBag,     adminOnly: true  },
    { name: "Tickets",      href: "/admin/tickets",        icon: Ticket,          adminOnly: false },
    { name: "Purchases",    href: "/admin/purchases",      icon: CreditCard,      adminOnly: true  },
    { name: "Announcements",href: "/admin/announcements",  icon: Megaphone,       adminOnly: false },
    { name: "Coupons",      href: "/admin/coupons",        icon: Tag,             adminOnly: false },
    { name: "Custom Roles", href: "/admin/roles",          icon: Shield,          adminOnly: true  },
    { name: "Settings",     href: "/admin/settings",       icon: Settings,        adminOnly: true  },
  ];

  const navItems = allNavItems.filter(item => !item.adminOnly || isAdmin(user.role));

  const roleLabel = user.role === "owner" ? "Owner" : user.role === "admin" ? "Admin" : "Moderator";
  const roleBg = user.role === "owner" ? "text-red-400" : user.role === "admin" ? "text-primary" : "text-blue-400";

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-80px)]">
      <aside className="w-full md:w-64 border-r border-border/50 bg-card p-4 flex flex-col gap-2 flex-shrink-0">
        <div className="mb-2 px-3 py-2">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Admin Portal</p>
          <p className={`text-xs font-semibold mt-1 ${roleBg}`}>{user.username} · {roleLabel}</p>
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-border/50 hover:text-foreground"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-primary" : ""}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="flex-1 p-6 md:p-8 bg-background overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
