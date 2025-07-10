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
  school_address: string
  exam_type: string
  exam_time: string
  total_marks: string
  instructions: string
  page_size: string
  margin_top: string
  margin_bottom: string
  margin_left: string
  margin_right: string
  font_family: string
  font_size: string
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
    school_address: '',
    exam_type: 'বার্ষিক পরীক্ষা',
    exam_time: '২ ঘণ্টা ৩০ মিনিট',
    total_marks: '১০০',
    instructions: 'প্রতিটি প্রশ্নের চারটি উত্তর দেওয়া আছে। সঠিক উত্তরটি বেছে নিয়ে উত্তরপত্রে প্রয়োজনীয় স্থানে সম্পূর্ণ বৃত্তটি কালো কর।',
    page_size: 'A4',
    margin_top: '1in',
    margin_bottom: '1in',
    margin_left: '1in',
    margin_right: '1in',
    font_family: 'noto-serif',
    font_size: '14px',
  })
  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = useReactToPrint({
    contentRef: printRef,
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
          school_address: data.school_address || '',
          exam_type: data.exam_type,
          exam_time: data.exam_time,
          total_marks: data.total_marks,
          instructions: data.instructions,
          page_size: data.page_size || 'A4',
          margin_top: data.margin_top || '1in',
          margin_bottom: data.margin_bottom || '1in',
          margin_left: data.margin_left || '1in',
          margin_right: data.margin_right || '1in',
          font_family: data.font_family || 'noto-serif',
          font_size: data.font_size || '14px',
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

  // Get font configuration
  const getFontConfig = (fontFamily: string, fontSize: string) => {
    const fontFamilyMap = {
      'noto-serif': "'Noto Serif Bengali', serif",
      'kalpurush': "'Kalpurush', sans-serif",
      'solaiman': "'SolaimanLipi', serif"
    }
    
    return {
      fontFamily: fontFamilyMap[fontFamily as keyof typeof fontFamilyMap] || fontFamilyMap['noto-serif'],
      fontSize: fontSize || '14px'
    }
  }

  // Get margin configuration
  const getMarginConfig = (top: string, bottom: string, left: string, right: string) => {
    return {
      top: top || '1in',
      bottom: bottom || '1in',
      left: left || '1in',
      right: right || '1in'
    }
  }

  const fontConfig = getFontConfig(examSettings.font_family, examSettings.font_size)
  const marginConfig = getMarginConfig(
    examSettings.margin_top,
    examSettings.margin_bottom,
    examSettings.margin_left,
    examSettings.margin_right
  )

  // Get page size configuration
  const getPageConfig = (pageSize: string) => {
    switch (pageSize) {
      case 'Letter':
        return {
          questionsPerColumn: 10,
          pageClass: 'letter-page',
          size: 'Letter'
        }
      case 'Legal':
        return {
          questionsPerColumn: 13,
          pageClass: 'legal-page', 
          size: 'Legal'
        }
      case 'A4':
      default:
        return {
          questionsPerColumn: 8,
          pageClass: 'a4-page',
          size: 'A4'
        }
    }
  }

  const pageConfig = getPageConfig(examSettings.page_size)

  // Function to split questions into pages with two columns based on page size
  const splitQuestionsIntoPages = (questions: Question[]) => {
    const questionsPerPage = pageConfig.questionsPerColumn * 2
    const pages = []
    
    for (let i = 0; i < questions.length; i += questionsPerPage) {
      const pageQuestions = questions.slice(i, i + questionsPerPage)
      const leftColumn = pageQuestions.slice(0, pageConfig.questionsPerColumn)
      const rightColumn = pageQuestions.slice(pageConfig.questionsPerColumn)
      
      pages.push({
        leftColumn,
        rightColumn
      })
    }
    
    return pages
  }

  const questionPages = splitQuestionsIntoPages(filteredQuestions)

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
          @import url('https://fonts.googleapis.com/css2?family=Kalpurush:wght@400;600;700&display=swap');
          @import url('https://fonts.googleapis.com/css2?family=SolaimanLipi:wght@400;600;700&display=swap');
          
          .bengali-text {
            font-family: ${fontConfig.fontFamily};
            font-size: ${fontConfig.fontSize};
            line-height: 1.6;
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
            
            .page-break-before {
              page-break-before: always;
            }
            
            @page {
              margin-top: ${marginConfig.top};
              margin-bottom: ${marginConfig.bottom};
              margin-left: ${marginConfig.left};
              margin-right: ${marginConfig.right};
              size: ${pageConfig.size};
            }
            
            .a4-page {
              min-height: 297mm;
              width: 210mm;
            }
            
            .letter-page {
              min-height: 11in;
              width: 8.5in;
            }
            
            .legal-page {
              min-height: 14in;
              width: 8.5in;
            }
          }
        `}</style>

        {filteredQuestions.length === 0 ? (
          <div className="p-8 max-w-4xl mx-auto">
            <div className="text-center py-8 text-gray-500">
              কোন প্রশ্ন পাওয়া যায়নি
            </div>
          </div>
        ) : (
          questionPages.map((page, pageIndex) => (
            <div key={pageIndex} className={`p-8 mx-auto ${pageConfig.pageClass} ${pageIndex > 0 ? 'page-break-before' : ''}`} style={{
              maxWidth: pageConfig.size === 'A4' ? '210mm' : 
                       pageConfig.size === 'Letter' ? '8.5in' : 
                       pageConfig.size === 'Legal' ? '8.5in' : '210mm',
              minHeight: pageConfig.size === 'A4' ? '297mm' : 
                        pageConfig.size === 'Letter' ? '11in' : 
                        pageConfig.size === 'Legal' ? '14in' : '297mm',
              backgroundColor: 'white',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              margin: '20px auto',
              border: '1px solid #e5e7eb'
            }}>
              {/* Header - only on first page */}
              {pageIndex === 0 && (
                <div className="text-center mb-8 bengali-text">
                  <div className="border-2 border-black p-4 mb-4">
                    <h1 className="text-2xl font-bold mb-2">
                      {examSettings.school_name}
                    </h1>
                    {examSettings.school_address && (
                      <p className="text-sm mb-2">
                        {examSettings.school_address}
                      </p>
                    )}
                    <h2 className="text-xl font-semibold mb-2">
                      {examSettings.exam_type} - {selectedSubject && selectedSubject !== 'all' ? selectedSubject : 'সকল বিষয়'}
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
              )}

              {/* Instructions - only on first page */}
              {pageIndex === 0 && (
                <div className="mb-6 bengali-text text-sm">
                  <p className="mb-2">
                    <strong>নির্দেশনা:</strong> {examSettings.instructions}
                  </p>
                </div>
              )}

              {/* Questions in two columns */}
              <div className="grid grid-cols-2 gap-8 bengali-text">
                {/* Left Column */}
                <div className="space-y-6">
                  {page.leftColumn.map((question) => (
                    <div key={question.id} className="mb-6">
                      <div className="font-semibold mb-3 text-base leading-relaxed">
                        {getBanglaNumber(question.question_no)}। {question.question_text}
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm ml-6">
                        <div className="flex items-start">
                          <span className="font-medium mr-2 min-w-[20px]">ক)</span>
                          <span>{question.option_a}</span>
                        </div>
                        <div className="flex items-start">
                          <span className="font-medium mr-2 min-w-[20px]">খ)</span>
                          <span>{question.option_b}</span>
                        </div>
                        <div className="flex items-start">
                          <span className="font-medium mr-2 min-w-[20px]">গ)</span>
                          <span>{question.option_c}</span>
                        </div>
                        <div className="flex items-start">
                          <span className="font-medium mr-2 min-w-[20px]">ঘ)</span>
                          <span>{question.option_d}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {page.rightColumn.map((question) => (
                    <div key={question.id} className="mb-6">
                      <div className="font-semibold mb-3 text-base leading-relaxed">
                        {getBanglaNumber(question.question_no)}। {question.question_text}
                      </div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm ml-6">
                        <div className="flex items-start">
                          <span className="font-medium mr-2 min-w-[20px]">ক)</span>
                          <span>{question.option_a}</span>
                        </div>
                        <div className="flex items-start">
                          <span className="font-medium mr-2 min-w-[20px]">খ)</span>
                          <span>{question.option_b}</span>
                        </div>
                        <div className="flex items-start">
                          <span className="font-medium mr-2 min-w-[20px]">গ)</span>
                          <span>{question.option_c}</span>
                        </div>
                        <div className="flex items-start">
                          <span className="font-medium mr-2 min-w-[20px]">ঘ)</span>
                          <span>{question.option_d}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}

        {/* Answer Key (for print only) - appears after all question pages */}
        {filteredQuestions.length > 0 && (
          <div className="p-8 max-w-4xl mx-auto page-break-before print-only hidden">
            <div className="mt-12">
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
          </div>
        )}

      </div>
    </div>
  )
}