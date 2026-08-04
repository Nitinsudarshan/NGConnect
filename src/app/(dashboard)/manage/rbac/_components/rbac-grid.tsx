'use client';

import React, { useState, useTransition } from 'react';
import { saveRbacChanges } from '@/app/actions/permissions';
import { PageCluster } from '@/lib/permissions';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Edit, Save, X, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export type RolePermissionData = {
  role: string;
  dashboard: boolean;
  reports: boolean;
  crm: boolean;
  data_management: boolean;
  manage_users: boolean;
  manage_alumni_network: boolean;
  master_data: boolean;
  rbac: boolean;
};

const CLUSTERS: { key: PageCluster; label: string }[] = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'reports', label: 'Reports' },
  { key: 'crm', label: 'CRM' },
  { key: 'data_management', label: 'Data Management' },
  { key: 'manage_users', label: 'Manage Users' },
  { key: 'manage_alumni_network', label: 'Manage Alumni Network' },
  { key: 'master_data', label: 'Master Data' },
  { key: 'rbac', label: 'RBAC (This Page)' },
];

export function RbacGrid({ initialData }: { initialData: RolePermissionData[] }) {
  const router = useRouter();
  const [data, setData] = useState<RolePermissionData[]>(initialData);
  const [isEditing, setIsEditing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleToggle = (role: string, cluster: PageCluster, currentValue: boolean) => {
    if (!isEditing) return;
    
    setData((prev) => 
      prev.map((r) => r.role === role ? { ...r, [cluster]: !currentValue } : r)
    );
  };

  const handleSave = () => {
    startTransition(async () => {
      const res = await saveRbacChanges(data);
      if (!res.success) {
        toast.error(`Failed to update permissions: ${res.error}`);
      } else {
        toast.success('Permissions saved successfully!');
        setIsEditing(false);
        router.refresh();
      }
    });
  };

  const handleCancel = () => {
    setData(initialData);
    setIsEditing(false);
  };

  return (
    <>
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-card border border-border shadow-lg p-6 rounded-xl max-w-sm w-full space-y-4">
            <div className="flex items-center gap-3 text-yellow-600">
              <AlertTriangle className="w-6 h-6 text-yellow-500" />
              <h3 className="font-bold text-lg">Edit Permissions?</h3>
            </div>
            <p className="text-muted-foreground text-sm">
              Are you sure you want to edit these configurations? You are modifying core access settings.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setShowConfirm(false)}>Cancel</Button>
              <Button onClick={() => { setShowConfirm(false); setIsEditing(true); }}>Yes, Edit</Button>
            </div>
          </div>
        </div>
      )}

      <Card className="border-border/60 bg-card/40 backdrop-blur-md shadow-lg overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-border/40 pb-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <span>Role Permissions Grid</span>
                {isPending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              </CardTitle>
              <CardDescription>
                {isEditing 
                  ? "You are currently in Edit Mode. Don't forget to save your changes."
                  : "View the access for specific page clusters. Click Edit to make changes."
                }
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {!isEditing ? (
                <Button onClick={() => setShowConfirm(true)} variant="outline" className="gap-2">
                  <Edit className="w-4 h-4" /> Edit Permissions
                </Button>
              ) : (
                <>
                  <Button onClick={handleCancel} variant="ghost" disabled={isPending} className="gap-2 text-muted-foreground">
                    <X className="w-4 h-4" /> Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={isPending} className="gap-2 bg-green-600 hover:bg-green-700 text-white">
                    <Save className="w-4 h-4" /> Save Changes
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 text-muted-foreground font-semibold uppercase text-xs sticky top-0">
              <tr>
                <th className="px-6 py-4 whitespace-nowrap border-b border-r border-border/50">Role</th>
                {CLUSTERS.map(c => (
                  <th key={c.key} className="px-6 py-4 whitespace-nowrap border-b border-border/50 text-center">
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {data.filter(row => row.role !== 'Super Admin').map((row) => (
                <tr key={row.role} className="hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-4 font-semibold text-foreground border-r border-border/50 whitespace-nowrap bg-card/30">
                    {row.role}
                  </td>
                  {CLUSTERS.map(c => {
                    const hasAccess = row[c.key as keyof RolePermissionData] as boolean;
                    const disabled = !isEditing || isPending;
                    
                    return (
                      <td key={c.key} className="px-6 py-4 text-center">
                        <div className="flex justify-center">
                          <Checkbox
                            checked={hasAccess}
                            disabled={disabled}
                            onCheckedChange={() => handleToggle(row.role, c.key, hasAccess)}
                            className={`
                              transition-all duration-200 
                              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                              ${hasAccess ? 'data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500' : 'border-yellow-500/50 hover:border-yellow-500 bg-yellow-500/10'}
                            `}
                          />
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </>
  );
}
