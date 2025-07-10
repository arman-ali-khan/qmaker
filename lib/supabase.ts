import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

export type Database = {
  public: {
    Tables: {
      exam_settings: {
        Row: {
          id: string
          user_id: string
          school_name: string
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
          exam_type: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          school_name?: string
          exam_time?: string
          total_marks?: string
          instructions?: string
          page_size?: string
          margin_top?: string
          margin_bottom?: string
          margin_left?: string
          margin_right?: string
          font_family?: string
          font_size?: string
          exam_type?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          school_name?: string
          exam_time?: string
          total_marks?: string
          instructions?: string
          page_size?: string
          margin_top?: string
          margin_bottom?: string
          margin_left?: string
          margin_right?: string
          font_family?: string
          font_size?: string
          exam_type?: string
          created_at?: string
          updated_at?: string
        }
      }
      questions: {
        Row: {
          id: string
          user_id: string
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
        Insert: {
          id?: string
          user_id: string
          subject: string
          question_no: number
          question_text: string
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          correct_answer: string
          question_set?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          subject?: string
          question_no?: number
          question_text?: string
          option_a?: string
          option_b?: string
          option_c?: string
          option_d?: string
          correct_answer?: string
          question_set?: string | null
          created_at?: string
        }
      }
    }
  }
}