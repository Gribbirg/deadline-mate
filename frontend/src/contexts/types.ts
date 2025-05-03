import { User } from './AuthContext';
import { Group } from './GroupContext';

// Типы для профилей пользователей
export interface TeacherProfile {
  id: number;
  user: User;
  position?: string;
  department?: string;
  academic_degree?: string;
  bio?: string;
  avatar?: string;
}

export interface StudentProfile {
  id: number;
  user: User;
  major?: string;
  year_of_study?: number;
  bio?: string;
  avatar?: string;
}

// Типы для заданий
export interface Assignment {
  id: number;
  title: string;
  description: string;
  created_by: TeacherProfile;
  created_at: string;
  updated_at: string;
  status: 'draft' | 'published' | 'archived';
  deadline: string;
  max_points: number;
  allow_late_submissions: boolean;
  late_penalty_percentage: number;
  attachments: AssignmentAttachment[];
  is_deadline_expired: boolean;
  time_remaining: string | null;
  submission_count: number;
}

export interface AssignmentMin {
  id: number;
  title: string;
  status: 'draft' | 'published' | 'archived';
  deadline: string;
  is_deadline_expired: boolean;
  time_remaining: string | null;
}

export interface AssignmentAttachment {
  id: number;
  file: string;
  filename: string;
  uploaded_at: string;
}

export interface AssignmentGroup {
  id: number;
  assignment: AssignmentMin;
  group: Group;
  assigned_at: string;
  custom_deadline: string | null;
  effective_deadline: string;
}

export interface Submission {
  id: number;
  assignment: AssignmentMin;
  student: StudentProfile;
  submitted_at: string;
  updated_at: string;
  comment: string;
  status: 'submitted' | 'graded' | 'returned';
  points: number | null;
  is_late: boolean;
  feedback: string;
  graded_by: TeacherProfile | null;
  graded_at: string | null;
  attachments: SubmissionAttachment[];
}

export interface SubmissionAttachment {
  id: number;
  file: string;
  filename: string;
  uploaded_at: string;
}

// Типы для форм заданий
export interface AssignmentFormData {
  title: string;
  description: string;
  status: 'draft' | 'published' | 'archived';
  deadline: string;
  max_points: number;
  allow_late_submissions: boolean;
  late_penalty_percentage: number;
}

export interface SubmissionFormData {
  comment: string;
}

export interface AssignmentGroupFormData {
  assignment_id: number;
  group_id: number;
  custom_deadline?: string;
} 