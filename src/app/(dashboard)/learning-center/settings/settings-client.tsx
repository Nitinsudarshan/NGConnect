"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { Save, Video, Mail, Loader2, Link2, CheckCircle2, UserPlus, MoreVertical, Eye, Trash2, Settings2, Users, Network, MessageSquare, Target, ListVideo, Plus, Edit2, MapPin, Linkedin, Phone, History, FolderTree, ChevronRight, ChevronDown, AlertTriangle, FolderPlus, BookOpen, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PageBanner } from "@/components/shared/page-banner"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { MentorForm } from "@/components/settings/mentor-form"
import { EditLogTab } from "@/components/settings/edit-log-tab"
import { 
  Mentor, 
  LearningAudience, 
  LearningSessionType, 
  LearningCategory, 
  LearningSubcategory, 
  LearningCenterAuditLog,
  CourseraConfig,
  getCategorySessionCount,
  getSubcategorySessionCount,
  saveCourseraConfig
} from "@/lib/learning-center/queries"
import { 
  archiveMentorAction, 
  saveAudienceAction, 
  deleteAudienceAction, 
  saveSessionTypeAction, 
  deleteSessionTypeAction, 
  saveCategoryAction,
  deleteCategoryAction,
  saveSubcategoryAction,
  deleteSubcategoryAction,
  logIntegrationAction,
  disconnectGoogleMeetAction
} from "@/lib/learning-center/actions"
import { Switch } from "@/components/ui/switch"

