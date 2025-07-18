/*
  # Add exam_type column to exam_settings table

  1. Schema Changes
    - Add `exam_type` column to `exam_settings` table
    - Set default value to 'বার্ষিক পরীক্ষা' (Annual Examination in Bengali)
    - Column is required (NOT NULL) with default value for existing records

  2. Notes
    - This resolves the database error where the application expects an exam_type column
    - Default value is set to handle existing records without breaking them
*/

ALTER TABLE exam_settings ADD COLUMN exam_type text NOT NULL DEFAULT 'বার্ষিক পরীক্ষা';