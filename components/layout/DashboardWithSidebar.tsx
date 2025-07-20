'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, signOut, User } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar'
import { Separator } from '@/components/ui/separator'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { LogOut, BookOpen } from 'lucide-react'
import { toast } from 'sonner'
import AppSidebar from './AppSidebar'
import QuestionForm from '@/components/questions/QuestionForm'
import QuestionPreview from '@/components/questions/QuestionPreview'
import ExamSettingsForm from '@/components/questions/ExamSettingsForm'

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

export default function DashboardWithSidebar() {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
  const [selectedSubject, setSelectedSubject] = useState<string>('')
  const [selectedQuestion, setSelectedQuestion] = useState<SavedQuestion | null>(null)
  const [activeView, setActiveView] = useState<'create' | 'preview' | 'settings'>('create')
  const router = useRouter()

  useEffect(() => {
    checkUser()
  }, [])

  const checkUser = async () => {
    try {
      const currentUser = await getCurrentUser()
      if (currentUser) {
        setUser(currentUser)
      } else {
        router.push('/')
      }
    } catch (error) {
      console.error('Error checking user:', error)
      router.push('/')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
      toast.success('Successfully signed out')
      router.push('/')
    } catch (error) {
      toast.error('Error signing out')
    }
  }

  const handleQuestionAdded = () => {
    // Don't refresh the entire dashboard, let individual components handle their own updates
    // setRefreshKey(prev => prev + 1)
  }

  const handleSettingsUpdated = () => {
    setRefreshKey(prev => prev + 1)
  }

  const handleQuestionSelect = (question: SavedQuestion) => {
    setSelectedQuestion(question)
    setActiveView('create')
    // You can implement editing functionality here
    toast.info('Question selected for editing')
  }

  const handleSubjectSelect = (subject: string) => {
    setSelectedSubject(subject)
    setActiveView('preview') // Switch to preview when subject is selected
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <SidebarProvider defaultOpen={false}>
      <AppSidebar 
        user={user} 
        onQuestionSelect={handleQuestionSelect}
        onSubjectSelect={handleSubjectSelect}
      />
      <SidebarInset>
        {/* Header */}
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/dashboard">
                  Dashboard
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>
                  {activeView === 'create' && 'Create Questions'}
                  {activeView === 'preview' && 'Preview & Print'}
                  {activeView === 'settings' && 'Settings'}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
          
          <div className="ml-auto flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <span className="text-sm text-gray-600">
                Welcome, {user?.full_name}
              </span>
              <div className="text-xs text-gray-500">
                {user?.role === 'school_owner' ? 'School Owner' : 'Teacher'} • {user?.email}
              </div>
            </div>
            <Button variant="outline" onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex flex-1 flex-col gap-4 p-4">
          {/* Navigation Tabs */}
          <div className="flex gap-2 border-b pb-4">
            <Button
              variant={activeView === 'create' ? 'default' : 'outline'}
              onClick={() => setActiveView('create')}
              className="flex items-center gap-2"
            >
              <BookOpen className="h-4 w-4" />
              Create Questions
            </Button>
            <Button
              variant={activeView === 'preview' ? 'default' : 'outline'}
              onClick={() => setActiveView('preview')}
              className="flex items-center gap-2"
            >
              <BookOpen className="h-4 w-4" />
              Preview & Print
            </Button>
            <Button
              variant={activeView === 'settings' ? 'default' : 'outline'}
              onClick={() => setActiveView('settings')}
              className="flex items-center gap-2"
            >
              <BookOpen className="h-4 w-4" />
              Settings
            </Button>
          </div>

          {/* Content Area */}
          <div className="flex-1">
            {activeView === 'create' && (
              <div className="space-y-6">
                {selectedSubject && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800">
                      <strong>Selected Subject:</strong> {selectedSubject}
                    </p>
                  </div>
                )}
                <QuestionForm 
                  onQuestionAdded={handleQuestionAdded} 
                  user={user}
                  selectedSubject={selectedSubject}
                />
              </div>
            )}

            {activeView === 'preview' && (
              <QuestionPreview 
                key={`preview-${refreshKey}`} 
                user={user}
                selectedSubject={selectedSubject}
              />
            )}

            {activeView === 'settings' && (
              <ExamSettingsForm 
                key={`settings-${refreshKey}`} 
                onSettingsUpdated={handleSettingsUpdated} 
                user={user} 
              />
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}