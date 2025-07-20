'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@/components/ui/sidebar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { supabase } from '@/lib/supabase'
import { User } from '@/lib/auth'
import { toast } from 'sonner'
import { 
  BookOpen, 
  Plus, 
  Search, 
  ChevronDown, 
  ChevronRight,
  Edit,
  Trash2,
  FileText,
  GraduationCap,
  Settings
} from 'lucide-react'

const questionSchema = z.object({
  subject: z.string().min(1, 'Subject is required'),
  question_text: z.string().min(10, 'Question must be at least 10 characters'),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  options: z.array(z.string().min(1, 'Option cannot be empty')).length(4, 'Must have exactly 4 options'),
  correct_answer: z.enum(['A', 'B', 'C', 'D']),
})

type QuestionFormData = z.infer<typeof questionSchema>

interface Subject {
  id: string
  name: string
  question_count: number
}

interface SavedQuestion {
  id: string
  paper_id: string
  question_text: string
  options: string[]
  correct_answer: string
  order_index: number
  difficulty?: string
  created_at: string
  question_papers?: {
    title: string
    header_info: any
  }
}

interface AppSidebarProps {
  user: User | null
  onQuestionSelect?: (question: SavedQuestion) => void
  onSubjectSelect?: (subject: string) => void
}

export default function AppSidebar({ user, onQuestionSelect, onSubjectSelect }: AppSidebarProps) {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [savedQuestions, setSavedQuestions] = useState<SavedQuestion[]>([])
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState<string>('')

  const form = useForm<QuestionFormData>({
    resolver: zodResolver(questionSchema),
    defaultValues: {
      subject: '',
      question_text: '',
      difficulty: 'medium',
      options: ['', '', '', ''],
      correct_answer: 'A',
    },
  })

  useEffect(() => {
    if (user) {
      fetchSubjects()
      fetchSavedQuestions()
    }
  }, [user])

  const fetchSubjects = async () => {
    try {
      if (!user) return

      const { data: subjectsData, error } = await supabase
        .from('subjects')
        .select('*')
        .eq('user_id', user.id)
        .order('name')

      if (error) {
        console.error('Error fetching subjects:', error)
        return
      }

      // Get question counts for each subject
      const subjectsWithCounts = await Promise.all(
        (subjectsData || []).map(async (subject) => {
          // First, get paper IDs for this subject and user
          const { data: paperIds } = await supabase
            .from('question_papers')
            .select('id')
            .eq('user_id', user.id)
            .filter('header_info->>subject', 'eq', subject.name)

          if (!paperIds || paperIds.length === 0) {
            return {
              ...subject,
              question_count: 0
            }
          }

          // Then, count questions for these papers
          const { count } = await supabase
            .from('questions')
            .select('*', { count: 'exact', head: true })
            .in('paper_id', paperIds.map(p => p.id))

          return {
            ...subject,
            question_count: count || 0
          }
        })
      )

      setSubjects(subjectsWithCounts)
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const fetchSavedQuestions = async () => {
    try {
      if (!user) return

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
      } else {
        setSavedQuestions(data || [])
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const onSubmit = async (data: QuestionFormData) => {
    setIsLoading(true)
    try {
      if (!user) {
        toast.error('Please sign in to save questions')
        return
      }

      // Create or find a question paper for this subject
      const paperTitle = `${data.subject} Questions`
      
      let paperId: string | null = null
      
      const { data: existingPaper } = await supabase
        .from('question_papers')
        .select('id')
        .eq('user_id', user.id)
        .eq('title', paperTitle)
        .maybeSingle()
      
      if (existingPaper) {
        paperId = existingPaper.id
      } else {
        const { data: newPaper, error: paperError } = await supabase
          .from('question_papers')
          .insert({
            user_id: user.id,
            title: paperTitle,
            header_info: {
              subject: data.subject,
              exam_type: 'MCQ',
              total_marks: '100',
              school_name: 'বাংলাদেশ শিক্ষা বোর্ড',
              exam_name: 'বার্ষিক পরীক্ষা'
            }
          })
          .select('id')
          .single()
        
        if (paperError || !newPaper) {
          toast.error('Failed to create question paper')
          return
        }
        
        paperId = newPaper.id
      }

      // Get the next order index
      const { count } = await supabase
        .from('questions')
        .select('*', { count: 'exact', head: true })
        .eq('paper_id', paperId)

      const questionToSave = {
        paper_id: paperId,
        type: 'mcq',
        question_text: data.question_text,
        options: data.options,
        correct_answer: data.correct_answer,
        marks: 1,
        order_index: (count || 0) + 1,
        difficulty: data.difficulty
      }

      const { error } = await supabase
        .from('questions')
        .insert(questionToSave)

      if (error) {
        toast.error('Failed to save question')
        console.error(error)
      } else {
        toast.success('Question saved successfully!')
        form.reset({
          subject: data.subject, // Keep the same subject
          question_text: '',
          difficulty: 'medium',
          options: ['', '', '', ''],
          correct_answer: 'A',
        })
        // Only refresh saved questions, don't refresh subjects to maintain selection
        fetchSavedQuestions()
        // Update subject count for the specific subject without refreshing all
        setSubjects(prev => prev.map(s => 
          s.name === data.subject 
            ? { ...s, question_count: (s.question_count || 0) + 1 }
            : s
        ))
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
      console.error(error)
    } finally {
      setIsLoading(false)
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
      } else {
        toast.success('Question deleted successfully!')
        fetchSavedQuestions()
        fetchSubjects()
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    }
  }

  const toggleSubject = (subjectName: string) => {
    const newExpanded = new Set(expandedSubjects)
    if (newExpanded.has(subjectName)) {
      newExpanded.delete(subjectName)
    } else {
      newExpanded.add(subjectName)
    }
    setExpandedSubjects(newExpanded)
  }

  const handleSubjectSelect = (subject: string) => {
    setSelectedSubject(subject)
    onSubjectSelect?.(subject)
  }

  const totalQuestionCount = subjects.reduce((total, subject) => total + (subject.question_count || 0), 0)

  const filteredQuestions = savedQuestions.filter(question =>
    question.question_text.toLowerCase().includes(searchTerm.toLowerCase()) ||
    question.question_papers?.header_info?.subject?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const questionsBySubject = filteredQuestions.reduce((acc, question) => {
    const subject = question.question_papers?.header_info?.subject || 'Unknown'
    if (!acc[subject]) {
      acc[subject] = []
    }
    acc[subject].push(question)
    return acc
  }, {} as Record<string, SavedQuestion[]>)

  if (!user) {
    return (
      <Sidebar>
        <SidebarContent>
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">Please sign in</p>
          </div>
        </SidebarContent>
      </Sidebar>
    )
  }

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1">
          <GraduationCap className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-lg font-semibold">প্রশ্ন প্রণেতা</h2>
            <p className="text-xs text-muted-foreground">Question Builder</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
      

        {/* Subjects Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Subjects
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  onClick={() => handleSubjectSelect('')}
                  isActive={selectedSubject === ''}
                  className="w-full justify-start"
                >
                  <FileText className="h-4 w-4" />
                  <span>All Subjects</span>
                  <Badge variant="secondary" className="ml-auto">
                    {totalQuestionCount}
                  </Badge>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {subjects.map((subject) => (
                <SidebarMenuItem key={subject.id}>
                  <SidebarMenuButton
                    onClick={() => handleSubjectSelect(subject.name)}
                    isActive={selectedSubject === subject.name}
                    className="w-full justify-start"
                  >
                    <BookOpen className="h-4 w-4" />
                    <span className="truncate">{subject.name}</span>
                    <Badge variant="secondary" className="ml-auto">
                      {subject.question_count}
                    </Badge>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Saved Questions */}
        <SidebarGroup className="flex-1">
          <SidebarGroupLabel className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Saved Questions ({filteredQuestions.length})
          </SidebarGroupLabel>
          <SidebarGroupContent>
            {/* Search */}
            <div className="px-2 pb-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search questions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-8 pl-7 text-xs"
                />
              </div>
            </div>

            <ScrollArea className="h-[400px]">
              <div className="space-y-1 px-2">
                {Object.entries(questionsBySubject).map(([subject, questions]) => (
                  <Collapsible
                    key={subject}
                    open={expandedSubjects.has(subject)}
                    onOpenChange={() => toggleSubject(subject)}
                  >
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        className="w-full justify-start h-8 px-2 text-xs font-medium"
                      >
                        {expandedSubjects.has(subject) ? (
                          <ChevronDown className="h-3 w-3 mr-1" />
                        ) : (
                          <ChevronRight className="h-3 w-3 mr-1" />
                        )}
                        <span className="truncate">{subject}</span>
                        <Badge variant="outline" className="ml-auto text-xs">
                          {questions.length}
                        </Badge>
                      </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-1 ml-4">
                      {questions.map((question) => (
                        <div
                          key={question.id}
                          className="group relative rounded-md border p-2 hover:bg-accent/50 transition-colors"
                        >
                          <div className="space-y-1">
                            <p className="text-xs font-medium line-clamp-2">
                              {question.question_text}
                            </p>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <span>Q{question.order_index}</span>
                              <span>•</span>
                              <span className="capitalize">
                                {question.difficulty || 'medium'}
                              </span>
                              <span>•</span>
                              <span>Ans: {question.correct_answer}</span>
                            </div>
                          </div>
                          <div className="absolute right-1 top-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => onQuestionSelect?.(question)}
                              aria-label="Edit question"
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                              onClick={() => deleteQuestion(question.id)}
                              aria-label="Delete question"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                ))}
                
                {Object.keys(questionsBySubject).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-xs">No questions found</p>
                    {searchTerm && (
                      <p className="text-xs">Try a different search term</p>
                    )}
                  </div>
                )}
              </div>
            </ScrollArea>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="px-2 py-1">
          <div className="text-xs text-muted-foreground space-y-1">
            <p className="font-medium">{user.full_name}</p>
            <p>{user.email}</p>
            <p className="capitalize">{user.role.replace('_', ' ')}</p>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}