import React from "react"

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-4 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
      </div>
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-8 text-center text-muted-foreground">
        CRM Settings content will go here.
      </div>
    </div>
  )
}
