export type UserRole = 'staff' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  password?: string;
  full_name: string;
  role: UserRole;
  title?: string;
  department?: string;
  active_session_token?: string;
  known_device_ids?: string[];
  created_at: string;
  updated_at?: string;
}

export type ScholarshipCategory = 'Academic' | 'Financial' | 'Athletic' | 'Alumni' | 'Industry' | 'Leadership';

export interface Scholarship {
  id: string;
  title: string;
  code: string;
  description: string;
  category: ScholarshipCategory;
  slots: number;
  slots_remaining: number;
  grant_amount: number; // in PHP ₱
  grant_type: string; // e.g. "100% Tuition Waiver + ₱15,000 Allowance"
  min_gwa: number; // Mapúa grading scale (1.00 is top, 1.75 etc.)
  max_family_income: number; // in PHP ₱
  deadline: string;
  requirements: string[];
  is_active: boolean;
  is_frozen: boolean;
  freeze_note?: string;
  created_at: string;
}

export interface HouseholdMember {
  id: string;
  name: string;
  relation: string;
  occupation: string;
  monthly_income: number;
}

export interface ApplicationDocument {
  id: string;
  type: 'com' | 'itr' | 'id' | 'other';
  name: string;
  url: string;
  size: string;
  uploaded_at: string;
  file_type?: string;
  data_url?: string;
}

export type ApplicationStatus = 'Pending' | 'In Review' | 'Shortlisted' | 'Approved' | 'Rejected';

export interface Application {
  id: string;
  reference_code: string; // e.g., AMOSA-982F1A03
  scholarship_id: string;
  scholarship_title: string;
  student_number: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  program: string;
  year_level: string;
  gwa: number;
  monthly_family_income: number;
  household_members: HouseholdMember[];
  documents: ApplicationDocument[];
  status: ApplicationStatus;
  awarded_amount: number; // in PHP ₱
  remarks: string; // Visible to student
  staff_notes?: string; // Internal staff notes
  created_at: string;
  updated_at: string;
}

export interface FreezePeriod {
  id: string;
  scholarship_id: string; // 'all' or specific scholarship ID
  scholarship_title?: string;
  start_date: string;
  end_date: string;
  announcement_note: string;
  created_by: string;
  created_at: string;
  is_active: boolean;
}

export interface InterviewSchedule {
  id: string;
  application_id: string;
  student_name: string;
  scholarship_title: string;
  date_time: string;
  location: string;
  interviewer: string;
  status: 'Scheduled' | 'Completed' | 'Cancelled';
}
