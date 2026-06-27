"use client";

import React, { useState, useEffect, useRef } from "react";
import { useUserContext } from "@/contexts/user-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Lock,
  Plus,
  X,
  Upload,
  Camera,
  Save,
  Sparkles,
  Github,
  Linkedin,
  Briefcase,
  GraduationCap,
  UserSquare2,
  Calendar,
  Palette,
  BookOpen
} from "lucide-react";

// Presets for the preview card gradient banner
const BANNER_THEMES = [
  { id: "midnight", name: "Midnight Lavender", class: "bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600" },
  { id: "ocean", name: "Ocean Breeze", class: "bg-gradient-to-r from-teal-500 via-blue-600 to-indigo-600" },
  { id: "sunset", name: "Sunset Glow", class: "bg-gradient-to-r from-orange-500 via-pink-500 to-red-500" },
  { id: "forest", name: "Emerald Forest", class: "bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600" },
];

export default function ProfilePage() {
  const contextUser = useUserContext();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Profile Form States
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");

  // Custom NGConnect Fields
  const [campus, setCampus] = useState("");
  const [role, setRole] = useState("");
  const [batch, setBatch] = useState("");
  const [bio, setBio] = useState("");
  const [education, setEducation] = useState("");
  const [course, setCourse] = useState("");

  // Social Links
  const [github, setGithub] = useState("");
  const [linkedin, setLinkedin] = useState("");

  // Skills Tags
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");

  // Avatar State
  const [avatarUrl, setAvatarUrl] = useState("");

  // Custom Card Background Banner
  const [selectedTheme, setSelectedTheme] = useState("midnight");

  const [isSaving, setIsSaving] = useState(false);
  const [isAlumni, setIsAlumni] = useState(true);

  // Initialize data
  useEffect(() => {
    // 1. First check localStorage for previously saved profile details
    const stored = localStorage.getItem("ngconnect_profile");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setName(parsed.name || "");
        setEmail(parsed.email || "");
        setPhone(parsed.phone || "");
        setGender(parsed.gender || "");
        setCity(parsed.city || "");
        setState(parsed.state || "");
        setCampus(parsed.campus || "");
        setRole(parsed.role || "");
        setBatch(parsed.batch || "");
        setBio(parsed.bio || "");
        setEducation(parsed.education || "");
        setCourse(parsed.course || "");
        setGithub(parsed.github || "");
        setLinkedin(parsed.linkedin || "");
        setSkills(parsed.skills || []);
        setAvatarUrl(parsed.avatarUrl || "");
        setSelectedTheme(parsed.selectedTheme || "midnight");
        
        // Prioritize context/Supabase truth if available
        if (contextUser) {
          setIsAlumni(contextUser.isAlumni !== false);
        } else {
          setIsAlumni(parsed.isAlumni !== false);
        }
        return;
      } catch (e) {
        console.error("Error reading localStorage", e);
      }
    }

    // 2. Otherwise fallback to UserContext / Context User metadata if available
    if (contextUser) {
      setName(contextUser.name || "");
      setEmail(contextUser.email || "");
      setAvatarUrl(contextUser.avatar || "");
      setRole(contextUser.role || "Student");
      setIsAlumni(contextUser.isAlumni !== false);
    } else {
      // Complete Dummy Fallbacks for testing frontend immediately
      setName("Nitin Sudarshan");
      setEmail("nitin@navgurukul.org");
      setPhone("+91 98765 43210");
      setGender("Male");
      setCity("Dharamshala");
      setState("Himachal Pradesh");
      setCampus("Dharamshala");
      setRole("Admin");
      setBatch("2020");
      setBio("Full-stack enthusiast passionate about education, mentorship, and building open-source projects for the NavGurukul ecosystem.");
      setEducation("Undergraduate (Bachelors)");
      setCourse("Software Engineering (JavaScript)");
      setGithub("https://github.com/nitin");
      setLinkedin("https://linkedin.com/in/nitin");
      setSkills(["React", "Next.js", "TypeScript"]);
      setAvatarUrl("");
      setIsAlumni(true);
    }
  }, [contextUser]);

  // Handle Mock Save
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    // Simulate saving delay
    setTimeout(() => {
      const profileData = {
        name,
        email,
        phone,
        gender,
        city,
        state,
        campus,
        role,
        batch,
        bio,
        github,
        linkedin,
        skills,
        avatarUrl,
        selectedTheme,
        education,
        course,
        isAlumni
      };

      localStorage.setItem("ngconnect_profile", JSON.stringify(profileData));
      setIsSaving(false);
      toast.success("Profile saved successfully!", {
        description: "Your local profile configurations have been updated.",
      });
    }, 800);
  };

  // Skill Add Handler
  const handleAddSkill = (e: React.KeyboardEvent | React.MouseEvent) => {
    if (e.type === "keydown" && (e as React.KeyboardEvent).key !== "Enter") {
      return;
    }
    e.preventDefault();
    const trimmed = skillInput.trim();
    if (trimmed) {
      if (skills.length >= 3) {
        toast.warning("Limit reached", {
          description: "You can add up to 3 professional skills only.",
        });
        return;
      }
      if (!skills.includes(trimmed)) {
        setSkills([...skills, trimmed]);
        setSkillInput("");
      }
    }
  };

  // Skill Delete Handler
  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter(s => s !== skillToRemove));
  };

  // Avatar Mock Upload
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result as string);
        toast.info("Avatar uploaded!", {
          description: "Don't forget to save changes to persist your avatar.",
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const getInitials = (fullName: string) => {
    return fullName
      ? fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
      : "NG";
  };

  const currentTheme = BANNER_THEMES.find(t => t.id === selectedTheme) || BANNER_THEMES[0];

  const completionItems = [
    { id: "name", label: "Full Name", filled: !!name },
    { id: "phone", label: "Phone Number", filled: !!phone },
    { id: "gender", label: "Gender Selection", filled: !!gender },
    { id: "city", label: "City", filled: !!city },
    { id: "state", label: "State", filled: !!state },
    ...(isAlumni ? [
      { id: "campus", label: "Campus Location", filled: !!campus },
      { id: "education", label: "Education Level", filled: !!education },
      { id: "course", label: "Course Selected", filled: !!course },
      { id: "batch", label: "Batch Year", filled: !!batch }
    ] : []),
    { id: "avatar", label: "Profile Picture", filled: !!avatarUrl }
  ];

  const completedCount = completionItems.filter(item => item.filled).length;
  const completionPercentage = Math.round((completedCount / completionItems.length) * 100);

  return (
    <div className="flex flex-1 flex-col gap-8 p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full pb-20 animate-fade-in">

      {/* Header section with description */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between border-b pb-5">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-zinc-50">Profile Settings</h1>
          <p className="text-muted-foreground text-sm md:text-base mt-1">
            Update your professional information and customize how your profile looks on the network.
          </p>
        </div>
        <div className="flex items-center gap-2 mt-4 md:mt-0 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900/60 px-3 py-1.5 rounded-lg text-xs font-medium">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Local Mock Database Active</span>
        </div>
      </div>

      {/* Grid Layout: Form vs Live Preview Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

        {/* Left Side: Profile Form Details (Span 2 Columns) */}
        <form onSubmit={handleSave} className="lg:col-span-2 space-y-6">

          {/* Card 1: Account & Profile Picture */}
          <Card className="pt-0 border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-100/50 dark:bg-zinc-800/50 border-b border-slate-100 dark:border-zinc-900 pt-6 pb-6">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <UserSquare2 className="h-5 w-5 text-indigo-500" />
                Profile Details & Account
              </CardTitle>
              <CardDescription>Configure your visual display identity and main details.</CardDescription>
            </CardHeader>
            <CardContent className="pt-2 space-y-6">

              {/* Avatar Uploader UI */}
              <div className="flex flex-col sm:flex-row items-center gap-6 pb-2">
                <div className="relative group">
                  <Avatar className="h-24 w-24 border-4 border-white dark:border-zinc-950 shadow-md ring-2 ring-indigo-500/20">
                    <AvatarImage src={avatarUrl} alt={name} className="object-cover" />
                    <AvatarFallback className="text-xl font-bold bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400">
                      {getInitials(name)}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    type="button"
                    onClick={triggerFileInput}
                    className="absolute -bottom-1 -right-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full p-2 shadow-lg transition-transform hover:scale-105"
                    title="Change Avatar"
                  >
                    <Camera className="h-4 w-4" />
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleAvatarChange}
                    accept="image/*"
                    className="hidden"
                  />
                </div>

                <div className="flex-1 text-center sm:text-left space-y-2">
                  <h3 className="font-semibold text-slate-800 dark:text-zinc-200 text-base">Profile Image</h3>
                  <p className="text-xs text-muted-foreground max-w-sm">
                    Upload a square photo (JPG, PNG, or WEBP up to 2MB). Your image will be cached locally on this device.
                  </p>
                  <div className="flex flex-wrap justify-center sm:justify-start gap-2 pt-1">
                    <Button type="button" variant="outline" size="sm" onClick={triggerFileInput} className="text-xs gap-1.5 h-8">
                      <Upload className="h-3.5 w-3.5" />
                      Upload Image
                    </Button>
                    {avatarUrl && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setAvatarUrl("");
                          toast.info("Avatar cleared!");
                        }}
                        className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 h-8"
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Form Input Elements */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Full Name */}
                <div className="space-y-1.5">
                  <Label htmlFor="fullName" className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                    Full Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="fullName"
                    required
                    placeholder="e.g. Nitin Sudarshan"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-10 border-slate-200 dark:border-zinc-800 focus:ring-indigo-500 focus:border-indigo-500 focus-visible:ring-indigo-500"
                  />
                </div>

                {/* Email (LOCKED ON REGISTRATION) */}
                <div className="space-y-1.5">
                  <Label htmlFor="emailInput" className="text-xs font-semibold text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
                    Email Address
                    <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                      <Lock className="h-2.5 w-2.5" /> Locked
                    </span>
                  </Label>
                  <Input
                    id="emailInput"
                    type="email"
                    disabled
                    value={email}
                    className="h-10 bg-slate-100/70 dark:bg-zinc-900/60 border-slate-200/60 dark:border-zinc-900 text-slate-500 dark:text-zinc-400 cursor-not-allowed select-none font-mono"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <Label htmlFor="phoneNumber" className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                    Phone Number
                  </Label>
                  <Input
                    id="phoneNumber"
                    type="tel"
                    placeholder="e.g. +91 99999 88888"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="h-10 border-slate-200 dark:border-zinc-800 focus:ring-indigo-500 focus-visible:ring-indigo-500"
                  />
                </div>

                {/* Gender */}
                <div className="space-y-1.5">
                  <Label htmlFor="genderSelect" className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                    Gender
                  </Label>
                  <Select value={gender} onValueChange={setGender}>
                    <SelectTrigger id="genderSelect" className="w-full h-10 border-slate-200 dark:border-zinc-800 focus:ring-indigo-500">
                      <SelectValue placeholder="Select Gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Non-Binary">Non-Binary</SelectItem>
                      <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* City */}
                <div className="space-y-1.5">
                  <Label htmlFor="cityName" className="text-xs font-semibold text-slate-700 dark:text-zinc-300">City</Label>
                  <Input
                    id="cityName"
                    placeholder="e.g. Dharamshala"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="h-10 border-slate-200 dark:border-zinc-800"
                  />
                </div>

                {/* State */}
                <div className="space-y-1.5">
                  <Label htmlFor="stateName" className="text-xs font-semibold text-slate-700 dark:text-zinc-300">State</Label>
                  <Input
                    id="stateName"
                    placeholder="e.g. Himachal Pradesh"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="h-10 border-slate-200 dark:border-zinc-800"
                  />
                </div>

              </div>

            </CardContent>
          </Card>

          {/* Card 2: Campus and Education (NGConnect specifics) */}
          {isAlumni && (
            <Card className="pt-0 border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden">
              <CardHeader className="bg-slate-100/50 dark:bg-zinc-800/50 border-b border-slate-100 dark:border-zinc-900 pt-6 pb-6">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-indigo-500" />
                  Affiliation & Education
                </CardTitle>
                <CardDescription>Specify your campus and academic background.</CardDescription>
              </CardHeader>
              <CardContent className="pt-2">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  {/* Campus Select */}
                  <div className="space-y-1.5">
                    <Label htmlFor="campusSelect" className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                      NavGurukul Campus
                    </Label>
                    <Select value={campus} onValueChange={setCampus}>
                      <SelectTrigger id="campusSelect" className="w-full h-10 border-slate-200 dark:border-zinc-800">
                        <SelectValue placeholder="Select Campus" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Dharamshala">Dharamshala</SelectItem>
                        <SelectItem value="Sarjapur">Sarjapur</SelectItem>
                        <SelectItem value="Pune">Pune</SelectItem>
                        <SelectItem value="Bengaluru">Bengaluru</SelectItem>
                        <SelectItem value="Other">Other / Remote</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Highest level of education */}
                  <div className="space-y-1.5">
                    <Label htmlFor="educationSelect" className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                      Highest Education
                    </Label>
                    <Select value={education} onValueChange={setEducation}>
                      <SelectTrigger id="educationSelect" className="w-full h-10 border-slate-200 dark:border-zinc-800">
                        <SelectValue placeholder="Select Education" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="High School (10th)">High School (10th)</SelectItem>
                        <SelectItem value="Intermediate (12th)">Intermediate (12th)</SelectItem>
                        <SelectItem value="Diploma">Diploma</SelectItem>
                        <SelectItem value="Undergraduate (Bachelors)">Undergraduate (Bachelors)</SelectItem>
                        <SelectItem value="Postgraduate (Masters)">Postgraduate (Masters)</SelectItem>
                        <SelectItem value="PhD">PhD / Doctorate</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Course Taken */}
                  <div className="space-y-1.5">
                    <Label htmlFor="courseSelect" className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                      Course Taken
                    </Label>
                    <Select value={course} onValueChange={setCourse}>
                      <SelectTrigger id="courseSelect" className="w-full h-10 border-slate-200 dark:border-zinc-800">
                        <SelectValue placeholder="Select Course" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Software Engineering (Python)">Software Engineering (Python)</SelectItem>
                        <SelectItem value="Software Engineering (JavaScript)">Software Engineering (JavaScript)</SelectItem>
                        <SelectItem value="Software Engineering (React/Frontend)">Software Engineering (React/Frontend)</SelectItem>
                        <SelectItem value="Data Science & Analytics">Data Science & Analytics</SelectItem>
                        <SelectItem value="Graphic Design & UX/UI">Graphic Design & UX/UI</SelectItem>
                        <SelectItem value="Product Management">Product Management</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Graduation / Joining Batch */}
                  <div className="space-y-1.5">
                    <Label htmlFor="batchYearSelect" className="text-xs font-semibold text-slate-700 dark:text-zinc-300">
                      Batch Year
                    </Label>
                    <Select value={batch} onValueChange={setBatch}>
                      <SelectTrigger id="batchYearSelect" className="w-full h-10 border-slate-200 dark:border-zinc-800">
                        <SelectValue placeholder="Select Batch Year" />
                      </SelectTrigger>
                      <SelectContent className="max-h-56 overflow-y-auto">
                        {Array.from(
                          { length: new Date().getFullYear() - 2017 + 1 },
                          (_, i) => (new Date().getFullYear() - i).toString()
                        ).map((year) => (
                          <SelectItem key={year} value={year}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                </div>

              </CardContent>
            </Card>
          )}

          {/* Card 3: Social Profile, About Me & Skills */}
          {isAlumni && (
            <Card className="pt-0 border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden">
              <CardHeader className="bg-slate-100/50 dark:bg-zinc-800/50 border-b border-slate-100 dark:border-zinc-900 pt-6 pb-6">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-indigo-500" />
                  About & Professional Presence
                </CardTitle>
                <CardDescription>Add bio info, social profile connections, and tech tags.</CardDescription>
              </CardHeader>
              <CardContent className="pt-2 space-y-5">

                {/* Bio / About */}
                <div className="space-y-1.5">
                  <Label htmlFor="bioText" className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Biography / Summary</Label>
                  <Textarea
                    id="bioText"
                    placeholder="Share a short summary about your background, achievements, and goals..."
                    rows={4}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="border-slate-200 dark:border-zinc-800 focus:ring-indigo-500"
                  />
                </div>

                {/* Skills Tags Manager */}
                <div className="space-y-2">
                  <Label className="text-xs font-semibold text-slate-700 dark:text-zinc-300">Professional Skills</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Type skill (e.g. Python, SQL) and press Add or Enter"
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={handleAddSkill}
                      className="h-9 border-slate-200 dark:border-zinc-800 flex-1"
                    />
                    <Button type="button" size="sm" variant="secondary" onClick={handleAddSkill} className="h-9 gap-1 text-xs">
                      <Plus className="h-3.5 w-3.5" /> Add
                    </Button>
                  </div>
                  {/* Render skills tags list */}
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {skills.length === 0 ? (
                      <span className="text-xs text-muted-foreground italic">No skills listed yet. Add skills above.</span>
                    ) : (
                      skills.map((skill) => (
                        <Badge
                          key={skill}
                          variant="secondary"
                          className="py-1 px-2.5 rounded-full text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-300 flex items-center gap-1.5 group transition-all"
                        >
                          {skill}
                          <button
                            type="button"
                            onClick={() => handleRemoveSkill(skill)}
                            className="text-muted-foreground group-hover:text-red-500 rounded-full hover:bg-slate-300/40 dark:hover:bg-zinc-700/40 p-0.5"
                            title={`Remove ${skill}`}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))
                    )}
                  </div>
                </div>

                {/* Social Channels */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">

                  {/* GitHub */}
                  <div className="space-y-1.5">
                    <Label htmlFor="githubUrl" className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1">
                      <Github className="h-3.5 w-3.5" /> GitHub Profile URL
                    </Label>
                    <Input
                      id="githubUrl"
                      type="url"
                      placeholder="https://github.com/username"
                      value={github}
                      onChange={(e) => setGithub(e.target.value)}
                      className="h-10 border-slate-200 dark:border-zinc-800"
                    />
                  </div>

                  {/* LinkedIn */}
                  <div className="space-y-1.5">
                    <Label htmlFor="linkedinUrl" className="text-xs font-semibold text-slate-700 dark:text-zinc-300 flex items-center gap-1">
                      <Linkedin className="h-3.5 w-3.5" /> LinkedIn Profile URL
                    </Label>
                    <Input
                      id="linkedinUrl"
                      type="url"
                      placeholder="https://linkedin.com/in/username"
                      value={linkedin}
                      onChange={(e) => setLinkedin(e.target.value)}
                      className="h-10 border-slate-200 dark:border-zinc-800"
                    />
                  </div>

                </div>

              </CardContent>
            </Card>
          )}

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (confirm("Reset form? This will reload your saved changes.")) {
                  window.location.reload();
                }
              }}
              className="h-11 px-5 text-sm"
            >
              Reset Changes
            </Button>

            <Button
              type="submit"
              disabled={isSaving}
              className="h-11 px-6 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white gap-2 transition-all hover:shadow-lg disabled:opacity-75"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>

        </form>

        {/* Right Side: Sticky live preview showcase card */}
        <div className="lg:sticky lg:top-6 space-y-6">

          {/* Profile Strength / Completion Card */}
          <Card className="pt-0 border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-zinc-900 bg-slate-100/50 dark:bg-zinc-800/50 pt-6">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-indigo-500 animate-pulse" /> Profile Strength
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-2 pb-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700 dark:text-zinc-300">
                    {completionPercentage === 100
                      ? "Excellent! Profile is complete."
                      : completionPercentage >= 70
                        ? "Looking good! Almost complete."
                        : "Let's complete your profile."}
                  </span>
                  <span className="font-bold text-indigo-600 dark:text-indigo-400">{completionPercentage}%</span>
                </div>
                <Progress value={completionPercentage} className="h-2 w-full bg-slate-100 dark:bg-zinc-800" />
              </div>

              {/* Dynamic Checklist */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-900">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 block mb-2">Completion Checklist</span>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                  {completionItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-zinc-400">
                      {item.filled ? (
                        <span className="text-emerald-500 font-bold shrink-0">✓</span>
                      ) : (
                        <span className="text-slate-300 dark:text-zinc-700 font-extrabold shrink-0">•</span>
                      )}
                      <span className={item.filled ? "line-through text-muted-foreground/60 truncate" : "truncate"}>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card Theme Picker */}
          <Card className="pt-0 border-slate-200 dark:border-zinc-800 shadow-sm overflow-hidden">
            <CardHeader className="py-4 border-b border-slate-100 dark:border-zinc-900 bg-slate-100/50 dark:bg-zinc-800/50 pt-4">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400 flex items-center gap-1.5">
                <Palette className="h-3.5 w-3.5 text-indigo-500" /> Customize Card Banner
              </CardTitle>
            </CardHeader>
            <CardContent className="py-2">
              <div className="grid grid-cols-2 gap-2">
                {BANNER_THEMES.map((theme) => (
                  <button
                    key={theme.id}
                    type="button"
                    onClick={() => setSelectedTheme(theme.id)}
                    className={`flex items-center gap-2 p-2 rounded-lg border text-left text-xs font-medium transition-all group ${selectedTheme === theme.id
                      ? "border-indigo-600 bg-indigo-50/40 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300 shadow-sm"
                      : "border-slate-100 hover:border-slate-300 dark:border-zinc-800 dark:hover:border-zinc-700 text-slate-600 dark:text-zinc-400"
                      }`}
                  >
                    <span className={`h-4 w-4 rounded-full ${theme.class} border border-white/20`} />
                    <span className="truncate">{theme.name}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Premium Profile Showcase Card */}
          <div className="group relative overflow-hidden rounded-2xl border border-slate-200 dark:border-zinc-800 shadow-lg bg-white dark:bg-zinc-950 transition-all hover:shadow-xl duration-300">

            {/* 1. Header Gradient Banner */}
            <div className={`h-32 w-full transition-all duration-500 relative ${currentTheme.class}`}>
              <div className="absolute inset-0 bg-black/10 backdrop-blur-[1px]" />
              <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-md text-white text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border border-white/10 shadow-sm">
                Live Preview
              </div>
            </div>

            {/* 2. Content Body Area */}
            <div className="px-6 pb-6 pt-0 relative flex flex-col items-center text-center">

              {/* Profile Avatar overlapping header */}
              <div className="relative -mt-14 mb-3">
                <Avatar className="h-24 w-24 border-4 border-white dark:border-zinc-950 shadow-lg object-cover">
                  <AvatarImage src={avatarUrl} alt={name || "User"} />
                  <AvatarFallback className="text-xl font-bold bg-indigo-100 dark:bg-zinc-800 text-indigo-700 dark:text-zinc-200">
                    {getInitials(name)}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* Name and Designation */}
              <h2 className="text-xl font-extrabold text-slate-800 dark:text-zinc-100 tracking-tight leading-snug flex items-center gap-1.5 justify-center">
                {name || "Your Name"}
              </h2>

              {/* Badges row: Role & Campus */}
              <div className="flex flex-wrap gap-1.5 justify-center mt-2.5">
                {role && (
                  <Badge className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border-indigo-100 dark:border-indigo-900/60 font-semibold text-[10px] uppercase tracking-wider py-0.5 px-2 hover:bg-indigo-50">
                    {role}
                  </Badge>
                )}
                {isAlumni && campus && (
                  <Badge variant="outline" className="text-slate-600 dark:text-zinc-400 border-slate-200 dark:border-zinc-800 bg-slate-100/50 dark:bg-zinc-900/30 text-[10px] uppercase tracking-wider py-0.5 px-2 font-medium">
                    {campus} Campus
                  </Badge>
                )}
                {isAlumni && batch && (
                  <Badge variant="secondary" className="bg-slate-100 dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 text-[10px] tracking-wide py-0.5 px-2 font-medium border border-slate-200/50 dark:border-zinc-800/40">
                    Class of {batch}
                  </Badge>
                )}
              </div>

              {/* Separation Divider */}
              <div className="w-full border-t border-slate-100 dark:border-zinc-900 my-4" />

              {/* Detailed Contact Attributes list */}
              <div className="w-full space-y-2.5 text-left text-xs px-2 text-slate-600 dark:text-zinc-400">

                {/* Email Address */}
                <div className="flex items-center gap-2.5 py-0.5">
                  <Mail className="h-4 w-4 text-slate-400 dark:text-zinc-500 shrink-0" />
                  <span className="truncate" title={email}>{email || "email@example.com"}</span>
                  <span title="Locked auth record" className="ml-auto shrink-0">
                    <Lock className="h-3 w-3 text-amber-500/80" />
                  </span>
                </div>



                {/* Course Taken */}
                {isAlumni && course && (
                  <div className="flex items-center gap-2.5 py-0.5">
                    <BookOpen className="h-4 w-4 text-slate-400 dark:text-zinc-500 shrink-0" />
                    <span className="truncate" title={course}>Course: {course}</span>
                  </div>
                )}
              </div>

              {/* Skills Area on the card preview */}
              {isAlumni && skills.length > 0 && (
                <>
                  <div className="w-full border-t border-slate-100 dark:border-zinc-900 my-4" />
                  <div className="w-full text-left px-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 block mb-2">Skills & Technologies</span>
                    <div className="flex flex-wrap gap-1">
                      {skills.map((skill) => (
                        <span
                          key={skill}
                          className="text-[10px] bg-slate-50 dark:bg-zinc-800/50 text-slate-600 dark:text-zinc-300 font-medium px-2 py-0.5 rounded border border-slate-100 dark:border-zinc-800/80"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Social profile quick link buttons */}
              {isAlumni && (github || linkedin) && (
                <>
                  <div className="w-full border-t border-slate-100 dark:border-zinc-900 my-4" />
                  <div className="flex items-center gap-3">
                    {github && (
                      <a
                        href={github}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-full border border-slate-100 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900 text-slate-600 dark:text-zinc-400 transition-colors"
                        title="GitHub Profile"
                      >
                        <Github className="h-4 w-4" />
                      </a>
                    )}
                    {linkedin && (
                      <a
                        href={linkedin}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-full border border-slate-100 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-900 text-slate-600 dark:text-zinc-400 transition-colors"
                        title="LinkedIn Profile"
                      >
                        <Linkedin className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </>
              )}

            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
