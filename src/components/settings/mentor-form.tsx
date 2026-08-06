"use client"

import React, { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { createMentor, updateMentor } from "@/lib/learning-center/actions"
import { MentorFormSchema, MentorFormValues } from "@/lib/learning-center/schema"
import { Mentor } from "@/lib/learning-center/queries"

interface MentorFormProps {
  defaultValues?: Mentor | null
  onSuccess?: () => void
}

export function MentorForm({ defaultValues, onSuccess }: MentorFormProps) {
  const [isPending, setIsPending] = useState(false)
  
  const form = useForm<MentorFormValues>({
    resolver: zodResolver(MentorFormSchema) as any,
    defaultValues: {
      name: defaultValues?.name || "",
      email: defaultValues?.email || "",
      status: (defaultValues?.status as any) || "Active",
      expertise: defaultValues?.expertise || [],
      contact_number: defaultValues?.contact_number || "",
      linkedin_url: defaultValues?.linkedin_url || "",
      city: defaultValues?.city || "",
    },
  })

  async function onSubmit(data: MentorFormValues) {
    setIsPending(true)
    let result
    if (defaultValues?.id) {
      result = await updateMentor(defaultValues.id, data)
    } else {
      result = await createMentor(data)
    }
    
    setIsPending(false)
    if (result.success) {
      toast.success(defaultValues?.id ? "Mentor updated successfully" : "Mentor added successfully")
      onSuccess?.()
    } else {
      toast.error(result.error || "An error occurred")
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name *</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="john@example.com" {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="Being Reviewed">Being Reviewed</SelectItem>
                  <SelectItem value="Waitlisted">Waitlisted</SelectItem>
                  <SelectItem value="Onboarded">Onboarded</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="expertise"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Expertise (comma separated)</FormLabel>
              <FormControl>
                <Input 
                  placeholder="React, UI/UX, Backend" 
                  value={field.value.join(", ")} 
                  onChange={(e) => {
                    const val = e.target.value.split(",").map(s => s.trim()).filter(Boolean)
                    field.onChange(val)
                  }} 
                />
              </FormControl>
              <FormDescription>Separate multiple expertise domains with commas.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="contact_number"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Contact Number</FormLabel>
              <FormControl>
                <Input placeholder="+1234567890" {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="linkedin_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>LinkedIn URL</FormLabel>
              <FormControl>
                <Input placeholder="https://linkedin.com/in/..." {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="city"
          render={({ field }) => (
            <FormItem>
              <FormLabel>City</FormLabel>
              <FormControl>
                <Input placeholder="Pune" {...field} value={field.value || ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isPending}>
            {isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {defaultValues?.id ? "Save Changes" : "Add Mentor"}
          </Button>
        </div>
      </form>
    </Form>
  )
}
