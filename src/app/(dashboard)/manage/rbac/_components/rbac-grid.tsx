'use client';

import React, { useState, useTransition, useMemo } from 'react';
import { saveGranularRbacChanges, GranularPermissionInput } from '@/app/actions/permissions';
import { PERMISSION_RESOURCES, RESOURCE_CLUSTERS, ActionType } from '@/lib/resource-tree';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Edit, Save, X, AlertTriangle, Search, Shield, Users, User, ChevronDown, ChevronRight, CheckSquare, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

type SubjectType = 'role' | 'team' | 'user';

const ROLES = ['Admin', 'Manager', 'Program', 'Operations', 'Viewer', 'Member'];
const TEAMS = ["CEO's Office", 'Alumni Growth', 'PNC', 'Finance', 'None'];

// Group resources by cluster
const RESOURCES_BY_CLUSTER = RESOURCE_CLUSTERS.map(cluster => ({
  ...cluster,
  resources: PERMISSION_RESOURCES.filter(r => r.cluster === cluster.id)
}));

export function RbacGrid({ initialData, canEdit, users = [] }: { initialData: GranularPermissionInput[], canEdit: boolean, users?: { id: string, name: string, email: string, role?: string, team?: string }[] }) {
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<SubjectType>('role');
  const [selectedSubject, setSelectedSubject] = useState<string>('Admin');
  
  // User Search State
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  
  // Temporary state for the currently edited subject's permissions
  const [permissions, setPermissions] = useState<GranularPermissionInput[]>(initialData);
  const [isEditing, setIsEditing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [activeCluster, setActiveCluster] = useState<string | null>('crm');
  const [isPending, startTransition] = useTransition();

  const toggleCluster = (clusterId: string) => {
    setActiveCluster(prev => prev === clusterId ? null : clusterId);
  };

  const handleSelectAll = (clusterId: string, action: ActionType, checked: boolean) => {
    if (!isEditing) return;
    const cluster = RESOURCES_BY_CLUSTER.find(c => c.id === clusterId);
    if (!cluster) return;

    setPermissions(prev => {
      let newPerms = [...prev];
      cluster.resources.forEach(resource => {
        if (!resource.actions.includes(action)) return;
        
        const existingIdx = newPerms.findIndex(p => p.subject_type === activeTab && p.subject_id === selectedSubject && p.resource_id === resource.id);
        
        if (existingIdx >= 0) {
          newPerms[existingIdx] = { ...newPerms[existingIdx], [`can_${action}`]: checked };
        } else {
          newPerms.push({
            subject_type: activeTab,
            subject_id: selectedSubject,
            resource_id: resource.id,
            can_view: action === 'view' ? checked : false,
            can_edit: action === 'edit' ? checked : false,
            can_delete: action === 'delete' ? checked : false,
          });
        }
      });
      return newPerms;
    });
  };

  const handleToggle = (resourceId: string, action: ActionType, checked: boolean) => {
    if (!isEditing) return;
    
    setPermissions(prev => {
      const existing = prev.find(p => p.subject_type === activeTab && p.subject_id === selectedSubject && p.resource_id === resourceId);
      if (existing) {
        return prev.map(p => {
          if (p === existing) {
            return { ...p, [`can_${action}`]: checked };
          }
          return p;
        });
      } else {
        return [...prev, {
          subject_type: activeTab,
          subject_id: selectedSubject,
          resource_id: resourceId,
          can_view: action === 'view' ? checked : false,
          can_edit: action === 'edit' ? checked : false,
          can_delete: action === 'delete' ? checked : false,
        }];
      }
    });
  };

  const changedPermissions = useMemo(() => {
    const original = initialData.filter(p => p.subject_type === activeTab && p.subject_id === selectedSubject);
    const current = permissions.filter(p => p.subject_type === activeTab && p.subject_id === selectedSubject);
    const changes: { resource: string, action: string, from: boolean, to: boolean }[] = [];

    PERMISSION_RESOURCES.forEach(r => {
      const origP = original.find(p => p.resource_id === r.id);
      const currP = current.find(p => p.resource_id === r.id);
      
      (['view', 'edit', 'delete'] as const).forEach(action => {
        if (!r.actions.includes(action)) return;
        const origVal = origP ? origP[`can_${action}`] : false;
        const currVal = currP ? currP[`can_${action}`] : false;
        if (origVal !== currVal) {
          changes.push({ resource: r.label, action, from: !!origVal, to: !!currVal });
        }
      });
    });

    return changes;
  }, [initialData, permissions, activeTab, selectedSubject]);

  const getEffectivePermission = (resourceId: string, action: ActionType) => {
    if (activeTab === 'role') {
      const p = initialData.find(x => x.subject_type === 'role' && x.subject_id === selectedSubject && x.resource_id === resourceId);
      return p ? p[`can_${action}`] : false;
    }
    if (activeTab === 'team') {
      const p = initialData.find(x => x.subject_type === 'team' && x.subject_id === selectedSubject && x.resource_id === resourceId);
      return p ? p[`can_${action}`] : false;
    }
    if (activeTab === 'user') {
      const user = users.find(u => u.id === selectedSubject);
      if (!user) return false;
      if (user.role === 'Super Admin') return true;
      
      const userPerm = initialData.find(x => x.subject_type === 'user' && x.subject_id === selectedSubject && x.resource_id === resourceId);
      if (userPerm && userPerm[`can_${action}`] !== null && userPerm[`can_${action}`] !== undefined) return userPerm[`can_${action}`];
      
      if (user.team && user.team !== 'None') {
        const teamPerm = initialData.find(x => x.subject_type === 'team' && x.subject_id === user.team && x.resource_id === resourceId);
        if (teamPerm && teamPerm[`can_${action}`] !== null && teamPerm[`can_${action}`] !== undefined) return teamPerm[`can_${action}`];
      }
      
      if (user.role) {
        const rolePerm = initialData.find(x => x.subject_type === 'role' && x.subject_id === user.role && x.resource_id === resourceId);
        if (rolePerm && rolePerm[`can_${action}`] !== null && rolePerm[`can_${action}`] !== undefined) return rolePerm[`can_${action}`];
      }
      return false;
    }
    return false;
  };

  const handleSaveClick = () => {
    if (changedPermissions.length === 0) {
      toast.info("No changes were made to permissions.");
      setIsEditing(false);
      return;
    }
    setShowConfirm(true);
  };

  const handleSave = () => {
    startTransition(async () => {
      // Only save permissions for the active subject_type and subject_id to avoid overriding others accidentally
      const subjectPermissions = permissions.filter(p => p.subject_type === activeTab && p.subject_id === selectedSubject);
      const res = await saveGranularRbacChanges(activeTab, subjectPermissions);
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
    setPermissions(initialData);
    setIsEditing(false);
  };

  const currentPermissions = useMemo(() => {
    return permissions.filter(p => p.subject_type === activeTab && p.subject_id === selectedSubject);
  }, [permissions, activeTab, selectedSubject]);

  return (
    <>
      <Card className="border-border/60 bg-card/40 backdrop-blur-md shadow-lg overflow-hidden">
      <CardHeader className="bg-muted/30 border-b border-border/40 pb-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <span>Granular Permissions Matrix</span>
              {isPending && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            </CardTitle>
            <CardDescription>
              {isEditing 
                ? "You are currently in Edit Mode. Don't forget to save your changes."
                : "View and manage fine-grained view, edit, and delete permissions."
              }
            </CardDescription>
          </div>
          <div className="flex items-center gap-3">
            {(!isEditing && canEdit) ? (
              <Button onClick={() => setIsEditing(true)} className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm transition-all hover:scale-[1.02]">
                <Edit className="w-4 h-4" /> Edit Permissions
              </Button>
            ) : isEditing ? (
              <>
                <Button onClick={handleCancel} variant="ghost" disabled={isPending} className="gap-2 text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" /> Cancel
                </Button>
                <Button onClick={handleSaveClick} disabled={isPending} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all hover:scale-[1.02]">
                  <Save className="w-4 h-4" /> Save Changes
                </Button>
              </>
            ) : null}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        {/* Navigation & Selection */}
        <div className="flex flex-col md:flex-row gap-6">
          <div className="w-full md:w-64 space-y-4 shrink-0 border-r border-border/50 pr-6">
            <Tabs value={activeTab} onValueChange={(v) => { 
              setActiveTab(v as SubjectType); 
              setIsEditing(false); 
              setPermissions(initialData); 
              setSelectedSubject(''); // Reset selection on tab change
              setUserSearchQuery('');
              setShowUserDropdown(false);
            }}>
              <TabsList className="w-full grid grid-cols-3">
                <TabsTrigger value="role" title="Roles"><Shield className="w-4 h-4" /></TabsTrigger>
                <TabsTrigger value="team" title="Teams"><Users className="w-4 h-4" /></TabsTrigger>
                <TabsTrigger value="user" title="Individuals"><User className="w-4 h-4" /></TabsTrigger>
              </TabsList>
            </Tabs>
            
            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Select {activeTab}</label>
              
              {activeTab === 'role' && (
                <div className="flex flex-col gap-1">
                  {ROLES.map(role => (
                    <button
                      key={role}
                      onClick={() => { setSelectedSubject(role); setIsEditing(false); setPermissions(initialData); }}
                      className={`text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${selectedSubject === role ? 'bg-primary text-primary-foreground shadow-sm' : 'hover:bg-muted text-muted-foreground'}`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              )}
              
              {activeTab === 'team' && (
                <div className="flex flex-col gap-1">
                  {TEAMS.map(team => (
                    <button
                      key={team}
                      onClick={() => { setSelectedSubject(team); setIsEditing(false); setPermissions(initialData); }}
                      className={`text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${selectedSubject === team ? 'bg-primary text-primary-foreground shadow-sm' : 'hover:bg-muted text-muted-foreground'}`}
                    >
                      {team}
                    </button>
                  ))}
                </div>
              )}
              
              {activeTab === 'user' && (
                <div className="space-y-2 mt-2">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input 
                      placeholder="Search by name, email, or UUID..." 
                      className="pl-9 h-9 text-sm" 
                      value={userSearchQuery}
                      onChange={(e) => { 
                        setUserSearchQuery(e.target.value); 
                        setShowUserDropdown(true);
                      }}
                      onFocus={() => setShowUserDropdown(true)}
                    />
                    
                    {showUserDropdown && userSearchQuery.trim() !== '' && (
                      <div className="absolute top-full left-0 w-full mt-1 bg-popover border border-border rounded-md shadow-md z-50 max-h-[300px] overflow-y-auto">
                        {users.filter(u => 
                          u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) || 
                          u.email.toLowerCase().includes(userSearchQuery.toLowerCase()) || 
                          u.id.includes(userSearchQuery)
                        ).slice(0, 10).map(u => (
                          <div 
                            key={u.id}
                            className="px-3 py-2 hover:bg-muted cursor-pointer text-sm flex flex-col gap-0.5 border-b border-border/50 last:border-0"
                            onClick={() => {
                              setSelectedSubject(u.id);
                              setUserSearchQuery('');
                              setShowUserDropdown(false);
                              setIsEditing(false);
                              setPermissions(initialData);
                            }}
                          >
                            <span className="font-medium text-foreground">{u.name || 'Unnamed User'}</span>
                            <span className="text-[11px] text-muted-foreground">{u.email}</span>
                          </div>
                        ))}
                        {users.filter(u => 
                          u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) || 
                          u.email.toLowerCase().includes(userSearchQuery.toLowerCase()) || 
                          u.id.includes(userSearchQuery)
                        ).length === 0 && (
                          <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                            No staff users found matching "{userSearchQuery}".
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {selectedSubject && !userSearchQuery && (
                    <div className="bg-primary/10 border border-primary/20 rounded-md p-2 flex items-start justify-between gap-2">
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-semibold text-primary truncate">
                          {users.find(u => u.id === selectedSubject)?.name || 'Unknown User'}
                        </span>
                        <span className="text-xs text-muted-foreground truncate">
                          {users.find(u => u.id === selectedSubject)?.email || ''}
                        </span>
                      </div>
                      <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0 text-muted-foreground hover:text-destructive" onClick={() => { setSelectedSubject(''); setPermissions(initialData); setIsEditing(false); }}>
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  )}

                  {!selectedSubject && (
                    <p className="text-[11px] text-muted-foreground/80 leading-tight">
                      Search for a staff member to view or edit their individual overrides.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Permissions Matrix */}
          <div className="flex-1 space-y-6">
            <div className="flex flex-col gap-2 pb-4 border-b border-border/50">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  Permissions for: <Badge variant="secondary" className="text-sm px-3 py-0.5 bg-muted">
                    {activeTab === 'user' && selectedSubject 
                      ? (users.find(u => u.id === selectedSubject)?.name || selectedSubject) 
                      : (selectedSubject || 'None selected')}
                  </Badge>
                </h3>
              </div>
              
              {selectedSubject && selectedSubject !== 'Super Admin' && (
                <div className="text-[13px] animate-in fade-in slide-in-from-top-1">
                  {isEditing ? (
                    <span className="text-amber-600 dark:text-amber-500 flex items-center gap-1.5 font-medium">
                      <AlertTriangle className="w-4 h-4" /> 
                      Editing mode: Only explicit overrides are shown. Inherited permissions are hidden.
                    </span>
                  ) : (
                    <span className="text-blue-600 dark:text-blue-400 flex items-center gap-1.5 font-medium">
                      <Info className="w-4 h-4" /> 
                      View mode: Showing effective permissions (Inherited + Explicit).
                    </span>
                  )}
                </div>
              )}
            </div>
            
            {!selectedSubject ? (
              <div className="text-center py-12 text-muted-foreground border border-dashed rounded-xl">
                Please select or enter a {activeTab} to configure permissions.
              </div>
            ) : (
              <div className="space-y-8">
                {RESOURCES_BY_CLUSTER.map(cluster => {
                  if (cluster.resources.length === 0) return null;
                  
                    const isExpanded = activeCluster === cluster.id;
                  
                  return (
                    <div key={cluster.id} className="space-y-3">
                      <div 
                        className="flex items-center gap-2 font-semibold text-foreground bg-muted/50 px-3 py-1.5 rounded-lg border border-border/50 cursor-pointer hover:bg-muted/70 transition-colors select-none"
                        onClick={() => toggleCluster(cluster.id)}
                      >
                        {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                        {cluster.label}
                      </div>
                      
                      {isExpanded && (
                      <div className="overflow-x-auto animate-in fade-in slide-in-from-top-2 duration-200">
                        <table className="w-full text-sm text-left border-collapse">
                          <thead>
                            <tr className="border-b border-border">
                              <th className="py-2 pl-4 pr-4 font-medium text-muted-foreground w-1/2">Resource / Feature</th>
                              {['view', 'edit', 'delete'].map(actionType => {
                                const action = actionType as ActionType;
                                const supportsAction = cluster.resources.some(r => r.actions.includes(action));
                                if (!supportsAction) return <th key={action} className="py-2 px-4 font-medium text-muted-foreground text-center w-1/6 capitalize">{action}</th>;
                                
                                const allChecked = cluster.resources.filter(r => r.actions.includes(action)).every(r => {
                                  const p = currentPermissions.find(cp => cp.resource_id === r.id);
                                  return p && p[`can_${action}`];
                                });
                                
                                return (
                                  <th key={action} className="py-2 px-4 font-medium text-muted-foreground text-center w-1/6">
                                    <div className="flex flex-col items-center gap-1.5">
                                      <span className="capitalize">{action}</span>
                                      {isEditing && (
                                        <Checkbox 
                                          checked={allChecked} 
                                          onCheckedChange={(c) => handleSelectAll(cluster.id, action, !!c)}
                                          className="data-[state=checked]:bg-primary transition-all scale-90"
                                          title={`Select all ${action} for ${cluster.label}`}
                                        />
                                      )}
                                    </div>
                                  </th>
                                );
                              })}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border/30">
                            {cluster.resources.map(resource => {
                              const p = currentPermissions.find(p => p.resource_id === resource.id);
                              
                              return (
                                <tr key={resource.id} className="hover:bg-muted/20 transition-colors">
                                  <td className="py-2.5 pl-4 pr-4 border-r border-border/30">
                                    <div className="flex flex-col">
                                      <span className="font-medium">{resource.label}</span>
                                      <span className="text-[10px] text-muted-foreground font-mono">{resource.id}</span>
                                    </div>
                                  </td>
                                  
                                  {['view', 'edit', 'delete'].map(actionType => {
                                    const action = actionType as ActionType;
                                    const isSupported = resource.actions.includes(action);
                                    const isChecked = isSupported ? !!p?.[`can_${action}`] : false;
                                    const disabled = !isEditing || !isSupported;
                                    
                                    return (
                                      <td key={action} className="py-2 px-4 text-center align-middle">
                                        <div className="flex justify-center">
                                          {isSupported ? (
                                            isEditing ? (
                                              <Checkbox
                                                checked={isChecked}
                                                disabled={false}
                                                onCheckedChange={(c) => handleToggle(resource.id, action, !!c)}
                                                className={`
                                                  transition-all duration-200 cursor-pointer
                                                  ${isChecked ? 'data-[state=checked]:bg-primary data-[state=checked]:border-primary' : ''}
                                                `}
                                              />
                                            ) : (
                                              <div 
                                                className={`w-4 h-4 rounded-sm flex items-center justify-center transition-all ${getEffectivePermission(resource.id, action) ? 'bg-primary text-primary-foreground border border-primary' : 'border border-primary/20 bg-muted/30'}`}
                                                title={getEffectivePermission(resource.id, action) ? "Effectively Granted" : "Effectively Denied"}
                                              >
                                                {getEffectivePermission(resource.id, action) && <CheckSquare className="w-3 h-3" />}
                                              </div>
                                            )
                                          ) : (
                                            <span className="text-muted-foreground/30 text-xs">-</span>
                                          )}
                                        </div>
                                      </td>
                                    );
                                  })}
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>

    <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Permission Changes</DialogTitle>
          <DialogDescription asChild>
            <div className="space-y-4 pt-2">
              <p>
                Are you sure you want to save these permission changes for <strong>
                  {activeTab === 'user' && selectedSubject 
                    ? (users.find(u => u.id === selectedSubject)?.name || selectedSubject) 
                    : selectedSubject}
                </strong>? 
                This will update their access immediately and record an entry in the Audit Log for rollback purposes.
              </p>
              
              <div className="bg-muted/30 p-4 rounded-md border border-border/50 max-h-[40vh] overflow-y-auto">
                <h5 className="font-semibold text-foreground text-[11px] uppercase tracking-wider mb-3">
                  Detected Changes ({changedPermissions.length})
                </h5>
                <div className="space-y-2">
                  {changedPermissions.map((c, i) => (
                    <div key={i} className="flex items-center justify-between text-sm py-1 border-b border-border/30 last:border-0">
                      <span className="text-muted-foreground">{c.resource} <span className="capitalize text-[10px] opacity-70 ml-1">({c.action})</span></span>
                      <span className={c.to ? "text-emerald-600 font-medium bg-emerald-500/10 px-2 py-0.5 rounded text-xs" : "text-destructive font-medium bg-destructive/10 px-2 py-0.5 rounded text-xs"}>
                        {c.from ? 'Granted' : 'Denied'} &rarr; {c.to ? 'Granted' : 'Denied'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => setShowConfirm(false)} disabled={isPending}>Cancel</Button>
          <Button onClick={() => { setShowConfirm(false); handleSave(); }} disabled={isPending} className="bg-green-600 hover:bg-green-700 text-white gap-2">
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Confirm & Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
}
