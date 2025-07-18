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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { supabase } from '@/lib/supabase'
import { getCurrentUser, User } from '@/lib/auth'
import { toast } from 'sonner'
import { Plus, Trash2, Edit, Save, X } from 'lucide-react'

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
  user: User | null
}

interface SavedQuestion {
  id: string
  paper_id: string
  type: string
  question_text: string
  options: string[]
  correct_answer: string
  marks: number
  order_index: number
  created_at: string
  updated_at: string
  question_papers?: {
    title: string
    header_info: any
  }
}

export default function QuestionForm({ onQuestionAdded, user }: QuestionFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [questions, setQuestions] = useState<QuestionFormData[]>([])
  const [savedQuestions, setSavedQuestions] = useState<SavedQuestion[]>([])
  const [editingQuestion, setEditingQuestion] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<any>(null)
  const [isLoadingSaved, setIsLoadingSaved] = useState(true)

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

  useEffect(() => {
    fetchSavedQuestions()
  }, [])

  const fetchSavedQuestions = async () => {
    setIsLoadingSaved(true)
    try {
      if (!user) return

      // Get questions with their question papers
      const { data, error } = await supabase
        .from('questions')
        .select(`
          *,
          question_papers!inner(
            title,
            header_info,
            user_id
          )
        `)
        .eq('question_papers.user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching questions:', error)
        toast.error('Failed to load questions')
      } else {
        setSavedQuestions(data || [])
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoadingSaved(false)
    }
  }

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
      if (!user) {
        toast.error('Please sign in to save questions')
        return
      }

      // Create or find a question paper for this set
      const firstQuestion = questions[0]
      const paperTitle = firstQuestion.question_set || `${firstQuestion.subject} Questions`
      
      let paperId: string | null = null
      
      // Check if a paper with this title already exists
      const { data: existingPaper } = await supabase
        .from('question_papers')
        .select('id')
        .eq('user_id', user.id)
        .eq('title', paperTitle)
        .maybeSingle()
      
      if (existingPaper) {
        paperId = existingPaper.id
      } else {
        // Create a new question paper
        const { data: newPaper, error: paperError } = await supabase
          .from('question_papers')
          .insert({
            user_id: user.id,
            title: paperTitle,
            header_info: {
              subject: firstQuestion.subject,
              exam_type: 'MCQ',
              total_marks: questions.length.toString(),
              school_name: 'বাংলাদেশ শিক্ষা বোর্ড',
              exam_name: 'বার্ষিক পরীক্ষা'
            }
          })
          .select('id')
          .single()
        
        if (paperError || !newPaper) {
          toast.error('Failed to create question paper')
          console.error(paperError)
          return
        }
        
        paperId = newPaper.id
      }

      // Update the question paper's header_info with the current subject if needed
      if (paperId) {
        const { error: updateError } = await supabase
          .from('question_papers')
          .update({
            header_info: {
              subject: firstQuestion.subject,
              exam_type: 'MCQ',
              total_marks: questions.length.toString(),
              school_name: 'বাংলাদেশ শিক্ষা বোর্ড',
              exam_name: 'বার্ষিক পরীক্ষা'
            }
          })
          .eq('id', paperId)
        
        if (updateError) {
          console.error('Error updating question paper header:', updateError)
        }
      }

      // Transform questions to new format
      const questionsToSave = questions.map((q, index) => ({
        paper_id: paperId,
        type: 'mcq',
        question_text: q.question_text,
        options: [q.option_a, q.option_b, q.option_c, q.option_d],
        correct_answer: q.correct_answer,
        marks: 1,
        order_index: q.question_no
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
        fetchSavedQuestions() // Refresh the saved questions list
        onQuestionAdded()
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const startEdit = (question: SavedQuestion) => {
    setEditingQuestion(question.id)
    setEditForm({
      id: question.id,
      subject: question.question_papers?.header_info?.subject || 'বাংলা',
      question_no: question.order_index,
      question_text: question.question_text,
      option_a: question.options?.[0] || '',
      option_b: question.options?.[1] || '',
      option_c: question.options?.[2] || '',
      option_d: question.options?.[3] || '',
      correct_answer: question.correct_answer,
      question_set: question.question_papers?.title || null,
    })
  }

  const cancelEdit = () => {
    setEditingQuestion(null)
    setEditForm(null)
  }

  const saveEdit = async () => {
    if (!editForm) return

    try {
      // First, update the question paper's header_info with the new subject
      const questionToUpdate = savedQuestions.find(q => q.id === editForm.id)
      if (questionToUpdate?.paper_id) {
        const { error: headerError } = await supabase
          .from('question_papers')
          .update({
            header_info: {
              subject: editForm.subject,
              exam_type: 'MCQ',
              school_name: 'বাংলাদেশ শিক্ষা বোর্ড',
              exam_name: 'বার্ষিক পরীক্ষা'
            }
          })
          .eq('id', questionToUpdate.paper_id)
        
        if (headerError) {
          console.error('Error updating question paper header:', headerError)
        }
      }

      const { error } = await supabase
        .from('questions')
        .update({
          question_text: editForm.question_text,
          options: [editForm.option_a, editForm.option_b, editForm.option_c, editForm.option_d],
          correct_answer: editForm.correct_answer,
          order_index: editForm.question_no
        })
        .eq('id', editForm.id)

      if (error) {
        toast.error('Failed to update question')
        console.error(error)
      } else {
        toast.success('Question updated successfully!')
        setEditingQuestion(null)
        setEditForm(null)
        fetchSavedQuestions()
        onQuestionAdded()
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
      console.error(error)
    }
  }

  const deleteQuestion = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question?')) return

    try {
      const { error } = await supabase
        .from('questions')
        .delete()
        .eq('id', questionId)

      if (error) {
        toast.error('Failed to delete question')
        console.error(error)
      } else {
        toast.success('Question deleted successfully!')
        fetchSavedQuestions()
        onQuestionAdded()
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
      console.error(error)
    }
  }

  if (!user) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-gray-500">Please sign in to create questions</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">নতুন প্রশ্ন যোগ করুন</CardTitle>
          <p className="text-sm text-gray-600">
            Logged in as: {user.full_name} ({user.role})
          </p>
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

      {/* Saved Questions List */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">
            সংরক্ষিত প্রশ্নসমূহ ({savedQuestions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoadingSaved ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : savedQuestions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              কোন প্রশ্ন সংরক্ষিত নেই
            </div>
          ) : (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {savedQuestions.map((question) => (
                <div key={question.id} className="border rounded-lg p-4 bg-gray-50">
                  {editingQuestion === question.id ? (
                    // Edit mode
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>বিষয়</Label>
                          <Select 
                            value={editForm?.subject || ''} 
                            onValueChange={(value) => {
                              setEditForm(prev => prev ? {...prev, subject: value} : null)
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {subjects.map((subject) => (
                                <SelectItem key={subject} value={subject}>
                                  {subject}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>প্রশ্ন নং</Label>
                          <Input
                            type="number"
                            value={editForm?.question_no || ''}
                            onChange={(e) => setEditForm(prev => prev ? {...prev, question_no: parseInt(e.target.value)} : null)}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label>প্রশ্নের সেট</Label>
                        <Input
                          value={editForm?.question_set || ''}
                          onChange={(e) => setEditForm(prev => prev ? {...prev, question_set: e.target.value} : null)}
                        />
                      </div>
                      
                      <div>
                        <Label>প্রশ্ন</Label>
                        <Textarea
                          value={editForm?.question_text || ''}
                          onChange={(e) => setEditForm(prev => prev ? {...prev, question_text: e.target.value} : null)}
                          rows={3}
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>বিকল্প (ক)</Label>
                          <Input
                            value={editForm?.option_a || ''}
                            onChange={(e) => setEditForm(prev => prev ? {...prev, option_a: e.target.value} : null)}
                          />
                        </div>
                        <div>
                          <Label>বিকল্প (খ)</Label>
                          <Input
                            value={editForm?.option_b || ''}
                            onChange={(e) => setEditForm(prev => prev ? {...prev, option_b: e.target.value} : null)}
                          />
                        </div>
                        <div>
                          <Label>বিকল্প (গ)</Label>
                          <Input
                            value={editForm?.option_c || ''}
                            onChange={(e) => setEditForm(prev => prev ? {...prev, option_c: e.target.value} : null)}
                          />
                        </div>
                        <div>
                          <Label>বিকল্প (ঘ)</Label>
                          <Input
                            value={editForm?.option_d || ''}
                            onChange={(e) => setEditForm(prev => prev ? {...prev, option_d: e.target.value} : null)}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label>সঠিক উত্তর</Label>
                        <RadioGroup
                          value={editForm?.correct_answer || ''}
                          onValueChange={(value) => setEditForm(prev => prev ? {...prev, correct_answer: value} : null)}
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="A" id="edit_correct_a" />
                            <Label htmlFor="edit_correct_a">ক</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="B" id="edit_correct_b" />
                            <Label htmlFor="edit_correct_b">খ</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="C" id="edit_correct_c" />
                            <Label htmlFor="edit_correct_c">গ</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="D" id="edit_correct_d" />
                            <Label htmlFor="edit_correct_d">ঘ</Label>
                          </div>
                        </RadioGroup>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button onClick={saveEdit} size="sm">
                          <Save className="w-4 h-4 mr-2" />
                          সেভ করুন
                        </Button>
                        <Button onClick={cancelEdit} variant="outline" size="sm">
                          <X className="w-4 h-4 mr-2" />
                          বাতিল
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // View mode
                    <>
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {question.question_papers?.header_info?.subject || 'বিষয় অজানা'}
                            </span>
                            <span className="text-sm text-gray-600">
                              প্রশ্ন নং: {question.order_index}
                            </span>
                            {question.question_papers?.title && (
                              <span className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded">
                                {question.question_papers.title}
                              </span>
                            )}
                          </div>
                          <h3 className="font-medium mb-2">
                            {question.question_text}
                          </h3>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => startEdit(question)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => deleteQuestion(question.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                        <div>ক) {question.options?.[0] || ''}</div>
                        <div>খ) {question.options?.[1] || ''}</div>
                        <div>গ) {question.options?.[2] || ''}</div>
                        <div>ঘ) {question.options?.[3] || ''}</div>
                      </div>
                      <div className="text-sm text-green-600">
                        সঠিক উত্তর: {question.correct_answer === 'A' ? 'ক' : 
                         question.correct_answer === 'B' ? 'খ' : 
                         question.correct_answer === 'C' ? 'গ' : 'ঘ'}
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        তৈরি: {new Date(question.created_at).toLocaleDateString('bn-BD')}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
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