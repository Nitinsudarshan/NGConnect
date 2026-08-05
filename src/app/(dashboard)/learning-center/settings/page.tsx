"use client"

import React, { useState } from "react"
import Link from "next/link"
import { Save, Video, Mail, Loader2, Link2, CheckCircle2, UserPlus, MoreVertical, Eye, Trash2, Settings2, Users, Network, MessageSquare, Target, ListVideo, Plus, Edit2, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageBanner } from "@/components/shared/page-banner"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { toast } from "sonner"
import { SettingsLayout } from "@/components/settings/settings-layout"
import { MentorStatsModalContent } from "@/components/settings/mentor-stats-modal"

export default function SettingsPage() {
  const [testingZoom, setTestingZoom] = useState(false)
  const [saving, setSaving] = useState(false)
  const [zoomConnected, setZoomConnected] = useState(false)
  const [activeTab, setActiveTab] = useState("mentors")
  const [selectedMentorId, setSelectedMentorId] = useState<string | null>(null)

  // Mock Audiences Data
  const [audiences, setAudiences] = useState([
    { id: "a1", name: "Internal Alumni", isCampusSpecific: false, campuses: [] },
    { id: "a2", name: "External Alumni", isCampusSpecific: false, campuses: [] },
    { id: "a3", name: "All Alumni", isCampusSpecific: false, campuses: [] },
    { id: "a4", name: "On-Campus", isCampusSpecific: true, campuses: ["Pune", "Bangalore"] }
  ])

  // Mock Session Types Data
  const [sessionTypes, setSessionTypes] = useState([
    { id: "t1", name: "Online session" },
    { id: "t2", name: "Offline session" },
    { id: "t3", name: "Interview Prep" },
    { id: "t4", name: "Mentoring" },
    { id: "t5", name: "Career guidance" }
  ])

  // Modals state
  const [audienceModalOpen, setAudienceModalOpen] = useState(false)
  const [editingAudience, setEditingAudience] = useState<any>(null)
  const [audienceForm, setAudienceForm] = useState({ name: "", isCampusSpecific: false, campuses: [] as string[] })

  const [sessionTypeModalOpen, setSessionTypeModalOpen] = useState(false)
  const [editingSessionType, setEditingSessionType] = useState<any>(null)
  const [sessionTypeForm, setSessionTypeForm] = useState({ name: "" })

  const availableCampuses = ["Pune", "Bangalore", "Dharamshala", "Sarjapur", "Tripura", "Amravati"]
  
  // Mock Mentors Data
  const mentors = [
    { id: "m1", name: "Alex Johnson", domain: "Backend & Systems", city: "Bangalore", sessions: 12, duration: "840 min", rating: 4.8 },
    { id: "m2", name: "Jane Smith", domain: "UI/UX Design", city: "Remote", sessions: 5, duration: "450 min", rating: 4.9 },
    { id: "m3", name: "Michael Chen", domain: "Frontend React", city: "Pune", sessions: 8, duration: "600 min", rating: 4.6 },
  ]

  const handleTestZoom = () => {
    setTestingZoom(true)
    setTimeout(() => {
      setTestingZoom(false)
      setZoomConnected(true)
      toast.success("Successfully connected to Zoom Enterprise")
    }, 1500)
  }

  const handleSaveSettings = () => {
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      toast.success("Settings saved successfully")
    }, 1000)
  }

  const handleArchiveMentor = () => {
    toast.success("Mentor archived successfully. Historical session data preserved.")
  }

  const navItems = [
    { label: "Manage Mentors", value: "mentors", icon: Users },
    { label: "Audience", value: "audience", icon: Target },
    { label: "Session Types", value: "session-types", icon: ListVideo },
    { label: "Integrations", value: "integrations", icon: Network },
    { label: "Communications", value: "communications", icon: MessageSquare },
  ]

  return (
    <div className="w-full space-y-6 pb-12">
      <div className="px-6">
        <PageBanner 
          title="Learning Center Settings"
          description="Manage integrations, master communications, and mentors."
          icon={<Settings2 className="w-8 h-8 text-indigo-500" />}
        />
      </div>

      <div className="px-6">
        <SettingsLayout navItems={navItems} activeValue={activeTab} onValueChange={setActiveTab}>
          
          {activeTab === "mentors" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-semibold">Mentor Master Database</h2>
                <Button>
                  <UserPlus className="w-4 h-4 mr-2" /> Add Mentor
                </Button>
              </div>
              <div className="border rounded-md bg-card overflow-x-auto">
                <Table className="min-w-[600px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Domain</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead className="text-right">Sessions</TableHead>
                      <TableHead className="text-right">Avg Rating</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mentors.map((mentor) => (
                      <TableRow key={mentor.id}>
                        <TableCell className="font-medium">{mentor.name}</TableCell>
                        <TableCell>{mentor.domain}</TableCell>
                        <TableCell>{mentor.city}</TableCell>
                        <TableCell className="text-right">{mentor.sessions}</TableCell>
                        <TableCell className="text-right font-medium text-emerald-600 dark:text-emerald-400">
                          ★ {mentor.rating}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="ghost" size="icon" onClick={() => setSelectedMentorId(mentor.id)}>
                                    <Eye className="w-4 h-4 text-muted-foreground hover:text-primary" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>View Stats & Details</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="text-red-600" onClick={handleArchiveMentor}>
                                  <Trash2 className="w-4 h-4 mr-2" /> Archive Mentor
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {activeTab === "integrations" && (
            <div className="max-w-2xl space-y-4">
              <div className="space-y-1 mb-6">
                <h2 className="text-lg font-semibold flex items-center gap-2"><Video className="w-5 h-5" /> Zoom Integration</h2>
                <p className="text-sm text-muted-foreground">
                  Connect your Zoom Enterprise account using Server-to-Server OAuth to auto-generate meeting links.
                </p>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-medium">Account ID</label>
                  <Input type="password" placeholder="••••••••••••" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium">Client ID</label>
                  <Input type="password" placeholder="••••••••••••" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium">Client Secret</label>
                  <Input type="password" placeholder="••••••••••••" />
                </div>
                
                <div className="flex flex-col items-start border-t border-slate-200 dark:border-zinc-800 pt-6 gap-4">
                  {zoomConnected && (
                    <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                      <CheckCircle2 className="w-4 h-4" /> Connected to NGConnect Enterprise
                    </div>
                  )}
                  <Button onClick={handleTestZoom} disabled={testingZoom}>
                    {testingZoom ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Link2 className="w-4 h-4 mr-2" />}
                    {zoomConnected ? "Re-test Connection" : "Test Connection"}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "communications" && (
            <div className="max-w-3xl space-y-4">
              <div className="space-y-1 mb-6">
                <h2 className="text-lg font-semibold flex items-center gap-2"><Mail className="w-5 h-5" /> Master Communication Settings</h2>
                <p className="text-sm text-muted-foreground">Configure default timings and channels for session notifications.</p>
              </div>
              
              <div className="space-y-6">
                {/* Trigger Item */}
                <div className="flex items-start justify-between border-b border-slate-200 dark:border-zinc-800 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h5 className="font-medium text-sm">Announcement</h5>
                      <Badge variant="outline" className="text-[10px]">T-2 Days</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">Initial session announcement sent to selected audience.</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <label className="text-xs">Email</label>
                      <input type="checkbox" defaultChecked className="rounded border-gray-300" />
                    </div>
                  </div>
                </div>

                {/* Trigger Item */}
                <div className="flex items-start justify-between border-b border-slate-200 dark:border-zinc-800 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h5 className="font-medium text-sm">T-1 Day Reminder</h5>
                      <Badge variant="outline" className="text-[10px]">T-1 Day</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">Sent 24 hours before the session.</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <label className="text-xs">Email</label>
                      <input type="checkbox" defaultChecked className="rounded border-gray-300" />
                    </div>
                  </div>
                </div>

                {/* Trigger Item */}
                <div className="flex items-start justify-between border-b border-slate-200 dark:border-zinc-800 pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h5 className="font-medium text-sm">Morning-of Reminder</h5>
                      <Badge variant="outline" className="text-[10px]">9:00 AM</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">Sent at 9:00 AM on the day of the session.</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <label className="text-xs">Email</label>
                      <input type="checkbox" defaultChecked className="rounded border-gray-300" />
                    </div>
                  </div>
                </div>

                {/* Trigger Item */}
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h5 className="font-medium text-sm">Post-Session Feedback</h5>
                      <Badge variant="outline" className="text-[10px]">After Session</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">Thank you message and feedback form link.</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <label className="text-xs">Email</label>
                      <input type="checkbox" defaultChecked className="rounded border-gray-300" />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end border-t border-slate-200 dark:border-zinc-800 pt-6">
                  <Button onClick={handleSaveSettings} disabled={saving}>
                    {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Settings
                  </Button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "audience" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <h2 className="text-lg font-semibold">Audience Management</h2>
                  <p className="text-sm text-muted-foreground">Manage audience segments for sessions.</p>
                </div>
                <Button onClick={() => {
                  setEditingAudience(null)
                  setAudienceForm({ name: "", isCampusSpecific: false, campuses: [] })
                  setAudienceModalOpen(true)
                }}>
                  <Plus className="w-4 h-4 mr-2" /> Add Audience
                </Button>
              </div>
              <div className="border rounded-md bg-card overflow-x-auto">
                <Table className="min-w-[500px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Audience Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Campuses</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {audiences.map((aud) => (
                      <TableRow key={aud.id}>
                        <TableCell className="font-medium">{aud.name}</TableCell>
                        <TableCell>
                          {aud.isCampusSpecific ? (
                            <Badge variant="secondary" className="bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border-purple-200 dark:border-purple-800">Campus Specific</Badge>
                          ) : (
                            <Badge variant="outline">Global</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {aud.isCampusSpecific && aud.campuses.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {aud.campuses.map(c => (
                                <Badge key={c} variant="secondary" className="text-[10px] font-normal">{c}</Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => {
                              setEditingAudience(aud)
                              setAudienceForm({ name: aud.name, isCampusSpecific: aud.isCampusSpecific, campuses: aud.campuses })
                              setAudienceModalOpen(true)
                            }}>
                              <Edit2 className="w-4 h-4 text-muted-foreground" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50" onClick={() => {
                              setAudiences(audiences.filter(a => a.id !== aud.id))
                              toast.success("Audience deleted")
                            }}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {activeTab === "session-types" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <h2 className="text-lg font-semibold">Session Types</h2>
                  <p className="text-sm text-muted-foreground">Manage the categories assigned to sessions.</p>
                </div>
                <Button onClick={() => {
                  setEditingSessionType(null)
                  setSessionTypeForm({ name: "" })
                  setSessionTypeModalOpen(true)
                }}>
                  <Plus className="w-4 h-4 mr-2" /> Add Type
                </Button>
              </div>
              <div className="border rounded-md bg-card overflow-x-auto">
                <Table className="min-w-[400px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type Name</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessionTypes.map((type) => (
                      <TableRow key={type.id}>
                        <TableCell className="font-medium">{type.name}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => {
                              setEditingSessionType(type)
                              setSessionTypeForm({ name: type.name })
                              setSessionTypeModalOpen(true)
                            }}>
                              <Edit2 className="w-4 h-4 text-muted-foreground" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50" onClick={() => {
                              setSessionTypes(sessionTypes.filter(t => t.id !== type.id))
                              toast.success("Session type deleted")
                            }}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

        </SettingsLayout>
      </div>

      {/* Dialogs */}
      <Dialog open={!!selectedMentorId} onOpenChange={(open) => !open && setSelectedMentorId(null)}>
        <DialogContent className="max-w-[95vw] sm:max-w-[90vw] w-[95vw] sm:w-[90vw] h-[95vh] sm:h-[90vh] max-h-[95vh] p-4 sm:p-6 overflow-hidden flex flex-col">
          <DialogTitle className="sr-only">Mentor Stats & Details</DialogTitle>
          <DialogDescription className="sr-only">View comprehensive statistics and session history for this mentor.</DialogDescription>
          <div className="flex-1 overflow-y-auto">
            {selectedMentorId && <MentorStatsModalContent mentorId={selectedMentorId} />}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={audienceModalOpen} onOpenChange={setAudienceModalOpen}>
        <DialogContent>
          <DialogTitle>{editingAudience ? "Edit Audience" : "Add Audience"}</DialogTitle>
          <DialogDescription>Create or modify an audience segment for targeting sessions.</DialogDescription>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Audience Name</label>
              <Input 
                value={audienceForm.name} 
                onChange={(e) => setAudienceForm({...audienceForm, name: e.target.value})}
                placeholder="e.g. Internal Alumni" 
              />
            </div>
            
            <div className="flex items-center gap-2 pt-2">
              <input 
                type="checkbox" 
                id="isCampus"
                checked={audienceForm.isCampusSpecific}
                onChange={(e) => {
                  setAudienceForm({...audienceForm, isCampusSpecific: e.target.checked, campuses: e.target.checked ? audienceForm.campuses : []})
                }}
                className="rounded border-gray-300"
              />
              <label htmlFor="isCampus" className="text-sm font-medium cursor-pointer">This audience is campus-specific</label>
            </div>

            {audienceForm.isCampusSpecific && (
              <div className="space-y-3 pt-2 p-4 bg-muted/50 rounded-lg border border-dashed">
                <label className="text-sm font-medium flex items-center gap-2"><MapPin className="w-4 h-4" /> Select Campuses</label>
                <div className="flex flex-wrap gap-2">
                  {availableCampuses.map(campus => {
                    const isSelected = audienceForm.campuses.includes(campus)
                    return (
                      <Badge 
                        key={campus}
                        variant={isSelected ? "default" : "outline"}
                        className={`cursor-pointer ${isSelected ? 'bg-primary' : 'bg-background hover:bg-muted'}`}
                        onClick={() => {
                          if (isSelected) {
                            setAudienceForm({...audienceForm, campuses: audienceForm.campuses.filter(c => c !== campus)})
                          } else {
                            setAudienceForm({...audienceForm, campuses: [...audienceForm.campuses, campus]})
                          }
                        }}
                      >
                        {campus}
                      </Badge>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 border-t pt-4">
            <Button variant="outline" onClick={() => setAudienceModalOpen(false)}>Cancel</Button>
            <Button onClick={() => {
              if (editingAudience) {
                setAudiences(audiences.map(a => a.id === editingAudience.id ? { ...a, ...audienceForm } : a))
                toast.success("Audience updated")
              } else {
                setAudiences([...audiences, { id: `a${Date.now()}`, ...audienceForm }])
                toast.success("Audience created")
              }
              setAudienceModalOpen(false)
            }}>
              {editingAudience ? "Save Changes" : "Create Audience"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={sessionTypeModalOpen} onOpenChange={setSessionTypeModalOpen}>
        <DialogContent>
          <DialogTitle>{editingSessionType ? "Edit Session Type" : "Add Session Type"}</DialogTitle>
          <DialogDescription>Define categories for organizing sessions.</DialogDescription>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Type Name</label>
              <Input 
                value={sessionTypeForm.name} 
                onChange={(e) => setSessionTypeForm({...sessionTypeForm, name: e.target.value})}
                placeholder="e.g. Online session" 
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t pt-4">
            <Button variant="outline" onClick={() => setSessionTypeModalOpen(false)}>Cancel</Button>
            <Button onClick={() => {
              if (editingSessionType) {
                setSessionTypes(sessionTypes.map(t => t.id === editingSessionType.id ? { ...t, ...sessionTypeForm } : t))
                toast.success("Session type updated")
              } else {
                setSessionTypes([...sessionTypes, { id: `t${Date.now()}`, ...sessionTypeForm }])
                toast.success("Session type created")
              }
              setSessionTypeModalOpen(false)
            }}>
              {editingSessionType ? "Save Changes" : "Create Type"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
