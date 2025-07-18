'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import { User } from '@/lib/auth'
import { toast } from 'sonner'
import { Settings, Save } from 'lucide-react'

const examSettingsSchema = z.object({
  school_name: z.string().min(1, 'School name is required'),
  school_address: z.string().optional(),
  exam_type: z.string().min(1, 'Exam type is required'),
  exam_time: z.string().min(1, 'Exam time is required'),
  total_marks: z.string().min(1, 'Total marks is required'),
  instructions: z.string().min(1, 'Instructions are required'),
  page_size: z.string().min(1, 'Page size is required'),
  font_family: z.string().min(1, 'Font family is required'),
  font_size: z.string().min(1, 'Font size is required'),
  margin_top: z.string().min(1, 'Top margin is required'),
  margin_bottom: z.string().min(1, 'Bottom margin is required'),
  margin_left: z.string().min(1, 'Left margin is required'),
  margin_right: z.string().min(1, 'Right margin is required'),
})

type ExamSettingsFormData = z.infer<typeof examSettingsSchema>

interface ExamSettingsFormProps {
  onSettingsUpdated: () => void
  user: User | null
}

export default function ExamSettingsForm({ onSettingsUpdated, user }: ExamSettingsFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingSettings, setIsLoadingSettings] = useState(true)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<ExamSettingsFormData>({
    resolver: zodResolver(examSettingsSchema),
    defaultValues: {
      school_name: 'বাংলাদেশ শিক্ষা বোর্ড',
      school_address: '',
      exam_type: 'বার্ষিক পরীক্ষা',
      exam_time: '২ ঘণ্টা ৩০ মিনিট',
      total_marks: '১০০',
      instructions: 'প্রতিটি প্রশ্নের চারটি উত্তর দেওয়া আছে। সঠিক উত্তরটি বেছে নিয়ে উত্তরপত্রে প্রয়োজনীয় স্থানে সম্পূর্ণ বৃত্তটি কালো কর।',
      page_size: 'A4',
      font_family: 'noto-serif',
      font_size: '14px',
      margin_top: '1in',
      margin_bottom: '1in',
      margin_left: '1in',
      margin_right: '1in',
    },
  })

  useEffect(() => {
    if (user) {
      loadExamSettings()
    }
  }, [user])

  const loadExamSettings = async () => {
    setIsLoadingSettings(true)
    try {
      if (!user) return

      // Try to get settings from the most recent question paper
      const { data, error } = await supabase
        .from('question_papers')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading exam settings:', error)
        toast.error('Failed to load exam settings')
      } else if (data) {
        // Load settings from question paper
        const settings = {
          school_name: data.header_info?.school_name || 'বাংলাদেশ শিক্ষা বোর্ড',
          school_address: data.header_info?.school_address || '',
          exam_type: data.header_info?.exam_type || 'বার্ষিক পরীক্ষা',
          exam_time: data.header_info?.exam_time || '২ ঘণ্টা ৩০ মিনিট',
          total_marks: data.header_info?.total_marks || '১০০',
          instructions: data.header_info?.instructions || 'প্রতিটি প্রশ্নের চারটি উত্তর দেওয়া আছে। সঠিক উত্তরটি বেছে নিয়ে উত্তরপত্রে প্রয়োজনীয় স্থানে সম্পূর্ণ বৃত্তটি কালো কর।',
          page_size: data.page_size || 'A4',
          font_family: 'noto-serif',
          font_size: '14px',
          margin_top: data.margins?.top ? `${data.margins.top}mm` : '25mm',
          margin_bottom: data.margins?.bottom ? `${data.margins.bottom}mm` : '25mm',
          margin_left: data.margins?.left ? `${data.margins.left}mm` : '25mm',
          margin_right: data.margins?.right ? `${data.margins.right}mm` : '25mm',
        }
        
        reset(settings)
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoadingSettings(false)
    }
  }

  const saveSettings = async (data: ExamSettingsFormData) => {
    setIsLoading(true)
    try {
      if (!user) {
        toast.error('Please sign in to save settings')
        return
      }

      // Convert margin values to numbers (remove units)
      const parseMargin = (margin: string) => {
        const num = parseFloat(margin.replace(/[^\d.]/g, ''))
        return isNaN(num) ? 25 : num
      }

      const margins = {
        top: parseMargin(data.margin_top),
        bottom: parseMargin(data.margin_bottom),
        left: parseMargin(data.margin_left),
        right: parseMargin(data.margin_right)
      }

      const headerInfo = {
        school_name: data.school_name,
        school_address: data.school_address,
        exam_type: data.exam_type,
        exam_time: data.exam_time,
        total_marks: data.total_marks,
        instructions: data.instructions
      }

      // Check if user has any question papers
      const { data: existingPaper } = await supabase
        .from('question_papers')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle()

      if (existingPaper) {
        // Update existing question papers with new settings
        const { error } = await supabase
          .from('question_papers')
          .update({
            page_size: data.page_size,
            margins: margins,
            header_info: headerInfo,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id)

        if (error) {
          toast.error('Failed to save settings')
          console.error(error)
        } else {
          toast.success('Settings saved successfully!')
          onSettingsUpdated()
        }
      } else {
        // Create a default question paper with these settings
        const { error } = await supabase
          .from('question_papers')
          .insert({
            user_id: user.id,
            title: 'Default Settings',
            page_size: data.page_size,
            margins: margins,
            header_info: headerInfo
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

  if (!user) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-gray-500">Please sign in to manage exam settings</p>
        </CardContent>
      </Card>
    )
  }

  if (isLoadingSettings) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2">Loading settings...</span>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-semibold flex items-center">
          <Settings className="w-5 h-5 mr-2" />
          পরীক্ষার সেটিংস
        </CardTitle>
        <p className="text-sm text-gray-600">
          Configure exam paper settings and formatting options
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(saveSettings)} className="space-y-6">
          {/* School Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">প্রতিষ্ঠানের তথ্য</h3>
            
            <div className="space-y-2">
              <Label htmlFor="school_name">প্রতিষ্ঠানের নাম</Label>
              <Input
                id="school_name"
                {...register('school_name')}
                placeholder="বাংলাদেশ শিক্ষা বোর্ড"
              />
              {errors.school_name && (
                <p className="text-sm text-red-500">{errors.school_name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="school_address">প্রতিষ্ঠানের ঠিকানা (ঐচ্ছিক)</Label>
              <Input
                id="school_address"
                {...register('school_address')}
                placeholder="ঢাকা, বাংলাদেশ"
              />
            </div>
          </div>

          {/* Exam Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">পরীক্ষার তথ্য</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="exam_type">পরীক্ষার ধরন</Label>
                <Input
                  id="exam_type"
                  {...register('exam_type')}
                  placeholder="বার্ষিক পরীক্ষা"
                />
                {errors.exam_type && (
                  <p className="text-sm text-red-500">{errors.exam_type.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="exam_time">সময়</Label>
                <Input
                  id="exam_time"
                  {...register('exam_time')}
                  placeholder="২ ঘণ্টা ৩০ মিনিট"
                />
                {errors.exam_time && (
                  <p className="text-sm text-red-500">{errors.exam_time.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="total_marks">পূর্ণমান</Label>
              <Input
                id="total_marks"
                {...register('total_marks')}
                placeholder="১০০"
              />
              {errors.total_marks && (
                <p className="text-sm text-red-500">{errors.total_marks.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="instructions">নির্দেশনা</Label>
              <Textarea
                id="instructions"
                {...register('instructions')}
                rows={3}
                placeholder="প্রতিটি প্রশ্নের চারটি উত্তর দেওয়া আছে। সঠিক উত্তরটি বেছে নিয়ে উত্তরপত্রে প্রয়োজনীয় স্থানে সম্পূর্ণ বৃত্তটি কালো কর।"
              />
              {errors.instructions && (
                <p className="text-sm text-red-500">{errors.instructions.message}</p>
              )}
            </div>
          </div>

          {/* Page Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">পৃষ্ঠার সেটিংস</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="page_size">পৃষ্ঠার আকার</Label>
                <Select onValueChange={(value) => setValue('page_size', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="পৃষ্ঠার আকার নির্বাচন করুন" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A4">A4</SelectItem>
                    <SelectItem value="A5">A5</SelectItem>
                    <SelectItem value="Letter">Letter</SelectItem>
                  </SelectContent>
                </Select>
                {errors.page_size && (
                  <p className="text-sm text-red-500">{errors.page_size.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="font_family">ফন্ট</Label>
                <Select onValueChange={(value) => setValue('font_family', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="ফন্ট নির্বাচন করুন" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="noto-serif">Noto Serif Bengali</SelectItem>
                    <SelectItem value="arial">Arial</SelectItem>
                    <SelectItem value="times">Times New Roman</SelectItem>
                  </SelectContent>
                </Select>
                {errors.font_family && (
                  <p className="text-sm text-red-500">{errors.font_family.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="font_size">ফন্ট সাইজ</Label>
              <Input
                id="font_size"
                {...register('font_size')}
                placeholder="14px"
              />
              {errors.font_size && (
                <p className="text-sm text-red-500">{errors.font_size.message}</p>
              )}
            </div>
          </div>

          {/* Margins */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">মার্জিন</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="margin_top">উপরে</Label>
                <Input
                  id="margin_top"
                  {...register('margin_top')}
                  placeholder="25mm"
                />
                {errors.margin_top && (
                  <p className="text-sm text-red-500">{errors.margin_top.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="margin_bottom">নিচে</Label>
                <Input
                  id="margin_bottom"
                  {...register('margin_bottom')}
                  placeholder="25mm"
                />
                {errors.margin_bottom && (
                  <p className="text-sm text-red-500">{errors.margin_bottom.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="margin_left">বামে</Label>
                <Input
                  id="margin_left"
                  {...register('margin_left')}
                  placeholder="25mm"
                />
                {errors.margin_left && (
                  <p className="text-sm text-red-500">{errors.margin_left.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="margin_right">ডানে</Label>
                <Input
                  id="margin_right"
                  {...register('margin_right')}
                  placeholder="25mm"
                />
                {errors.margin_right && (
                  <p className="text-sm text-red-500">{errors.margin_right.message}</p>
                )}
              </div>
            </div>
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