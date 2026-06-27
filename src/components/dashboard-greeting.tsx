"use client"

import React, { useEffect, useState } from "react"
import { useUserContext } from "@/contexts/user-context"
import { 
  Sparkles, 
  Moon, 
  Sun, 
  Sunrise, 
  Sunset, 
  Coffee, 
  Laptop, 
  Compass, 
  Gamepad, 
  Tv, 
  Music, 
  UtensilsCrossed, 
  Smile, 
  BookOpen, 
  Activity,
  Flame,
  Award
} from "lucide-react"

export type GreetingDetail = {
  text: (name: string) => string
  subtext: (name: string) => string
  icon: React.ReactNode
  gradient: string
  border: string
  accentText: string
}

// 120 greetings (5 for each of the 24 hours)
export const hourlyGreetings: Record<number, GreetingDetail[]> = {
    // 12:00 AM - 12:59 AM
    0: [
      {
        text: (name) => `Hi ${name}! 🌌`,
        subtext: () => "Midnight magic is in the air. Time to dream big or code deep!",
        icon: <Moon className="h-8 w-8 text-indigo-400 animate-pulse" />,
        gradient: "from-indigo-950/20 via-purple-950/10 to-transparent",
        border: "border-indigo-500/20 dark:border-indigo-500/30",
        accentText: "text-indigo-400"
      },
      {
        text: (name) => `Hello ${name}! ✨`,
        subtext: () => "A new day has officially begun. Hope your night is peaceful.",
        icon: <Sparkles className="h-8 w-8 text-violet-400" />,
        gradient: "from-violet-950/20 via-fuchsia-950/10 to-transparent",
        border: "border-violet-500/20 dark:border-violet-500/30",
        accentText: "text-violet-400"
      },
      {
        text: (name) => `Midnight check-in, ${name}! 🌠`,
        subtext: () => "Hope you're enjoying the quiet side of the world.",
        icon: <Compass className="h-8 w-8 text-blue-400" />,
        gradient: "from-blue-950/20 via-slate-900/10 to-transparent",
        border: "border-blue-500/20 dark:border-blue-500/30",
        accentText: "text-blue-400"
      },
      {
        text: (name) => `Hey ${name}! 🔮`,
        subtext: () => "Let the quiet of midnight spark your best ideas.",
        icon: <Sparkles className="h-8 w-8 text-purple-400" />,
        gradient: "from-purple-950/20 via-indigo-950/10 to-transparent",
        border: "border-purple-500/20 dark:border-purple-500/30",
        accentText: "text-purple-400"
      },
      {
        text: (name) => `Welcome to the new day, ${name}! 🛸`,
        subtext: () => "Whispering stars and quiet vibes. Wishing you a peaceful night.",
        icon: <Moon className="h-8 w-8 text-cyan-400" />,
        gradient: "from-cyan-950/20 via-slate-900/10 to-transparent",
        border: "border-cyan-500/20 dark:border-cyan-500/30",
        accentText: "text-cyan-400"
      }
    ],
    // 1:00 AM - 1:59 AM
    1: [
      {
        text: (name) => `Still awake, ${name}? 🦉`,
        subtext: () => "The night is quiet, and the focus is real. You've got this!",
        icon: <Laptop className="h-8 w-8 text-fuchsia-400" />,
        gradient: "from-fuchsia-950/20 via-purple-950/10 to-transparent",
        border: "border-fuchsia-500/20 dark:border-fuchsia-500/30",
        accentText: "text-fuchsia-400"
      },
      {
        text: (name) => `Hi ${name}! 💻`,
        subtext: () => "Under the neon glow, the best ideas come to life.",
        icon: <Sparkles className="h-8 w-8 text-cyan-400" />,
        gradient: "from-cyan-950/20 via-blue-950/10 to-transparent",
        border: "border-cyan-500/20 dark:border-cyan-500/30",
        accentText: "text-cyan-400"
      },
      {
        text: (name) => `Hey ${name}! ⌨️`,
        subtext: () => "Coding into the quiet hours? Keep shining, but don't forget to rest!",
        icon: <Laptop className="h-8 w-8 text-indigo-400 animate-pulse" />,
        gradient: "from-indigo-950/20 via-fuchsia-950/10 to-transparent",
        border: "border-indigo-500/20 dark:border-indigo-500/30",
        accentText: "text-indigo-400"
      },
      {
        text: (name) => `Night owl mode, ${name}! 💡`,
        subtext: () => "The world is sleeping, but you are building. Incredible dedication!",
        icon: <Sparkles className="h-8 w-8 text-yellow-400" />,
        gradient: "from-yellow-950/20 via-amber-950/10 to-transparent",
        border: "border-yellow-500/20 dark:border-yellow-500/30",
        accentText: "text-yellow-400"
      },
      {
        text: (name) => `Hello ${name}! 🧪`,
        subtext: () => "Creating wonders in the quietest hours. Hope your night is cozy.",
        icon: <Compass className="h-8 w-8 text-teal-400" />,
        gradient: "from-teal-950/20 via-slate-900/10 to-transparent",
        border: "border-teal-500/20 dark:border-teal-500/30",
        accentText: "text-teal-400"
      }
    ],
    // 2:00 AM - 2:59 AM
    2: [
      {
        text: (name) => `Hi ${name}! 💤`,
        subtext: () => "In the stillness of the deep night, hope your mind is resting well.",
        icon: <Moon className="h-8 w-8 text-blue-400" />,
        gradient: "from-blue-950/20 via-slate-900/10 to-transparent",
        border: "border-blue-500/20 dark:border-blue-500/30",
        accentText: "text-blue-400"
      },
      {
        text: (name) => `Late night coding, ${name}? 🛌`,
        subtext: () => "Make sure to grab a comfortable pillow soon!",
        icon: <Moon className="h-8 w-8 text-violet-400" />,
        gradient: "from-violet-950/20 via-indigo-950/10 to-transparent",
        border: "border-violet-500/20 dark:border-violet-500/30",
        accentText: "text-violet-400"
      },
      {
        text: (name) => `Hey ${name}! 🤫`,
        subtext: () => "Shhh... the universe is resting. Hope you are winding down.",
        icon: <Moon className="h-8 w-8 text-indigo-400" />,
        gradient: "from-indigo-950/20 via-slate-950/10 to-transparent",
        border: "border-indigo-500/20 dark:border-indigo-500/30",
        accentText: "text-indigo-400"
      },
      {
        text: (name) => `Deep night thoughts, ${name}? 🌌`,
        subtext: () => "The stars are watching. Take a deep breath and let go of the day.",
        icon: <Sparkles className="h-8 w-8 text-purple-400 animate-pulse" />,
        gradient: "from-purple-950/20 via-slate-900/10 to-transparent",
        border: "border-purple-500/20 dark:border-purple-500/30",
        accentText: "text-purple-400"
      },
      {
        text: (name) => `Hello ${name}! 🧸`,
        subtext: () => "Rest is the fuel for tomorrow's success. Sweet dreams soon!",
        icon: <Moon className="h-8 w-8 text-sky-400" />,
        gradient: "from-sky-950/20 via-slate-900/10 to-transparent",
        border: "border-sky-500/20 dark:border-sky-500/30",
        accentText: "text-sky-400"
      }
    ],
    // 3:00 AM - 3:59 AM
    3: [
      {
        text: (name) => `Hi ${name}! 🧙‍♂️`,
        subtext: () => "3 AM ideas hit differently. What creative thoughts are on your mind?",
        icon: <Sparkles className="h-8 w-8 text-purple-400 animate-pulse" />,
        gradient: "from-purple-950/20 via-violet-950/10 to-transparent",
        border: "border-purple-500/20 dark:border-purple-500/30",
        accentText: "text-purple-400"
      },
      {
        text: (name) => `Hey ${name}! 🔮`,
        subtext: () => "The quietest hour of the night is when the magic happens.",
        icon: <Sparkles className="h-8 w-8 text-indigo-400" />,
        gradient: "from-indigo-950/20 via-purple-950/10 to-transparent",
        border: "border-indigo-500/20 dark:border-indigo-500/30",
        accentText: "text-indigo-400"
      },
      {
        text: (name) => `Wow, late night, ${name}! 🕸️`,
        subtext: () => "Make sure to give your eyes a good break. Sleep is precious.",
        icon: <Moon className="h-8 w-8 text-rose-400" />,
        gradient: "from-rose-950/20 via-slate-900/10 to-transparent",
        border: "border-rose-500/20 dark:border-rose-500/30",
        accentText: "text-rose-400"
      },
      {
        text: (name) => `Hi ${name}! ✨`,
        subtext: () => "Exploring the unknown at 3 AM? You are truly dedicated.",
        icon: <Laptop className="h-8 w-8 text-violet-400" />,
        gradient: "from-violet-950/20 via-purple-950/10 to-transparent",
        border: "border-violet-500/20 dark:border-violet-500/30",
        accentText: "text-violet-400"
      },
      {
        text: (name) => `Hello ${name}! 🧠`,
        subtext: () => "Let your thoughts settle and get some peaceful sleep. You deserve it.",
        icon: <Sparkles className="h-8 w-8 text-blue-400" />,
        gradient: "from-blue-950/20 via-slate-900/10 to-transparent",
        border: "border-blue-500/20 dark:border-blue-500/30",
        accentText: "text-blue-400"
      }
    ],
    // 4:00 AM - 4:59 AM
    4: [
      {
        text: (name) => `Hi ${name}! 🌅`,
        subtext: () => "Early bird or night owl? The first light of dawn is almost here.",
        icon: <Sunrise className="h-8 w-8 text-teal-400" />,
        gradient: "from-teal-950/20 via-slate-900/10 to-transparent",
        border: "border-teal-500/20 dark:border-teal-500/30",
        accentText: "text-teal-400"
      },
      {
        text: (name) => `Hey ${name}! ☕`,
        subtext: () => "A fresh dawn is brewing. Hope your morning start is peaceful.",
        icon: <Coffee className="h-8 w-8 text-amber-500" />,
        gradient: "from-amber-950/20 via-slate-900/10 to-transparent",
        border: "border-amber-500/20 dark:border-amber-500/30",
        accentText: "text-amber-500"
      },
      {
        text: (name) => `Almost sunrise, ${name}! 🐦`,
        subtext: () => "The birds will start singing soon. Take it easy and enjoy the calm.",
        icon: <Sunrise className="h-8 w-8 text-sky-400" />,
        gradient: "from-sky-950/20 via-slate-900/10 to-transparent",
        border: "border-sky-500/20 dark:border-sky-500/30",
        accentText: "text-sky-400"
      },
      {
        text: (name) => `Hi ${name}! 🌬️`,
        subtext: () => "The cool pre-dawn breeze is waiting. Hope you're feeling calm and focused.",
        icon: <Compass className="h-8 w-8 text-emerald-400" />,
        gradient: "from-emerald-950/20 via-slate-900/10 to-transparent",
        border: "border-emerald-500/20 dark:border-emerald-500/30",
        accentText: "text-emerald-400"
      },
      {
        text: (name) => `Hello ${name}! ❄️`,
        subtext: () => "A quiet start to a beautiful day. Wishing you absolute clarity.",
        icon: <Sparkles className="h-8 w-8 text-cyan-400" />,
        gradient: "from-cyan-950/20 via-slate-900/10 to-transparent",
        border: "border-cyan-500/20 dark:border-cyan-500/30",
        accentText: "text-cyan-400"
      }
    ],
    // 5:00 AM - 5:59 AM
    5: [
      {
        text: (name) => `Good morning, ${name}! 🌄`,
        subtext: () => "Early rise, early victories. Let's make today beautiful.",
        icon: <Sunrise className="h-8 w-8 text-amber-500 animate-pulse" />,
        gradient: "from-amber-500/10 via-orange-500/5 to-transparent",
        border: "border-amber-200/50 dark:border-amber-900/30",
        accentText: "text-amber-600 dark:text-amber-400"
      },
      {
        text: (name) => `Hi ${name}! 🏃‍♂️`,
        subtext: () => "A fresh start to a fresh day. Let's step into it with joy and energy!",
        icon: <Activity className="h-8 w-8 text-emerald-500" />,
        gradient: "from-emerald-500/10 via-teal-500/5 to-transparent",
        border: "border-emerald-200/50 dark:border-emerald-900/30",
        accentText: "text-emerald-600 dark:text-emerald-400"
      },
      {
        text: (name) => `Rise and shine, ${name}! 🌱`,
        subtext: () => "Hope your morning tea or coffee tastes amazing. Let's grow today.",
        icon: <Coffee className="h-8 w-8 text-orange-500" />,
        gradient: "from-orange-500/10 via-amber-500/5 to-transparent",
        border: "border-orange-200/50 dark:border-orange-900/30",
        accentText: "text-orange-600 dark:text-orange-400"
      },
      {
        text: (name) => `Hey ${name}! 🌤️`,
        subtext: () => "Watching the sky change colors. Hope your day starts with high energy.",
        icon: <Sunrise className="h-8 w-8 text-yellow-500" />,
        gradient: "from-yellow-500/10 via-amber-500/5 to-transparent",
        border: "border-yellow-200/50 dark:border-yellow-900/30",
        accentText: "text-yellow-600 dark:text-yellow-400"
      },
      {
        text: (name) => `Hello ${name}! 🍵`,
        subtext: () => "Welcome to the quietest hour of the morning. Wishing you deep focus.",
        icon: <Sparkles className="h-8 w-8 text-teal-500" />,
        gradient: "from-teal-500/10 via-sky-500/5 to-transparent",
        border: "border-teal-200/50 dark:border-teal-900/30",
        accentText: "text-teal-600 dark:text-teal-400"
      }
    ],
    // 6:00 AM - 6:59 AM
    6: [
      {
        text: (name) => `Good morning, ${name}! ☕`,
        subtext: () => "The coffee is brewing and the sun is rising. The perfect combination!",
        icon: <Coffee className="h-8 w-8 text-amber-600" />,
        gradient: "from-amber-500/10 via-orange-500/5 to-transparent",
        border: "border-amber-200/50 dark:border-amber-900/30",
        accentText: "text-amber-700 dark:text-amber-400"
      },
      {
        text: (name) => `Hi ${name}! ☀️`,
        subtext: () => "The sun is officially up! Let's greet the day with a smile and focus.",
        icon: <Sun className="h-8 w-8 text-yellow-500" />,
        gradient: "from-yellow-500/10 via-orange-500/5 to-transparent",
        border: "border-yellow-200/50 dark:border-yellow-900/30",
        accentText: "text-yellow-600 dark:text-yellow-400"
      },
      {
        text: (name) => `Morning, ${name}! 🍳`,
        subtext: () => "Time for a delicious breakfast and a kickstart of fresh energy.",
        icon: <UtensilsCrossed className="h-8 w-8 text-orange-500" />,
        gradient: "from-orange-500/10 via-amber-500/5 to-transparent",
        border: "border-orange-200/50 dark:border-orange-900/30",
        accentText: "text-orange-600 dark:text-orange-400"
      },
      {
        text: (name) => `Hey ${name}! 🥐`,
        subtext: () => "Hope your day starts with warm vibes, gentle breezes, and great motivation.",
        icon: <Smile className="h-8 w-8 text-rose-500" />,
        gradient: "from-rose-500/10 via-orange-500/5 to-transparent",
        border: "border-rose-200/50 dark:border-rose-900/30",
        accentText: "text-rose-600 dark:text-rose-400"
      },
      {
        text: (name) => `Hello ${name}! 🥛`,
        subtext: () => "Fresh day, fresh mind. Let's make something amazing and lasting today.",
        icon: <Sparkles className="h-8 w-8 text-cyan-500" />,
        gradient: "from-cyan-500/10 via-blue-500/5 to-transparent",
        border: "border-cyan-200/50 dark:border-cyan-900/30",
        accentText: "text-cyan-600 dark:text-cyan-400"
      }
    ],
    // 7:00 AM - 7:59 AM
    7: [
      {
        text: (name) => `Good morning, ${name}! ☀️`,
        subtext: () => "Wishing you a day full of productivity, happiness, and clear goals.",
        icon: <Sun className="h-8 w-8 text-yellow-500" />,
        gradient: "from-yellow-500/10 via-amber-500/5 to-transparent",
        border: "border-yellow-200/50 dark:border-yellow-900/30",
        accentText: "text-yellow-600 dark:text-yellow-400"
      },
      {
        text: (name) => `Hi ${name}! 🧼`,
        subtext: () => "Ready for a fresh start? Let's kick off the morning routine.",
        icon: <Smile className="h-8 w-8 text-teal-500" />,
        gradient: "from-teal-500/10 via-emerald-500/5 to-transparent",
        border: "border-teal-200/50 dark:border-teal-900/30",
        accentText: "text-teal-600 dark:text-teal-400"
      },
      {
        text: (name) => `Hey ${name}! 🥞`,
        subtext: () => "Pancakes or cereal? Fuel up properly for a fantastic day ahead!",
        icon: <Coffee className="h-8 w-8 text-orange-500" />,
        gradient: "from-orange-500/10 via-rose-500/5 to-transparent",
        border: "border-orange-200/50 dark:border-orange-900/30",
        accentText: "text-orange-600 dark:text-orange-400"
      },
      {
        text: (name) => `Morning, ${name}! 📖`,
        subtext: () => "A blank canvas of 24 hours lies ahead. Write a great story today.",
        icon: <BookOpen className="h-8 w-8 text-sky-500" />,
        gradient: "from-sky-500/10 via-indigo-500/5 to-transparent",
        border: "border-sky-200/50 dark:border-sky-900/30",
        accentText: "text-sky-600 dark:text-sky-400"
      },
      {
        text: (name) => `Hello ${name}! 📅`,
        subtext: () => "Check your calendar, set your priorities, and let's win today!",
        icon: <Award className="h-8 w-8 text-indigo-500" />,
        gradient: "from-indigo-500/10 via-purple-500/5 to-transparent",
        border: "border-indigo-200/50 dark:border-indigo-900/30",
        accentText: "text-indigo-600 dark:text-indigo-400"
      }
    ],
    // 8:00 AM - 8:59 AM
    8: [
      {
        text: (name) => `Hi ${name}! 🚀`,
        subtext: () => "The workday begins! Let's set our sights on high achievements today.",
        icon: <Laptop className="h-8 w-8 text-blue-500" />,
        gradient: "from-blue-500/10 via-cyan-500/5 to-transparent",
        border: "border-blue-200/50 dark:border-blue-900/30",
        accentText: "text-blue-600 dark:text-blue-400"
      },
      {
        text: (name) => `Good morning, ${name}! 💼`,
        subtext: () => "Grab your goals and let's turn them into actions. Time to shine.",
        icon: <Award className="h-8 w-8 text-slate-700 dark:text-slate-300" />,
        gradient: "from-slate-500/10 via-zinc-500/5 to-transparent",
        border: "border-slate-200/50 dark:border-slate-800/50",
        accentText: "text-slate-700 dark:text-slate-300"
      },
      {
        text: (name) => `Hey ${name}! 📧`,
        subtext: () => "Inboxes are loading, but remember to prioritize your focus and peace first.",
        icon: <Compass className="h-8 w-8 text-teal-500" />,
        gradient: "from-teal-500/10 via-emerald-500/5 to-transparent",
        border: "border-teal-200/50 dark:border-teal-900/30",
        accentText: "text-teal-600 dark:text-teal-400"
      },
      {
        text: (name) => `Morning, ${name}! 📈`,
        subtext: () => "Let's make incremental progress today. Every single step counts!",
        icon: <Activity className="h-8 w-8 text-emerald-500" />,
        gradient: "from-emerald-500/10 via-sky-500/5 to-transparent",
        border: "border-emerald-200/50 dark:border-emerald-900/30",
        accentText: "text-emerald-600 dark:text-emerald-400"
      },
      {
        text: (name) => `Hello ${name}! 🎯`,
        subtext: () => "Set your primary target for the day. Let's hit it together!",
        icon: <Sparkles className="h-8 w-8 text-violet-500" />,
        gradient: "from-violet-500/10 via-indigo-500/5 to-transparent",
        border: "border-violet-200/50 dark:border-violet-900/30",
        accentText: "text-violet-600 dark:text-violet-400"
      }
    ],
    // 9:00 AM - 9:59 AM
    9: [
      {
        text: (name) => `Hi ${name}! 💻`,
        subtext: () => "Coding time, collaborating time. Let's build something epic today!",
        icon: <Laptop className="h-8 w-8 text-indigo-500" />,
        gradient: "from-indigo-500/10 via-sky-500/5 to-transparent",
        border: "border-indigo-200/50 dark:border-indigo-900/30",
        accentText: "text-indigo-600 dark:text-indigo-400"
      },
      {
        text: (name) => `Good morning, ${name}! 📋`,
        subtext: () => "Fresh energy for your morning standups. Let's coordinate and conquer.",
        icon: <Smile className="h-8 w-8 text-sky-500" />,
        gradient: "from-sky-500/10 via-teal-500/5 to-transparent",
        border: "border-sky-200/50 dark:border-sky-900/30",
        accentText: "text-sky-600 dark:text-sky-400"
      },
      {
        text: (name) => `Hey ${name}! 🤝`,
        subtext: () => "Teamwork makes the dream work. Hope your morning is going beautifully.",
        icon: <Award className="h-8 w-8 text-violet-500" />,
        gradient: "from-violet-500/10 via-purple-500/5 to-transparent",
        border: "border-violet-200/50 dark:border-violet-900/30",
        accentText: "text-violet-600 dark:text-violet-400"
      },
      {
        text: (name) => `Morning, ${name}! ☕`,
        subtext: () => "Time for a quick second sip of coffee or tea. Keep the creative flow!",
        icon: <Coffee className="h-8 w-8 text-amber-600" />,
        gradient: "from-amber-500/10 via-yellow-500/5 to-transparent",
        border: "border-amber-200/50 dark:border-amber-900/30",
        accentText: "text-amber-600 dark:text-amber-400"
      },
      {
        text: (name) => `Hello ${name}! 🔥`,
        subtext: () => "The morning momentum is real. Let's ride the wave and build magic.",
        icon: <Flame className="h-8 w-8 text-orange-500" />,
        gradient: "from-orange-500/10 via-red-500/5 to-transparent",
        border: "border-orange-200/50 dark:border-orange-900/30",
        accentText: "text-orange-600 dark:text-orange-400"
      }
    ],
    // 10:00 AM - 10:59 AM
    10: [
      {
        text: (name) => `Hi ${name}! ⚡`,
        subtext: () => "In the zone! Peak productivity mode is fully unlocked and ready.",
        icon: <Flame className="h-8 w-8 text-yellow-500" />,
        gradient: "from-yellow-500/10 via-amber-500/5 to-transparent",
        border: "border-yellow-200/50 dark:border-yellow-900/30",
        accentText: "text-yellow-600 dark:text-yellow-400"
      },
      {
        text: (name) => `Hey ${name}! 🧠`,
        subtext: () => "Deep focus hour. Hope you are making outstanding progress on your tasks.",
        icon: <Sparkles className="h-8 w-8 text-indigo-500" />,
        gradient: "from-indigo-500/10 via-violet-500/5 to-transparent",
        border: "border-indigo-200/50 dark:border-indigo-900/30",
        accentText: "text-indigo-600 dark:text-indigo-400"
      },
      {
        text: (name) => `Good morning, ${name}! 💻`,
        subtext: () => "Coding, building, creating. Let's resolve the hardest bugs right now.",
        icon: <Laptop className="h-8 w-8 text-blue-500" />,
        gradient: "from-blue-500/10 via-sky-500/5 to-transparent",
        border: "border-blue-200/50 dark:border-blue-900/30",
        accentText: "text-blue-600 dark:text-blue-400"
      },
      {
        text: (name) => `Morning, ${name}! 🎯`,
        subtext: () => "Stay focused, block the noise, and design beautiful solutions.",
        icon: <Compass className="h-8 w-8 text-emerald-500" />,
        gradient: "from-emerald-500/10 via-teal-500/5 to-transparent",
        border: "border-emerald-200/50 dark:border-emerald-900/30",
        accentText: "text-emerald-600 dark:text-emerald-400"
      },
      {
        text: (name) => `Hello ${name}! 🚀`,
        subtext: () => "High energy, high impact. What amazing feature are we launching today?",
        icon: <Award className="h-8 w-8 text-purple-500" />,
        gradient: "from-purple-500/10 via-pink-500/5 to-transparent",
        border: "border-purple-200/50 dark:border-purple-900/30",
        accentText: "text-purple-600 dark:text-purple-400"
      }
    ],
    // 11:00 AM - 11:59 AM
    11: [
      {
        text: (name) => `Hi ${name}! 🍕`,
        subtext: () => "Almost lunchtime! Time to wrap up those morning focus tasks.",
        icon: <Smile className="h-8 w-8 text-amber-500" />,
        gradient: "from-amber-500/10 via-orange-500/5 to-transparent",
        border: "border-amber-200/50 dark:border-amber-900/30",
        accentText: "text-amber-600 dark:text-amber-400"
      },
      {
        text: (name) => `Hey ${name}! 🍔`,
        subtext: () => "Brain power needs food power. What are you planning for lunch today?",
        icon: <UtensilsCrossed className="h-8 w-8 text-orange-500" />,
        gradient: "from-orange-500/10 via-red-500/5 to-transparent",
        border: "border-orange-200/50 dark:border-orange-900/30",
        accentText: "text-orange-600 dark:text-orange-400"
      },
      {
        text: (name) => `Good morning, ${name}! 🕛`,
        subtext: () => "Just an hour until midday. Let's finish this morning block strong.",
        icon: <Activity className="h-8 w-8 text-blue-500" />,
        gradient: "from-blue-500/10 via-indigo-500/5 to-transparent",
        border: "border-blue-200/50 dark:border-blue-900/30",
        accentText: "text-blue-600 dark:text-blue-400"
      },
      {
        text: (name) => `Morning check, ${name}! 🤤`,
        subtext: () => "Is the stomach growling yet? Hope you had a highly productive morning.",
        icon: <Smile className="h-8 w-8 text-yellow-500" />,
        gradient: "from-yellow-500/10 via-amber-500/5 to-transparent",
        border: "border-yellow-200/50 dark:border-yellow-900/30",
        accentText: "text-yellow-600 dark:text-yellow-400"
      },
      {
        text: (name) => `Hello ${name}! 🥗`,
        subtext: () => "Balancing focus and hunger. You are doing a spectacular job today.",
        icon: <Sparkles className="h-8 w-8 text-teal-500" />,
        gradient: "from-teal-500/10 via-emerald-500/5 to-transparent",
        border: "border-teal-200/50 dark:border-teal-900/30",
        accentText: "text-teal-600 dark:text-teal-400"
      }
    ],
    // 12:00 PM - 12:59 PM
    12: [
      {
        text: (name) => `Good afternoon, ${name}! 🍱`,
        subtext: () => "Lunch break is here! Time to step away, eat well, and recharge.",
        icon: <UtensilsCrossed className="h-8 w-8 text-amber-500" />,
        gradient: "from-amber-500/10 via-rose-500/5 to-transparent",
        border: "border-amber-200/50 dark:border-amber-900/30",
        accentText: "text-amber-600 dark:text-amber-400"
      },
      {
        text: (name) => `Hi ${name}! ☀️`,
        subtext: () => "The sun is at its peak. Hope you are enjoying a nice midday rest.",
        icon: <Sun className="h-8 w-8 text-yellow-500" />,
        gradient: "from-yellow-500/10 via-amber-500/5 to-transparent",
        border: "border-yellow-200/50 dark:border-yellow-900/30",
        accentText: "text-yellow-600 dark:text-yellow-400"
      },
      {
        text: (name) => `Hey ${name}! 🥤`,
        subtext: () => "Stay hydrated! Enjoy your meal and take a well-deserved break.",
        icon: <Smile className="h-8 w-8 text-sky-500" />,
        gradient: "from-sky-500/10 via-cyan-500/5 to-transparent",
        border: "border-sky-200/50 dark:border-sky-900/30",
        accentText: "text-sky-600 dark:text-sky-400"
      },
      {
        text: (name) => `Midday check-in, ${name}! 🌳`,
        subtext: () => "Take a quick walk or look out the window. Give your mind a reset.",
        icon: <Compass className="h-8 w-8 text-emerald-500" />,
        gradient: "from-emerald-500/10 via-teal-500/5 to-transparent",
        border: "border-emerald-200/50 dark:border-emerald-900/30",
        accentText: "text-emerald-600 dark:text-emerald-400"
      },
      {
        text: (name) => `Hello ${name}! 💬`,
        subtext: () => "Midday chat, relaxation, and resting the screen eyes. Enjoy this break.",
        icon: <Sparkles className="h-8 w-8 text-rose-500" />,
        gradient: "from-rose-500/10 via-orange-500/5 to-transparent",
        border: "border-rose-200/50 dark:border-rose-900/30",
        accentText: "text-rose-600 dark:text-rose-400"
      }
    ],
    // 1:00 PM - 1:59 PM
    13: [
      {
        text: (name) => `Hi ${name}! ☀️`,
        subtext: () => "Hope your are having a great afternoon. Let's kick off the next session!",
        icon: <Sun className="h-8 w-8 text-amber-500" />,
        gradient: "from-amber-500/10 via-orange-500/5 to-transparent",
        border: "border-amber-200/50 dark:border-amber-900/30",
        accentText: "text-amber-600 dark:text-amber-400"
      },
      {
        text: (name) => `Good afternoon, ${name}! 🔋`,
        subtext: () => "Recharged and ready to go. Let's tackle the afternoon tasks.",
        icon: <Activity className="h-8 w-8 text-emerald-500" />,
        gradient: "from-emerald-500/10 via-teal-500/5 to-transparent",
        border: "border-emerald-200/50 dark:border-emerald-900/30",
        accentText: "text-emerald-600 dark:text-emerald-400"
      },
      {
        text: (name) => `Hey ${name}! 💪`,
        subtext: () => "Time to build momentum for the second half of the day. You've got this!",
        icon: <Flame className="h-8 w-8 text-orange-500" />,
        gradient: "from-orange-500/10 via-red-500/5 to-transparent",
        border: "border-orange-200/50 dark:border-orange-900/30",
        accentText: "text-orange-600 dark:text-orange-400"
      },
      {
        text: (name) => `Afternoon focus, ${name}! ☕`,
        subtext: () => "Time for a post-lunch tea or coffee to stay alert and productive.",
        icon: <Coffee className="h-8 w-8 text-amber-600" />,
        gradient: "from-amber-600/10 via-yellow-500/5 to-transparent",
        border: "border-amber-200/50 dark:border-amber-900/30",
        accentText: "text-amber-600 dark:text-amber-400"
      },
      {
        text: (name) => `Hello ${name}! 🚀`,
        subtext: () => "Fresh energy for the afternoon priorities. Let's make an impact.",
        icon: <Award className="h-8 w-8 text-blue-500" />,
        gradient: "from-blue-500/10 via-sky-500/5 to-transparent",
        border: "border-blue-200/50 dark:border-blue-900/30",
        accentText: "text-blue-600 dark:text-blue-400"
      }
    ],
    // 2:00 PM - 2:59 PM
    14: [
      {
        text: (name) => `Hi ${name}! 🎨`,
        subtext: () => "Brainstorming and creativity are peaking. Think outside the box today!",
        icon: <Sparkles className="h-8 w-8 text-pink-500" />,
        gradient: "from-pink-500/10 via-purple-500/5 to-transparent",
        border: "border-pink-200/50 dark:border-pink-900/30",
        accentText: "text-pink-600 dark:text-pink-400"
      },
      {
        text: (name) => `Good afternoon, ${name}! 🧠`,
        subtext: () => "Creative minds build the most premium experiences. Let's design.",
        icon: <Laptop className="h-8 w-8 text-purple-500" />,
        gradient: "from-purple-500/10 via-indigo-500/5 to-transparent",
        border: "border-purple-200/50 dark:border-purple-900/30",
        accentText: "text-purple-600 dark:text-purple-400"
      },
      {
        text: (name) => `Hey ${name}! 📝`,
        subtext: () => "Scribbling notes, coding prototypes. Let your imagination guide you.",
        icon: <BookOpen className="h-8 w-8 text-indigo-500" />,
        gradient: "from-indigo-500/10 via-sky-500/5 to-transparent",
        border: "border-indigo-200/50 dark:border-indigo-900/30",
        accentText: "text-indigo-600 dark:text-indigo-400"
      },
      {
        text: (name) => `Afternoon vibes, ${name}! 💡`,
        subtext: () => "Let a flash of inspiration guide your next UI layout. Keep it clean.",
        icon: <Sparkles className="h-8 w-8 text-yellow-500" />,
        gradient: "from-yellow-500/10 via-orange-500/5 to-transparent",
        border: "border-yellow-200/50 dark:border-yellow-900/30",
        accentText: "text-yellow-600 dark:text-yellow-400"
      },
      {
        text: (name) => `Hello ${name}! 🌀`,
        subtext: () => "Stay curious, experiment, and enjoy the creative journey this afternoon.",
        icon: <Compass className="h-8 w-8 text-teal-500" />,
        gradient: "from-teal-500/10 via-emerald-500/5 to-transparent",
        border: "border-teal-200/50 dark:border-teal-900/30",
        accentText: "text-teal-600 dark:text-teal-400"
      }
    ],
    // 3:00 PM - 3:59 PM
    15: [
      {
        text: (name) => `Hi ${name}! ☕`,
        subtext: () => "The 3 PM dip is real. Time for a delicious tea or coffee break!",
        icon: <Coffee className="h-8 w-8 text-amber-600 animate-bounce-slow" />,
        gradient: "from-amber-500/10 via-orange-500/5 to-transparent",
        border: "border-amber-200/50 dark:border-amber-900/30",
        accentText: "text-amber-600 dark:text-amber-400"
      },
      {
        text: (name) => `Good afternoon, ${name}! 🍪`,
        subtext: () => "Pair your beverage with a sweet snack and take a slow, deep breath.",
        icon: <Smile className="h-8 w-8 text-yellow-500" />,
        gradient: "from-yellow-500/10 via-amber-500/5 to-transparent",
        border: "border-yellow-200/50 dark:border-yellow-900/30",
        accentText: "text-yellow-600 dark:text-yellow-400"
      },
      {
        text: (name) => `Hey ${name}! 🍩`,
        subtext: () => "Sugar or caffeine? Grab a quick bite to fuel your evening wrap-up.",
        icon: <UtensilsCrossed className="h-8 w-8 text-orange-500" />,
        gradient: "from-orange-500/10 via-rose-500/5 to-transparent",
        border: "border-orange-200/50 dark:border-orange-900/30",
        accentText: "text-orange-600 dark:text-orange-400"
      },
      {
        text: (name) => `Afternoon check-in, ${name}! 🍰`,
        subtext: () => "Keep up the great spirit, the hardest part of the day is already done.",
        icon: <Sparkles className="h-8 w-8 text-rose-500" />,
        gradient: "from-rose-500/10 via-pink-500/5 to-transparent",
        border: "border-rose-200/50 dark:border-rose-900/30",
        accentText: "text-rose-600 dark:text-rose-400"
      },
      {
        text: (name) => `Hello ${name}! 🛋️`,
        subtext: () => "A quick 5-minute stretch. Rest your eyes, look away, and breathe.",
        icon: <Smile className="h-8 w-8 text-teal-500" />,
        gradient: "from-teal-500/10 via-sky-500/5 to-transparent",
        border: "border-teal-200/50 dark:border-teal-900/30",
        accentText: "text-teal-600 dark:text-teal-400"
      }
    ],
    // 4:00 PM - 4:59 PM
    16: [
      {
        text: (name) => `Hi ${name}! 🌇`,
        subtext: () => "The golden hour is casting its warm glow. Time to finalize those tasks.",
        icon: <Sunset className="h-8 w-8 text-orange-500" />,
        gradient: "from-orange-500/10 via-rose-500/5 to-transparent",
        border: "border-orange-200/50 dark:border-orange-900/30",
        accentText: "text-orange-600 dark:text-orange-400"
      },
      {
        text: (name) => `Good afternoon, ${name}! 🍂`,
        subtext: () => "Let's review what we achieved today. Splendid progress all around.",
        icon: <Award className="h-8 w-8 text-rose-500" />,
        gradient: "from-rose-500/10 via-amber-500/5 to-transparent",
        border: "border-rose-200/50 dark:border-rose-900/30",
        accentText: "text-rose-600 dark:text-rose-400"
      },
      {
        text: (name) => `Hey ${name}! 📜`,
        subtext: () => "Finishing up the day's final details. Let's cross the daily line.",
        icon: <BookOpen className="h-8 w-8 text-amber-600" />,
        gradient: "from-amber-500/10 via-yellow-500/5 to-transparent",
        border: "border-amber-200/50 dark:border-amber-900/30",
        accentText: "text-amber-600 dark:text-amber-400"
      },
      {
        text: (name) => `Golden hour, ${name}! 🏁`,
        subtext: () => "The end of the workday is near. You did a marvelous job today.",
        icon: <Sun className="h-8 w-8 text-yellow-500" />,
        gradient: "from-yellow-500/10 via-orange-500/5 to-transparent",
        border: "border-yellow-200/50 dark:border-yellow-900/30",
        accentText: "text-yellow-600 dark:text-yellow-400"
      },
      {
        text: (name) => `Hello ${name}! 💼`,
        subtext: () => "Tidying up the workspace. Wishing you a very satisfying wrap-up.",
        icon: <Laptop className="h-8 w-8 text-slate-600 dark:text-slate-400" />,
        gradient: "from-slate-500/10 via-zinc-500/5 to-transparent",
        border: "border-slate-200/50 dark:border-slate-800/50",
        accentText: "text-slate-600 dark:text-slate-400"
      }
    ],
    // 5:00 PM - 5:59 PM
    17: [
      {
        text: (name) => `Good evening, ${name}! 🌅`,
        subtext: () => "The sun is setting beautifully. Time to shut down and relax.",
        icon: <Sunset className="h-8 w-8 text-rose-500 animate-pulse" />,
        gradient: "from-rose-500/10 via-purple-500/5 to-transparent",
        border: "border-rose-200/50 dark:border-rose-900/30",
        accentText: "text-rose-600 dark:text-rose-400"
      },
      {
        text: (name) => `Hi ${name}! 🚶‍♂️`,
        subtext: () => "Time to close the laptop and step outside for a refreshing walk.",
        icon: <Smile className="h-8 w-8 text-orange-500" />,
        gradient: "from-orange-500/10 via-amber-500/5 to-transparent",
        border: "border-orange-200/50 dark:border-orange-900/30",
        accentText: "text-orange-600 dark:text-orange-400"
      },
      {
        text: (name) => `Hey ${name}! 🚲`,
        subtext: () => "Commuting or winding down? Transition your mind to relax mode.",
        icon: <Compass className="h-8 w-8 text-purple-500" />,
        gradient: "from-purple-500/10 via-indigo-500/5 to-transparent",
        border: "border-purple-200/50 dark:border-purple-900/30",
        accentText: "text-purple-600 dark:text-purple-400"
      },
      {
        text: (name) => `Evening check-in, ${name}! 🎒`,
        subtext: () => "You put in hard, honest work today. Be immensely proud of it.",
        icon: <Award className="h-8 w-8 text-indigo-500" />,
        gradient: "from-indigo-500/10 via-sky-500/5 to-transparent",
        border: "border-indigo-200/50 dark:border-indigo-900/30",
        accentText: "text-indigo-600 dark:text-indigo-400"
      },
      {
        text: (name) => `Hello ${name}! 🍹`,
        subtext: () => "Winding down hours begin! Cheers to a highly productive day.",
        icon: <Sparkles className="h-8 w-8 text-pink-500" />,
        gradient: "from-pink-500/10 via-rose-500/5 to-transparent",
        border: "border-pink-200/50 dark:border-pink-900/30",
        accentText: "text-pink-600 dark:text-pink-400"
      }
    ],
    // 6:00 PM - 6:59 PM
    18: [
      {
        text: (name) => `Good evening, ${name}! 🍲`,
        subtext: () => "Dinner is near or served. Enjoy a warm, delicious meal tonight.",
        icon: <Smile className="h-8 w-8 text-amber-500" />,
        gradient: "from-amber-500/10 via-orange-500/5 to-transparent",
        border: "border-amber-200/50 dark:border-amber-900/30",
        accentText: "text-amber-600 dark:text-amber-400"
      },
      {
        text: (name) => `Hi ${name}! 🥤`,
        subtext: () => "Relaxing at home? Let all the day's code worries melt away.",
        icon: <Smile className="h-8 w-8 text-rose-500" />,
        gradient: "from-rose-500/10 via-purple-500/5 to-transparent",
        border: "border-rose-200/50 dark:border-rose-900/30",
        accentText: "text-rose-600 dark:text-rose-400"
      },
      {
        text: (name) => `Hey ${name}! 🏡`,
        subtext: () => "Welcome to your cozy evening space. Time for self-care and quiet.",
        icon: <Smile className="h-8 w-8 text-emerald-500" />,
        gradient: "from-emerald-500/10 via-teal-500/5 to-transparent",
        border: "border-emerald-200/50 dark:border-emerald-900/30",
        accentText: "text-emerald-600 dark:text-emerald-400"
      },
      {
        text: (name) => `Evening relaxation, ${name}! 🛋️`,
        subtext: () => "Sit back, put your feet up, and enjoy a comfortable, quiet evening.",
        icon: <Tv className="h-8 w-8 text-purple-500" />,
        gradient: "from-purple-500/10 via-pink-500/5 to-transparent",
        border: "border-purple-200/50 dark:border-purple-900/30",
        accentText: "text-purple-600 dark:text-purple-400"
      },
      {
        text: (name) => `Hello ${name}! 📺`,
        subtext: () => "Catching up on a favorite show or hobby? Enjoy your screen-free relaxing time.",
        icon: <Tv className="h-8 w-8 text-violet-500" />,
        gradient: "from-violet-500/10 via-indigo-500/5 to-transparent",
        border: "border-violet-200/50 dark:border-violet-900/30",
        accentText: "text-violet-600 dark:text-violet-400"
      }
    ],
    // 7:00 PM - 7:59 PM
    19: [
      {
        text: (name) => `Good evening, ${name}! 🛋️`,
        subtext: () => "Cozy lighting, quiet atmosphere. The night is young and relaxing.",
        icon: <Smile className="h-8 w-8 text-violet-500" />,
        gradient: "from-violet-500/10 via-purple-500/5 to-transparent",
        border: "border-violet-200/50 dark:border-violet-900/30",
        accentText: "text-violet-600 dark:text-violet-400"
      },
      {
        text: (name) => `Hi ${name}! 🕯️`,
        subtext: () => "Light a warm candle, play some lo-fi beats, and let the brain rest.",
        icon: <Music className="h-8 w-8 text-pink-500" />,
        gradient: "from-pink-500/10 via-rose-500/5 to-transparent",
        border: "border-pink-200/50 dark:border-pink-900/30",
        accentText: "text-pink-600 dark:text-pink-400"
      },
      {
        text: (name) => `Hey ${name}! 🎮`,
        subtext: () => "Winding down with games or fun projects? Enjoy your leisure hour.",
        icon: <Gamepad className="h-8 w-8 text-indigo-500" />,
        gradient: "from-indigo-500/10 via-blue-500/5 to-transparent",
        border: "border-indigo-200/50 dark:border-indigo-900/30",
        accentText: "text-indigo-600 dark:text-indigo-400"
      },
      {
        text: (name) => `Evening, ${name}! 📖`,
        subtext: () => "Reading a good book? Let your mind wander to different places.",
        icon: <BookOpen className="h-8 w-8 text-sky-500" />,
        gradient: "from-sky-500/10 via-teal-500/5 to-transparent",
        border: "border-sky-200/50 dark:border-sky-900/30",
        accentText: "text-sky-600 dark:text-sky-400"
      },
      {
        text: (name) => `Hello ${name}! 🎧`,
        subtext: () => "Tuning out the world with some soothing music. Rest well tonight.",
        icon: <Music className="h-8 w-8 text-rose-500 animate-pulse" />,
        gradient: "from-rose-500/10 via-indigo-500/5 to-transparent",
        border: "border-rose-200/50 dark:border-rose-900/30",
        accentText: "text-rose-600 dark:text-rose-400"
      }
    ],
    // 8:00 PM - 8:59 PM
    20: [
      {
        text: (name) => `Hi ${name}! 🎮`,
        subtext: () => "High-score time! Time for gaming, reading, or coding just for fun.",
        icon: <Gamepad className="h-8 w-8 text-indigo-500 animate-bounce-slow" />,
        gradient: "from-indigo-500/10 via-purple-500/5 to-transparent",
        border: "border-indigo-200/50 dark:border-indigo-900/30",
        accentText: "text-indigo-600 dark:text-indigo-400"
      },
      {
        text: (name) => `Good evening, ${name}! 🍿`,
        subtext: () => "Popcorn and a movie night? Have a spectacular watch tonight.",
        icon: <Tv className="h-8 w-8 text-violet-500" />,
        gradient: "from-violet-500/10 via-fuchsia-500/5 to-transparent",
        border: "border-violet-200/50 dark:border-violet-900/30",
        accentText: "text-violet-600 dark:text-violet-400"
      },
      {
        text: (name) => `Hey ${name}! 🎬`,
        subtext: () => "Hope you are enjoying a fun, lighthearted evening with loved ones.",
        icon: <Smile className="h-8 w-8 text-emerald-500" />,
        gradient: "from-emerald-500/10 via-teal-500/5 to-transparent",
        border: "border-emerald-200/50 dark:border-emerald-900/30",
        accentText: "text-emerald-600 dark:text-emerald-400"
      },
      {
        text: (name) => `Night vibes, ${name}! 👾`,
        subtext: () => "Unleash your inner creator, or just chill out completely. No rules.",
        icon: <Gamepad className="h-8 w-8 text-rose-500" />,
        gradient: "from-rose-500/10 via-pink-500/5 to-transparent",
        border: "border-rose-200/50 dark:border-rose-900/30",
        accentText: "text-rose-600 dark:text-rose-400"
      },
      {
        text: (name) => `Hello ${name}! 🍩`,
        subtext: () => "Grab a warm beverage and enjoy these late-evening comfortable vibes.",
        icon: <Coffee className="h-8 w-8 text-amber-500" />,
        gradient: "from-amber-500/10 via-orange-500/5 to-transparent",
        border: "border-amber-200/50 dark:border-amber-900/30",
        accentText: "text-amber-600 dark:text-amber-400"
      }
    ],
    // 9:00 PM - 9:59 PM
    21: [
      {
        text: (name) => `Good evening, ${name}! 🌙`,
        subtext: () => "The stars are shining bright in the night sky. Time for cozy thoughts.",
        icon: <Moon className="h-8 w-8 text-blue-400" />,
        gradient: "from-blue-500/10 via-indigo-500/5 to-transparent",
        border: "border-blue-200/50 dark:border-blue-900/30",
        accentText: "text-blue-600 dark:text-blue-400"
      },
      {
        text: (name) => `Hi ${name}! 📖`,
        subtext: () => "Winding down the day. Let's take a minute to appreciate the small wins.",
        icon: <BookOpen className="h-8 w-8 text-violet-500" />,
        gradient: "from-violet-500/10 via-purple-500/5 to-transparent",
        border: "border-violet-200/50 dark:border-violet-900/30",
        accentText: "text-violet-600 dark:text-violet-400"
      },
      {
        text: (name) => `Hey ${name}! 🫖`,
        subtext: () => "A warm cup of chamomile tea? A perfect way to soothe the mind.",
        icon: <Coffee className="h-8 w-8 text-yellow-600 dark:text-yellow-500" />,
        gradient: "from-yellow-500/10 via-amber-500/5 to-transparent",
        border: "border-yellow-200/50 dark:border-yellow-900/30",
        accentText: "text-yellow-600 dark:text-yellow-400"
      },
      {
        text: (name) => `Cozy night, ${name}! 🕯️`,
        subtext: () => "Rest your thoughts, dim the screens, and find your calm space.",
        icon: <Sparkles className="h-8 w-8 text-pink-400 animate-pulse" />,
        gradient: "from-pink-500/10 via-rose-500/5 to-transparent",
        border: "border-pink-200/50 dark:border-pink-900/30",
        accentText: "text-pink-600 dark:text-pink-400"
      },
      {
        text: (name) => `Hello ${name}! 🧸`,
        subtext: () => "Cozy blankets are waiting. Hope you're feeling peaceful and content.",
        icon: <Moon className="h-8 w-8 text-cyan-400" />,
        gradient: "from-cyan-500/10 via-indigo-500/5 to-transparent",
        border: "border-cyan-200/50 dark:border-cyan-900/30",
        accentText: "text-cyan-600 dark:text-cyan-400"
      }
    ],
    // 10:00 PM - 10:59 PM
    22: [
      {
        text: (name) => `Hi ${name}! 😴`,
        subtext: () => "Preparing for a good night's sleep? Let's turn off the screens soon.",
        icon: <Moon className="h-8 w-8 text-indigo-400 animate-pulse" />,
        gradient: "from-indigo-950/20 via-slate-900/10 to-transparent",
        border: "border-indigo-500/20 dark:border-indigo-500/30",
        accentText: "text-indigo-400"
      },
      {
        text: (name) => `Good night, ${name}! 🛌`,
        subtext: () => "Wishing you a deeply restorative, peaceful sleep. Sleep well.",
        icon: <Moon className="h-8 w-8 text-blue-400" />,
        gradient: "from-blue-950/20 via-slate-900/10 to-transparent",
        border: "border-blue-500/20 dark:border-blue-500/30",
        accentText: "text-blue-400"
      },
      {
        text: (name) => `Hey ${name}! 💤`,
        subtext: () => "Time to relax every single muscle. You did wonderful work today.",
        icon: <Moon className="h-8 w-8 text-teal-400" />,
        gradient: "from-teal-950/20 via-slate-900/10 to-transparent",
        border: "border-teal-500/20 dark:border-teal-500/30",
        accentText: "text-teal-400"
      },
      {
        text: (name) => `Late evening, ${name}! 🧖‍♂️`,
        subtext: () => "Pamper yourself and relax. A brand new day awaits tomorrow.",
        icon: <Sparkles className="h-8 w-8 text-purple-400" />,
        gradient: "from-purple-950/20 via-indigo-950/10 to-transparent",
        border: "border-purple-500/20 dark:border-purple-500/30",
        accentText: "text-purple-400"
      },
      {
        text: (name) => `Hello ${name}! 🧘‍♂️`,
        subtext: () => "Quiet meditation or deep breathing. Have a serene and quiet night.",
        icon: <Sparkles className="h-8 w-8 text-pink-400" />,
        gradient: "from-pink-950/20 via-slate-900/10 to-transparent",
        border: "border-pink-500/20 dark:border-pink-500/30",
        accentText: "text-pink-400"
      }
    ],
    // 11:00 PM - 11:59 PM
    23: [
      {
        text: (name) => `Hi ${name}! ✨`,
        subtext: () => "Almost midnight. Winding down the final, quiet moments of today.",
        icon: <Sparkles className="h-8 w-8 text-violet-400" />,
        gradient: "from-violet-950/20 via-purple-950/10 to-transparent",
        border: "border-violet-500/20 dark:border-violet-500/30",
        accentText: "text-violet-400"
      },
      {
        text: (name) => `Hello ${name}! 🌌`,
        subtext: () => "A quiet night for deep reflection. What are you grateful for today?",
        icon: <Moon className="h-8 w-8 text-indigo-400 animate-pulse" />,
        gradient: "from-indigo-950/20 via-slate-900/10 to-transparent",
        border: "border-indigo-500/20 dark:border-indigo-500/30",
        accentText: "text-indigo-400"
      },
      {
        text: (name) => `Hey ${name}! 🌠`,
        subtext: () => "Hope your dreams are sweet, creative, and your sleep is peaceful.",
        icon: <Sparkles className="h-8 w-8 text-sky-400" />,
        gradient: "from-sky-950/20 via-slate-900/10 to-transparent",
        border: "border-sky-500/20 dark:border-sky-500/30",
        accentText: "text-sky-400"
      },
      {
        text: (name) => `Midnight is near, ${name}! 🕰️`,
        subtext: () => "Let go of today's stresses. Tomorrow is a brand new, empty canvas.",
        icon: <Moon className="h-8 w-8 text-cyan-400" />,
        gradient: "from-cyan-950/20 via-slate-900/10 to-transparent",
        border: "border-cyan-500/20 dark:border-cyan-500/30",
        accentText: "text-cyan-400"
      },
      {
        text: (name) => `Hello ${name}! 💭`,
        subtext: () => "A quiet mind leads to a bright tomorrow. Rest well, friend.",
        icon: <Sparkles className="h-8 w-8 text-purple-400" />,
        gradient: "from-purple-950/20 via-slate-900/10 to-transparent",
        border: "border-purple-500/20 dark:border-purple-500/30",
        accentText: "text-purple-400"
      }
    ]
}

