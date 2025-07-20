'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { supabase } from '@/lib/supabase'
import { User } from '@/lib/auth'
import { toast } from 'sonner'
import { Plus, BookOpen, FileText, Trash2 } from 'lucide-react'

interface Subject {
  id: string
  name: string
  question_count?: number
}

interface DashboardSidebarProps {
  user: User | null
  onSubjectSelect: (subject: string) => void
  selectedSubject: string | null
  onRefresh: () => void
}

export default function DashboardSidebar({ 
  user, 
  onSubjectSelect, 
  selectedSubject, 
  onRefresh 
}: DashboardSidebarProps) {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [newSubject, setNewSubject] = useState('')
  const [isAddingSubject, setIsAddingSubject] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (user) {
      fetchSubjects()
    }
  }, [user])

  const fetchSubjects = async () => {
    setIsLoading(true)
    try {
      if (!user) return

      // Get subjects with question counts
      const { data: subjectsData, error: subjectsError } = await supabase
        .from('subjects')
        .select('*')
        .eq('user_id', user.id)
        .order('name')

      if (subjectsError) {
        console.error('Error fetching subjects:', subjectsError)
        toast.error('Failed to load subjects')
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
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const addNewSubject = async () => {
    if (!newSubject.trim() || !user) return

    setIsAddingSubject(true)
    try {
      const { data, error } = await supabase
        .from('subjects')
        .insert({
          user_id: user.id,
          name: newSubject.trim()
        })
        .select()
        .single()

      if (error) {
        if (error.code === '23505') {
          toast.error('This subject already exists')
        } else {
          toast.error('Failed to add subject')
        }
      } else {
        setSubjects(prev => [...prev, { ...data, question_count: 0 }].sort((a, b) => a.name.localeCompare(b.name)))
        setNewSubject('')
        toast.success('Subject added successfully')
        onRefresh()
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setIsAddingSubject(false)
    }
  }

  const deleteSubject = async (subjectId: string, subjectName: string) => {
    if (!confirm(`Are you sure you want to delete "${subjectName}"? This will not delete existing questions.`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('subjects')
        .delete()
        .eq('id', subjectId)

      if (error) {
        toast.error('Failed to delete subject')
        console.error(error)
      } else {
        setSubjects(prev => prev.filter(s => s.id !== subjectId))
        toast.success('Subject deleted successfully')
        if (selectedSubject === subjectName) {
          onSubjectSelect('')
        }
        onRefresh()
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
      console.error(error)
    }
  }

  if (!user) {
    return (
      <div className="w-80 border-r bg-gray-50 p-4">
        <p className="text-gray-500 text-center">Please sign in</p>
      </div>
    )
  }

  return (
    <div className="w-80 border-r bg-gray-50 flex flex-col h-full">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold mb-4 flex items-center">
          <BookOpen className="w-5 h-5 mr-2" />
          বিষয়সমূহ
        </h2>
        
        {/* Add new subject */}
        <div className="space-y-2">
          <Label htmlFor="new-subject">নতুন বিষয় যোগ করুন</Label>
          <div className="flex gap-2">
            <Input
              id="new-subject"
              placeholder="বিষয়ের নাম"
              value={newSubject}
              onChange={(e) => setNewSubject(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addNewSubject()
                }
              }}
            />
            <Button
              onClick={addNewSubject}
              disabled={isAddingSubject || !newSubject.trim()}
              size="sm"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        {isLoading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        ) : subjects.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">কোন বিষয় নেই</p>
            <p className="text-xs">উপরে নতুন বিষয় যোগ করুন</p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* All subjects option */}
            <Button
              variant={selectedSubject === '' ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => onSubjectSelect('')}
            >
              <BookOpen className="w-4 h-4 mr-2" />
              সব বিষয়
            </Button>
            
            <Separator />
            
            {subjects.map((subject) => (
              <div key={subject.id} className="group relative">
                <Button
                  variant={selectedSubject === subject.name ? 'default' : 'ghost'}
                  className="w-full justify-start pr-8"
                  onClick={() => onSubjectSelect(subject.name)}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  <span className="flex-1 text-left truncate">{subject.name}</span>
                  {subject.question_count !== undefined && (
                    <Badge variant="secondary" className="ml-2">
                      {subject.question_count}
                    </Badge>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0"
                  onClick={() => deleteSubject(subject.id, subject.name)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>

      <div className="p-4 border-t bg-white">
        <div className="text-xs text-gray-500 space-y-1">
          <p>মোট বিষয়: {subjects.length}</p>
          <p>নির্বাচিত: {selectedSubject || 'সব বিষয়'}</p>
        </div>
      </div>
    </div>
  )
}