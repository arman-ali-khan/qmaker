'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { supabase } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/auth'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'

const questionSchema = z.object({
  subject: z.string().min(1, 'Subject is required'),
  question_no: z.number().min(1, 'Question number is required'),
  question_text: z.string().min(1, 'Question text is required'),
  option_a: z.string().min(1, 'Option A is required'),
  option_b: z.string().min(1, 'Option B is required'),
  option_c: z.string().min(1, 'Option C is required'),
  option_d: z.string().min(1, 'Option D is required'),
  correct_answer: z.enum(['A', 'B', 'C', 'D']),
  question_set: z.string().optional(),
})

type QuestionFormData = z.infer<typeof questionSchema>

const subjects = [
  'বাংলা',
  'ইংরেজি',
  'গণিত',
  'পদার্থবিজ্ঞান',
  'রসায়ন',
  'জীববিজ্ঞান',
  'ইতিহাস',
  'ভূগোল',
  'সমাজবিজ্ঞান',
  'অর্থনীতি',
]

interface QuestionFormProps {
  onQuestionAdded: () => void
}

export default function QuestionForm({ onQuestionAdded }: QuestionFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [questions, setQuestions] = useState<QuestionFormData[]>([])

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<QuestionFormData>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      question_no: 1,
    },
  })

  const addQuestion = (data: QuestionFormData) => {
    setQuestions([...questions, data])
    reset({
      subject: data.subject,
      question_set: data.question_set,
      question_no: data.question_no + 1,
    })
    toast.success('Question added to set')
  }

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index))
  }

  const saveAllQuestions = async () => {
    if (questions.length === 0) {
      toast.error('Please add at least one question')
      return
    }

    setIsLoading(true)
    try {
      const user = await getCurrentUser()
      if (!user) {
        toast.error('Please sign in to save questions')
        return
      }

      const questionsToSave = questions.map(q => ({
        ...q,
        user_id: user.id,
      }))

      const { error } = await supabase
        .from('questions')
        .insert(questionsToSave)

      if (error) {
        toast.error('Failed to save questions')
        console.error(error)
      } else {
        toast.success(`${questions.length} question(s) saved successfully!`)
        setQuestions([])
        onQuestionAdded()
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">নতুন প্রশ্ন যোগ করুন</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(addQuestion)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subject">বিষয়</Label>
                <Select onValueChange={(value) => setValue('subject', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="বিষয় নির্বাচন করুন" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject} value={subject}>
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.subject && (
                  <p className="text-sm text-red-500">{errors.subject.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="question_no">প্রশ্ন নং</Label>
                <Input
                  id="question_no"
                  type="number"
                  {...register('question_no', { valueAsNumber: true })}
                />
                {errors.question_no && (
                  <p className="text-sm text-red-500">{errors.question_no.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="question_set">প্রশ্নের সেট (ঐচ্ছিক)</Label>
              <Input
                id="question_set"
                placeholder="মডেল টেস্ট ১, চূড়ান্ত পরীক্ষা ইত্যাদি"
                {...register('question_set')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="question_text">প্রশ্ন</Label>
              <Textarea
                id="question_text"
                placeholder="প্রশ্নটি এখানে লিখুন..."
                rows={3}
                {...register('question_text')}
              />
              {errors.question_text && (
                <p className="text-sm text-red-500">{errors.question_text.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="option_a">বিকল্প (ক)</Label>
                <Input
                  id="option_a"
                  placeholder="বিকল্প ক"
                  {...register('option_a')}
                />
                {errors.option_a && (
                  <p className="text-sm text-red-500">{errors.option_a.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="option_b">বিকল্প (খ)</Label>
                <Input
                  id="option_b"
                  placeholder="বিকল্প খ"
                  {...register('option_b')}
                />
                {errors.option_b && (
                  <p className="text-sm text-red-500">{errors.option_b.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="option_c">বিকল্প (গ)</Label>
                <Input
                  id="option_c"
                  placeholder="বিকল্প গ"
                  {...register('option_c')}
                />
                {errors.option_c && (
                  <p className="text-sm text-red-500">{errors.option_c.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="option_d">বিকল্প (ঘ)</Label>
                <Input
                  id="option_d"
                  placeholder="বিকল্প ঘ"
                  {...register('option_d')}
                />
                {errors.option_d && (
                  <p className="text-sm text-red-500">{errors.option_d.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label>সঠিক উত্তর</Label>
              <RadioGroup
                onValueChange={(value) => setValue('correct_answer', value as 'A' | 'B' | 'C' | 'D')}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="A" id="correct_a" />
                  <Label htmlFor="correct_a">ক</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="B" id="correct_b" />
                  <Label htmlFor="correct_b">খ</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="C" id="correct_c" />
                  <Label htmlFor="correct_c">গ</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="D" id="correct_d" />
                  <Label htmlFor="correct_d">ঘ</Label>
                </div>
              </RadioGroup>
              {errors.correct_answer && (
                <p className="text-sm text-red-500">{errors.correct_answer.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              প্রশ্ন যোগ করুন
            </Button>
          </form>
        </CardContent>
      </Card>

      {questions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-semibold">
              প্রশ্নের তালিকা ({questions.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {questions.map((question, index) => (
                <div key={index} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-medium">
                      {question.question_no}. {question.question_text}
                    </h3>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeQuestion(index)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>ক) {question.option_a}</div>
                    <div>খ) {question.option_b}</div>
                    <div>গ) {question.option_c}</div>
                    <div>ঘ) {question.option_d}</div>
                  </div>
                  <div className="mt-2 text-sm text-green-600">
                    সঠিক উত্তর: {question.correct_answer}
                  </div>
                </div>
              ))}
              <Button
                onClick={saveAllQuestions}
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'সেভ করা হচ্ছে...' : 'সব প্রশ্ন সেভ করুন'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}