export function DashboardGreeting() {
  const user = useUserContext()
  const [mounted, setMounted] = useState(false)
  const [currentHour, setCurrentHour] = useState(12)
  const [dayOfMonth, setDayOfMonth] = useState(1)

  useEffect(() => {
    setMounted(true)
    const now = new Date()
    setCurrentHour(now.getHours())
    setDayOfMonth(now.getDate())
  }, [])

  const firstName = user?.name ? user.name.split(" ")[0] : "Friend"

  // Fallback layout before mounting to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="relative bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 p-6 rounded-[12px] overflow-hidden shadow-sm animate-pulse">
        <div className="flex items-start gap-4">
          <div className="flex-1 space-y-2">
            <div className="h-6 bg-slate-200 dark:bg-zinc-800 rounded w-1/3" />
            <div className="h-4 bg-slate-200 dark:bg-zinc-800 rounded w-2/3 mt-2" />
          </div>
          <div className="h-10 w-10 bg-slate-200 dark:bg-zinc-800 rounded-full" />
        </div>
      </div>
    )
  }

  // Get index based on day of month to cycle through 5 options daily
  const greetingIndex = (dayOfMonth - 1) % 5
  
  // Safe access to hourly greetings data
  const hourData = hourlyGreetings[currentHour] || hourlyGreetings[12]
  const activeTemplate = hourData[greetingIndex] || hourData[0]

  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${activeTemplate.gradient} bg-white dark:bg-zinc-950 border ${activeTemplate.border} p-6 rounded-[12px] shadow-sm transition-all duration-700 hover:shadow-md hover:scale-[1.005] group`}>
      {/* Decorative colored glow backdrop */}
      <div className="absolute right-0 top-0 w-32 h-32 bg-radial-gradient opacity-10 blur-2xl rounded-full -mr-8 -mt-8 pointer-events-none group-hover:scale-110 transition-transform duration-700" />
      
      <div className="flex items-start gap-4 sm:gap-6 relative z-10">
        <div className="flex-1 space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white transition-all duration-700">
            {activeTemplate.text(firstName)}
          </h1>
          <p className="text-slate-600 dark:text-zinc-300 text-sm sm:text-base font-medium leading-relaxed max-w-2xl transition-all duration-700">
            {activeTemplate.subtext(firstName)}
          </p>
        </div>
        <div className="flex-shrink-0 bg-slate-50/50 dark:bg-zinc-900/60 p-3 rounded-full border border-slate-100 dark:border-zinc-850 shadow-inner group-hover:rotate-12 transition-transform duration-500 ease-out">
          {activeTemplate.icon}
        </div>
      </div>
    </div>
  )
}
