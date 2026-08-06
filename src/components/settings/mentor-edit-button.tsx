"use client"

import React, { useState } from "react"
import { Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { MentorForm } from "./mentor-form"
import { Mentor } from "@/lib/learning-center/queries"

export function MentorEditButton({ mentor }: { mentor: Mentor }) {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Edit className="w-4 h-4 mr-2" /> Edit Details
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogTitle>Edit Mentor Details</DialogTitle>
        <DialogDescription>Update the profile and settings for {mentor.name}.</DialogDescription>
        <MentorForm defaultValues={mentor} onSuccess={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  )
}
