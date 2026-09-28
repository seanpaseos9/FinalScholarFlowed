export type UserRole = 'staff' | 'admin';

export interface UserProfile {
  id: string;
  email: string;
  password?: string;
  full_name: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  role: UserRole;
  title?: string;
  department?: string;
  phone?: string;
  active_session_token?: string;
  known_device_ids?: string[];
  security_questions?: { question: string; answer: string }[];
  security_questions_setup?: boolean;
  created_at: string;
  updated_at?: string;
}

export type ScholarshipCategory = 'Academic' | 'Financial' | 'Athletic' | 'Alumni' | 'Industry' | 'Leadership' | 'Performing Arts' | 'Research' | 'Community';

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
  max_family_income: number; // in PHP ₱ (Annual Gross Family Income limit)
  deadline: string;
  requirements: string[];
  is_active: boolean;
  is_frozen: boolean;
  freeze_note?: string;
  created_at: string;
  // --- Policy Rules ---
  duration_years: number;           // How many school years the grant covers (e.g. 1, 2, 4)
  is_renewable: boolean;            // Whether scholars can renew after the term ends
  renewal_deadline?: string;        // Deadline for submitting renewal application (YYYY-MM-DD)
  max_approved_per_student?: number; // Hardcoded global rule: 1 active grant per student
}

export interface HouseholdMember {
  id: string;
  name?: string; // composite full name for backward compatibility
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  relation: string;
  occupation: string;
  monthly_income: number;
  annual_income?: number; // Declared Annual Income in PHP ₱
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
  storage_path?: string;
}

export type ApplicationStatus =
  | 'Pending'
  | 'In Review'
  | 'Shortlisted'
  | 'Approved'
  | 'Rejected'
  | 'For Renewal'   // Approved term expiring — renewal window open
  | 'Expired'       // Term ended, no renewal submitted in time
  | 'Removed';      // Scholar removed due to policy failure (GWA drop, etc.)

export interface Application {
  id: string;
  reference_code: string; // e.g., AMOSA-982F1A03
  scholarship_id: string;
  scholarship_title: string;
  student_number: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  gender?: string;
  birthdate?: string;
  email: string;
  phone: string;
  program: string;
  year_level: string;
  gwa: number;
  monthly_family_income: number;
  annual_family_income?: number;
  is_working_student?: boolean;
  student_annual_income?: number;
  household_members: HouseholdMember[];
  documents: ApplicationDocument[];
  status: ApplicationStatus;
  awarded_amount: number; // in PHP ₱
  remarks: string; // Visible to student
  staff_notes?: string; // Internal staff notes
  // --- Lifecycle Tracking ---
  approved_at?: string;    // ISO timestamp when Approved status was set
  approved_by?: string;    // Full name and role of the admin/staff coordinator who approved
  approved_by_id?: string; // ID/staff ID of the approver
  expires_at?: string;     // ISO date when the scholarship term ends (approved_at + duration_years)
  removal_reason?: string; // Reason when status is set to 'Removed'
  is_renewal?: boolean;    // true if this application is a renewal of a previous one
  renewed_from?: string;   // reference_code of the original application being renewed
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

export type StaffApplicationStatus = 'Pending' | 'Approved' | 'Rejected';

export interface StaffApplication {
  id: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
  full_name?: string;
  email?: string;
  institutional_email?: string;
  phone?: string;
  phone_number?: string;
  birthdate: string;
  staff_id?: string;
  staff_id_number?: string; // Exactly 10 digits
  department: string;
  position: string;
  status: StaffApplicationStatus;
  created_at: string;
  updated_at?: string;
  reviewed_at?: string;
  admin_remarks?: string;
  admin_notes?: string;
  assigned_username?: string; // Login email / username assigned upon approval
  assigned_password?: string; // Generated password for initial staff access
  credentials_retrieved?: boolean;
  credentials_viewed?: boolean;
}

