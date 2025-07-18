'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Save } from 'lucide-react';

const examSettingsSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  school_name: z.string().min(1, 'School name is required'),
  school_address: z.string().optional(),
  exam_type: z.string().min(1, 'Exam type is required'),
  exam_time: z.string().min(1, 'Exam time is required'),
  total_marks: z.string().min(1, 'Total marks is required'),
  instructions: z.string().optional(),
  page_size: z.enum(['A4', 'Letter', 'Legal']),
  margin_top: z.number().min(0, 'Top margin must be positive'),
  margin_bottom: z.number().min(0, 'Bottom margin must be positive'),
  margin_left: z.number().min(0, 'Left margin must be positive'),
  margin_right: z.number().min(0, 'Right margin must be positive'),
});

type ExamSettingsFormData = z.infer<typeof examSettingsSchema>;

interface ExamSettingsFormProps {
  onSettingsUpdated: () => void;
}

export default function ExamSettingsForm({ onSettingsUpdated }: ExamSettingsFormProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [questionPaperId, setQuestionPaperId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<ExamSettingsFormData>({
    resolver: zodResolver(examSettingsSchema),
    defaultValues: {
      title: 'Default Question Paper',
      school_name: 'বাংলাদেশ শিক্ষা বোর্ড',
      school_address: '',
      exam_type: 'বার্ষিক পরীক্ষা',
      exam_time: '২ ঘণ্টা ৩০ মিনিট',
      total_marks: '১০০',
      instructions: 'প্রতিটি প্রশ্নের চারটি উত্তর দেওয়া আছে। সঠিক উত্তরটি বেছে নিয়ে উত্তরপত্রে প্রয়োজনীয় স্থানে সম্পূর্ণ বৃত্তটি কালো কর।',
      page_size: 'A4',
      margin_top: 25,
      margin_bottom: 25,
      margin_left: 25,
      margin_right: 25,
    },
  });

  useEffect(() => {
    loadQuestionPaper();
  }, []);

  const loadQuestionPaper = async () => {
    setIsLoading(true);
    try {
      const user = await getCurrentUser();
      if (!user) return;

      // Get the first question paper for this user, or create a default one
      const { data, error } = await supabase
        .from('question_papers')
        .select('*')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error loading question paper:', error);
      } else if (data) {
        setQuestionPaperId(data.id);
        reset({
          title: data.title || 'Default Question Paper',
          school_name: data.header_info?.school_name || 'বাংলাদেশ শিক্ষা বোর্ড',
          school_address: data.header_info?.school_address || '',
          exam_type: data.header_info?.exam_type || 'বার্ষিক পরীক্ষা',
          exam_time: data.header_info?.exam_time || '২ ঘণ্টা ৩০ মিনিট',
          total_marks: data.header_info?.total_marks || '১০০',
          instructions: data.header_info?.instructions || 'প্রতিটি প্রশ্নের চারটি উত্তর দেওয়া আছে। সঠিক উত্তরটি বেছে নিয়ে উত্তরপত্রে প্রয়োজনীয় স্থানে সম্পূর্ণ বৃত্তটি কালো কর।',
          page_size: (data.page_size as 'A4' | 'Letter' | 'Legal') || 'A4',
          margin_top: data.margins?.top || 25,
          margin_bottom: data.margins?.bottom || 25,
          margin_left: data.margins?.left || 25,
          margin_right: data.margins?.right || 25,
        });
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: ExamSettingsFormData) => {
    setIsSaving(true);
    try {
      const user = await getCurrentUser();
      if (!user) {
        toast.error('Please sign in to save settings');
        return;
      }

      const paperData = {
        user_id: user.id,
        title: data.title,
        page_size: data.page_size,
        margins: {
          top: data.margin_top,
          bottom: data.margin_bottom,
          left: data.margin_left,
          right: data.margin_right,
        },
        header_info: {
          school_name: data.school_name,
          school_address: data.school_address,
          exam_type: data.exam_type,
          exam_time: data.exam_time,
          total_marks: data.total_marks,
          instructions: data.instructions,
        },
      };

      let error;
      if (questionPaperId) {
        // Update existing question paper
        const result = await supabase
          .from('question_papers')
          .update(paperData)
          .eq('id', questionPaperId);
        error = result.error;
      } else {
        // Create new question paper
        const result = await supabase
          .from('question_papers')
          .insert(paperData)
          .select('id')
          .single();
        error = result.error;
        if (!error && result.data) {
          setQuestionPaperId(result.data.id);
        }
      }

      if (error) {
        console.error('Error saving question paper:', error);
        toast.error('Failed to save settings');
      } else {
        toast.success('Settings saved successfully!');
        onSettingsUpdated();
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading settings...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-semibold">পরীক্ষার সেটিংস</CardTitle>
        <CardDescription>
          পরীক্ষার কাগজের জন্য প্রয়োজনীয় তথ্য এবং ফরম্যাটিং সেটিংস কনফিগার করুন
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Paper Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">কাগজের তথ্য</h3>
            <div className="space-y-2">
              <Label htmlFor="title">কাগজের শিরোনাম</Label>
              <Input
                id="title"
                placeholder="প্রশ্নপত্রের শিরোনাম লিখুন"
                {...register('title')}
              />
              {errors.title && (
                <p className="text-sm text-red-500">{errors.title.message}</p>
              )}
            </div>
          </div>

          {/* School Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">প্রতিষ্ঠানের তথ্য</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="school_name">প্রতিষ্ঠানের নাম</Label>
                <Input
                  id="school_name"
                  placeholder="প্রতিষ্ঠানের নাম লিখুন"
                  {...register('school_name')}
                />
                {errors.school_name && (
                  <p className="text-sm text-red-500">{errors.school_name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="exam_type">পরীক্ষার ধরন</Label>
                <Select onValueChange={(value) => setValue('exam_type', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="পরীক্ষার ধরন নির্বাচন করুন" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="বার্ষিক পরীক্ষা">বার্ষিক পরীক্ষা</SelectItem>
                    <SelectItem value="অর্ধবার্ষিক পরীক্ষা">অর্ধবার্ষিক পরীক্ষা</SelectItem>
                    <SelectItem value="ত্রৈমাসিক পরীক্ষা">ত্রৈমাসিক পরীক্ষা</SelectItem>
                    <SelectItem value="মডেল টেস্ট">মডেল টেস্ট</SelectItem>
                    <SelectItem value="সাপ্তাহিক পরীক্ষা">সাপ্তাহিক পরীক্ষা</SelectItem>
                    <SelectItem value="চূড়ান্ত পরীক্ষা">চূড়ান্ত পরীক্ষা</SelectItem>
                  </SelectContent>
                </Select>
                {errors.exam_type && (
                  <p className="text-sm text-red-500">{errors.exam_type.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="school_address">প্রতিষ্ঠানের ঠিকানা (ঐচ্ছিক)</Label>
              <Textarea
                id="school_address"
                placeholder="প্রতিষ্ঠানের সম্পূর্ণ ঠিকানা লিখুন"
                rows={2}
                {...register('school_address')}
              />
            </div>
          </div>

          {/* Exam Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">পরীক্ষার বিবরণ</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="exam_time">পরীক্ষার সময়</Label>
                <Input
                  id="exam_time"
                  placeholder="২ ঘণ্টা ৩০ মিনিট"
                  {...register('exam_time')}
                />
                {errors.exam_time && (
                  <p className="text-sm text-red-500">{errors.exam_time.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="total_marks">পূর্ণমান</Label>
                <Input
                  id="total_marks"
                  placeholder="১০০"
                  {...register('total_marks')}
                />
                {errors.total_marks && (
                  <p className="text-sm text-red-500">{errors.total_marks.message}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="instructions">নির্দেশনা</Label>
              <Textarea
                id="instructions"
                placeholder="পরীক্ষার নির্দেশনা লিখুন..."
                rows={3}
                {...register('instructions')}
              />
            </div>
          </div>

          {/* Page Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">পৃষ্ঠার সেটিংস</h3>
            <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="page_size">পৃষ্ঠার আকার</Label>
                <Select onValueChange={(value) => setValue('page_size', value as 'A4' | 'Letter' | 'Legal')}>
                  <SelectTrigger>
                    <SelectValue placeholder="পৃষ্ঠার আকার নির্বাচন করুন" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A4">A4 (210 × 297 mm)</SelectItem>
                    <SelectItem value="Letter">Letter (8.5 × 11 in)</SelectItem>
                    <SelectItem value="Legal">Legal (8.5 × 14 in)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Margins */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">পৃষ্ঠার মার্জিন (mm)</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="margin_top">উপরের মার্জিন</Label>
                <Input
                  id="margin_top"
                  type="number"
                  placeholder="25"
                  {...register('margin_top', { valueAsNumber: true })}
                />
                {errors.margin_top && (
                  <p className="text-sm text-red-500">{errors.margin_top.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="margin_bottom">নিচের মার্জিন</Label>
                <Input
                  id="margin_bottom"
                  type="number"
                  placeholder="25"
                  {...register('margin_bottom', { valueAsNumber: true })}
                />
                {errors.margin_bottom && (
                  <p className="text-sm text-red-500">{errors.margin_bottom.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="margin_left">বামের মার্জিন</Label>
                <Input
                  id="margin_left"
                  type="number"
                  placeholder="25"
                  {...register('margin_left', { valueAsNumber: true })}
                />
                {errors.margin_left && (
                  <p className="text-sm text-red-500">{errors.margin_left.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="margin_right">ডানের মার্জিন</Label>
                <Input
                  id="margin_right"
                  type="number"
                  placeholder="25"
                  {...register('margin_right', { valueAsNumber: true })}
                />
                {errors.margin_right && (
                  <p className="text-sm text-red-500">{errors.margin_right.message}</p>
                )}
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isSaving}>
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                সেভ করা হচ্ছে...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                সেটিংস সেভ করুন
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}