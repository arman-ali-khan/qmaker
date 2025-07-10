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

  // Get font configuration
  const getFontConfig = (fontFamily: string, fontSize: string) => {
    const fontFamilyMap = {
      'noto-serif': "'Noto Serif Bengali', serif",
      'kalpurush': "'Kalpurush', sans-serif",
      'solaiman': "'SolaimanLipi', serif",
      'arial': "Arial, sans-serif",
      'times-new-roman': "'Times New Roman', serif",
      'calibri': "Calibri, sans-serif",
      'georgia': "Georgia, serif"
    }
    
    return {
      fontFamily: fontFamilyMap[fontFamily as keyof typeof fontFamilyMap] || fontFamilyMap['noto-serif'],
      fontSize: fontSize || '14px'
    }
  }

  // Get page size configuration
  const getPageConfig = (pageSize: string) => {
    switch (pageSize) {
      case 'Letter':
        return {
          questionsPerColumn: 15,
          pageClass: 'letter-page',
          size: 'Letter'
        }
      case 'Legal':
        return {
          questionsPerColumn: 18,
          pageClass: 'legal-page', 
          size: 'Legal'
        }
      case 'A4':
      default:
        return {
          questionsPerColumn: 12,
          pageClass: 'a4-page',
          size: 'A4'
        }
    }
  }

  const fontConfig = getFontConfig(examSettings.font_family, examSettings.font_size)
  const pageConfig = getPageConfig(examSettings.page_size)

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `${selectedSubject || 'All'} - Questions`,
    pageStyle: `
      @page {
        size: ${pageConfig.size};
        margin: ${examSettings.margin_top} ${examSettings.margin_right} ${examSettings.margin_bottom} ${examSettings.margin_left};
      }
      
      @media print {
        body {
          margin: 0 !important;
          padding: 0 !important;
          -webkit-print-color-adjust: exact;
        }
        
        .print-page {
          width: 100% !important;
          height: auto !important;
          min-height: auto !important;
          padding: 0 !important;
          margin: 0 !important;
          box-shadow: none !important;
          border: none !important;
          background: white !important;
        }
      }
    `,
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
      <Card className="no-print">
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

      <div ref={printRef}>
        <style jsx global>{`
          @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+Bengali:wght@400;600;700&display=swap');
          @import url('https://fonts.googleapis.com/css2?family=Kalpurush:wght@400;600;700&display=swap');
          @import url('https://fonts.googleapis.com/css2?family=SolaimanLipi:wght@400;600;700&display=swap');
          
          .bengali-text {
            font-family: ${fontConfig.fontFamily};
            font-size: ${fontConfig.fontSize};
            line-height: 1.5;
          }
          
          @media print {
            .no-print {
              display: none !important;
            }
            
            .print-only {
              display: block !important;
            }
            
            body {
              margin: 0 !important;
              padding: 0 !important;
              -webkit-print-color-adjust: exact;
              font-size: 12px !important;
              line-height: 1.3 !important;
            }
            
            .page-break {
              page-break-after: always;
            }
            
            .page-break-before {
              page-break-before: always;
            }
            
            .avoid-break {
              page-break-inside: avoid;
              break-inside: avoid;
            }
            
            @page {
              size: ${pageConfig.size} !important;
              margin: ${examSettings.margin_top} ${examSettings.margin_right} ${examSettings.margin_bottom} ${examSettings.margin_left} !important;
            }
            
            .print-page {
              width: 100% !important;
              height: auto !important;
              min-height: auto !important;
              padding: 0 !important;
              margin: 0 !important;
              box-shadow: none !important;
              border: none !important;
              background: white !important;
            }
            
            .bengali-text {
              font-size: 11px !important;
              line-height: 1.3 !important;
            }
            
            .question-header {
              font-size: 12px !important;
              margin-bottom: 4px !important;
              line-height: 1.4 !important;
            }
            
            .question-options {
              font-size: 10px !important;
              line-height: 1.2 !important;
              margin-left: 12px !important;
            }
            
            .question-item {
              margin-bottom: 8px !important;
            }
            
            .exam-header {
              font-size: 14px !important;
              margin-bottom: 12px !important;
            }
            
            .exam-title {
              font-size: 16px !important;
              margin-bottom: 6px !important;
            }
            
            .exam-subtitle {
              font-size: 14px !important;
              margin-bottom: 6px !important;
            }
            
            .exam-instructions {
              font-size: 10px !important;
              margin-bottom: 8px !important;
            }
            
            .question-columns {
              gap: 16px !important;
            }
          }
          
          @media screen {
            .print-page {
              min-height: ${pageConfig.size === 'A4' ? '297mm' : 
                           pageConfig.size === 'Letter' ? '11in' : 
                           pageConfig.size === 'Legal' ? '14in' : '297mm'};
              width: ${pageConfig.size === 'A4' ? '210mm' : 
                      pageConfig.size === 'Letter' ? '8.5in' : 
                      pageConfig.size === 'Legal' ? '8.5in' : '210mm'};
              background: white;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
              margin: 20px auto;
              border: 1px solid #e5e7eb;
              padding: 40px;
              box-sizing: border-box;
            }
          }
        `}</style>

        {filteredQuestions.length === 0 ? (
          <div className="print-page">
            <div className="text-center py-8 text-gray-500">
              কোন প্রশ্ন পাওয়া যায়নি
            </div>
          </div>
        ) : (
          questionPages.map((page, pageIndex) => (
            <div key={pageIndex} className={`print-page ${pageIndex > 0 ? 'page-break-before' : ''}`}>
              {/* Header - only on first page */}
              {pageIndex === 0 && (
                <div className="text-center mb-4 bengali-text avoid-break exam-header">
                  <div className="border-2 border-black p-4 mb-4">
                    <h1 className="text-xl font-bold mb-2 exam-title">
                      {examSettings.school_name}
                    </h1>
                    {examSettings.school_address && (
                      <p className="text-sm mb-2">
                        {examSettings.school_address}
                      </p>
                    )}
                    <h2 className="text-lg font-semibold mb-2 exam-subtitle">
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
                <div className="mb-3 bengali-text text-sm avoid-break exam-instructions">
                  <p className="mb-4">
                    <strong>নির্দেশনা:</strong> {examSettings.instructions}
                  </p>
                </div>
              )}

              {/* Questions in two columns */}
              <div className="grid grid-cols-2 gap-4 bengali-text question-columns">
                {/* Left Column */}
                <div className="space-y-2">
                  {page.leftColumn.map((question) => (
                    <div key={question.id} className="avoid-break question-item">
                      <div className="font-semibold mb-1 text-base leading-tight question-header">
                        {getBanglaNumber(question.question_no)}। {question.question_text}
                      </div>
                      <div className="grid grid-cols-2 gap-x-1 gap-y-0 text-sm question-options">
                        <div className="flex items-start">
                          <span className="font-medium mr-1 min-w-[14px]">ক)</span>
                          <span className="leading-tight">{question.option_a}</span>
                        </div>
                        <div className="flex items-start">
                          <span className="font-medium mr-1 min-w-[14px]">খ)</span>
                          <span className="leading-tight">{question.option_b}</span>
                        </div>
                        <div className="flex items-start">
                          <span className="font-medium mr-1 min-w-[14px]">গ)</span>
                          <span className="leading-tight">{question.option_c}</span>
                        </div>
                        <div className="flex items-start">
                          <span className="font-medium mr-1 min-w-[14px]">ঘ)</span>
                          <span className="leading-tight">{question.option_d}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Right Column */}
                <div className="space-y-2">
                  {page.rightColumn.map((question) => (
                    <div key={question.id} className="avoid-break question-item">
                      <div className="font-semibold mb-1 text-base leading-tight question-header">
                        {getBanglaNumber(question.question_no)}। {question.question_text}
                      </div>
                      <div className="grid grid-cols-2 gap-x-1 gap-y-0 text-sm question-options">
                        <div className="flex items-start">
                          <span className="font-medium mr-1 min-w-[14px]">ক)</span>
                          <span className="leading-tight">{question.option_a}</span>
                        </div>
                        <div className="flex items-start">
                          <span className="font-medium mr-1 min-w-[14px]">খ)</span>
                          <span className="leading-tight">{question.option_b}</span>
                        </div>
                        <div className="flex items-start">
                          <span className="font-medium mr-1 min-w-[14px]">গ)</span>
                          <span className="leading-tight">{question.option_c}</span>
                        </div>
                        <div className="flex items-start">
                          <span className="font-medium mr-1 min-w-[14px]">ঘ)</span>
                          <span className="leading-tight">{question.option_d}</span>
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
          <div className="print-page page-break-before print-only hidden">
            <div className="mt-8">
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