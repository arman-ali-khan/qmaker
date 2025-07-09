'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { getCurrentUser, signOut } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LogOut, BookOpen, Plus, Eye, Settings } from 'lucide-react'
import { toast } from 'sonner'
import QuestionForm from '@/components/questions/QuestionForm'
import QuestionPreview from '@/components/questions/QuestionPreview'
import ExamSettingsForm from '@/components/questions/ExamSettingsForm'

export default function DashboardLayout() {
  const [user, setUser] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)
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
    setRefreshKey(prev => prev + 1)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <BookOpen className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">প্রশ্ন প্রণেতা</h1>
                <p className="text-sm text-gray-600">Question Builder Dashboard</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Welcome, {user?.email}
              </span>
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="create" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="create" className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>প্রশ্ন তৈরি করুন</span>
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center space-x-2">
              <Eye className="h-4 w-4" />
              <span>প্রিভিউ ও প্রিন্ট</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>সেটিংস</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="mt-6">
            <QuestionForm onQuestionAdded={handleQuestionAdded} />
          </TabsContent>

          <TabsContent value="preview" className="mt-6">
            <QuestionPreview key={refreshKey} />
          </TabsContent>

          <TabsContent value="settings" className="mt-6">
            <ExamSettingsForm onSettingsUpdated={handleQuestionAdded} />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}