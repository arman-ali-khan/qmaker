import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL environment variable')
}

if (!supabaseKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          role: 'school_owner' | 'teacher'
          school_id: string | null
          full_name: string
          subject: string | null
          qualification: string | null
          experience: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          role: 'school_owner' | 'teacher'
          school_id?: string | null
          full_name: string
          subject?: string | null
          qualification?: string | null
          experience?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: 'school_owner' | 'teacher'
          school_id?: string | null
          full_name?: string
          subject?: string | null
          qualification?: string | null
          experience?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      question_papers: {
        Row: {
          id: string
          user_id: string
          title: string
          page_size: string
          margins: any
          header_info: any
          language_direction: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          page_size?: string
          margins?: any
          header_info?: any
          language_direction?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          page_size?: string
          margins?: any
          header_info?: any
          language_direction?: string
          created_at?: string
          updated_at?: string
        }
      }
      questions: {
        Row: {
          id: string
          paper_id: string
          type: string
          question_text: string
          options: string[] | null
          correct_answer: string | null
          marks: number
          order_index: number
          column_layout: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          paper_id: string
          type: string
          question_text: string
          options?: string[] | null
          correct_answer?: string | null
          marks?: number
          order_index?: number
          column_layout?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          paper_id?: string
          type?: string
          question_text?: string
          options?: string[] | null
          correct_answer?: string
          marks?: number
          order_index?: number
          column_layout?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}