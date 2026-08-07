"use client";

import React, { useState } from "react";
import { Activity, Sun, Sparkles, Moon, Award, Smile, Flame, TrendingUp, Clock, Coffee, User, Building2, Briefcase, DollarSign, Code2, GraduationCap, ArrowRight } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function ComponentsShowcasePage() {
  const [progress, setProgress] = useState(60);

  return (
    <div className="flex flex-1 flex-col gap-10 p-4 md:p-8 max-w-7xl mx-auto w-full pb-20 animate-in fade-in slide-in-from-bottom-3 duration-500">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Components Showcase</h1>
        <p className="text-muted-foreground text-lg">
          A comprehensive style guide of all pre-installed shadcn/ui components and their variations.
        </p>
      </div>

      <Separator />

      {/* 1. Typography, Buttons & Badges */}
      <section className="space-y-6">
        <h2 className="text-2xl font-semibold tracking-tight border-b pb-2">Typography, Buttons & Badges</h2>
        
        <div className="space-y-8">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Typography</h3>
            <div className="space-y-4 bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
              <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">Heading 1</h1>
              <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0">Heading 2</h2>
              <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">Heading 3</h3>
              <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">Heading 4</h4>
              <p className="leading-7 [&:not(:first-child)]:mt-6">The king, seeing how much happier his subjects were, realized the error of his ways and repealed the joke tax.</p>
              <blockquote className="mt-6 border-l-2 pl-6 italic">"After all," he said, "everyone enjoys a good joke, so it's only fair that they should pay for the privilege."</blockquote>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Buttons</h3>
            <div className="flex flex-wrap gap-4 bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
              <Button>Default</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="link">Link</Button>
              <Button disabled>Disabled</Button>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Badges</h3>
            <div className="flex flex-wrap gap-4 bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="destructive">Destructive</Badge>
              <Badge variant="outline">Outline</Badge>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Forms & Inputs */}
      <section className="space-y-6 mt-10">
        <h2 className="text-2xl font-semibold tracking-tight border-b pb-2">Forms & Inputs</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="m@example.com" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="message">Message</Label>
              <Textarea id="message" placeholder="Type your message here." />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="framework">Framework</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select a framework" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="next">Next.js</SelectItem>
                  <SelectItem value="sveltekit">SvelteKit</SelectItem>
                  <SelectItem value="astro">Astro</SelectItem>
                  <SelectItem value="remix">Remix</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex items-center space-x-2">
              <Checkbox id="terms" />
              <Label htmlFor="terms">Accept terms and conditions</Label>
            </div>
            <div className="space-y-3">
              <Label>Notification Preference</Label>
              <RadioGroup defaultValue="comfortable">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="default" id="r1" />
                  <Label htmlFor="r1">Default</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="comfortable" id="r2" />
                  <Label htmlFor="r2">Comfortable</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="compact" id="r3" />
                  <Label htmlFor="r3">Compact</Label>
                </div>
              </RadioGroup>
            </div>
            <div className="flex items-center space-x-2">
              <Switch id="airplane-mode" />
              <Label htmlFor="airplane-mode">Airplane Mode</Label>
            </div>
            <div className="space-y-3">
              <Label>Volume</Label>
              <Slider defaultValue={[50]} max={100} step={1} />
            </div>
          </div>
        </div>
      </section>

      {/* 3. Overlays & Modals */}
      <section className="space-y-6 mt-10">
        <h2 className="text-2xl font-semibold tracking-tight border-b pb-2">Overlays & Modals</h2>
        
        <div className="flex flex-wrap gap-6 bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Open Dialog</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Edit profile</DialogTitle>
                <DialogDescription>
                  Make changes to your profile here. Click save when you're done.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">Name</Label>
                  <Input id="name" defaultValue="Pedro Duarte" className="col-span-3" />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit">Save changes</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline">Open Sheet</Button>
            </SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Are you absolutely sure?</SheetTitle>
                <SheetDescription>
                  This action cannot be undone. This will permanently delete your account.
                </SheetDescription>
              </SheetHeader>
            </SheetContent>
          </Sheet>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">Open Dropdown</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Billing</DropdownMenuItem>
              <DropdownMenuItem>Team</DropdownMenuItem>
              <DropdownMenuItem>Subscription</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline">Hover Tooltip</Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Add to library</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </section>

      {/* 4. Data Display & Feedback */}
      <section className="space-y-6 mt-10">
        <h2 className="text-2xl font-semibold tracking-tight border-b pb-2">Data Display & Feedback</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
          <Card>
            <CardHeader>
              <CardTitle>Card Title</CardTitle>
              <CardDescription>Card Description goes here.</CardDescription>
            </CardHeader>
            <CardContent>
              <p>Card Content is the main body of the card.</p>
            </CardContent>
            <CardFooter>
              <Button>Action</Button>
            </CardFooter>
          </Card>

          <div className="space-y-8">
            <div className="flex gap-4">
              <Avatar>
                <AvatarImage src="https://github.com/shadcn.png" alt="@shadcn" />
                <AvatarFallback>CN</AvatarFallback>
              </Avatar>
              <Avatar>
                <AvatarFallback>AB</AvatarFallback>
              </Avatar>
            </div>

            <div className="space-y-2">
              <Label>Progress</Label>
              <Progress value={progress} className="w-full" />
            </div>

            <div className="space-y-2">
              <Label>Skeleton Loader</Label>
              <div className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-1 md:col-span-2 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Invoice</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">INV001</TableCell>
                  <TableCell>Paid</TableCell>
                  <TableCell>Credit Card</TableCell>
                  <TableCell className="text-right">$250.00</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">INV002</TableCell>
                  <TableCell>Pending</TableCell>
                  <TableCell>PayPal</TableCell>
                  <TableCell className="text-right">$150.00</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      </section>

      {/* 5. Layout & Navigation */}
      <section className="space-y-6 mt-10">
        <h2 className="text-2xl font-semibold tracking-tight border-b pb-2">Layout & Navigation</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-slate-50 dark:bg-slate-900/50 p-6 rounded-xl border border-slate-200 dark:border-slate-800">
          <Tabs defaultValue="account" className="w-[400px] max-w-full">
            <TabsList>
              <TabsTrigger value="account">Account</TabsTrigger>
              <TabsTrigger value="password">Password</TabsTrigger>
            </TabsList>
            <TabsContent value="account" className="p-4 border rounded-md mt-2 bg-background">Make changes to your account here.</TabsContent>
            <TabsContent value="password" className="p-4 border rounded-md mt-2 bg-background">Change your password here.</TabsContent>
          </Tabs>

          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>Is it accessible?</AccordionTrigger>
              <AccordionContent>
                Yes. It adheres to the WAI-ARIA design pattern.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>Is it styled?</AccordionTrigger>
              <AccordionContent>
                Yes. It comes with default styles that matches the other components' aesthetic.
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <Collapsible className="space-y-2 border p-4 rounded-md bg-background">
            <div className="flex items-center justify-between space-x-4 px-4">
              <h4 className="text-sm font-semibold">@peduarte starred 3 repositories</h4>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-9 p-0">
                  <span className="sr-only">Toggle</span>
                  <i className="fa-solid fa-chevron-down"></i>
                </Button>
              </CollapsibleTrigger>
            </div>
            <div className="rounded-md border px-4 py-3 font-mono text-sm">@radix-ui/primitives</div>
            <CollapsibleContent className="space-y-2">
              <div className="rounded-md border px-4 py-3 font-mono text-sm">@radix-ui/colors</div>
              <div className="rounded-md border px-4 py-3 font-mono text-sm">@stitches/react</div>
            </CollapsibleContent>
          </Collapsible>

          <div className="space-y-4">
            <Label>Breadcrumb Navigation</Label>
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="/">Home</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink href="/docs">Docs</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage>Components Showcase</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </div>
      </section>

      {/* 6. Welcome Banners */}
      <section className="space-y-6 mt-10">
        <h2 className="text-2xl font-semibold tracking-tight border-b pb-2">Welcome Banners</h2>
        <div className="grid grid-cols-1 gap-6">
          {/* Option 1: Vibrant Ocean */}
          <div className="relative overflow-hidden bg-gradient-to-br from-blue-500/10 via-cyan-400/10 to-transparent bg-white dark:bg-slate-950 border border-blue-200 dark:border-blue-800 p-6 rounded-xl shadow-sm group">
            <div className="absolute right-0 top-0 w-40 h-40 opacity-20 blur-3xl rounded-full -mr-10 -mt-10 bg-blue-500 pointer-events-none group-hover:scale-110 transition-transform duration-700" />
            <div className="flex items-start gap-4 sm:gap-6 relative z-10">
              <div className="flex-1 space-y-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  Welcome back, Alex!
                </h1>
                <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base font-medium">
                  Here's what's happening with your projects today.
                </p>
              </div>
              <div className="flex-shrink-0 bg-blue-100 dark:bg-blue-900/50 p-4 rounded-xl border border-blue-200 dark:border-blue-800 shadow-sm group-hover:rotate-12 transition-transform duration-500">
                <Activity className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </div>

          {/* Option 2: Sunset Glow */}
          <div className="relative overflow-hidden bg-gradient-to-br from-orange-500/15 via-rose-400/10 to-transparent bg-white dark:bg-slate-950 border border-orange-200 dark:border-orange-900/50 p-6 rounded-xl shadow-sm group">
            <div className="absolute right-0 top-0 w-40 h-40 opacity-20 blur-3xl rounded-full -mr-10 -mt-10 bg-orange-500 pointer-events-none group-hover:scale-110 transition-transform duration-700" />
            <div className="flex items-start gap-4 sm:gap-6 relative z-10">
              <div className="flex-1 space-y-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  Good afternoon, Alex.
                </h1>
                <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base font-medium">
                  You have 3 tasks pending for today.
                </p>
              </div>
              <div className="flex-shrink-0 bg-orange-100 dark:bg-orange-900/50 p-4 rounded-xl border border-orange-200 dark:border-orange-800 shadow-sm group-hover:-rotate-12 transition-transform duration-500">
                <Sun className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </div>

          {/* Option 3: Aurora Emerald */}
          <div className="relative overflow-hidden bg-gradient-to-br from-emerald-500/15 via-teal-400/10 to-transparent bg-white dark:bg-slate-950 border border-emerald-200 dark:border-emerald-900/50 p-6 rounded-xl shadow-sm group">
            <div className="absolute right-0 top-0 w-40 h-40 opacity-20 blur-3xl rounded-full -mr-10 -mt-10 bg-emerald-500 pointer-events-none group-hover:scale-110 transition-transform duration-700" />
            <div className="flex items-start gap-4 sm:gap-6 relative z-10">
              <div className="flex-1 space-y-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  Morning, Alex!
                </h1>
                <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base font-medium">
                  Your weekly report is ready to view.
                </p>
              </div>
              <div className="flex-shrink-0 bg-emerald-100 dark:bg-emerald-900/50 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 shadow-sm group-hover:scale-110 transition-transform duration-500">
                <Sparkles className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </div>

          {/* Option 4: Royal Purple */}
          <div className="relative overflow-hidden bg-gradient-to-br from-purple-500/15 via-indigo-400/10 to-transparent bg-white dark:bg-slate-950 border border-purple-200 dark:border-purple-900/50 p-6 rounded-xl shadow-sm group">
            <div className="absolute right-0 top-0 w-40 h-40 opacity-20 blur-3xl rounded-full -mr-10 -mt-10 bg-purple-500 pointer-events-none group-hover:scale-110 transition-transform duration-700" />
            <div className="flex items-start gap-4 sm:gap-6 relative z-10">
              <div className="flex-1 space-y-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  Evening, Alex.
                </h1>
                <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base font-medium">
                  Time to wrap up for the day. Excellent work!
                </p>
              </div>
              <div className="flex-shrink-0 bg-purple-100 dark:bg-purple-900/50 p-4 rounded-xl border border-purple-200 dark:border-purple-800 shadow-sm group-hover:rotate-12 transition-transform duration-500">
                <Moon className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </div>

          {/* Option 5: Midnight Solid (High impact) */}
          <div className="relative overflow-hidden bg-slate-900 dark:bg-slate-950 border border-slate-800 p-6 rounded-xl shadow-md group">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-purple-600/20 opacity-50 pointer-events-none" />
            <div className="absolute right-0 top-0 w-40 h-40 opacity-30 blur-3xl rounded-full -mr-10 -mt-10 bg-blue-500 pointer-events-none group-hover:scale-125 transition-transform duration-1000" />
            <div className="flex items-start gap-4 sm:gap-6 relative z-10">
              <div className="flex-1 space-y-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                  Hello, Alex!
                </h1>
                <p className="text-slate-300 text-sm sm:text-base font-medium">
                  Ready to conquer the day? You have 2 unread messages.
                </p>
              </div>
              <div className="flex-shrink-0 bg-slate-800/80 p-4 rounded-xl border border-slate-700 shadow-inner group-hover:scale-110 transition-transform duration-500">
                <Award className="h-8 w-8 text-blue-400" />
              </div>
            </div>
          </div>

          {/* Option 6: Action-Oriented Layout */}
          <div className="relative overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm flex flex-col md:flex-row items-center justify-between p-6 sm:p-8 gap-6 group">
            <div className="absolute left-0 top-0 bottom-0 w-2 bg-indigo-500 rounded-l-xl" />
            <div className="flex-1 space-y-3 z-10">
              <div className="inline-flex items-center space-x-2 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-2">
                <Sun className="w-4 h-4" />
                <span>Good Morning</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Ready to dive in, Alex?
              </h1>
              <p className="text-slate-600 dark:text-slate-400 font-medium max-w-xl">
                Your performance is up 12% this week. Keep up the great work and check out your new potential leads.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row w-full md:w-auto gap-3 shrink-0 z-10">
              <Button className="w-full sm:w-auto shadow-md hover:shadow-lg transition-shadow bg-indigo-600 hover:bg-indigo-700 text-white">
                View Reports
              </Button>
              <Button variant="outline" className="w-full sm:w-auto bg-transparent border-slate-300 dark:border-slate-700">
                Dismiss
              </Button>
            </div>
          </div>

          {/* Option 7: Split Design with Geometric Shapes */}
          <div className="relative overflow-hidden bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm flex flex-col sm:flex-row group">
            <div className="flex-1 p-6 sm:p-8 space-y-2 z-10">
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Welcome back!
              </h1>
              <p className="text-slate-500 dark:text-slate-400 font-medium">
                Here's a quick overview of your workspace. You have 5 new notifications waiting for your review.
              </p>
              <div className="pt-4">
                <a href="#" className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline inline-flex items-center">
                  Review notifications <i className="fa-solid fa-arrow-right ml-2 text-sm"></i>
                </a>
              </div>
            </div>
            {/* Geometric right side */}
            <div className="relative w-full sm:w-1/3 min-h-[160px] sm:min-h-[auto] bg-emerald-50 dark:bg-emerald-950/30 overflow-hidden flex items-center justify-center border-t sm:border-t-0 sm:border-l border-emerald-100 dark:border-emerald-900/50">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-emerald-200/50 dark:bg-emerald-800/30 rounded-full blur-xl" />
              <div className="absolute top-0 right-0 w-24 h-24 bg-teal-400/20 rounded-bl-full" />
              <div className="absolute bottom-0 left-0 w-20 h-20 bg-green-400/20 rounded-tr-full" />
              <Sparkles className="w-12 h-12 text-emerald-600 dark:text-emerald-500 relative z-10 group-hover:rotate-180 transition-transform duration-1000" />
            </div>
          </div>

          {/* Option 8: Centered Spotlight */}
          <div className="relative overflow-hidden bg-slate-900 border border-slate-800 p-8 sm:p-12 rounded-xl shadow-xl text-center group">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-fuchsia-900/40 via-slate-900/80 to-slate-900 pointer-events-none" />
            
            <div className="relative z-10 flex flex-col items-center space-y-4 max-w-2xl mx-auto">
              <div className="bg-fuchsia-500/20 p-4 rounded-full border border-fuchsia-500/30 shadow-[0_0_30px_-5px_rgba(217,70,239,0.4)] group-hover:shadow-[0_0_50px_-10px_rgba(217,70,239,0.6)] transition-shadow duration-500">
                <Flame className="w-10 h-10 text-fuchsia-400" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
                You're on fire, Alex!
              </h1>
              <p className="text-slate-300 text-lg">
                You've hit your weekly target 2 days early. Take a breather, or keep the momentum going.
              </p>
            </div>
          </div>

          {/* Option 9: Progress/Goal Driven */}
          <div className="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm p-6 sm:p-8 group overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-slate-100 dark:bg-slate-800">
              <div className="h-full bg-blue-500 w-[75%]" />
            </div>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10 pt-2">
              <div className="flex-1 space-y-2">
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                  <TrendingUp className="w-6 h-6 text-blue-500" />
                  Great progress, Alex!
                </h1>
                <p className="text-slate-600 dark:text-slate-400 font-medium">
                  You are 75% of the way to your monthly revenue goal. Just a little more push!
                </p>
              </div>
              <div className="flex items-center gap-4 shrink-0 bg-slate-50 dark:bg-slate-950 p-4 rounded-lg border border-slate-100 dark:border-slate-800">
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-500">Current</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">$15,000</p>
                </div>
                <div className="w-px h-10 bg-slate-200 dark:bg-slate-700" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-500">Goal</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">$20,000</p>
                </div>
              </div>
            </div>
          </div>

          {/* Option 10: Minimalist Typographic */}
          <div className="bg-slate-950 text-white rounded-xl p-8 sm:p-10 flex flex-col justify-center border border-slate-900 relative overflow-hidden group">
            <div className="absolute -right-20 -top-20 opacity-5 group-hover:opacity-10 group-hover:rotate-12 transition-all duration-700">
              <Sparkles className="w-96 h-96" />
            </div>
            <div className="relative z-10 max-w-3xl">
              <p className="text-slate-400 uppercase tracking-[0.2em] text-xs font-bold mb-4">Monday, August 4</p>
              <h1 className="text-4xl sm:text-5xl font-black tracking-tighter leading-none mb-4">
                GOOD MORNING, ALEX.
              </h1>
              <p className="text-slate-400 text-lg sm:text-xl font-medium max-w-xl leading-relaxed">
                Your schedule is clear until 2 PM. It's the perfect window for deep work.
              </p>
            </div>
          </div>

          {/* Option 11: Frosted Glass / Pattern Background */}
          <div className="relative rounded-xl p-6 sm:p-8 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden group">
            {/* Pattern background simulated with repeating linear gradient */}
            <div className="absolute inset-0 opacity-[0.03] dark:opacity-5 bg-[repeating-linear-gradient(45deg,_#000_0,_#000_2px,_transparent_2px,_transparent_8px)] dark:bg-[repeating-linear-gradient(45deg,_#fff_0,_#fff_2px,_transparent_2px,_transparent_8px)] pointer-events-none" />
            <div className="absolute -right-32 -bottom-32 w-96 h-96 bg-amber-400/20 rounded-full blur-3xl pointer-events-none group-hover:scale-110 transition-transform duration-1000" />
            
            <div className="relative z-10 flex items-start gap-6 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md p-6 rounded-xl border border-white/40 dark:border-slate-700/50 shadow-sm">
              <div className="bg-amber-100 dark:bg-amber-900/50 p-4 rounded-full shrink-0 mt-1 shadow-inner border border-amber-200 dark:border-amber-800">
                <Coffee className="w-8 h-8 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  Time for a break?
                </h1>
                <p className="text-slate-700 dark:text-slate-300 font-medium">
                  You've been focused for 2 hours straight. Grab some coffee and stretch your legs.
                </p>
              </div>
            </div>
          </div>

          {/* Option 12: Alert / Notice Style */}
          <div className="bg-amber-50 dark:bg-amber-950/30 border-l-4 border-amber-500 rounded-r-xl shadow-sm p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="bg-amber-100 dark:bg-amber-900/50 p-3 rounded-full text-amber-600 dark:text-amber-500 shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-amber-900 dark:text-amber-400">
                  System Maintenance Scheduled
                </h1>
                <p className="text-amber-700 dark:text-amber-500/80 text-sm font-medium mt-1">
                  The dashboard will be in read-only mode in 30 minutes for an update.
                </p>
              </div>
            </div>
            <Button variant="outline" className="shrink-0 border-amber-200 hover:bg-amber-100 dark:border-amber-800 dark:hover:bg-amber-900/50 text-amber-800 dark:text-amber-300 w-full sm:w-auto">
              Learn More
            </Button>
          </div>

          {/* Option 13: Multi-Metric Dashboard Header */}
          <div className="relative overflow-hidden bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl shadow-sm group">
            <div className="absolute right-0 top-0 w-64 h-64 opacity-10 bg-teal-500 blur-3xl rounded-full pointer-events-none" />
            <div className="p-6 border-b border-slate-100 dark:border-slate-800/60 relative z-10 flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  Welcome back, Alex!
                </h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
                  Here's your quick snapshot for today.
                </p>
              </div>
              <Button size="sm" className="hidden sm:flex">
                New Project
              </Button>
            </div>
            <div className="grid grid-cols-3 divide-x divide-slate-100 dark:divide-slate-800/60 relative z-10 bg-slate-50/50 dark:bg-slate-900/20">
              <div className="p-4 sm:p-5 flex flex-col justify-center items-center text-center hover:bg-slate-100 dark:hover:bg-slate-900/50 transition-colors cursor-pointer">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active</span>
                <span className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">12</span>
              </div>
              <div className="p-4 sm:p-5 flex flex-col justify-center items-center text-center hover:bg-slate-100 dark:hover:bg-slate-900/50 transition-colors cursor-pointer">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending</span>
                <span className="text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-500 mt-1">4</span>
              </div>
              <div className="p-4 sm:p-5 flex flex-col justify-center items-center text-center hover:bg-slate-100 dark:hover:bg-slate-900/50 transition-colors cursor-pointer">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Completed</span>
                <span className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-500 mt-1">89</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Dashboard Cards */}
      <section className="space-y-6 mt-10">
        <h2 className="text-2xl font-semibold tracking-tight border-b pb-2">Dashboard Cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Card Option 1: Clean Minimal */}
          <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Revenue</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">$45,231</p>
              </div>
              <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center">
                <i className="fa-solid fa-arrow-up mr-1 text-xs"></i> +20.1%
              </span>
              <span className="text-slate-500 ml-2">from last month</span>
            </div>
          </div>

          {/* Card Option 2: Soft Tinted Background */}
          <div className="bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/50 rounded-xl p-5 shadow-sm hover:border-indigo-200 dark:hover:border-indigo-800 transition-colors">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">Active Users</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">+2,350</p>
              </div>
              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg">
                <Smile className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
            <div className="mt-4">
              <div className="w-full bg-indigo-100 dark:bg-indigo-900/30 rounded-full h-1.5">
                <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: "70%" }}></div>
              </div>
              <p className="text-xs text-slate-500 mt-2">70% to monthly goal</p>
            </div>
          </div>

          {/* Card Option 3: Modern Outline with Icon Accent */}
          <div className="relative bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm overflow-hidden group">
            <div className="absolute right-0 top-0 h-full w-1 bg-emerald-500" />
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Completion Rate</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">94%</p>
              </div>
              <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg group-hover:scale-110 transition-transform">
                <Award className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                Excellent
              </span>
              <span className="text-slate-500 ml-2">performance</span>
            </div>
          </div>

          {/* Card Option 4: Gradient Border Glow */}
          <div className="relative bg-white dark:bg-slate-950 rounded-xl p-5 shadow-sm overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-400 to-rose-400 opacity-20 blur-xl -z-10" />
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Sales</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">12,234</p>
              </div>
              <div className="p-2 bg-gradient-to-br from-orange-400 to-rose-400 rounded-lg shadow-sm text-white">
                <Flame className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-rose-600 dark:text-rose-400 font-medium flex items-center">
                <i className="fa-solid fa-arrow-up mr-1 text-xs"></i> +12.5%
              </span>
              <span className="text-slate-500 ml-2">vs last week</span>
            </div>
          </div>

          {/* Card Option 5: Solid Vibrant Fill */}
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-xl p-5 shadow-md relative overflow-hidden group">
            <div className="absolute right-0 top-0 opacity-10 scale-150 -mt-4 -mr-4 group-hover:scale-110 transition-transform duration-500">
              <Sparkles className="w-32 h-32" />
            </div>
            <div className="relative z-10">
              <div className="flex justify-between items-start">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-blue-100">Premium Users</p>
                  <p className="text-3xl font-bold text-white">4,392</p>
                </div>
                <div className="p-2 bg-white/20 backdrop-blur-md rounded-lg">
                  <Activity className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-blue-100 font-medium">
                  Top tier growth
                </span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Alumni Details Cards Section (10 Design Options) */}
      <section className="space-y-6 pt-10 border-t border-border">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-600 border border-indigo-500/20">
              <User className="w-5 h-5" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight">Alumni Details Cards (10 Design Options)</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Curated design layouts for displaying Alumni Profile details across CRM views.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Option 1: Minimalist Modern */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Option 1: Minimalist Modern</span>
            <Card className="border border-border/80 rounded-2xl bg-card shadow-2xs hover:shadow-md transition-all">
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-base font-bold text-foreground">Aarav Sharma</CardTitle>
                  <p className="text-xs text-muted-foreground font-mono">aarav.sharma@example.com</p>
                </div>
                <Badge variant="outline" className="text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                  PLACED
                </Badge>
              </CardHeader>
              <CardContent className="space-y-2.5 text-xs">
                <div className="flex justify-between items-center py-1 border-b border-border/40">
                  <span className="text-muted-foreground flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" /> Campus</span>
                  <span className="font-semibold text-foreground">Pune Campus</span>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-border/40">
                  <span className="text-muted-foreground flex items-center gap-1.5"><Briefcase className="w-3.5 h-3.5" /> Company</span>
                  <span className="font-bold text-foreground">Thoughtworks</span>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-muted-foreground flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5" /> Monthly Salary</span>
                  <span className="font-bold text-emerald-600">₹45,000/mo</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Option 2: Gradient Glassmorphism */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Option 2: Gradient Glassmorphism</span>
            <div className="relative rounded-2xl border border-white/20 bg-gradient-to-br from-indigo-500/10 via-purple-500/10 to-pink-500/10 backdrop-blur-md p-5 shadow-lg space-y-4 overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
              <div className="flex justify-between items-start pt-1">
                <div>
                  <h3 className="text-base font-extrabold text-foreground">Priya Patel</h3>
                  <p className="text-xs text-muted-foreground font-mono">priya.patel@example.com</p>
                </div>
                <Badge className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold text-[10px]">
                  PUNE • SOFTWARE DEV
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded-xl bg-background/60 backdrop-blur-sm border border-border/40">
                  <span className="text-[10px] text-muted-foreground block">Company</span>
                  <span className="font-bold text-foreground">Zomato</span>
                </div>
                <div className="p-2.5 rounded-xl bg-background/60 backdrop-blur-sm border border-border/40">
                  <span className="text-[10px] text-muted-foreground block">Monthly CTC</span>
                  <span className="font-extrabold text-emerald-600">₹52,000/mo</span>
                </div>
              </div>
            </div>
          </div>

          {/* Option 3: Two-Column Split Metric Card */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Option 3: Two-Column Split Metric Card</span>
            <Card className="border border-border/80 rounded-2xl bg-card p-4">
              <div className="grid grid-cols-3 gap-4 items-center">
                <div className="col-span-1 p-3 rounded-xl bg-muted/40 text-center space-y-1.5 border border-border/60">
                  <div className="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-600 font-bold flex items-center justify-center mx-auto text-sm">
                    RK
                  </div>
                  <div className="font-bold text-xs">Rahul Kumar</div>
                  <Badge variant="secondary" className="text-[9px]">Active Alumnus</Badge>
                </div>
                <div className="col-span-2 space-y-2 text-xs">
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Campus & Course</span>
                    <span className="font-semibold text-foreground">Dharamshala • Python Web Dev</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-muted-foreground block">Current Employer</span>
                    <span className="font-bold text-foreground">Tech Mahindra</span>
                  </div>
                  <div className="pt-1 flex justify-between items-center">
                    <span className="font-extrabold text-emerald-600 text-xs">₹38,000/mo</span>
                    <Button size="sm" variant="outline" className="h-6 text-[10px] rounded-lg">View Details</Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Option 4: Neomorphic Soft Card */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Option 4: Neomorphic Soft Card</span>
            <div className="rounded-3xl border border-border/60 bg-card p-5 shadow-lg space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 text-white font-bold flex items-center justify-center shadow-md text-xs">
                    SS
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-foreground">Sneha Singh</h3>
                    <p className="text-[10px] text-muted-foreground">Admitted 2022 • Bangalore</p>
                  </div>
                </div>
                <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-full text-[10px]">
                  ● Active
                </Badge>
              </div>
              <div className="p-3 rounded-2xl bg-muted/30 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Company:</span>
                  <span className="font-bold text-foreground">Infosys</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Starting CTC:</span>
                  <span className="font-semibold text-foreground">₹4.2 LPA</span>
                </div>
              </div>
            </div>
          </div>

          {/* Option 5: Tech Stack & Terminal Focused Card */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Option 5: Tech Stack & Terminal Focused Card</span>
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950 text-zinc-100 p-4 space-y-3 font-mono shadow-md">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <Code2 className="w-3.5 h-3.5" /> vikram_aditya.dev
                </span>
                <span className="text-[10px] text-zinc-400">STATUS: PLACED</span>
              </div>
              <div className="text-xs space-y-1.5">
                <div className="text-zinc-300">Company: <span className="text-amber-300 font-bold">Paytm</span></div>
                <div className="text-zinc-300">Monthly CTC: <span className="text-emerald-400 font-bold">₹60,000/mo</span></div>
                <div className="flex items-center gap-1 pt-1">
                  <Badge variant="outline" className="text-[9px] border-zinc-700 text-zinc-300 bg-zinc-900">React.js</Badge>
                  <Badge variant="outline" className="text-[9px] border-zinc-700 text-zinc-300 bg-zinc-900">Node.js</Badge>
                  <Badge variant="outline" className="text-[9px] border-zinc-700 text-zinc-300 bg-zinc-900">PostgreSQL</Badge>
                </div>
              </div>
            </div>
          </div>

          {/* Option 6: Executive Compact Card */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Option 6: Executive Compact Card</span>
            <Card className="border border-border/80 rounded-2xl bg-card p-3 shadow-2xs">
              <div className="flex items-center justify-between text-xs gap-3">
                <div>
                  <div className="font-bold text-foreground">Ananya Verma</div>
                  <div className="text-[10px] text-muted-foreground font-mono">ananya@example.com</div>
                </div>
                <Badge variant="secondary" className="text-[10px]">Sarvinga Campus</Badge>
                <div className="text-right">
                  <div className="font-bold text-emerald-600">₹40,000/mo</div>
                  <div className="text-[10px] text-muted-foreground">Accenture</div>
                </div>
                <Button size="sm" variant="outline" className="h-7 text-[10px] rounded-lg">View</Button>
              </div>
            </Card>
          </div>

          {/* Option 7: Color-Coded Category Card */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Option 7: Color-Coded Category Card</span>
            <Card className="border border-border/80 rounded-2xl bg-card shadow-2xs">
              <CardHeader className="pb-3 flex flex-row items-center gap-3 border-b border-border/40">
                <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 border border-purple-500/20">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div>
                  <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Alumni Snapshot</CardTitle>
                  <div className="text-sm font-bold text-foreground">Karan Mehta</div>
                </div>
              </CardHeader>
              <CardContent className="p-4 space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-border/30">
                  <span className="text-muted-foreground">Campus</span>
                  <span className="font-bold text-foreground">Himachal Campus</span>
                </div>
                <div className="flex justify-between py-1 border-b border-border/30">
                  <span className="text-muted-foreground">Placed Company</span>
                  <span className="font-bold text-foreground">Wipro</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-muted-foreground">Pay-Forward Eligible</span>
                  <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px]">Eligible</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Option 8: Timeline & Journey Card */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Option 8: Timeline & Journey Card</span>
            <Card className="border border-border/80 rounded-2xl bg-card p-4 shadow-2xs space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-bold text-sm text-foreground">Divya Reddy</h3>
                <Badge variant="outline" className="text-[10px]">Class of 2021</Badge>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="px-2.5 py-1 rounded-lg bg-muted text-center font-mono text-[10px]">2021 Admitted</div>
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                <div className="px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-600 font-semibold text-[10px]">Pune Campus</div>
                <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                <div className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 font-bold text-[10px]">Deloitte (₹48k/mo)</div>
              </div>
            </Card>
          </div>

          {/* Option 9: High-Contrast Bold Bento Card */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Option 9: High-Contrast Bold Bento Card</span>
            <div className="rounded-2xl border-2 border-primary/40 bg-card p-4 shadow-md space-y-3">
              <div className="flex justify-between items-center border-b border-border pb-2">
                <span className="font-black text-base text-foreground">Tanya Roy</span>
                <Badge className="bg-primary text-primary-foreground font-extrabold text-[10px]">PREMIUM DONOR</Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 rounded-xl bg-muted font-bold">Campus: Jashpur</div>
                <div className="p-2 rounded-xl bg-muted font-bold text-emerald-600">CTC: ₹65,000/mo</div>
              </div>
            </div>
          </div>

          {/* Option 10: Multi-Metric Comprehensive Card */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Option 10: Multi-Metric Comprehensive Card</span>
            <Card className="border border-border/80 rounded-2xl bg-card p-4 shadow-2xs space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-sm text-foreground">Siddharth Joshi</h3>
                  <p className="text-[10px] text-muted-foreground font-mono">siddharth@example.com</p>
                </div>
                <Badge className="bg-emerald-500 text-white text-[10px]">ACTIVE MEMBER</Badge>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded-xl bg-muted/40">
                  <span className="text-[9px] text-muted-foreground block">Salary</span>
                  <span className="font-bold text-emerald-600">₹45k/mo</span>
                </div>
                <div className="p-2 rounded-xl bg-muted/40">
                  <span className="text-[9px] text-muted-foreground block">Cap Progress</span>
                  <span className="font-bold text-primary">65%</span>
                </div>
                <div className="p-2 rounded-xl bg-muted/40">
                  <span className="text-[9px] text-muted-foreground block">Coursera</span>
                  <span className="font-bold text-foreground">34 hrs</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

    </div>
  );
}
