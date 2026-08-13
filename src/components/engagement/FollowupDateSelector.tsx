import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar as CalendarIcon, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// Native JS Date helpers
const addDays = (d: Date, days: number) => new Date(d.getTime() + days * 86400000);
const isSunday = (d: Date) => d.getDay() === 0;
const isValid = (d: Date) => !isNaN(d.getTime());
const setTime = (d: Date, h: number, m: number) => {
  const newD = new Date(d);
  newD.setHours(h, m, 0, 0);
  return newD;
};
const formatDateTimeLocal = (d: Date) => {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

interface FollowupDateSelectorProps {
  value: string;
  onChange: (dateStr: string) => void;
  mode: "auto" | "custom" | "hidden" | "optional";
  autoDays?: number;
}

export function FollowupDateSelector({ value, onChange, mode, autoDays }: FollowupDateSelectorProps) {
  const [customDays, setCustomDays] = useState<string>("");

  const applyDays = (days: number) => {
    let target = addDays(new Date(), days);
    // If it's a Sunday, push to Monday
    if (isSunday(target)) {
      target = addDays(target, 1);
    }
    // Set time to noon local to avoid timezone issues with date inputs if needed, 
    // or just default to 10:00 AM
    target = setTime(target, 10, 0);
    // Format for datetime-local: yyyy-MM-ddThh:mm
    onChange(formatDateTimeLocal(target));
  };

  useEffect(() => {
    if (mode === "auto" && autoDays !== undefined) {
      applyDays(autoDays);
    } else if (mode === "hidden") {
      onChange("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, autoDays]);

  const handleCustomDaysChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = parseInt(e.target.value);
    if (isNaN(val)) {
      setCustomDays("");
      return;
    }
    if (val < 1) val = 1;
    if (val > 89) val = 89;
    setCustomDays(val.toString());
    applyDays(val);
  };

  const handleManualDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    if (!rawVal) {
      onChange("");
      return;
    }
    const d = new Date(rawVal);
    if (isValid(d)) {
      // Validate 90 days constraint if in custom mode (mandatory followup)
      if (mode === 'custom') {
        const maxDate = addDays(new Date(), 90);
        if (d > maxDate) {
          // cap it
          onChange(formatDateTimeLocal(maxDate));
          return;
        }
      }
      
      if (isSunday(d)) {
        // if user manually picked sunday, bump to monday
        onChange(formatDateTimeLocal(addDays(d, 1)));
      } else {
        onChange(rawVal);
      }
    } else {
      onChange(rawVal); // Let standard validation handle partial inputs
    }
  };

  if (mode === "hidden") return null;

  if (mode === "auto") {
    return (
      <div className="p-3.5 rounded-xl bg-destructive/5 border border-destructive/20 space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-destructive">
          <span className="flex items-center gap-1.5"><CalendarIcon className="w-3.5 h-3.5" /> Auto Follow-up Date</span>
          <span>T+{autoDays} Days</span>
        </div>
        <Input
          type="datetime-local"
          value={value}
          readOnly
          className="h-9 bg-background/50 rounded-xl cursor-not-allowed opacity-80 border-destructive/20"
        />
        <p className="text-[10px] text-destructive/80 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" /> Auto-calculated based on outcome tag.
        </p>
      </div>
    );
  }

  if (mode === "optional") {
    return (
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-foreground flex items-center gap-1">
          <CalendarIcon className="w-3.5 h-3.5 text-muted-foreground" /> Optional Follow-up Date & Time
        </label>
        <Input
          type="datetime-local"
          value={value}
          onChange={handleManualDateChange}
          className="h-10 rounded-xl"
        />
        <p className="text-[10px] text-muted-foreground">Sundays are automatically disabled/pushed to Monday.</p>
      </div>
    );
  }

  // custom mode (mandatory followup with UI)
  return (
    <div className="space-y-2.5 p-3.5 rounded-xl border border-border bg-card/50">
      <label className="text-xs font-semibold text-foreground flex items-center gap-1">
        <CalendarIcon className="w-3.5 h-3.5 text-primary" /> Follow-up Date & Time <span className="text-destructive">*</span>
      </label>
      <div className="grid grid-cols-4 gap-2">
        <Button type="button" variant="outline" className="h-9 rounded-xl text-xs bg-background" onClick={() => applyDays(30)}>T+30</Button>
        <Button type="button" variant="outline" className="h-9 rounded-xl text-xs bg-background" onClick={() => applyDays(60)}>T+60</Button>
        <Button type="button" variant="outline" className="h-9 rounded-xl text-xs bg-background" onClick={() => applyDays(90)}>T+90</Button>
        <div className="relative">
          <span className="absolute left-2 top-2.5 text-xs text-muted-foreground">T+</span>
          <Input 
            type="number" 
            placeholder="No." 
            className="h-9 rounded-xl text-xs pl-7 bg-background" 
            value={customDays}
            onChange={handleCustomDaysChange}
            min={1} max={89}
          />
        </div>
      </div>
      <Input
        type="datetime-local"
        value={value}
        onChange={handleManualDateChange}
        className="h-10 rounded-xl bg-background"
        required
      />
      <p className="text-[10px] text-muted-foreground">Max 90 days. Sundays are pushed to Monday.</p>
    </div>
  );
}
