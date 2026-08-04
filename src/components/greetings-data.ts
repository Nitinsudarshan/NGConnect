import {
  Activity,
  Award,
  BookOpen,
  Coffee,
  Compass,
  Flame,
  Gamepad,
  Laptop,
  Moon,
  Music,
  Smile,
  Sparkles,
  Sun,
  Sunrise,
  Sunset,
  Tv,
  UtensilsCrossed,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"

export type GreetingEntry = {
  /** Template string; {name} is replaced with the user's first name. */
  text: string
  subtext: string
  icon: LucideIcon
  iconClass: string
  gradient: string
  border: string
  accentText: string
}

export const ICONS: Record<string, LucideIcon> = {
  Activity,
  Award,
  BookOpen,
  Coffee,
  Compass,
  Flame,
  Gamepad,
  Laptop,
  Moon,
  Music,
  Smile,
  Sparkles,
  Sun,
  Sunrise,
  Sunset,
  Tv,
  UtensilsCrossed,
}

// 120 greetings: 5 variants for each of the 24 hours of the day.
export const hourlyGreetings: Record<number, GreetingEntry[]> = {
  0: [
    {
      text: "Still up, {name}?",
      subtext: "Midnight's a strange, quiet kind of productive. Make it count, then get some rest.",
      icon: Moon,
      iconClass: "text-indigo-400 animate-pulse",
      gradient: "from-indigo-950/20 via-purple-950/10 to-transparent",
      border: "border-indigo-500/20 dark:border-indigo-500/30",
      accentText: "text-indigo-400"
    },
    {
      text: "Welcome to a new day, {name}.",
      subtext: "Everything resets at midnight, including your patience with yesterday's bugs.",
      icon: Sparkles,
      iconClass: "text-violet-400",
      gradient: "from-violet-950/20 via-fuchsia-950/10 to-transparent",
      border: "border-violet-500/20 dark:border-violet-500/30",
      accentText: "text-violet-400"
    },
    {
      text: "Evening, {name} — or is it morning now?",
      subtext: "Either way, the dashboard's here whenever you are.",
      icon: Compass,
      iconClass: "text-blue-400",
      gradient: "from-blue-950/20 via-slate-900/10 to-transparent",
      border: "border-blue-500/20 dark:border-blue-500/30",
      accentText: "text-blue-400"
    },
    {
      text: "{name}, the clock just rolled over.",
      subtext: "A fresh 24 hours, technically. Use it however suits you best.",
      icon: Sparkles,
      iconClass: "text-purple-400",
      gradient: "from-purple-950/20 via-indigo-950/10 to-transparent",
      border: "border-purple-500/20 dark:border-purple-500/30",
      accentText: "text-purple-400"
    },
    {
      text: "Quiet hour, {name}.",
      subtext: "Fewer notifications, fewer people online. Sometimes that's exactly what's needed.",
      icon: Moon,
      iconClass: "text-cyan-400",
      gradient: "from-cyan-950/20 via-slate-900/10 to-transparent",
      border: "border-cyan-500/20 dark:border-cyan-500/30",
      accentText: "text-cyan-400"
    },
  ],
  1: [
    {
      text: "Burning the midnight oil, {name}?",
      subtext: "Just don't let one more tab turn into three more hours.",
      icon: Laptop,
      iconClass: "text-fuchsia-400",
      gradient: "from-fuchsia-950/20 via-purple-950/10 to-transparent",
      border: "border-fuchsia-500/20 dark:border-fuchsia-500/30",
      accentText: "text-fuchsia-400"
    },
    {
      text: "Hey {name}, still at it.",
      subtext: "Whatever kept you up, hope it's worth it — and hope you sleep soon after.",
      icon: Sparkles,
      iconClass: "text-cyan-400",
      gradient: "from-cyan-950/20 via-blue-950/10 to-transparent",
      border: "border-cyan-500/20 dark:border-cyan-500/30",
      accentText: "text-cyan-400"
    },
    {
      text: "{name}, the night shift begins.",
      subtext: "Fewer distractions this hour. Some of your best work might happen here.",
      icon: Laptop,
      iconClass: "text-indigo-400 animate-pulse",
      gradient: "from-indigo-950/20 via-fuchsia-950/10 to-transparent",
      border: "border-indigo-500/20 dark:border-indigo-500/30",
      accentText: "text-indigo-400"
    },
    {
      text: "1 AM check-in, {name}.",
      subtext: "No judgment if you're here for fun or for focus. Either way, welcome.",
      icon: Sparkles,
      iconClass: "text-yellow-400",
      gradient: "from-yellow-950/20 via-amber-950/10 to-transparent",
      border: "border-yellow-500/20 dark:border-yellow-500/30",
      accentText: "text-yellow-400"
    },
    {
      text: "Night owl confirmed, {name}.",
      subtext: "The rest of the world's asleep. You've got the place to yourself.",
      icon: Compass,
      iconClass: "text-teal-400",
      gradient: "from-teal-950/20 via-slate-900/10 to-transparent",
      border: "border-teal-500/20 dark:border-teal-500/30",
      accentText: "text-teal-400"
    },
  ],
  2: [
    {
      text: "{name}, it's the deep-night hour.",
      subtext: "If you're working, take it slow. If you're scrolling, maybe don't.",
      icon: Moon,
      iconClass: "text-blue-400",
      gradient: "from-blue-950/20 via-slate-900/10 to-transparent",
      border: "border-blue-500/20 dark:border-blue-500/30",
      accentText: "text-blue-400"
    },
    {
      text: "2 AM, {name}.",
      subtext: "This is usually the hour where things either click or fall apart. Hope it's the former.",
      icon: Moon,
      iconClass: "text-violet-400",
      gradient: "from-violet-950/20 via-indigo-950/10 to-transparent",
      border: "border-violet-500/20 dark:border-violet-500/30",
      accentText: "text-violet-400"
    },
    {
      text: "Hey {name}.",
      subtext: "It's very late. Whatever you're doing can probably wait until after some sleep.",
      icon: Moon,
      iconClass: "text-indigo-400",
      gradient: "from-indigo-950/20 via-slate-950/10 to-transparent",
      border: "border-indigo-500/20 dark:border-indigo-500/30",
      accentText: "text-indigo-400"
    },
    {
      text: "{name}, the world's mostly asleep.",
      subtext: "A good time for focus, a better time for rest.",
      icon: Sparkles,
      iconClass: "text-purple-400 animate-pulse",
      gradient: "from-purple-950/20 via-slate-900/10 to-transparent",
      border: "border-purple-500/20 dark:border-purple-500/30",
      accentText: "text-purple-400"
    },
    {
      text: "Quiet check-in, {name}.",
      subtext: "No rush here. Take whatever time you need before logging off.",
      icon: Moon,
      iconClass: "text-sky-400",
      gradient: "from-sky-950/20 via-slate-900/10 to-transparent",
      border: "border-sky-500/20 dark:border-sky-500/30",
      accentText: "text-sky-400"
    },
  ],
  3: [
    {
      text: "3 AM, {name}.",
      subtext: "Historically the hour for either genius ideas or regrettable decisions. Choose wisely.",
      icon: Sparkles,
      iconClass: "text-purple-400 animate-pulse",
      gradient: "from-purple-950/20 via-violet-950/10 to-transparent",
      border: "border-purple-500/20 dark:border-purple-500/30",
      accentText: "text-purple-400"
    },
    {
      text: "{name}, you're up early or very late.",
      subtext: "Either way, a glass of water probably wouldn't hurt.",
      icon: Sparkles,
      iconClass: "text-indigo-400",
      gradient: "from-indigo-950/20 via-purple-950/10 to-transparent",
      border: "border-indigo-500/20 dark:border-indigo-500/30",
      accentText: "text-indigo-400"
    },
    {
      text: "Hey {name}, still going?",
      subtext: "This is usually when things get either weird or brilliant. Good luck.",
      icon: Moon,
      iconClass: "text-rose-400",
      gradient: "from-rose-950/20 via-slate-900/10 to-transparent",
      border: "border-rose-500/20 dark:border-rose-500/30",
      accentText: "text-rose-400"
    },
    {
      text: "{name}, the night's almost done.",
      subtext: "A few more hours until sunrise. Hang in there or head to bed.",
      icon: Laptop,
      iconClass: "text-violet-400",
      gradient: "from-violet-950/20 via-purple-950/10 to-transparent",
      border: "border-violet-500/20 dark:border-violet-500/30",
      accentText: "text-violet-400"
    },
    {
      text: "Deep-night session, {name}.",
      subtext: "Whatever's keeping you here, hope it's a good reason.",
      icon: Sparkles,
      iconClass: "text-blue-400",
      gradient: "from-blue-950/20 via-slate-900/10 to-transparent",
      border: "border-blue-500/20 dark:border-blue-500/30",
      accentText: "text-blue-400"
    },
  ],
  4: [
    {
      text: "Early one, {name}.",
      subtext: "The city's still asleep, but you're already moving. Respect.",
      icon: Sunrise,
      iconClass: "text-teal-400",
      gradient: "from-teal-950/20 via-slate-900/10 to-transparent",
      border: "border-teal-500/20 dark:border-teal-500/30",
      accentText: "text-teal-400"
    },
    {
      text: "{name}, dawn's not far off now.",
      subtext: "First light usually shows up somewhere around now.",
      icon: Coffee,
      iconClass: "text-amber-500",
      gradient: "from-amber-950/20 via-slate-900/10 to-transparent",
      border: "border-amber-500/20 dark:border-amber-500/30",
      accentText: "text-amber-500"
    },
    {
      text: "Hey {name}, up before the sun.",
      subtext: "There's something clarifying about this hour. Use it well.",
      icon: Sunrise,
      iconClass: "text-sky-400",
      gradient: "from-sky-950/20 via-slate-900/10 to-transparent",
      border: "border-sky-500/20 dark:border-sky-500/30",
      accentText: "text-sky-400"
    },
    {
      text: "{name}, the quiet before the morning rush.",
      subtext: "Enjoy it — it won't last once everyone else wakes up.",
      icon: Compass,
      iconClass: "text-emerald-400",
      gradient: "from-emerald-950/20 via-slate-900/10 to-transparent",
      border: "border-emerald-500/20 dark:border-emerald-500/30",
      accentText: "text-emerald-400"
    },
    {
      text: "4 AM, {name}.",
      subtext: "Either an incredibly early start or a very long night. Either way, you're here.",
      icon: Sparkles,
      iconClass: "text-cyan-400",
      gradient: "from-cyan-950/20 via-slate-900/10 to-transparent",
      border: "border-cyan-500/20 dark:border-cyan-500/30",
      accentText: "text-cyan-400"
    },
  ],
  5: [
    {
      text: "Good morning, {name}.",
      subtext: "Early starts tend to pay off later in the day. Let's get into it.",
      icon: Sunrise,
      iconClass: "text-amber-500 animate-pulse",
      gradient: "from-amber-500/10 via-orange-500/5 to-transparent",
      border: "border-amber-200/50 dark:border-amber-900/30",
      accentText: "text-amber-600 dark:text-amber-400"
    },
    {
      text: "{name}, first one up?",
      subtext: "There's a certain calm to mornings before the noise kicks in.",
      icon: Activity,
      iconClass: "text-emerald-500",
      gradient: "from-emerald-500/10 via-teal-500/5 to-transparent",
      border: "border-emerald-200/50 dark:border-emerald-900/30",
      accentText: "text-emerald-600 dark:text-emerald-400"
    },
    {
      text: "Hey {name}, rise and grind — literally, coffee's calling.",
      subtext: "Fuel up before the day gets moving.",
      icon: Coffee,
      iconClass: "text-orange-500",
      gradient: "from-orange-500/10 via-amber-500/5 to-transparent",
      border: "border-orange-200/50 dark:border-orange-900/30",
      accentText: "text-orange-600 dark:text-orange-400"
    },
    {
      text: "Morning, {name}.",
      subtext: "The sky's doing its thing outside. Worth a glance before you dive in.",
      icon: Sunrise,
      iconClass: "text-yellow-500",
      gradient: "from-yellow-500/10 via-amber-500/5 to-transparent",
      border: "border-yellow-200/50 dark:border-yellow-900/30",
      accentText: "text-yellow-600 dark:text-yellow-400"
    },
    {
      text: "{name}, the day's just getting started.",
      subtext: "A slow, steady morning beats a rushed one every time.",
      icon: Sparkles,
      iconClass: "text-teal-500",
      gradient: "from-teal-500/10 via-sky-500/5 to-transparent",
      border: "border-teal-200/50 dark:border-teal-900/30",
      accentText: "text-teal-600 dark:text-teal-400"
    },
  ],
  6: [
    {
      text: "Morning, {name}.",
      subtext: "Coffee's brewing somewhere, the day's ahead. Let's make a start.",
      icon: Coffee,
      iconClass: "text-amber-600",
      gradient: "from-amber-500/10 via-orange-500/5 to-transparent",
      border: "border-amber-200/50 dark:border-amber-900/30",
      accentText: "text-amber-700 dark:text-amber-400"
    },
    {
      text: "Hey {name}, the sun's up.",
      subtext: "Time to shake off the last of the sleep and get moving.",
      icon: Sun,
      iconClass: "text-yellow-500",
      gradient: "from-yellow-500/10 via-orange-500/5 to-transparent",
      border: "border-yellow-200/50 dark:border-yellow-900/30",
      accentText: "text-yellow-600 dark:text-yellow-400"
    },
    {
      text: "{name}, breakfast o'clock.",
      subtext: "Whatever you eat, eat something before the meetings start.",
      icon: UtensilsCrossed,
      iconClass: "text-orange-500",
      gradient: "from-orange-500/10 via-amber-500/5 to-transparent",
      border: "border-orange-200/50 dark:border-orange-900/30",
      accentText: "text-orange-600 dark:text-orange-400"
    },
    {
      text: "Good morning, {name}.",
      subtext: "New day, new set of problems to solve. No pressure.",
      icon: Smile,
      iconClass: "text-rose-500",
      gradient: "from-rose-500/10 via-orange-500/5 to-transparent",
      border: "border-rose-200/50 dark:border-rose-900/30",
      accentText: "text-rose-600 dark:text-rose-400"
    },
    {
      text: "{name}, the world's waking up too.",
      subtext: "Might as well join it — the day's not waiting.",
      icon: Sparkles,
      iconClass: "text-cyan-500",
      gradient: "from-cyan-500/10 via-blue-500/5 to-transparent",
      border: "border-cyan-200/50 dark:border-cyan-900/30",
      accentText: "text-cyan-600 dark:text-cyan-400"
    },
  ],
  7: [
    {
      text: "Morning, {name}.",
      subtext: "Whatever's on today's list, you've got time to tackle it properly.",
      icon: Sun,
      iconClass: "text-yellow-500",
      gradient: "from-yellow-500/10 via-amber-500/5 to-transparent",
      border: "border-yellow-200/50 dark:border-yellow-900/30",
      accentText: "text-yellow-600 dark:text-yellow-400"
    },
    {
      text: "Hey {name}, ready to get moving?",
      subtext: "A little planning now saves a lot of scrambling later.",
      icon: Smile,
      iconClass: "text-teal-500",
      gradient: "from-teal-500/10 via-emerald-500/5 to-transparent",
      border: "border-teal-200/50 dark:border-teal-900/30",
      accentText: "text-teal-600 dark:text-teal-400"
    },
    {
      text: "{name}, fresh start.",
      subtext: "Pick one thing to get done before lunch and the rest tends to follow.",
      icon: Coffee,
      iconClass: "text-orange-500",
      gradient: "from-orange-500/10 via-rose-500/5 to-transparent",
      border: "border-orange-200/50 dark:border-orange-900/30",
      accentText: "text-orange-600 dark:text-orange-400"
    },
    {
      text: "Good morning, {name}.",
      subtext: "Check the calendar, take a breath, and ease into it.",
      icon: BookOpen,
      iconClass: "text-sky-500",
      gradient: "from-sky-500/10 via-indigo-500/5 to-transparent",
      border: "border-sky-200/50 dark:border-sky-900/30",
      accentText: "text-sky-600 dark:text-sky-400"
    },
    {
      text: "{name}, the day's wide open.",
      subtext: "Nothing's gone wrong yet. That's a good place to start from.",
      icon: Award,
      iconClass: "text-indigo-500",
      gradient: "from-indigo-500/10 via-purple-500/5 to-transparent",
      border: "border-indigo-200/50 dark:border-indigo-900/30",
      accentText: "text-indigo-600 dark:text-indigo-400"
    },
  ],
  8: [
    {
      text: "Workday's starting, {name}.",
      subtext: "Whatever's first on the list, might as well get it moving.",
      icon: Laptop,
      iconClass: "text-blue-500",
      gradient: "from-blue-500/10 via-cyan-500/5 to-transparent",
      border: "border-blue-200/50 dark:border-blue-900/30",
      accentText: "text-blue-600 dark:text-blue-400"
    },
    {
      text: "Hey {name}, let's get to it.",
      subtext: "The inbox can wait five more minutes. Breathe first.",
      icon: Award,
      iconClass: "text-slate-700 dark:text-slate-300",
      gradient: "from-slate-500/10 via-zinc-500/5 to-transparent",
      border: "border-slate-200/50 dark:border-slate-800/50",
      accentText: "text-slate-700 dark:text-slate-300"
    },
    {
      text: "{name}, 8 AM and counting.",
      subtext: "Set one priority for the day and let the rest sort itself out.",
      icon: Compass,
      iconClass: "text-teal-500",
      gradient: "from-teal-500/10 via-emerald-500/5 to-transparent",
      border: "border-teal-200/50 dark:border-teal-900/30",
      accentText: "text-teal-600 dark:text-teal-400"
    },
    {
      text: "Morning, {name}.",
      subtext: "Some days start slow and speed up. Others don't. Either's fine.",
      icon: Activity,
      iconClass: "text-emerald-500",
      gradient: "from-emerald-500/10 via-sky-500/5 to-transparent",
      border: "border-emerald-200/50 dark:border-emerald-900/30",
      accentText: "text-emerald-600 dark:text-emerald-400"
    },
    {
      text: "{name}, here we go.",
      subtext: "Small steps early tend to add up by the afternoon.",
      icon: Sparkles,
      iconClass: "text-violet-500",
      gradient: "from-violet-500/10 via-indigo-500/5 to-transparent",
      border: "border-violet-200/50 dark:border-violet-900/30",
      accentText: "text-violet-600 dark:text-violet-400"
    },
  ],
  9: [
    {
      text: "Hey {name}, midmorning's here.",
      subtext: "If you've got a hard problem today, this is usually a good window for it.",
      icon: Laptop,
      iconClass: "text-indigo-500",
      gradient: "from-indigo-500/10 via-sky-500/5 to-transparent",
      border: "border-indigo-200/50 dark:border-indigo-900/30",
      accentText: "text-indigo-600 dark:text-indigo-400"
    },
    {
      text: "{name}, standup time maybe?",
      subtext: "Whatever the sync is, keep it short and get back to the real work.",
      icon: Smile,
      iconClass: "text-sky-500",
      gradient: "from-sky-500/10 via-teal-500/5 to-transparent",
      border: "border-sky-200/50 dark:border-sky-900/30",
      accentText: "text-sky-600 dark:text-sky-400"
    },
    {
      text: "Morning, {name}.",
      subtext: "Second coffee, first real progress. That tracks.",
      icon: Award,
      iconClass: "text-violet-500",
      gradient: "from-violet-500/10 via-purple-500/5 to-transparent",
      border: "border-violet-200/50 dark:border-violet-900/30",
      accentText: "text-violet-600 dark:text-violet-400"
    },
    {
      text: "{name}, momentum's building.",
      subtext: "The morning's shaping up — keep the same energy going.",
      icon: Coffee,
      iconClass: "text-amber-600",
      gradient: "from-amber-500/10 via-yellow-500/5 to-transparent",
      border: "border-amber-200/50 dark:border-amber-900/30",
      accentText: "text-amber-600 dark:text-amber-400"
    },
    {
      text: "Hey {name}, focus window open.",
      subtext: "Good time to close some tabs and open the important ones.",
      icon: Flame,
      iconClass: "text-orange-500",
      gradient: "from-orange-500/10 via-red-500/5 to-transparent",
      border: "border-orange-200/50 dark:border-orange-900/30",
      accentText: "text-orange-600 dark:text-orange-400"
    },
  ],
  10: [
    {
      text: "{name}, this is usually peak hours.",
      subtext: "If you've got deep work to do, now's a solid time for it.",
      icon: Flame,
      iconClass: "text-yellow-500",
      gradient: "from-yellow-500/10 via-amber-500/5 to-transparent",
      border: "border-yellow-200/50 dark:border-yellow-900/30",
      accentText: "text-yellow-600 dark:text-yellow-400"
    },
    {
      text: "Hey {name}, in the zone yet?",
      subtext: "No shame if not — sometimes it takes till after lunch.",
      icon: Sparkles,
      iconClass: "text-indigo-500",
      gradient: "from-indigo-500/10 via-violet-500/5 to-transparent",
      border: "border-indigo-200/50 dark:border-indigo-900/30",
      accentText: "text-indigo-600 dark:text-indigo-400"
    },
    {
      text: "{name}, late morning check-in.",
      subtext: "Whatever's hardest on your list, this hour tends to handle it well.",
      icon: Laptop,
      iconClass: "text-blue-500",
      gradient: "from-blue-500/10 via-sky-500/5 to-transparent",
      border: "border-blue-200/50 dark:border-blue-900/30",
      accentText: "text-blue-600 dark:text-blue-400"
    },
    {
      text: "Morning's holding up, {name}.",
      subtext: "Keep the noise down and the focus up a little longer.",
      icon: Compass,
      iconClass: "text-emerald-500",
      gradient: "from-emerald-500/10 via-teal-500/5 to-transparent",
      border: "border-emerald-200/50 dark:border-emerald-900/30",
      accentText: "text-emerald-600 dark:text-emerald-400"
    },
    {
      text: "{name}, good stretch of hours ahead still.",
      subtext: "Use them before lunch pulls your attention elsewhere.",
      icon: Award,
      iconClass: "text-purple-500",
      gradient: "from-purple-500/10 via-pink-500/5 to-transparent",
      border: "border-purple-200/50 dark:border-purple-900/30",
      accentText: "text-purple-600 dark:text-purple-400"
    },
  ],
  11: [
    {
      text: "Almost lunch, {name}.",
      subtext: "Worth wrapping up whatever's open before you step away.",
      icon: Smile,
      iconClass: "text-amber-500",
      gradient: "from-amber-500/10 via-orange-500/5 to-transparent",
      border: "border-amber-200/50 dark:border-amber-900/30",
      accentText: "text-amber-600 dark:text-amber-400"
    },
    {
      text: "Hey {name}, one hour to go.",
      subtext: "A good stopping point beats an interrupted one. Plan accordingly.",
      icon: UtensilsCrossed,
      iconClass: "text-orange-500",
      gradient: "from-orange-500/10 via-red-500/5 to-transparent",
      border: "border-orange-200/50 dark:border-orange-900/30",
      accentText: "text-orange-600 dark:text-orange-400"
    },
    {
      text: "{name}, the morning's nearly done.",
      subtext: "However it went, there's still an afternoon to work with.",
      icon: Activity,
      iconClass: "text-blue-500",
      gradient: "from-blue-500/10 via-indigo-500/5 to-transparent",
      border: "border-blue-200/50 dark:border-blue-900/30",
      accentText: "text-blue-600 dark:text-blue-400"
    },
    {
      text: "Getting hungry, {name}?",
      subtext: "Might be worth deciding on lunch now instead of at 12:01.",
      icon: Smile,
      iconClass: "text-yellow-500",
      gradient: "from-yellow-500/10 via-amber-500/5 to-transparent",
      border: "border-yellow-200/50 dark:border-yellow-900/30",
      accentText: "text-yellow-600 dark:text-yellow-400"
    },
    {
      text: "{name}, midday's closing in.",
      subtext: "Tie off a thread or two before the break hits.",
      icon: Sparkles,
      iconClass: "text-teal-500",
      gradient: "from-teal-500/10 via-emerald-500/5 to-transparent",
      border: "border-teal-200/50 dark:border-teal-900/30",
      accentText: "text-teal-600 dark:text-teal-400"
    },
  ],
  12: [
    {
      text: "Lunch, {name}.",
      subtext: "Step away from the screen if you can. It's usually worth it.",
      icon: UtensilsCrossed,
      iconClass: "text-amber-500",
      gradient: "from-amber-500/10 via-rose-500/5 to-transparent",
      border: "border-amber-200/50 dark:border-amber-900/30",
      accentText: "text-amber-600 dark:text-amber-400"
    },
    {
      text: "Hey {name}, midday check-in.",
      subtext: "However the morning went, this is a natural place to reset.",
      icon: Sun,
      iconClass: "text-yellow-500",
      gradient: "from-yellow-500/10 via-amber-500/5 to-transparent",
      border: "border-yellow-200/50 dark:border-yellow-900/30",
      accentText: "text-yellow-600 dark:text-yellow-400"
    },
    {
      text: "{name}, halfway through.",
      subtext: "Eat something, look at something that isn't a monitor.",
      icon: Smile,
      iconClass: "text-sky-500",
      gradient: "from-sky-500/10 via-cyan-500/5 to-transparent",
      border: "border-sky-200/50 dark:border-sky-900/30",
      accentText: "text-sky-600 dark:text-sky-400"
    },
    {
      text: "Good afternoon, {name}.",
      subtext: "The second half of the day tends to go better after an actual break.",
      icon: Compass,
      iconClass: "text-emerald-500",
      gradient: "from-emerald-500/10 via-teal-500/5 to-transparent",
      border: "border-emerald-200/50 dark:border-emerald-900/30",
      accentText: "text-emerald-600 dark:text-emerald-400"
    },
    {
      text: "{name}, table for one — or however many.",
      subtext: "Enjoy it. The afternoon can wait a bit longer.",
      icon: Sparkles,
      iconClass: "text-rose-500",
      gradient: "from-rose-500/10 via-orange-500/5 to-transparent",
      border: "border-rose-200/50 dark:border-rose-900/30",
      accentText: "text-rose-600 dark:text-rose-400"
    },
  ],
  13: [
    {
      text: "Back at it, {name}?",
      subtext: "Post-lunch focus takes a minute to kick in. Ease back into it.",
      icon: Sun,
      iconClass: "text-amber-500",
      gradient: "from-amber-500/10 via-orange-500/5 to-transparent",
      border: "border-amber-200/50 dark:border-amber-900/30",
      accentText: "text-amber-600 dark:text-amber-400"
    },
    {
      text: "Hey {name}, afternoon round two.",
      subtext: "Whatever's left on the list, this is a fine time to start it.",
      icon: Activity,
      iconClass: "text-emerald-500",
      gradient: "from-emerald-500/10 via-teal-500/5 to-transparent",
      border: "border-emerald-200/50 dark:border-emerald-900/30",
      accentText: "text-emerald-600 dark:text-emerald-400"
    },
    {
      text: "{name}, early afternoon.",
      subtext: "A little slower than the morning, maybe — that's normal.",
      icon: Flame,
      iconClass: "text-orange-500",
      gradient: "from-orange-500/10 via-red-500/5 to-transparent",
      border: "border-orange-200/50 dark:border-orange-900/30",
      accentText: "text-orange-600 dark:text-orange-400"
    },
    {
      text: "Good afternoon, {name}.",
      subtext: "Pick something manageable to get the momentum back.",
      icon: Coffee,
      iconClass: "text-amber-600",
      gradient: "from-amber-600/10 via-yellow-500/5 to-transparent",
      border: "border-amber-200/50 dark:border-amber-900/30",
      accentText: "text-amber-600 dark:text-amber-400"
    },
    {
      text: "{name}, the day's second half begins.",
      subtext: "Different energy than the morning, same goals though.",
      icon: Award,
      iconClass: "text-blue-500",
      gradient: "from-blue-500/10 via-sky-500/5 to-transparent",
      border: "border-blue-200/50 dark:border-blue-900/30",
      accentText: "text-blue-600 dark:text-blue-400"
    },
  ],
  14: [
    {
      text: "Hey {name}, creative hour?",
      subtext: "Afternoons are underrated for actually thinking things through.",
      icon: Sparkles,
      iconClass: "text-pink-500",
      gradient: "from-pink-500/10 via-purple-500/5 to-transparent",
      border: "border-pink-200/50 dark:border-pink-900/30",
      accentText: "text-pink-600 dark:text-pink-400"
    },
    {
      text: "{name}, 2 PM check-in.",
      subtext: "If you're stuck on something, this is often a good time to step back and reframe it.",
      icon: Laptop,
      iconClass: "text-purple-500",
      gradient: "from-purple-500/10 via-indigo-500/5 to-transparent",
      border: "border-purple-200/50 dark:border-purple-900/30",
      accentText: "text-purple-600 dark:text-purple-400"
    },
    {
      text: "Afternoon, {name}.",
      subtext: "Whatever needs a fresh angle, give it one now before the slump sets in.",
      icon: BookOpen,
      iconClass: "text-indigo-500",
      gradient: "from-indigo-500/10 via-sky-500/5 to-transparent",
      border: "border-indigo-200/50 dark:border-indigo-900/30",
      accentText: "text-indigo-600 dark:text-indigo-400"
    },
    {
      text: "Hey {name}, still going strong.",
      subtext: "Good energy so far — worth protecting it a bit longer.",
      icon: Sparkles,
      iconClass: "text-yellow-500",
      gradient: "from-yellow-500/10 via-orange-500/5 to-transparent",
      border: "border-yellow-200/50 dark:border-yellow-900/30",
      accentText: "text-yellow-600 dark:text-yellow-400"
    },
    {
      text: "{name}, midafternoon.",
      subtext: "A good window for the kind of work that needs a clear head.",
      icon: Compass,
      iconClass: "text-teal-500",
      gradient: "from-teal-500/10 via-emerald-500/5 to-transparent",
      border: "border-teal-200/50 dark:border-teal-900/30",
      accentText: "text-teal-600 dark:text-teal-400"
    },
  ],
  15: [
    {
      text: "3 PM, {name}.",
      subtext: "This is usually where energy dips. A short break helps more than it seems like it would.",
      icon: Coffee,
      iconClass: "text-amber-600 animate-bounce-slow",
      gradient: "from-amber-500/10 via-orange-500/5 to-transparent",
      border: "border-amber-200/50 dark:border-amber-900/30",
      accentText: "text-amber-600 dark:text-amber-400"
    },
    {
      text: "Hey {name}, feeling it yet?",
      subtext: "Water, a stretch, a few minutes away from the screen — cheap fixes that actually work.",
      icon: Smile,
      iconClass: "text-yellow-500",
      gradient: "from-yellow-500/10 via-amber-500/5 to-transparent",
      border: "border-yellow-200/50 dark:border-yellow-900/30",
      accentText: "text-yellow-600 dark:text-yellow-400"
    },
    {
      text: "{name}, the afternoon slump has entered the chat.",
      subtext: "Nothing wrong with a slower gear for a bit.",
      icon: UtensilsCrossed,
      iconClass: "text-orange-500",
      gradient: "from-orange-500/10 via-rose-500/5 to-transparent",
      border: "border-orange-200/50 dark:border-orange-900/30",
      accentText: "text-orange-600 dark:text-orange-400"
    },
    {
      text: "Afternoon check-in, {name}.",
      subtext: "The hardest part of the day's probably behind you already.",
      icon: Sparkles,
      iconClass: "text-rose-500",
      gradient: "from-rose-500/10 via-pink-500/5 to-transparent",
      border: "border-rose-200/50 dark:border-rose-900/30",
      accentText: "text-rose-600 dark:text-rose-400"
    },
    {
      text: "{name}, halfway to evening.",
      subtext: "A short reset now usually pays off for the last stretch.",
      icon: Smile,
      iconClass: "text-teal-500",
      gradient: "from-teal-500/10 via-sky-500/5 to-transparent",
      border: "border-teal-200/50 dark:border-teal-900/30",
      accentText: "text-teal-600 dark:text-teal-400"
    },
  ],
  16: [
    {
      text: "Hey {name}, home stretch.",
      subtext: "Worth deciding now what actually needs to get done before you sign off.",
      icon: Sunset,
      iconClass: "text-orange-500",
      gradient: "from-orange-500/10 via-rose-500/5 to-transparent",
      border: "border-orange-200/50 dark:border-orange-900/30",
      accentText: "text-orange-600 dark:text-orange-400"
    },
    {
      text: "{name}, golden hour outside, probably.",
      subtext: "Might be worth a glance out the window before the day wraps.",
      icon: Award,
      iconClass: "text-rose-500",
      gradient: "from-rose-500/10 via-amber-500/5 to-transparent",
      border: "border-rose-200/50 dark:border-rose-900/30",
      accentText: "text-rose-600 dark:text-rose-400"
    },
    {
      text: "Afternoon's winding down, {name}.",
      subtext: "Tie up the loose ends — tomorrow-you will appreciate it.",
      icon: BookOpen,
      iconClass: "text-amber-600",
      gradient: "from-amber-500/10 via-yellow-500/5 to-transparent",
      border: "border-amber-200/50 dark:border-amber-900/30",
      accentText: "text-amber-600 dark:text-amber-400"
    },
    {
      text: "{name}, almost there.",
      subtext: "A quick review of what got done today isn't a bad way to close out.",
      icon: Sun,
      iconClass: "text-yellow-500",
      gradient: "from-yellow-500/10 via-orange-500/5 to-transparent",
      border: "border-yellow-200/50 dark:border-yellow-900/30",
      accentText: "text-yellow-600 dark:text-yellow-400"
    },
    {
      text: "Hey {name}, last push.",
      subtext: "Finish what you can, and let the rest wait until tomorrow.",
      icon: Laptop,
      iconClass: "text-slate-600 dark:text-slate-400",
      gradient: "from-slate-500/10 via-zinc-500/5 to-transparent",
      border: "border-slate-200/50 dark:border-slate-800/50",
      accentText: "text-slate-600 dark:text-slate-400"
    },
  ],
  17: [
    {
      text: "Evening, {name}.",
      subtext: "Wherever the day landed, it's a reasonable time to start closing the laptop.",
      icon: Sunset,
      iconClass: "text-rose-500 animate-pulse",
      gradient: "from-rose-500/10 via-purple-500/5 to-transparent",
      border: "border-rose-200/50 dark:border-rose-900/30",
      accentText: "text-rose-600 dark:text-rose-400"
    },
    {
      text: "Hey {name}, day's about done.",
      subtext: "Whatever's left can probably wait until tomorrow morning.",
      icon: Smile,
      iconClass: "text-orange-500",
      gradient: "from-orange-500/10 via-amber-500/5 to-transparent",
      border: "border-orange-200/50 dark:border-orange-900/30",
      accentText: "text-orange-600 dark:text-orange-400"
    },
    {
      text: "{name}, sun's heading down.",
      subtext: "A short walk or a change of scenery tends to help the transition out of work mode.",
      icon: Compass,
      iconClass: "text-purple-500",
      gradient: "from-purple-500/10 via-indigo-500/5 to-transparent",
      border: "border-purple-200/50 dark:border-purple-900/30",
      accentText: "text-purple-600 dark:text-purple-400"
    },
    {
      text: "Good evening, {name}.",
      subtext: "Today happened. However it went, it's over now.",
      icon: Award,
      iconClass: "text-indigo-500",
      gradient: "from-indigo-500/10 via-sky-500/5 to-transparent",
      border: "border-indigo-200/50 dark:border-indigo-900/30",
      accentText: "text-indigo-600 dark:text-indigo-400"
    },
    {
      text: "{name}, signing off soon?",
      subtext: "A clear stop time makes tomorrow easier to start.",
      icon: Sparkles,
      iconClass: "text-pink-500",
      gradient: "from-pink-500/10 via-rose-500/5 to-transparent",
      border: "border-pink-200/50 dark:border-pink-900/30",
      accentText: "text-pink-600 dark:text-pink-400"
    },
  ],
  18: [
    {
      text: "Evening, {name}.",
      subtext: "Dinner, some quiet, whatever the evening calls for.",
      icon: Smile,
      iconClass: "text-amber-500",
      gradient: "from-amber-500/10 via-orange-500/5 to-transparent",
      border: "border-amber-200/50 dark:border-amber-900/30",
      accentText: "text-amber-600 dark:text-amber-400"
    },
    {
      text: "Hey {name}, home for the night?",
      subtext: "Let the work stuff stay at work for a few hours.",
      icon: Smile,
      iconClass: "text-rose-500",
      gradient: "from-rose-500/10 via-purple-500/5 to-transparent",
      border: "border-rose-200/50 dark:border-rose-900/30",
      accentText: "text-rose-600 dark:text-rose-400"
    },
    {
      text: "{name}, the evening's yours.",
      subtext: "Hope it's an easy one, whatever you're doing with it.",
      icon: Smile,
      iconClass: "text-emerald-500",
      gradient: "from-emerald-500/10 via-teal-500/5 to-transparent",
      border: "border-emerald-200/50 dark:border-emerald-900/30",
      accentText: "text-emerald-600 dark:text-emerald-400"
    },
    {
      text: "Good evening, {name}.",
      subtext: "A proper break from screens tends to help more than it costs.",
      icon: Tv,
      iconClass: "text-purple-500",
      gradient: "from-purple-500/10 via-pink-500/5 to-transparent",
      border: "border-purple-200/50 dark:border-purple-900/30",
      accentText: "text-purple-600 dark:text-purple-400"
    },
    {
      text: "{name}, dinner o'clock.",
      subtext: "Whatever's cooking, enjoy it without the laptop nearby.",
      icon: Tv,
      iconClass: "text-violet-500",
      gradient: "from-violet-500/10 via-indigo-500/5 to-transparent",
      border: "border-violet-200/50 dark:border-violet-900/30",
      accentText: "text-violet-600 dark:text-violet-400"
    },
  ],
  19: [
    {
      text: "Evening, {name}.",
      subtext: "A book, a show, a walk — whatever unwinds you best.",
      icon: Smile,
      iconClass: "text-violet-500",
      gradient: "from-violet-500/10 via-purple-500/5 to-transparent",
      border: "border-violet-200/50 dark:border-violet-900/30",
      accentText: "text-violet-600 dark:text-violet-400"
    },
    {
      text: "Hey {name}, quiet hour ahead.",
      subtext: "No agenda needed for this one.",
      icon: Music,
      iconClass: "text-pink-500",
      gradient: "from-pink-500/10 via-rose-500/5 to-transparent",
      border: "border-pink-200/50 dark:border-pink-900/30",
      accentText: "text-pink-600 dark:text-pink-400"
    },
    {
      text: "{name}, settling in?",
      subtext: "Hope the evening's easy and mostly work-free.",
      icon: Gamepad,
      iconClass: "text-indigo-500",
      gradient: "from-indigo-500/10 via-blue-500/5 to-transparent",
      border: "border-indigo-200/50 dark:border-indigo-900/30",
      accentText: "text-indigo-600 dark:text-indigo-400"
    },
    {
      text: "Good evening, {name}.",
      subtext: "Whatever's next tonight, it's earned after today.",
      icon: BookOpen,
      iconClass: "text-sky-500",
      gradient: "from-sky-500/10 via-teal-500/5 to-transparent",
      border: "border-sky-200/50 dark:border-sky-900/30",
      accentText: "text-sky-600 dark:text-sky-400"
    },
    {
      text: "{name}, the day's mostly behind you now.",
      subtext: "A calmer pace fits the hour.",
      icon: Music,
      iconClass: "text-rose-500 animate-pulse",
      gradient: "from-rose-500/10 via-indigo-500/5 to-transparent",
      border: "border-rose-200/50 dark:border-rose-900/30",
      accentText: "text-rose-600 dark:text-rose-400"
    },
  ],
  20: [
    {
      text: "Hey {name}, evening's in full swing.",
      subtext: "Games, a show, a hobby — whatever the unwind of choice is tonight.",
      icon: Gamepad,
      iconClass: "text-indigo-500 animate-bounce-slow",
      gradient: "from-indigo-500/10 via-purple-500/5 to-transparent",
      border: "border-indigo-200/50 dark:border-indigo-900/30",
      accentText: "text-indigo-600 dark:text-indigo-400"
    },
    {
      text: "{name}, leisure hours.",
      subtext: "No wrong answers for how to spend these.",
      icon: Tv,
      iconClass: "text-violet-500",
      gradient: "from-violet-500/10 via-fuchsia-500/5 to-transparent",
      border: "border-violet-200/50 dark:border-violet-900/30",
      accentText: "text-violet-600 dark:text-violet-400"
    },
    {
      text: "Evening, {name}.",
      subtext: "Hope whatever's on tonight is genuinely enjoyable, not just filler.",
      icon: Smile,
      iconClass: "text-emerald-500",
      gradient: "from-emerald-500/10 via-teal-500/5 to-transparent",
      border: "border-emerald-200/50 dark:border-emerald-900/30",
      accentText: "text-emerald-600 dark:text-emerald-400"
    },
    {
      text: "Hey {name}, downtime.",
      subtext: "Worth protecting this time from work creeping back in.",
      icon: Gamepad,
      iconClass: "text-rose-500",
      gradient: "from-rose-500/10 via-pink-500/5 to-transparent",
      border: "border-rose-200/50 dark:border-rose-900/30",
      accentText: "text-rose-600 dark:text-rose-400"
    },
    {
      text: "{name}, the fun part of the day.",
      subtext: "Enjoy it properly — you've earned the break.",
      icon: Coffee,
      iconClass: "text-amber-500",
      gradient: "from-amber-500/10 via-orange-500/5 to-transparent",
      border: "border-amber-200/50 dark:border-amber-900/30",
      accentText: "text-amber-600 dark:text-amber-400"
    },
  ],
  21: [
    {
      text: "{name}, evening's winding down.",
      subtext: "A good hour to start easing toward sleep, even loosely.",
      icon: Moon,
      iconClass: "text-blue-400",
      gradient: "from-blue-500/10 via-indigo-500/5 to-transparent",
      border: "border-blue-200/50 dark:border-blue-900/30",
      accentText: "text-blue-600 dark:text-blue-400"
    },
    {
      text: "Hey {name}, quieter now.",
      subtext: "Whatever's left of tonight, no need to rush it.",
      icon: BookOpen,
      iconClass: "text-violet-500",
      gradient: "from-violet-500/10 via-purple-500/5 to-transparent",
      border: "border-violet-200/50 dark:border-violet-900/30",
      accentText: "text-violet-600 dark:text-violet-400"
    },
    {
      text: "Evening, {name}.",
      subtext: "Screens dimmer, thoughts slower — that's usually the right direction from here.",
      icon: Coffee,
      iconClass: "text-yellow-600 dark:text-yellow-500",
      gradient: "from-yellow-500/10 via-amber-500/5 to-transparent",
      border: "border-yellow-200/50 dark:border-yellow-900/30",
      accentText: "text-yellow-600 dark:text-yellow-400"
    },
    {
      text: "{name}, night's settling in.",
      subtext: "A calm close to the day tends to make tomorrow easier.",
      icon: Sparkles,
      iconClass: "text-pink-400 animate-pulse",
      gradient: "from-pink-500/10 via-rose-500/5 to-transparent",
      border: "border-pink-200/50 dark:border-pink-900/30",
      accentText: "text-pink-600 dark:text-pink-400"
    },
    {
      text: "Hey {name}, almost bedtime territory.",
      subtext: "Worth starting to wind things down if you haven't already.",
      icon: Moon,
      iconClass: "text-cyan-400",
      gradient: "from-cyan-500/10 via-indigo-500/5 to-transparent",
      border: "border-cyan-200/50 dark:border-cyan-900/30",
      accentText: "text-cyan-600 dark:text-cyan-400"
    },
  ],
  22: [
    {
      text: "{name}, getting late.",
      subtext: "Screens off soon probably helps more than one more episode.",
      icon: Moon,
      iconClass: "text-indigo-400 animate-pulse",
      gradient: "from-indigo-950/20 via-slate-900/10 to-transparent",
      border: "border-indigo-500/20 dark:border-indigo-500/30",
      accentText: "text-indigo-400"
    },
    {
      text: "Good night, {name}.",
      subtext: "Hope the sleep's a good one — today's done, tomorrow can wait.",
      icon: Moon,
      iconClass: "text-blue-400",
      gradient: "from-blue-950/20 via-slate-900/10 to-transparent",
      border: "border-blue-500/20 dark:border-blue-500/30",
      accentText: "text-blue-400"
    },
    {
      text: "Hey {name}, winding down.",
      subtext: "Whatever's left can hold until morning.",
      icon: Moon,
      iconClass: "text-teal-400",
      gradient: "from-teal-950/20 via-slate-900/10 to-transparent",
      border: "border-teal-500/20 dark:border-teal-500/30",
      accentText: "text-teal-400"
    },
    {
      text: "{name}, late evening now.",
      subtext: "A calmer close to the day usually pays off tomorrow.",
      icon: Sparkles,
      iconClass: "text-purple-400",
      gradient: "from-purple-950/20 via-indigo-950/10 to-transparent",
      border: "border-purple-500/20 dark:border-purple-500/30",
      accentText: "text-purple-400"
    },
    {
      text: "Almost bedtime, {name}.",
      subtext: "Rest well — you've earned it.",
      icon: Sparkles,
      iconClass: "text-pink-400",
      gradient: "from-pink-950/20 via-slate-900/10 to-transparent",
      border: "border-pink-500/20 dark:border-pink-500/30",
      accentText: "text-pink-400"
    },
  ],
  23: [
    {
      text: "{name}, nearly midnight.",
      subtext: "Today's basically done. Tomorrow's a clean slate.",
      icon: Sparkles,
      iconClass: "text-violet-400",
      gradient: "from-violet-950/20 via-purple-950/10 to-transparent",
      border: "border-violet-500/20 dark:border-violet-500/30",
      accentText: "text-violet-400"
    },
    {
      text: "Hey {name}, last hour of the day.",
      subtext: "Whatever's unfinished can wait for daylight.",
      icon: Moon,
      iconClass: "text-indigo-400 animate-pulse",
      gradient: "from-indigo-950/20 via-slate-900/10 to-transparent",
      border: "border-indigo-500/20 dark:border-indigo-500/30",
      accentText: "text-indigo-400"
    },
    {
      text: "{name}, close to the reset.",
      subtext: "Hope tonight's rest is a good one.",
      icon: Sparkles,
      iconClass: "text-sky-400",
      gradient: "from-sky-950/20 via-slate-900/10 to-transparent",
      border: "border-sky-500/20 dark:border-sky-500/30",
      accentText: "text-sky-400"
    },
    {
      text: "Late one, {name}.",
      subtext: "Whatever kept you up this late, hope it was worth it.",
      icon: Moon,
      iconClass: "text-cyan-400",
      gradient: "from-cyan-950/20 via-slate-900/10 to-transparent",
      border: "border-cyan-500/20 dark:border-cyan-500/30",
      accentText: "text-cyan-400"
    },
    {
      text: "Almost a new day, {name}.",
      subtext: "Rest well — there's always tomorrow for the rest of it.",
      icon: Sparkles,
      iconClass: "text-purple-400",
      gradient: "from-purple-950/20 via-slate-900/10 to-transparent",
      border: "border-purple-500/20 dark:border-purple-500/30",
      accentText: "text-purple-400"
    },
  ],
}
