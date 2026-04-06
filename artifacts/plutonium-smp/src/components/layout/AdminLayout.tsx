import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import {
  LayoutDashboard, Users, ShoppingBag, Ticket, CreditCard,
  Megaphone, Tag, ShieldCheck, Trophy, Settings, Shield, Star, Wallet,
} from "lucide-react";

const ADMIN_ROLES = ["admin", "owner"] as const;
const MOD_ROLES = ["moderator", "admin", "owner"] as const;

function isAdmin(role?: string) { return ADMIN_ROLES.includes(role as any); }
function isMod(role?: string) { return MOD_ROLES.includes(role as any); }

function getUserPermissions(user: any): string[] {
  if (!user) return [];
  if (isAdmin(user.role)) return ["*"];
  return user.customRoleData?.permissions || [];
}

function canAccess(permissions: string[], requiredPermission?: string): boolean {
  if (!requiredPermission) return true;
  if (permissions.includes("*")) return true;
  return permissions.includes(requiredPermission);
}

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

  const permissions = getUserPermissions(user);

  const allNavItems = [
    { name: "Dashboard",    href: "/admin/dashboard",     icon: LayoutDashboard, permission: "view_dashboard"    },
    { name: "Users",        href: "/admin/users",          icon: Users,           permission: "view_users"        },
    { name: "Leaderboard",  href: "/admin/leaderboard",    icon: Trophy,          permission: "view_leaderboard"  },
    { name: "Store Items",  href: "/admin/store",          icon: ShoppingBag,     permission: "view_store"        },
    { name: "Tickets",      href: "/admin/tickets",        icon: Ticket,          permission: "view_tickets"      },
    { name: "Purchases",    href: "/admin/purchases",      icon: CreditCard,      permission: "view_purchases"    },
    { name: "Announcements",href: "/admin/announcements",  icon: Megaphone,       permission: "view_announcements"},
    { name: "Coupons",      href: "/admin/coupons",        icon: Tag,             permission: "view_coupons"      },
    { name: "Currency",     href: "/admin/currency",       icon: Wallet,          permission: "view_currency"     },
    { name: "Ranks",        href: "/admin/ranks",          icon: Star,            permission: "view_ranks"        },
    { name: "Custom Roles", href: "/admin/roles",          icon: Shield,          permission: "view_roles"        },
    { name: "Settings",     href: "/admin/settings",       icon: Settings,        permission: "view_settings"     },
  ];

  const navItems = allNavItems.filter(item => {
    if (isAdmin(user.role)) return true;
    return canAccess(permissions, item.permission);
  });

  const roleLabel = user.role === "owner" ? "Owner" : user.role === "admin" ? "Admin" : "Moderator";
  const roleBg = user.role === "owner" ? "text-red-400" : user.role === "admin" ? "text-primary" : "text-blue-400";

  const customRoleName = (user as any).customRoleData?.name;
  const customRoleColor = (user as any).customRoleData?.color;

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-80px)]">
      <aside className="w-full md:w-64 border-r border-border/50 bg-card p-4 flex flex-col gap-2 flex-shrink-0">
        <div className="mb-2 px-3 py-2">
          <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Admin Portal</p>
          <p className={`text-xs font-semibold mt-1 ${roleBg}`}>{user.username} · {roleLabel}</p>
          {customRoleName && (
            <p className="text-xs mt-0.5 font-medium" style={{ color: customRoleColor || "#6366f1" }}>
              {customRoleName}
            </p>
          )}
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