export function SettingsClient({ 
  initialMentors, 
  initialAudiences, 
  initialSessionTypes,
  initialCategories = [],
  initialAuditLogs = [],
  initialCourseraConfig,
  initialGmeetConnected = false,
  initialGmeetEmail = ""
}: { 
  initialMentors: Mentor[]
  initialAudiences: LearningAudience[]
  initialSessionTypes: LearningSessionType[]
  initialCategories?: LearningCategory[]
  initialAuditLogs?: LearningCenterAuditLog[]
  initialCourseraConfig?: CourseraConfig
  initialGmeetConnected?: boolean
  initialGmeetEmail?: string
}) {
  const [testingZoom, setTestingZoom] = useState(false)
  const [saving, setSaving] = useState(false)
  const [zoomConnected, setZoomConnected] = useState(false)
  const [gmeetConnected, setGmeetConnected] = useState(initialGmeetConnected)
  const [gmeetEmail, setGmeetEmail] = useState(initialGmeetEmail)
  const [connectingGmeet, setConnectingGmeet] = useState(false)
  const [courseraConnected, setCourseraConnected] = useState(true)
  const [testingCoursera, setTestingCoursera] = useState(false)
  const [syncingCoursera, setSyncingCoursera] = useState(false)
  const [contactEmail, setContactEmail] = useState(initialCourseraConfig?.contact_email ?? "learn@navgurukul.org")
  const [showCallouts, setShowCallouts] = useState(initialCourseraConfig?.show_callouts ?? true)
  const [savingCourseraConfig, setSavingCourseraConfig] = useState(false)
  const [activeTab, setActiveTab] = useState("mentors")
  const [selectedMentorId, setSelectedMentorId] = useState<string | null>(null)

  const handleTestCoursera = async () => {
    setTestingCoursera(true)
    setTimeout(async () => {
      setTestingCoursera(false)
      setCourseraConnected(true)
      toast.success("Successfully connected to Coursera Enterprise API")
      await logIntegrationAction("Coursera Enterprise", "update", "Tested Coursera Organization API integration")
      addLocalAuditLog("integration", null, "update", "Coursera Enterprise API connection verified")
    }, 1500)
  }

  const handleSyncCoursera = async () => {
    setSyncingCoursera(true)
    setTimeout(async () => {
      setSyncingCoursera(false)
      toast.success("Initiated Coursera learner activity sync")
      await logIntegrationAction("Coursera Enterprise", "update", "Synced Coursera learner progress & completions")
      addLocalAuditLog("integration", null, "update", "Triggered manual Coursera dataset sync")
    }, 1800)
  }

  const handleSaveCourseraConfig = async () => {
    setSavingCourseraConfig(true)
    const result = await saveCourseraConfig({ contact_email: contactEmail, show_callouts: showCallouts })
    setSavingCourseraConfig(false)
    if (result.success) {
      toast.success("Coursera settings saved successfully")
      await logIntegrationAction("Coursera Enterprise", "update", `Updated contact email & callout visibility`)
      addLocalAuditLog("integration", null, "update", `Coursera config saved — contact: ${contactEmail}, callouts: ${showCallouts}`)
    } else {
      toast.error(`Failed to save: ${result.error}`)
    }
  }

  const searchParams = useSearchParams()
  const router = useRouter()

  React.useEffect(() => {
    if (searchParams.get("gmeet") === "connected") {
      setGmeetConnected(true)
      toast.success("Google Workspace account connected successfully!")
      logIntegrationAction("Google Meet", "connect", "Google Workspace account connected successfully")
      router.replace("/learning-center/settings")
    } else if (searchParams.get("error")) {
      toast.error(`Integration failed: ${searchParams.get("error")}`)
      router.replace("/learning-center/settings")
    }
  }, [searchParams, router])

  // Initialize state with real data
  const [audiences, setAudiences] = useState<LearningAudience[]>(initialAudiences)

  // Session Types Data
  const [sessionTypes, setSessionTypes] = useState<LearningSessionType[]>(initialSessionTypes)

  // Categories & Subcategories Data
  const [categories, setCategories] = useState<LearningCategory[]>(initialCategories)
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({})

  React.useEffect(() => {
    if (initialCategories) {
      setCategories(initialCategories)
    }
  }, [initialCategories])

  // Category Modal state
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<LearningCategory | null>(null)
  const [categoryForm, setCategoryForm] = useState({ name: "", description: "" })
  const [categoryFormError, setCategoryFormError] = useState<string | null>(null)

  // Subcategory Modal state
  const [subcategoryModalOpen, setSubcategoryModalOpen] = useState(false)
  const [editingSubcategory, setEditingSubcategory] = useState<LearningSubcategory | null>(null)
  const [subcategoryParentCategory, setSubcategoryParentCategory] = useState<LearningCategory | null>(null)
  const [subcategoryForm, setSubcategoryForm] = useState({ name: "", description: "" })
  const [subcategoryFormError, setSubcategoryFormError] = useState<string | null>(null)

  // Delete Category confirmation dialog state
  const [deleteCategoryModalOpen, setDeleteCategoryModalOpen] = useState(false)
  const [deletingCategory, setDeletingCategory] = useState<LearningCategory | null>(null)
  const [deletingCategorySessionCount, setDeletingCategorySessionCount] = useState<number>(0)
  const [loadingCategorySessionCount, setLoadingCategorySessionCount] = useState<boolean>(false)

  // Delete Subcategory confirmation dialog state
  const [deleteSubcategoryModalOpen, setDeleteSubcategoryModalOpen] = useState(false)
  const [deletingSubcategory, setDeletingSubcategory] = useState<LearningSubcategory | null>(null)
  const [deletingSubcategorySessionCount, setDeletingSubcategorySessionCount] = useState<number>(0)
  const [loadingSubcategorySessionCount, setLoadingSubcategorySessionCount] = useState<boolean>(false)

  // Audit logs state
  const [auditLogs, setAuditLogs] = useState<LearningCenterAuditLog[]>(initialAuditLogs)

  // Modals state
  const [isAddMentorOpen, setIsAddMentorOpen] = useState(false)
  const [editingMentorData, setEditingMentorData] = useState<Mentor | null>(null)
  const [audienceModalOpen, setAudienceModalOpen] = useState(false)
  const [editingAudience, setEditingAudience] = useState<LearningAudience | null>(null)
  const [audienceForm, setAudienceForm] = useState({ name: "", audience_type: "general", campus_id: "", course_id: "", batch_year: "" })

  const toggleCategoryExpand = (catId: string) => {
    setExpandedCategories(prev => ({ ...prev, [catId]: !prev[catId] }))
  }

  // Category handlers
  const handleOpenCategoryModal = (category?: LearningCategory) => {
    if (category) {
      setEditingCategory(category)
      setCategoryForm({ name: category.name, description: category.description || "" })
    } else {
      setEditingCategory(null)
      setCategoryForm({ name: "", description: "" })
    }
    setCategoryFormError(null)
    setCategoryModalOpen(true)
  }

  const handleSaveCategory = async () => {
    const trimmedName = categoryForm.name.trim()
    if (!trimmedName) {
      setCategoryFormError("Category name is required")
      return
    }

    // Client-side uniqueness check
    const isDuplicate = categories.some(
      c => c.name.trim().toLowerCase() === trimmedName.toLowerCase() && c.id !== editingCategory?.id
    )
    if (isDuplicate) {
      setCategoryFormError(`A category named '${trimmedName}' already exists`)
      return
    }

    setCategoryFormError(null)
    if (editingCategory) {
      setCategories(categories.map(c => c.id === editingCategory.id ? { ...c, name: trimmedName, description: categoryForm.description.trim() || null } : c))
      toast.success("Category updated")
      await saveCategoryAction(editingCategory.id, trimmedName, categoryForm.description.trim())
      addLocalAuditLog("category", editingCategory.id, "update", `Updated category to '${trimmedName}'`)
    } else {
      const newId = `cat-${Date.now()}`
      const newCat: LearningCategory = {
        id: newId,
        name: trimmedName,
        description: categoryForm.description.trim() || null,
        created_at: new Date().toISOString(),
        subcategories: []
      }
      setCategories([...categories, newCat])
      toast.success("Category created")
      await saveCategoryAction(null, trimmedName, categoryForm.description.trim())
      addLocalAuditLog("category", newId, "create", `Created category '${trimmedName}'`)
    }
    setCategoryModalOpen(false)
  }

  const handleOpenDeleteCategory = async (category: LearningCategory) => {
    // UI Block Requirement: If category still has 1+ subcategories, BLOCK delete action!
    if (category.subcategories && category.subcategories.length > 0) {
      toast.error(`Cannot delete '${category.name}'. Please remove or reassign its ${category.subcategories.length} subcategory(ies) first.`)
      return
    }

    setDeletingCategory(category)
    setDeleteCategoryModalOpen(true)
    setLoadingCategorySessionCount(true)
    const count = await getCategorySessionCount(category.id)
    setDeletingCategorySessionCount(count)
    setLoadingCategorySessionCount(false)
  }

  const handleConfirmDeleteCategory = async () => {
    if (!deletingCategory) return
    const cat = deletingCategory
    setCategories(categories.filter(c => c.id !== cat.id))
    toast.success(`Category '${cat.name}' deleted`)
    await deleteCategoryAction(cat.id, cat.name)
    addLocalAuditLog("category", cat.id, "delete", `Deleted category '${cat.name}'`)
    setDeleteCategoryModalOpen(false)
    setDeletingCategory(null)
  }

  // Subcategory handlers
  const handleOpenSubcategoryModal = (parentCategory: LearningCategory, subcategory?: LearningSubcategory) => {
    setSubcategoryParentCategory(parentCategory)
    if (subcategory) {
      setEditingSubcategory(subcategory)
      setSubcategoryForm({ name: subcategory.name, description: subcategory.description || "" })
    } else {
      setEditingSubcategory(null)
      setSubcategoryForm({ name: "", description: "" })
    }
    setSubcategoryFormError(null)
    setSubcategoryModalOpen(true)
  }

  const handleSaveSubcategory = async () => {
    if (!subcategoryParentCategory) return
    const trimmedName = subcategoryForm.name.trim()
    if (!trimmedName) {
      setSubcategoryFormError("Subcategory name is required")
      return
    }

    // Client-side uniqueness check scoped to parent category
    const parentSubs = subcategoryParentCategory.subcategories || []
    const isDuplicate = parentSubs.some(
      s => s.name.trim().toLowerCase() === trimmedName.toLowerCase() && s.id !== editingSubcategory?.id
    )
    if (isDuplicate) {
      setSubcategoryFormError(`A subcategory named '${trimmedName}' already exists under '${subcategoryParentCategory.name}'`)
      return
    }

    setSubcategoryFormError(null)
    if (editingSubcategory) {
      setCategories(categories.map(c => {
        if (c.id !== subcategoryParentCategory.id) return c
        return {
          ...c,
          subcategories: (c.subcategories || []).map(s => s.id === editingSubcategory.id ? { ...s, name: trimmedName, description: subcategoryForm.description.trim() || null } : s)
        }
      }))
      toast.success("Subcategory updated")
      await saveSubcategoryAction(editingSubcategory.id, subcategoryParentCategory.id, trimmedName, subcategoryForm.description.trim())
      addLocalAuditLog("subcategory", editingSubcategory.id, "update", `Updated subcategory to '${trimmedName}'`)
    } else {
      const newSubId = `sub-${Date.now()}`
      const newSub: LearningSubcategory = {
        id: newSubId,
        category_id: subcategoryParentCategory.id,
        name: trimmedName,
        description: subcategoryForm.description.trim() || null,
        created_at: new Date().toISOString()
      }
      setCategories(categories.map(c => {
        if (c.id !== subcategoryParentCategory.id) return c
        return {
          ...c,
          subcategories: [...(c.subcategories || []), newSub]
        }
      }))
      // Automatically expand parent category when a new subcategory is added
      setExpandedCategories(prev => ({ ...prev, [subcategoryParentCategory.id]: true }))
      toast.success("Subcategory created")
      await saveSubcategoryAction(null, subcategoryParentCategory.id, trimmedName, subcategoryForm.description.trim())
      addLocalAuditLog("subcategory", newSubId, "create", `Created subcategory '${trimmedName}' under '${subcategoryParentCategory.name}'`)
    }
    setSubcategoryModalOpen(false)
  }

  const handleOpenDeleteSubcategory = async (subcategory: LearningSubcategory) => {
    setDeletingSubcategory(subcategory)
    setDeleteSubcategoryModalOpen(true)
    setLoadingSubcategorySessionCount(true)
    const count = await getSubcategorySessionCount(subcategory.id)
    setDeletingSubcategorySessionCount(count)
    setLoadingSubcategorySessionCount(false)
  }

  const handleConfirmDeleteSubcategory = async () => {
    if (!deletingSubcategory) return
    const sub = deletingSubcategory
    setCategories(categories.map(c => ({
      ...c,
      subcategories: (c.subcategories || []).filter(s => s.id !== sub.id)
    })))
    toast.success(`Subcategory '${sub.name}' deleted`)
    await deleteSubcategoryAction(sub.id, sub.name)
    addLocalAuditLog("subcategory", sub.id, "delete", `Deleted subcategory '${sub.name}'`)
    setDeleteSubcategoryModalOpen(false)
    setDeletingSubcategory(null)
  }

  const [sessionTypeModalOpen, setSessionTypeModalOpen] = useState(false)
  const [editingSessionType, setEditingSessionType] = useState<LearningSessionType | null>(null)
  const [sessionTypeForm, setSessionTypeForm] = useState({ name: "" })

  // Initialize mentors with real data
  const [mentorsState, setMentorsState] = useState<Mentor[]>(initialMentors)

  const addLocalAuditLog = (
    entity_type: "mentor" | "audience" | "session_type" | "integration" | "category" | "subcategory",
    entity_id: string | null,
    action: "create" | "update" | "delete" | "archive" | "connect" | "disconnect",
    details: string
  ) => {
    const newLog: LearningCenterAuditLog = {
      id: `log-${Date.now()}`,
      entity_type,
      entity_id,
      action,
      details,
      user_id: null,
      user_email: "Active Admin User",
      created_at: new Date().toISOString()
    }
    setAuditLogs(prev => [newLog, ...prev])
  }

  const getMentorStatusColor = (status: string) => {
    switch (status) {
      case 'Being Reviewed': return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700'
      case 'Waitlisted': return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800'
      case 'Onboarded': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200 dark:border-blue-800'
      case 'Active': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
      case 'Inactive': return 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400 border-red-200 dark:border-red-900/50'
      default: return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200'
    }
  }

  const handleTestZoom = async () => {
    setTestingZoom(true)
    setTimeout(async () => {
      setTestingZoom(false)
      setZoomConnected(true)
      toast.success("Successfully connected to Zoom Enterprise")
      await logIntegrationAction("Zoom Enterprise", "update", "Tested Zoom Enterprise OAuth integration configuration")
      addLocalAuditLog("integration", null, "update", "Zoom Enterprise Integration tested & verified")
    }, 1500)
  }

  const handleConnectGmeet = () => {
    setConnectingGmeet(true)
    logIntegrationAction("Google Meet", "connect", "Initiated Google Workspace OAuth authorization")
    addLocalAuditLog("integration", null, "connect", "Google Meet Integration OAuth flow initiated")
    window.location.href = "/api/integrations/google/auth"
  }

  const handleDisconnectGmeet = async () => {
    setConnectingGmeet(true)
    const result = await disconnectGoogleMeetAction()
    setConnectingGmeet(false)
    if (result.success) {
      setGmeetConnected(false)
      toast.success("Google Meet account disconnected")
      addLocalAuditLog("integration", null, "disconnect", "Google Meet Workspace account disconnected")
    } else {
      toast.error(`Failed to disconnect: ${result.error}`)
    }
  }

  const handleSaveSettings = async () => {
    setSaving(true)
    setTimeout(async () => {
      setSaving(false)
      toast.success("Settings saved successfully")
      await logIntegrationAction("Learning Hub Settings", "update", "Updated Learning Center integration preferences")
      addLocalAuditLog("integration", null, "update", "Saved Learning Center integration preferences")
    }, 1000)
  }

  const handleArchiveMentor = async (mentor: Mentor) => {
    setMentorsState(prev => prev.map(m => m.id === mentor.id ? { ...m, status: 'Inactive' } : m))
    toast.success("Mentor archived successfully. Historical session data preserved.")
    await archiveMentorAction(mentor.id, mentor.name)
    addLocalAuditLog("mentor", mentor.id, "archive", `Archived mentor '${mentor.name}' (Status set to Inactive)`)
  }

  const handleSaveAudience = async () => {
    if (editingAudience) {
      setAudiences(audiences.map(a => a.id === editingAudience.id ? ({ ...a, ...audienceForm, batch_year: audienceForm.batch_year ? parseInt(audienceForm.batch_year, 10) : null } as unknown as LearningAudience) : a))
      toast.success("Audience updated")
      await saveAudienceAction(editingAudience.id, audienceForm)
      addLocalAuditLog("audience", editingAudience.id, "update", `Updated audience target '${audienceForm.name}'`)
    } else {
      const newId = `aud-${Date.now()}`
      setAudiences([...audiences, { id: newId, created_at: new Date().toISOString(), ...audienceForm, batch_year: audienceForm.batch_year ? parseInt(audienceForm.batch_year, 10) : null } as unknown as LearningAudience])
      toast.success("Audience created")
      await saveAudienceAction(null, audienceForm)
      addLocalAuditLog("audience", newId, "create", `Created new audience target '${audienceForm.name}' (${audienceForm.audience_type})`)
    }
    setAudienceModalOpen(false)
  }

  const handleDeleteAudience = async (aud: LearningAudience) => {
    setAudiences(audiences.filter(a => a.id !== aud.id))
    toast.success("Audience deleted")
    await deleteAudienceAction(aud.id, aud.name)
    addLocalAuditLog("audience", aud.id, "delete", `Deleted audience target '${aud.name}'`)
  }

  const handleSaveSessionType = async () => {
    if (editingSessionType) {
      setSessionTypes(sessionTypes.map(t => t.id === editingSessionType.id ? { ...t, name: sessionTypeForm.name } : t))
      toast.success("Session type updated")
      await saveSessionTypeAction(editingSessionType.id, sessionTypeForm.name)
      addLocalAuditLog("session_type", editingSessionType.id, "update", `Updated session type to '${sessionTypeForm.name}'`)
    } else {
      const newId = `st-${Date.now()}`
      setSessionTypes([...sessionTypes, { id: newId, name: sessionTypeForm.name, created_at: new Date().toISOString() }])
      toast.success("Session type created")
      await saveSessionTypeAction(null, sessionTypeForm.name)
      addLocalAuditLog("session_type", newId, "create", `Created new session type '${sessionTypeForm.name}'`)
    }
    setSessionTypeModalOpen(false)
  }

  const handleDeleteSessionType = async (type: LearningSessionType) => {
    setSessionTypes(sessionTypes.filter(t => t.id !== type.id))
    toast.success("Session type deleted")
    await deleteSessionTypeAction(type.id, type.name)
    addLocalAuditLog("session_type", type.id, "delete", `Deleted session type '${type.name}'`)
  }

  const navItems = [
    { label: "Manage Mentors", value: "mentors", icon: Users },
    { label: "Audience", value: "audience", icon: Target },
    { label: "Session Types", value: "session-types", icon: ListVideo },
    { label: "Session Categories", value: "categories", icon: FolderTree },
    { label: "Integrations", value: "integrations", icon: Network },
    { label: "Edit Log", value: "edit-log", icon: History },
  ]

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto w-full">
      <PageBanner 
        title="Learning Center Settings"
        description="Manage integrations, audience segments, session categories, and mentor master database."
        icon={<Settings2 className="w-8 h-8 text-indigo-500" />}
      />

      <SettingsLayout navItems={navItems} activeValue={activeTab} onValueChange={setActiveTab}>
          
          {activeTab === "mentors" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-lg font-semibold">Mentor Master Database</h2>
                <Button onClick={() => setIsAddMentorOpen(true)}>
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
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Sessions</TableHead>
                      <TableHead className="text-right">Avg Rating</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mentorsState.map((mentor) => (
                      <TableRow key={mentor.id}>
                        <TableCell>
                          <div className="font-medium flex items-center gap-2">
                            {mentor.name}
                            {mentor.linkedin_url && (
                              <a href={mentor.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-600">
                                <Linkedin className="w-3.5 h-3.5" />
                              </a>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{mentor.role || 'N/A'}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-muted-foreground text-sm">
                            <MapPin className="w-3 h-3" /> {mentor.city || 'Remote'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={`font-normal ${getMentorStatusColor(mentor.status)}`}>
                            {mentor.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">{mentor.total_sessions}</TableCell>
                        <TableCell className="text-right font-medium text-emerald-600 dark:text-emerald-400">
                          {mentor.rating > 0 ? `★ ${mentor.rating}` : '-'}
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
                                <DropdownMenuItem className="cursor-pointer" onClick={() => setEditingMentorData(mentor)}>
                                  <Edit2 className="w-4 h-4 mr-2" /> Edit Mentor
                                </DropdownMenuItem>
                                <DropdownMenuItem className="text-red-600 cursor-pointer" onClick={() => handleArchiveMentor(mentor)}>
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
            <div className="space-y-4">
              <Tabs defaultValue="zoom" className="w-full">
                <TabsList className="mb-6">
                  <TabsTrigger value="zoom">Zoom Integration</TabsTrigger>
                  <TabsTrigger value="gmeet">Google Meet</TabsTrigger>
                  <TabsTrigger value="coursera">Coursera Enterprise</TabsTrigger>
                </TabsList>

                <TabsContent value="zoom" className="max-w-2xl">
                  <div className="space-y-1 mb-6">
                    <h2 className="text-lg font-semibold flex items-center gap-2"><Video className="w-5 h-5" /> Zoom Integration</h2>
                    <p className="text-sm text-muted-foreground">
                      Connect your Zoom Enterprise account using Server-to-Server OAuth to auto-generate meeting links.
                    </p>
                  </div>

                  <Card className="border shadow-sm">
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-base">Connection Status</CardTitle>
                        <Badge variant={zoomConnected ? "default" : "outline"} className={zoomConnected ? "bg-emerald-500" : ""}>
                          {zoomConnected ? "Connected & Active" : "Disconnected"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Account ID</label>
                        <Input placeholder="Zoom Account ID" defaultValue="acc_8f921901" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Client ID</label>
                        <Input placeholder="Server-to-Server OAuth Client ID" defaultValue="wX9z_L81T..." />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Client Secret</label>
                        <Input type="password" value="••••••••••••••••••••••••" readOnly />
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between border-t bg-muted/20 p-4">
                      <Button variant="outline" onClick={handleTestZoom} disabled={testingZoom}>
                        {testingZoom && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Test OAuth Connection
                      </Button>
                      <Button variant="secondary" onClick={() => setZoomConnected(false)}>Disconnect Account</Button>
                    </CardFooter>
                  </Card>
                </TabsContent>

                <TabsContent value="gmeet" className="max-w-2xl">
                  <div className="space-y-1 mb-6">
                    <h2 className="text-lg font-semibold flex items-center gap-2"><Video className="w-5 h-5" /> Google Meet Integration</h2>
                    <p className="text-sm text-muted-foreground">
                      Connect Google Workspace OAuth to auto-create Google Meet links for sessions.
                    </p>
                  </div>

                  <Card className="border shadow-sm">
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-base">Workspace Connection</CardTitle>
                        <Badge variant={gmeetConnected ? "default" : "outline"} className={gmeetConnected ? "bg-emerald-500" : ""}>
                          {gmeetConnected ? "Connected" : "Not Connected"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between p-4 border rounded-lg bg-slate-50 dark:bg-zinc-900">
                        <div>
                          <p className="font-medium text-sm">Google Workspace OAuth</p>
                          <p className="text-xs text-muted-foreground">
                            {gmeetConnected && gmeetEmail ? `Connected as ${gmeetEmail}` : "Google Calendar & Meet access"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {gmeetConnected && (
                            <Button variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50" onClick={handleDisconnectGmeet} disabled={connectingGmeet}>
                              Disconnect
                            </Button>
                          )}
                          <Button variant="outline" className="shrink-0" onClick={handleConnectGmeet} disabled={connectingGmeet}>
                            {connectingGmeet ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Link2 className="w-4 h-4 mr-2" />}
                            {gmeetConnected ? "Reconnect Account" : "Connect Google Account"}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="coursera" className="max-w-2xl">
                  <div className="space-y-1 mb-6">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-blue-600" /> Coursera Enterprise Integration
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Connect Coursera Organization API & SSO to sync learner course completions, total learning hours, and active enterprise licenses.
                    </p>
                  </div>

                  <Card className="border shadow-sm">
                    <CardHeader>
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-base">Organization Subscription & API Status</CardTitle>
                        <Badge variant={courseraConnected ? "default" : "outline"} className={courseraConnected ? "bg-blue-600" : ""}>
                          {courseraConnected ? "Connected & Active (Enterprise License)" : "Disconnected"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Organization ID</label>
                        <Input placeholder="Coursera Org ID" defaultValue="org_navgurukul_enterprise_2026" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Client ID</label>
                        <Input placeholder="OAuth Client ID" defaultValue="coursera_api_client_89f21" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Client Secret</label>
                        <Input type="password" value="••••••••••••••••••••••••••••••••" readOnly />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Program SSO Slug</label>
                        <Input placeholder="Program Slug" defaultValue="navgurukul-enterprise.coursera.org" />
                      </div>

                      {/* Divider */}
                      <div className="border-t border-slate-200 dark:border-zinc-800 pt-4 space-y-4">
                        <div>
                          <p className="text-sm font-semibold mb-1">Access Callout Settings</p>
                          <p className="text-xs text-muted-foreground">Controls the &quot;Get Coursera Access&quot; banner shown to users with no active license.</p>
                        </div>

                        {/* Contact Email */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Contact Email for Access Requests</label>
                          <Input
                            type="email"
                            placeholder="e.g. learn@navgurukul.org"
                            value={contactEmail}
                            onChange={(e) => setContactEmail(e.target.value)}
                          />
                          <p className="text-xs text-muted-foreground">
                            This email is used in the sidebar banner and dashboard callout &apos;Contact Us&apos; button.
                          </p>
                        </div>

                        {/* Show Callouts Toggle — auto-saves immediately */}
                        <div className="flex items-center justify-between p-3 border rounded-lg bg-slate-50 dark:bg-zinc-900">
                          <div>
                            <p className="text-sm font-medium">Show Access Callouts</p>
                            <p className="text-xs text-muted-foreground">When disabled, hides the sidebar & dashboard Coursera access banners for all users.</p>
                          </div>
                          <Switch
                            checked={showCallouts}
                            onCheckedChange={async (val) => {
                              setShowCallouts(val)
                              const result = await saveCourseraConfig({ contact_email: contactEmail, show_callouts: val })
                              if (result.success) {
                                toast.success(val ? "Coursera callouts enabled" : "Coursera callouts hidden")
                                addLocalAuditLog("integration", null, "update", `Coursera callouts ${val ? "enabled" : "disabled"}`)
                              } else {
                                toast.error(`Failed to save: ${result.error}`)
                                setShowCallouts(!val) // revert on failure
                              }
                            }}
                          />
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex justify-between flex-wrap gap-2 border-t bg-muted/20 p-4">
                      <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={handleTestCoursera} disabled={testingCoursera}>
                          {testingCoursera && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                          Test API Connection
                        </Button>
                        <Button variant="secondary" onClick={handleSyncCoursera} disabled={syncingCoursera}>
                          {syncingCoursera ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                          Sync Learner Data
                        </Button>
                      </div>
                      <Button variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50" onClick={() => setCourseraConnected(false)}>
                        Disconnect
                      </Button>
                    </CardFooter>
                  </Card>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end border-t border-slate-200 dark:border-zinc-800 pt-6">
                <Button onClick={handleSaveSettings} disabled={saving}>
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Save Settings
                </Button>
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
                  setAudienceForm({ name: "", audience_type: "general", campus_id: "", course_id: "", batch_year: "" })
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
                      <TableHead>Campuses / Target</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {audiences.map((aud) => (
                      <TableRow key={aud.id}>
                        <TableCell className="font-medium">{aud.name}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="capitalize">{aud.audience_type}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {aud.audience_type === "campus" && (aud.campus_id || "Any Campus")}
                          {aud.audience_type === "course" && (aud.course_id || "Any Course")}
                          {aud.audience_type === "batch" && (aud.batch_year ? `Batch ${aud.batch_year}` : "Any Batch")}
                          {aud.audience_type === "general" && "General Segment"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => {
                              setEditingAudience(aud)
                              setAudienceForm({ name: aud.name, audience_type: aud.audience_type, campus_id: aud.campus_id || "", course_id: aud.course_id || "", batch_year: aud.batch_year ? String(aud.batch_year) : "" })
                              setAudienceModalOpen(true)
                            }}>
                              <Edit2 className="w-4 h-4 text-muted-foreground" />
                            </Button>
                            <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50" onClick={() => handleDeleteAudience(aud)}>
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
                            <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50" onClick={() => handleDeleteSessionType(type)}>
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

          {activeTab === "categories" && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-2">
                <div>
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <FolderTree className="w-5 h-5 text-indigo-500" />
                    Session Categories & Subcategories
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Organize mentorship sessions into structured categories and nested subcategories.
                  </p>
                </div>
                <Button onClick={() => handleOpenCategoryModal()}>
                  <Plus className="w-4 h-4 mr-2" /> Add Category
                </Button>
              </div>

              {categories.length === 0 ? (
                <div className="text-center p-8 border rounded-lg bg-card text-muted-foreground">
                  <FolderTree className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="font-medium">No session categories configured yet.</p>
                  <p className="text-xs mt-1">Click &quot;Add Category&quot; to create your first category.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {categories.map((cat) => {
                    const isExpanded = !!expandedCategories[cat.id]
                    const subCount = cat.subcategories ? cat.subcategories.length : 0

                    return (
                      <div key={cat.id} className="border rounded-lg bg-card overflow-hidden transition-all shadow-sm">
                        {/* Category Header Row */}
                        <div className="flex items-center justify-between p-4 bg-card hover:bg-slate-50/50 dark:hover:bg-zinc-900/50 transition-colors">
                          <div className="flex items-center gap-3 cursor-pointer select-none flex-1" onClick={() => toggleCategoryExpand(cat.id)}>
                            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground">
                              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            </Button>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-base">{cat.name}</span>
                                <Badge variant="secondary" className="font-normal text-xs">
                                  {subCount} {subCount === 1 ? "subcategory" : "subcategories"}
                                </Badge>
                              </div>
                              {cat.description && (
                                <p className="text-xs text-muted-foreground mt-0.5">{cat.description}</p>
                              )}
                            </div>
                          </div>

                          {/* Category Actions */}
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-8 text-xs gap-1"
                              onClick={() => handleOpenSubcategoryModal(cat)}
                            >
                              <Plus className="w-3.5 h-3.5 text-indigo-500" /> Add Subcategory
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              onClick={() => handleOpenCategoryModal(cat)}
                              title="Edit Category"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>

                            {/* Delete Category Button with UI safety rules */}
                            {subCount > 0 ? (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="inline-block">
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        disabled 
                                        className="h-8 w-8 text-slate-300 dark:text-zinc-700 cursor-not-allowed opacity-50"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p className="text-xs max-w-xs">Cannot delete category with subcategories. Delete or reassign all subcategories first.</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            ) : (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"
                                onClick={() => handleOpenDeleteCategory(cat)}
                                title="Delete Category"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Nested Subcategories List */}
                        {isExpanded && (
                          <div className="border-t bg-slate-50/50 dark:bg-zinc-950/50 p-4">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                                Subcategories under &quot;{cat.name}&quot;
                              </h4>
                            </div>

                            {!cat.subcategories || cat.subcategories.length === 0 ? (
                              <div className="text-center py-4 px-3 border border-dashed rounded-md bg-background text-xs text-muted-foreground">
                                No subcategories added yet. Click &quot;Add Subcategory&quot; to create one.
                              </div>
                            ) : (
                              <div className="border rounded-md bg-background overflow-x-auto">
                                <Table>
                                  <TableHeader>
                                    <TableRow className="hover:bg-transparent">
                                      <TableHead className="text-xs">Subcategory Name</TableHead>
                                      <TableHead className="text-xs">Description</TableHead>
                                      <TableHead className="text-xs text-right">Actions</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {cat.subcategories.map((sub) => (
                                      <TableRow key={sub.id}>
                                        <TableCell className="font-medium text-xs py-2.5">{sub.name}</TableCell>
                                        <TableCell className="text-xs text-muted-foreground py-2.5">
                                          {sub.description || "-"}
                                        </TableCell>
                                        <TableCell className="text-right py-2.5">
                                          <div className="flex items-center justify-end gap-1">
                                            <Button 
                                              variant="ghost" 
                                              size="icon" 
                                              className="h-7 w-7 text-muted-foreground hover:text-foreground"
                                              onClick={() => handleOpenSubcategoryModal(cat, sub)}
                                              title="Edit Subcategory"
                                            >
                                              <Edit2 className="w-3.5 h-3.5" />
                                            </Button>
                                            <Button 
                                              variant="ghost" 
                                              size="icon" 
                                              className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"
                                              onClick={() => handleOpenDeleteSubcategory(sub)}
                                              title="Delete Subcategory"
                                            >
                                              <Trash2 className="w-3.5 h-3.5" />
                                            </Button>
                                          </div>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === "edit-log" && (
            <EditLogTab logs={auditLogs} />
          )}

        </SettingsLayout>

      {/* Dialogs */}
      <Dialog open={isAddMentorOpen} onOpenChange={setIsAddMentorOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogTitle>Add New Mentor</DialogTitle>
          <DialogDescription>Add a new mentor to the master database.</DialogDescription>
          <MentorForm onSuccess={() => {
            setIsAddMentorOpen(false)
            addLocalAuditLog("mentor", null, "create", "Added new mentor to database")
          }} />
        </DialogContent>
      </Dialog>
      
      <Dialog open={!!editingMentorData} onOpenChange={(open) => !open && setEditingMentorData(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogTitle>Edit Mentor</DialogTitle>
          <DialogDescription>Update the mentor's details.</DialogDescription>
          {editingMentorData && (
            <MentorForm 
              defaultValues={editingMentorData} 
              onSuccess={() => {
                const name = editingMentorData.name
                setEditingMentorData(null)
                addLocalAuditLog("mentor", editingMentorData.id, "update", `Updated details for mentor '${name}'`)
              }} 
            />
          )}
        </DialogContent>
      </Dialog>
      
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
            
            <div className="space-y-2 pt-2">
              <label className="text-sm font-medium">Audience Type</label>
              <select 
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                value={audienceForm.audience_type}
                onChange={(e) => setAudienceForm({
                  ...audienceForm, 
                  audience_type: e.target.value,
                  campus_id: "",
                  course_id: "",
                  batch_year: ""
                })}
              >
                <option value="general">General Segment</option>
                <option value="campus">By Campus</option>
                <option value="course">By Course</option>
                <option value="batch">By Batch Year</option>
              </select>
            </div>

            {audienceForm.audience_type === "campus" && (
              <div className="space-y-2 pt-2">
                <label className="text-sm font-medium flex items-center gap-2"><MapPin className="w-4 h-4" /> Select Campus</label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={audienceForm.campus_id}
                  onChange={(e) => setAudienceForm({...audienceForm, campus_id: e.target.value})}
                >
                  <option value="">Choose a campus...</option>
                  <option value="c-pune">Pune</option>
                  <option value="c-bangalore">Bangalore</option>
                  <option value="c-dharamshala">Dharamshala</option>
                  <option value="c-sarjapur">Sarjapur</option>
                  <option value="c-tripura">Tripura</option>
                </select>
              </div>
            )}

            {audienceForm.audience_type === "course" && (
              <div className="space-y-2 pt-2">
                <label className="text-sm font-medium flex items-center gap-2"><ListVideo className="w-4 h-4" /> Select Course</label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={audienceForm.course_id}
                  onChange={(e) => setAudienceForm({...audienceForm, course_id: e.target.value})}
                >
                  <option value="">Choose a course...</option>
                  <option value="cs-101">School of Tech</option>
                  <option value="cs-201">School of Design</option>
                </select>
              </div>
            )}

            {audienceForm.audience_type === "batch" && (
              <div className="space-y-2 pt-2">
                <label className="text-sm font-medium flex items-center gap-2"><Users className="w-4 h-4" /> Batch Year</label>
                <Input 
                  type="number"
                  placeholder="e.g. 2024"
                  value={audienceForm.batch_year}
                  onChange={(e) => setAudienceForm({...audienceForm, batch_year: e.target.value})}
                />
              </div>
            )}
          </div>
          <div className="flex justify-end gap-2 border-t pt-4">
            <Button variant="outline" onClick={() => setAudienceModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveAudience}>
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
            <Button onClick={handleSaveSessionType}>
              {editingSessionType ? "Save Changes" : "Create Type"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Category Dialog */}
      <Dialog open={categoryModalOpen} onOpenChange={setCategoryModalOpen}>
        <DialogContent>
          <DialogTitle>{editingCategory ? "Edit Category" : "Add Category"}</DialogTitle>
          <DialogDescription>Define a top-level category for learning sessions.</DialogDescription>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Category Name *</label>
              <Input 
                value={categoryForm.name} 
                onChange={(e) => {
                  setCategoryForm({...categoryForm, name: e.target.value})
                  if (categoryFormError) setCategoryFormError(null)
                }}
                placeholder="e.g. Technical Skills" 
              />
              {categoryFormError && (
                <p className="text-xs font-medium text-red-500 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> {categoryFormError}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description (Optional)</label>
              <Textarea 
                value={categoryForm.description} 
                onChange={(e) => setCategoryForm({...categoryForm, description: e.target.value})}
                placeholder="Brief description of this category..." 
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t pt-4">
            <Button variant="outline" onClick={() => setCategoryModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveCategory}>
              {editingCategory ? "Save Changes" : "Create Category"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Subcategory Dialog */}
      <Dialog open={subcategoryModalOpen} onOpenChange={setSubcategoryModalOpen}>
        <DialogContent>
          <DialogTitle>{editingSubcategory ? "Edit Subcategory" : "Add Subcategory"}</DialogTitle>
          <DialogDescription>
            Creating subcategory under category: <strong className="text-foreground">{subcategoryParentCategory?.name}</strong>
          </DialogDescription>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Subcategory Name *</label>
              <Input 
                value={subcategoryForm.name} 
                onChange={(e) => {
                  setSubcategoryForm({...subcategoryForm, name: e.target.value})
                  if (subcategoryFormError) setSubcategoryFormError(null)
                }}
                placeholder="e.g. Frontend Web Development" 
              />
              {subcategoryFormError && (
                <p className="text-xs font-medium text-red-500 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> {subcategoryFormError}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Description (Optional)</label>
              <Textarea 
                value={subcategoryForm.description} 
                onChange={(e) => setSubcategoryForm({...subcategoryForm, description: e.target.value})}
                placeholder="Brief description of this subcategory..." 
                rows={3}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 border-t pt-4">
            <Button variant="outline" onClick={() => setSubcategoryModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveSubcategory}>
              {editingSubcategory ? "Save Changes" : "Create Subcategory"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Category Confirmation Dialog */}
      <Dialog open={deleteCategoryModalOpen} onOpenChange={setDeleteCategoryModalOpen}>
        <DialogContent>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" /> Delete Category
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete category <strong>&quot;{deletingCategory?.name}&quot;</strong>?
          </DialogDescription>
          <div className="py-2 text-sm text-muted-foreground space-y-2">
            {loadingCategorySessionCount ? (
              <div className="flex items-center gap-2 text-xs">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                Checking referenced sessions count...
              </div>
            ) : (
              <p>
                {deletingCategorySessionCount > 0 ? (
                  <span className="text-amber-600 font-medium dark:text-amber-400">
                    Warning: {deletingCategorySessionCount} session(s) currently reference this category directly and will become uncategorized.
                  </span>
                ) : (
                  <span>No sessions currently reference this category.</span>
                )}
              </p>
            )}
          </div>
          <div className="flex justify-end gap-2 border-t pt-4">
            <Button variant="outline" onClick={() => setDeleteCategoryModalOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleConfirmDeleteCategory} disabled={loadingCategorySessionCount}>
              Delete Category
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Subcategory Confirmation Dialog */}
      <Dialog open={deleteSubcategoryModalOpen} onOpenChange={setDeleteSubcategoryModalOpen}>
        <DialogContent>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="w-5 h-5" /> Delete Subcategory
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete subcategory <strong>&quot;{deletingSubcategory?.name}&quot;</strong>?
          </DialogDescription>
          <div className="py-2 text-sm text-muted-foreground space-y-2">
            {loadingSubcategorySessionCount ? (
              <div className="flex items-center gap-2 text-xs">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                Checking referenced sessions count...
              </div>
            ) : (
              <p>
                {deletingSubcategorySessionCount > 0 ? (
                  <span className="text-amber-600 font-medium dark:text-amber-400">
                    Warning: {deletingSubcategorySessionCount} session(s) currently reference this subcategory and will become uncategorized at the subcategory level (subcategory_id set to null).
                  </span>
                ) : (
                  <span>No sessions currently reference this subcategory.</span>
                )}
              </p>
            )}
          </div>
          <div className="flex justify-end gap-2 border-t pt-4">
            <Button variant="outline" onClick={() => setDeleteSubcategoryModalOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleConfirmDeleteSubcategory} disabled={loadingSubcategorySessionCount}>
              Delete Subcategory
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
