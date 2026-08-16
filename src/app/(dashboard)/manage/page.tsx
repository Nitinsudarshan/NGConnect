import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getUserRole } from '@/lib/roles';
import { checkClusterAccess } from '@/lib/permissions';
import Link from 'next/link';
import {
  Users,
  GraduationCap,
  BarChart2,
  DatabaseBackup,
  Database,
  ShieldCheck,
  Mail,
  FileQuestion,
  Settings,
  ArrowRight,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const MANAGE_CATEGORIES = [
  {
    title: 'User & Network Management',
    links: [
      {
        href: '/manage/users',
        label: 'Users Directory',
        description: 'Manage staff and user accounts, authentication metadata, and role assignments.',
        icon: Users,
        badge: 'Admin',
        gradient: 'from-indigo-500/10 via-purple-500/5 to-transparent',
        border: 'hover:border-indigo-500/30 dark:hover:border-indigo-500/50',
        iconBg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white',
      },
      {
        href: '/manage/alumni-network',
        label: 'Alumni Network',
        description: 'View and manage external registered alumni network members across campuses.',
        icon: GraduationCap,
        badge: 'Staff',
        gradient: 'from-emerald-500/10 via-teal-500/5 to-transparent',
        border: 'hover:border-emerald-500/30 dark:hover:border-emerald-500/50',
        iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white',
      },
      {
        href: '/manage/master-data',
        label: 'Master Data',
        description: 'Central registry for alumni records, campuses, courses, and educational datasets.',
        icon: Database,
        badge: 'Manager',
        gradient: 'from-blue-500/10 via-sky-500/5 to-transparent',
        border: 'hover:border-blue-500/30 dark:hover:border-blue-500/50',
        iconBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white',
      },
    ],
  },
  {
    title: 'System Governance & Diagnostics',
    links: [
      {
        href: '/manage/reports',
        label: 'Manage & Data Quality Reports',
        description: 'Cross-cutting system health report generator for contact suppression and delivery failures.',
        icon: BarChart2,
        badge: 'Manager',
        gradient: 'from-amber-500/10 via-orange-500/5 to-transparent',
        border: 'hover:border-amber-500/30 dark:hover:border-amber-500/50',
        iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:bg-amber-600 group-hover:text-white',
      },
      {
        href: '/data-management',
        label: 'Data Management Hub',
        description: 'System administration utilities for imports, rollbacks, and audit logs.',
        icon: DatabaseBackup,
        badge: 'Admin',
        gradient: 'from-violet-500/10 via-fuchsia-500/5 to-transparent',
        border: 'hover:border-violet-500/30 dark:hover:border-violet-500/50',
        iconBg: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 group-hover:bg-violet-600 group-hover:text-white',
      },
      {
        href: '/manage/rbac',
        label: 'RBAC Matrix',
        description: 'Role-Based Access Control matrix for user, team, and role permissions.',
        icon: ShieldCheck,
        badge: 'Admin',
        gradient: 'from-rose-500/10 via-red-500/5 to-transparent',
        border: 'hover:border-rose-500/30 dark:hover:border-rose-500/50',
        iconBg: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 group-hover:bg-rose-600 group-hover:text-white',
      },
      {
        href: '/manage/notifications',
        label: 'Notification Logs',
        description: 'Email dispatch logs, queue monitoring, and system notification settings.',
        icon: Mail,
        badge: 'Admin',
        gradient: 'from-cyan-500/10 via-teal-500/5 to-transparent',
        border: 'hover:border-cyan-500/30 dark:hover:border-cyan-500/50',
        iconBg: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 group-hover:bg-cyan-600 group-hover:text-white',
      },
      {
        href: '/manage/help',
        label: 'Help Docs Hub',
        description: 'Interactive documentation manager and contextual user guide editor.',
        icon: FileQuestion,
        badge: 'Admin',
        gradient: 'from-purple-500/10 via-pink-500/5 to-transparent',
        border: 'hover:border-purple-500/30 dark:hover:border-purple-500/50',
        iconBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 group-hover:bg-purple-600 group-hover:text-white',
      },
    ],
  },
];

export default async function ManageHubPage() {
  const { userId } = await auth();
  const hasAccess = await checkClusterAccess(userId, 'manage');
  if (!hasAccess) redirect('/');

  const role = await getUserRole();
  const isSuperOrAdmin = role === 'Super Admin' || role === 'Admin';

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-20 animate-in fade-in slide-in-from-bottom-3 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/60 pb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-primary/10 to-indigo-500/10 text-primary rounded-xl border border-primary/20 shadow-inner">
            <Settings className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground/80">
              Management & Administration
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Configure user roles, alumni network parameters, system reports, data rules, and notification systems.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-10">
        {MANAGE_CATEGORIES.map((category) => {
          const visibleLinks = category.links.filter((link) => {
            if (['/manage/rbac', '/manage/notifications', '/manage/help'].includes(link.href)) {
              return isSuperOrAdmin;
            }
            return true;
          });

          if (visibleLinks.length === 0) return null;

          return (
            <div key={category.title} className="space-y-4">
              <h2 className="text-xl font-bold tracking-tight text-foreground/90 border-b border-border/40 pb-2">
                {category.title}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {visibleLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link key={link.href} href={link.href} className="group block">
                      <Card className={`h-full border border-border/80 bg-card/60 backdrop-blur-sm transition-all duration-300 relative overflow-hidden group-hover:-translate-y-1 group-hover:shadow-lg ${link.border}`}>
                        <div className={`absolute inset-0 bg-gradient-to-br ${link.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                        <div className="absolute right-4 top-4 opacity-0 group-hover:opacity-100 transition-all duration-300 text-muted-foreground">
                          <ArrowRight className="w-4 h-4 translate-x-[-8px] group-hover:translate-x-0 transition-transform" />
                        </div>
                        <CardHeader className="flex flex-col items-start gap-4 space-y-0 relative z-10">
                          <div className="flex flex-row items-center gap-4 pr-6 w-full">
                            <div className={`p-3 rounded-xl transition-all duration-300 ${link.iconBg} shadow-sm group-hover:scale-105 group-hover:rotate-3 shrink-0 flex items-center justify-center`}>
                              <Icon className="w-5 h-5" />
                            </div>
                            <div className="flex flex-col justify-center gap-2">
                              <CardTitle className="text-lg font-bold tracking-tight text-foreground group-hover:text-primary dark:group-hover:text-white transition-colors duration-300 leading-none">
                                {link.label}
                              </CardTitle>
                              <div className="flex items-center">
                                <span className="text-[10px] px-2 py-0.5 font-bold rounded-md bg-secondary/80 border border-border/80 text-muted-foreground uppercase tracking-widest inline-block leading-none">
                                  {link.badge}
                                </span>
                              </div>
                            </div>
                          </div>
                          <CardDescription className="text-sm leading-relaxed text-muted-foreground group-hover:text-foreground/95 transition-colors duration-300 w-full">
                            {link.description}
                          </CardDescription>
                        </CardHeader>
                      </Card>
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
