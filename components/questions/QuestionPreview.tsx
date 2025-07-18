'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { getCurrentUser, User } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Printer, Download } from 'lucide-react'
import { useReactToPrint } from 'react-to-print'

const defaultSubjects = [
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

interface Question {
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
    page_size: string
    margins: any
  }
}

interface QuestionPreviewProps {
  user: User | null
}

export default function QuestionPreview({ user }: QuestionPreviewProps) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([])
  const [selectedSubject, setSelectedSubject] = useState<string>('')
  const [selectedSet, setSelectedSet] = useState<string>('')
  const [subjects, setSubjects] = useState<string[]>([])
  const [questionSets, setQuestionSets] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const printRef = useRef<HTMLDivElement>(null)

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `${selectedSubject || 'All'} - Questions`,
    pageStyle: `
      @page {
        size: A4;
        margin: 1in;
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
  }, [])

  useEffect(() => {
    filterQuestions()
  }, [questions, selectedSubject, selectedSet])

  const fetchQuestions = async () => {
    setIsLoading(true)
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
            page_size,
            margins,
            user_id
          )
        `)
        .eq('question_papers.user_id', user.id)
        .order('order_index', { ascending: true })

      if (error) {
        console.error('Error fetching questions:', error)
      } else {
        setQuestions(data || [])
        
        // Extract unique subjects and sets
        const uniqueSubjects = [...new Set((data || [])
          .map(q => q.question_papers?.header_info?.subject)
          .filter(Boolean)
          .filter(subject => subject && subject.trim() !== '')
        )]
        const uniqueSets = [...new Set((data || [])
          .map(q => q.question_papers?.title)
          .filter(Boolean)
          .filter(title => title && title.trim() !== '')
        )]
        
        console.log('Unique subjects found:', uniqueSubjects)
        console.log('Unique sets found:', uniqueSets)
        
        // Use found subjects or fall back to default subjects if none found
        setSubjects(uniqueSubjects.length > 0 ? uniqueSubjects : defaultSubjects)
        setQuestionSets(uniqueSets)
      }
    } catch (error) {
      console.error('Error:', error)
      // Set default subjects on error
      setSubjects(defaultSubjects)
    } finally {
      setIsLoading(false)
    }
  }

  const filterQuestions = () => {
    let filtered = questions

    if (selectedSubject && selectedSubject !== 'all') {
      filtered = filtered.filter(q => q.question_papers?.header_info?.subject === selectedSubject)
    }

    if (selectedSet && selectedSet !== 'all') {
      filtered = filtered.filter(q => q.question_papers?.title === selectedSet)
    }

    setFilteredQuestions(filtered)
  }

  const getBanglaNumber = (num: number) => {
    const banglaNumbers = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯']
    return num.toString().split('').map(digit => banglaNumbers[parseInt(digit)]).join('')
  }

  // Function to split questions into pages with two columns
  const splitQuestionsIntoPages = (questions: Question[]) => {
    const questionsPerColumn = 9
    const questionsPerPage = questionsPerColumn * 2
    const pages = []
    
    for (let i = 0; i < questions.length; i += questionsPerPage) {
      const pageQuestions = questions.slice(i, i + questionsPerPage)
      const leftColumn = pageQuestions.slice(0, questionsPerColumn)
      const rightColumn = pageQuestions.slice(questionsPerColumn)
      
      pages.push({
        leftColumn,
        rightColumn
      })
    }
    
    return pages
  }

  const questionPages = splitQuestionsIntoPages(filteredQuestions)

  if (!user) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <p className="text-gray-500">Please sign in to view questions</p>
        </CardContent>
      </Card>
    )
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
      <Card className="no-print">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">প্রশ্ন প্রিভিউ ও প্রিন্ট</CardTitle>
          <p className="text-sm text-gray-600">
            Viewing questions for: {user.full_name} ({user.role})
          </p>
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
          
          .bengali-text {
            font-family: 'Noto Serif Bengali', serif;
            font-size: 14px;
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
              font-family: 'Noto Serif Bengali', serif !important;
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
              size: A4 !important;
              margin: 1in !important;
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
              page-break-after: always;
            }
            
            .print-page:last-child {
              page-break-after: auto;
            }
            
            .bengali-text {
              font-family: 'Noto Serif Bengali', serif !important;
              font-size: 11px !important;
              line-height: 1.3 !important;
            }
            
            .question-header {
              font-size: 12px !important;
              margin-bottom: 4px !important;
              line-height: 1.3 !important;
              font-weight: 600 !important;
            }
            
            .question-options {
              font-size: 10px !important;
              line-height: 1.2 !important;
              margin-left: 8px !important;
            }
            
            .question-item {
              margin-bottom: 8px !important;
              page-break-inside: avoid;
              break-inside: avoid;
            }
            
            .exam-header {
              font-size: 14px !important;
              margin-bottom: 10px !important;
            }
            
            .exam-title {
              font-size: 16px !important;
              margin-bottom: 6px !important;
              font-weight: 700 !important;
            }
            
            .exam-subtitle {
              font-size: 14px !important;
              margin-bottom: 6px !important;
              font-weight: 600 !important;
            }
            
            .exam-instructions {
              font-size: 10px !important;
              margin-bottom: 8px !important;
            }
            
            .question-columns {
              gap: 16px !important;
              display: grid !important;
              grid-template-columns: 1fr 1fr !important;
            }
            
            .question-column {
              display: flex !important;
              flex-direction: column !important;
              gap: 8px !important;
            }
            
            .option-grid {
              display: grid !important;
              grid-template-columns: 1fr !important;
              gap: 1px !important;
            }
            
            .option-item {
              display: flex !important;
              align-items: flex-start !important;
              gap: 6px !important;
            }
            
            .option-label {
              font-weight: 600 !important;
              min-width: 18px !important;
              flex-shrink: 0 !important;
            }
            
            .option-text {
              line-height: 1.2 !important;
              word-break: break-word !important;
              flex: 1 !important;
            }
          }
          
          @media screen {
            .print-page {
              min-height: 297mm;
              width: 210mm;
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
                      বাংলাদেশ শিক্ষা বোর্ড
                    </h1>
                    <h2 className="text-lg font-semibold mb-2 exam-subtitle">
                      বার্ষিক পরীক্ষা - {selectedSubject && selectedSubject !== 'all' ? selectedSubject : 'সকল বিষয়'}
                    </h2>
                    <div className="flex justify-between items-center text-sm">
                      <span>সময়: ২ ঘণ্টা ৩০ মিনিট</span>
                      <span>পূর্ণমান: ১০০</span>
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
                  <p className="mb-3">
                    <strong>নির্দেশনা:</strong> প্রতিটি প্রশ্নের চারটি উত্তর দেওয়া আছে। সঠিক উত্তরটি বেছে নিয়ে উত্তরপত্রে প্রয়োজনীয় স্থানে সম্পূর্ণ বৃত্তটি কালো কর।
                  </p>
                </div>
              )}

              {/* Questions in two columns */}
              <div className="bengali-text question-columns">
                {/* Left Column */}
                <div className="question-column">
                  {page.leftColumn.map((question) => (
                    <div key={question.id} className="avoid-break question-item">
                      <div className="font-semibold mb-2 text-base leading-tight question-header">
                        {getBanglaNumber(question.order_index)}। {question.question_text}
                      </div>
                      <div className="text-sm question-options">
                        <div className="option-grid">
                        <div className="option-item">
                          <span className="option-label">ক)</span>
                          <span className="option-text">{question.options?.[0] || ''}</span>
                        </div>
                        <div className="option-item">
                          <span className="option-label">খ)</span>
                          <span className="option-text">{question.options?.[1] || ''}</span>
                        </div>
                        <div className="option-item">
                          <span className="option-label">গ)</span>
                          <span className="option-text">{question.options?.[2] || ''}</span>
                        </div>
                        <div className="option-item">
                          <span className="option-label">ঘ)</span>
                          <span className="option-text">{question.options?.[3] || ''}</span>
                        </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Right Column */}
                <div className="question-column">
                  {page.rightColumn.map((question) => (
                    <div key={question.id} className="avoid-break question-item">
                      <div className="font-semibold mb-2 text-base leading-tight question-header">
                        {getBanglaNumber(question.order_index)}। {question.question_text}
                      </div>
                      <div className="text-sm question-options">
                        <div className="option-grid">
                        <div className="option-item">
                          <span className="option-label">ক)</span>
                          <span className="option-text">{question.options?.[0] || ''}</span>
                        </div>
                        <div className="option-item">
                          <span className="option-label">খ)</span>
                          <span className="option-text">{question.options?.[1] || ''}</span>
                        </div>
                        <div className="option-item">
                          <span className="option-label">গ)</span>
                          <span className="option-text">{question.options?.[2] || ''}</span>
                        </div>
                        <div className="option-item">
                          <span className="option-label">ঘ)</span>
                          <span className="option-text">{question.options?.[3] || ''}</span>
                        </div>
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
                    {getBanglaNumber(question.order_index)}. {question.correct_answer === 'A' ? 'ক' : 
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