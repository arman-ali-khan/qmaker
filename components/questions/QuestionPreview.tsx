'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { getCurrentUser } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Printer, Download } from 'lucide-react'
import { useReactToPrint } from 'react-to-print'

interface ExamSettings {
  school_name: string
  exam_time: string
  total_marks: string
  instructions: string
}

interface Question {
  id: string
  subject: string
  question_no: number
  question_text: string
  option_a: string
  option_b: string
  option_c: string
  option_d: string
  correct_answer: string
  question_set: string | null
  created_at: string
}

export default function QuestionPreview() {
  const [questions, setQuestions] = useState<Question[]>([])
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([])
  const [selectedSubject, setSelectedSubject] = useState<string>('')
  const [selectedSet, setSelectedSet] = useState<string>('')
  const [subjects, setSubjects] = useState<string[]>([])
  const [questionSets, setQuestionSets] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [examSettings, setExamSettings] = useState<ExamSettings>({
    school_name: 'বাংলাদেশ শিক্ষা বোর্ড',
    exam_time: '২ ঘণ্টা ৩০ মিনিট',
    total_marks: '১০০',
    instructions: 'প্রতিটি প্রশ্নের চারটি উত্তর দেওয়া আছে। সঠিক উত্তরটি বেছে নিয়ে উত্তরপত্রে প্রয়োজনীয় স্থানে সম্পূর্ণ বৃত্তটি কালো কর।',
  })
  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = useReactToPrint({
    content: () => printRef.current,
    documentTitle: `${selectedSubject || 'All'} - Questions`,
  })

  useEffect(() => {
    fetchQuestions()
    fetchExamSettings()
  }, [])

  useEffect(() => {
    filterQuestions()
  }, [questions, selectedSubject, selectedSet])

  const fetchQuestions = async () => {
    setIsLoading(true)
    try {
      const user = await getCurrentUser()
      if (!user) return

      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('user_id', user.id)
        .order('subject', { ascending: true })
        .order('question_no', { ascending: true })

      if (error) {
        console.error('Error fetching questions:', error)
      } else {
        setQuestions(data || [])
        
        // Extract unique subjects and sets
        const uniqueSubjects = [...new Set(data?.map(q => q.subject) || [])]
        const uniqueSets = [...new Set(data?.map(q => q.question_set).filter(Boolean) || [])]
        
        setSubjects(uniqueSubjects)
        setQuestionSets(uniqueSets)
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchExamSettings = async () => {
    try {
      const user = await getCurrentUser()
      if (!user) return

      const { data, error } = await supabase
        .from('exam_settings')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching exam settings:', error)
      } else if (data) {
        setExamSettings({
          school_name: data.school_name,
          exam_time: data.exam_time,
          total_marks: data.total_marks,
          instructions: data.instructions,
        })
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  const filterQuestions = () => {
    let filtered = questions

    if (selectedSubject && selectedSubject !== 'all') {
      filtered = filtered.filter(q => q.subject === selectedSubject)
    }

    if (selectedSet && selectedSet !== 'all') {
      filtered = filtered.filter(q => q.question_set === selectedSet)
    }

    setFilteredQuestions(filtered)
  }

  const getBanglaNumber = (num: number) => {
    const banglaNumbers = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯']
    return num.toString().split('').map(digit => banglaNumbers[parseInt(digit)]).join('')
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-semibold">প্রশ্ন প্রিভিউ ও প্রিন্ট</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="বিষয় নির্বাচন করুন" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">সব বিষয়</SelectItem>
                {subjects.map((subject) => (
                  <SelectItem key={subject} value={subject}>
                    {subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedSet} onValueChange={setSelectedSet}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="সেট নির্বাচন করুন" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">সব সেট</SelectItem>
                {questionSets.map((set) => (
                  <SelectItem key={set} value={set}>
                    {set}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button onClick={handlePrint} className="w-full sm:w-auto">
              <Printer className="w-4 h-4 mr-2" />
              প্রিন্ট করুন
            </Button>
          </div>
        </CardContent>
      </Card>

      <div ref={printRef} className="bg-white">
        <style jsx global>{`
          @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+Bengali:wght@400;600;700&display=swap');
          
          .bengali-text {
            font-family: 'Noto Serif Bengali', serif;
          }
          
          @media print {
            .no-print {
              display: none !important;
            }
            
            .print-only {
              display: block !important;
            }
            
            body {
              font-size: 14px;
              line-height: 1.5;
            }
            
            .page-break {
              page-break-after: always;
            }
          }
        `}</style>

        <div className="p-8 max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8 bengali-text">
            <div className="border-2 border-black p-4 mb-4">
              <h1 className="text-2xl font-bold mb-2">
                {examSettings.school_name}
              </h1>
              <h2 className="text-xl font-semibold mb-2">
                {selectedSubject && selectedSubject !== 'all' ? selectedSubject : 'সকল বিষয়'}
              </h2>
              <div className="flex justify-between items-center text-sm">
                <span>সময়: {examSettings.exam_time}</span>
                <span>পূর্ণমান: {examSettings.total_marks}</span>
              </div>
              {selectedSet && selectedSet !== 'all' && (
                <div className="mt-2 text-sm">
                  <span className="font-semibold">সেট: {selectedSet}</span>
                </div>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="mb-6 bengali-text text-sm">
            <p className="mb-2">
              <strong>নির্দেশনা:</strong> {examSettings.instructions}
            </p>
          </div>

          {/* Questions */}
          <div className="space-y-4 bengali-text">
            {filteredQuestions.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                কোন প্রশ্ন পাওয়া যায়নি
              </div>
            ) : (
              filteredQuestions.map((question, index) => (
                <div key={question.id} className="mb-6">
                  <div className="font-semibold mb-3 text-base leading-relaxed">
                    {getBanglaNumber(question.question_no)}। {question.question_text}
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm ml-6">
                    <div className="flex items-start">
                      <span className="font-medium mr-2">(ক)</span>
                      <span>{question.option_a}</span>
                    </div>
                    <div className="flex items-start">
                      <span className="font-medium mr-2">(খ)</span>
                      <span>{question.option_b}</span>
                    </div>
                    <div className="flex items-start">
                      <span className="font-medium mr-2">(গ)</span>
                      <span>{question.option_c}</span>
                    </div>
                    <div className="flex items-start">
                      <span className="font-medium mr-2">(ঘ)</span>
                      <span>{question.option_d}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Answer Key (for print only) */}
          {filteredQuestions.length > 0 && (
            <div className="mt-12 print-only hidden">
              <h3 className="text-lg font-bold mb-4 bengali-text">উত্তরমালা</h3>
              <div className="grid grid-cols-4 gap-4 text-sm">
                {filteredQuestions.map((question) => (
                  <div key={question.id} className="bengali-text">
                    {getBanglaNumber(question.question_no)}. {question.correct_answer === 'A' ? 'ক' : 
                     question.correct_answer === 'B' ? 'খ' : 
                     question.correct_answer === 'C' ? 'গ' : 'ঘ'}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}