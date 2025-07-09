'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/auth'
import { toast } from 'sonner'
import { Settings, Save } from 'lucide-react'

const settingsSchema = z.object({
  school_name: z.string().min(1, 'School name is required'),
  exam_time: z.string().min(1, 'Exam time is required'),
  total_marks: z.string().min(1, 'Total marks is required'),
  instructions: z.string().min(1, 'Instructions are required'),
})

type SettingsFormData = z.infer<typeof settingsSchema>

interface ExamSettingsFormProps {
  onSettingsUpdated: () => void
}

export default function ExamSettingsForm({ onSettingsUpdated }: ExamSettingsFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingSettings, setIsLoadingSettings] = useState(true)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      school_name: 'বাংলাদেশ শিক্ষা বোর্ড',
      exam_time: '২ ঘণ্টা ৩০ মিনিট',
      total_marks: '১০০',
      instructions: 'প্রতিটি প্রশ্নের চারটি উত্তর দেওয়া আছে। সঠিক উত্তরটি বেছে নিয়ে উত্তরপত্রে প্রয়োজনীয় স্থানে সম্পূর্ণ বৃত্তটি কালো কর।',
    },
  })

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    setIsLoadingSettings(true)
    try {
      const user = await getCurrentUser()
      if (!user) return

      const { data, error } = await supabase
        .from('exam_settings')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading settings:', error)
      } else if (data) {
        reset({
          school_name: data.school_name,
          exam_time: data.exam_time,
          total_marks: data.total_marks,
          instructions: data.instructions,
        })
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsLoadingSettings(false)
    }
  }

  const saveSettings = async (data: SettingsFormData) => {
    setIsLoading(true)
    try {
      const user = await getCurrentUser()
      if (!user) {
        toast.error('Please sign in to save settings')
        return
      }

      // Check if settings exist
      const { data: existingSettings } = await supabase
        .from('exam_settings')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (existingSettings) {
        // Update existing settings
        const { error } = await supabase
          .from('exam_settings')
          .update({
            school_name: data.school_name,
            exam_time: data.exam_time,
            total_marks: data.total_marks,
            instructions: data.instructions,
          })
          .eq('user_id', user.id)

        if (error) {
          toast.error('Failed to update settings')
          console.error(error)
        } else {
          toast.success('Settings updated successfully!')
          onSettingsUpdated()
        }
      } else {
        // Create new settings
        const { error } = await supabase
          .from('exam_settings')
          .insert({
            user_id: user.id,
            school_name: data.school_name,
            exam_time: data.exam_time,
            total_marks: data.total_marks,
            instructions: data.instructions,
          })

        if (error) {
          toast.error('Failed to save settings')
          console.error(error)
        } else {
          toast.success('Settings saved successfully!')
          onSettingsUpdated()
        }
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoadingSettings) {
    return (
      <div className="flex justify-center items-center h-32">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-semibold flex items-center">
          <Settings className="w-5 h-5 mr-2" />
          পরীক্ষার তথ্য সেটিংস
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(saveSettings)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="school_name">প্রতিষ্ঠানের নাম</Label>
            <Input
              id="school_name"
              placeholder="বাংলাদেশ শিক্ষা বোর্ড"
              {...register('school_name')}
            />
            {errors.school_name && (
              <p className="text-sm text-red-500">{errors.school_name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="exam_time">পরীক্ষার সময়</Label>
              <Input
                id="exam_time"
                placeholder="২ ঘণ্টা ৩০ মিনিট"
                {...register('exam_time')}
              />
              {errors.exam_time && (
                <p className="text-sm text-red-500">{errors.exam_time.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="total_marks">পূর্ণমান</Label>
              <Input
                id="total_marks"
                placeholder="১০০"
                {...register('total_marks')}
              />
              {errors.total_marks && (
                <p className="text-sm text-red-500">{errors.total_marks.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="instructions">নির্দেশনা</Label>
            <Textarea
              id="instructions"
              placeholder="প্রতিটি প্রশ্নের চারটি উত্তর দেওয়া আছে..."
              rows={4}
              {...register('instructions')}
            />
            {errors.instructions && (
              <p className="text-sm text-red-500">{errors.instructions.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            <Save className="w-4 h-4 mr-2" />
            {isLoading ? 'সেভ করা হচ্ছে...' : 'সেটিংস সেভ করুন'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}