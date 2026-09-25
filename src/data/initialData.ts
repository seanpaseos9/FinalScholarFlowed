import { Scholarship, Application, FreezePeriod, UserProfile, InterviewSchedule } from '../types';
import { DEFAULT_STAFF_PASSWORD_HASH, DEFAULT_ADMIN_PASSWORD_HASH } from '../lib/crypto';

export const INITIAL_STAFF_USER: UserProfile = {
  id: 'usr-staff-001',
  email: 'staff@scholarflow.edu',
  password: DEFAULT_STAFF_PASSWORD_HASH, // SHA-256 hash of 'staff123'
  full_name: 'Prof. Corazon V. Santos',
  role: 'staff',
  department: 'Office of Academic Aid & Student Affairs',
  title: 'Faculty Reviewer & Scholarship Head',
  created_at: '2025-01-10T08:00:00Z',
};

export const INITIAL_ADMIN_USER: UserProfile = {
  id: 'usr-admin-001',
  email: 'admin@scholarflow.edu',
  password: DEFAULT_ADMIN_PASSWORD_HASH, // SHA-256 hash of 'admin123'
  full_name: 'Dr. Raymond B. Miller',
  role: 'admin',
  department: 'University Scholarship Board',
  title: 'System Administrator',
  created_at: '2025-01-01T08:00:00Z',
};

export const INITIAL_SCHOLARSHIPS: Scholarship[] = [
  {
    id: 'sch-001',
    code: 'SCH-EXC-2026',
    title: 'Presidential Academic Excellence Fellowship',
    description: 'Premier institutional merit fellowship awarded to high-achieving undergraduate and post-graduate students demonstrating outstanding scholarship and academic rigor.',
    category: 'Academic',
    slots: 25,
    slots_remaining: 24, // 1 applied (Julian Vance - app-001)
    grant_amount: 90000,
    grant_type: '100% Tuition & Comprehensive Fee Waiver + ₱15,000 Term Stipend',
    min_gwa: 1.50,
    max_family_income: 800000,
    deadline: '2026-09-30',
    requirements: [
      'Official Certificate of Enrollment (COE)',
      'Certified Transcript / True Copy of Grades (GWA ≤ 1.50)',
      'Institutional Certificate of Good Conduct',
      'Proof of Household Income or Tax Assessment'
    ],
    is_active: true,
    is_frozen: false,
    duration_years: 1,
    is_renewable: true,
    renewal_deadline: '2026-10-31',
    max_approved_per_student: 1,
    created_at: '2026-01-15T09:00:00Z',
  },
  {
    id: 'sch-002',
    code: 'SCH-STEM-2026',
    title: 'Future Innovators STEM & Technology Grant',
    description: 'Competitive research and technology grant designated for students pursuing computer science, software engineering, robotics, data science, and applied mathematics.',
    category: 'Industry',
    slots: 15,
    slots_remaining: 13, // 2 applied (Marcus Santos - app-003, Patricia Chen - app-004)
    grant_amount: 85000,
    grant_type: '₱85,000 Tuition Credit + Research Lab Allowance',
    min_gwa: 1.75,
    max_family_income: 950000,
    deadline: '2026-09-20',
    requirements: [
      'Certificate of Enrollment',
      'STEM Project Portfolio or GitHub link',
      'Faculty Recommendation Letter'
    ],
    is_active: true,
    is_frozen: false,
    duration_years: 1,
    is_renewable: true,
    renewal_deadline: '2026-10-15',
    max_approved_per_student: 1,
    created_at: '2026-01-20T09:00:00Z',
  },
  {
    id: 'sch-003',
    code: 'SCH-FIN-2026',
    title: 'Global Access & Need-Based Opportunity Grant',
    description: 'Need-based financial aid program dedicated to assisting dedicated students facing economic hardship to complete their academic degrees uninterrupted.',
    category: 'Financial',
    slots: 50,
    slots_remaining: 49, // 1 applied (Samantha Reyes - app-002)
    grant_amount: 50000,
    grant_type: '₱50,000 / Term Direct Academic Tuition Assistance',
    min_gwa: 2.50,
    max_family_income: 380000,
    deadline: '2026-10-05',
    requirements: [
      'Parental Income Tax Assessment or Certificate of Indigency',
      'Household Utility Billing Statements (Last 3 Months)',
      'Certificate of Enrollment',
      'Student Personal Statement'
    ],
    is_active: true,
    is_frozen: false,
    duration_years: 2,
    is_renewable: true,
    renewal_deadline: '2026-11-15',
    max_approved_per_student: 1,
    created_at: '2026-02-01T09:00:00Z',
  },
  {
    id: 'sch-004',
    code: 'SCH-LEAD-2026',
    title: 'Civic Leadership & Community Service Fellowship',
    description: 'Merit scholarship supporting proactive student leaders who drive positive community impact, sustainability initiatives, and ethical student governance.',
    category: 'Leadership',
    slots: 20,
    slots_remaining: 20, // 0 applied
    grant_amount: 65000,
    grant_type: '₱65,000 Annual Leadership Grant + Mentorship Stipend',
    min_gwa: 2.00,
    max_family_income: 550000,
    deadline: '2026-09-25',
    requirements: [
      'Leadership Portfolio & Verified Advocacy Records',
      'Certificate of Enrollment',
      'Letter of Endorsement from Student Org or NGO'
    ],
    is_active: true,
    is_frozen: false,
    duration_years: 1,
    is_renewable: false,
    renewal_deadline: undefined,
    max_approved_per_student: 1,
    created_at: '2026-02-10T09:00:00Z',
  },
  {
    id: 'sch-005',
    code: 'SCH-ATH-2026',
    title: 'Varsity Athletics & Sports Distinction Grant',
    description: 'Awarded to competitive student athletes and collegiate varsity players representing the institution in regional and national athletic championships.',
    category: 'Athletic',
    slots: 30,
    slots_remaining: 29, // 1 applied (Gabriel Mendoza - app-005)
    grant_amount: 55000,
    grant_type: '100% Tuition Grant + Athletic Gear & Training Allowance',
    min_gwa: 2.75,
    max_family_income: 1200000,
    deadline: '2026-10-15',
    requirements: [
      'Athletics Department Coach Endorsement',
      'Certificate of Enrollment',
      'Annual Sports Medical Clearance'
    ],
    is_active: true,
    is_frozen: false,
    duration_years: 4,
    is_renewable: true,
    renewal_deadline: '2026-11-01',
    max_approved_per_student: 1,
    created_at: '2026-02-15T09:00:00Z',
  },
  {
    id: 'sch-006',
    code: 'SCH-ARTS-2026',
    title: 'Creative Arts & Digital Media Fellowship',
    description: 'Sponsored creative scholarship for emerging talents in architecture, digital design, multimedia arts, and communication technology.',
    category: 'Alumni',
    slots: 12,
    slots_remaining: 12, // 0 applied
    grant_amount: 60000,
    grant_type: '₱60,000 Creative Software & Materials Grant',
    min_gwa: 2.00,
    max_family_income: 650000,
    deadline: '2026-09-22',
    requirements: [
      'Creative Design Portfolio (PDF or Web Link)',
      'Certificate of Enrollment',
      'Artist Statement of Purpose'
    ],
    is_active: true,
    is_frozen: false,
    duration_years: 1,
    is_renewable: true,
    renewal_deadline: '2026-10-20',
    max_approved_per_student: 1,
    created_at: '2026-03-01T09:00:00Z',
  },
  {
    id: 'sch-007',
    code: 'SCH-PERF-2026',
    title: 'Meridian Performing Arts & Cultural Heritage Scholarship',
    description: 'Premier scholarship awarded to exceptional students demonstrating mastery in theater, orchestral music, vocal performance, and traditional dance.',
    category: 'Performing Arts',
    slots: 15,
    slots_remaining: 15,
    grant_amount: 70000,
    grant_type: '100% Tuition Assistance + Production & Instrument Allowance',
    min_gwa: 2.25,
    max_family_income: 750000,
    deadline: '2026-10-20',
    requirements: [
      'Audition Reel / Performance Portfolio Link',
      'Certificate of Enrollment',
      'Faculty Endorsement Letter (Cultural Affairs)',
      'Certificate of Good Conduct'
    ],
    is_active: true,
    is_frozen: false,
    duration_years: 1,
    is_renewable: true,
    renewal_deadline: '2026-11-20',
    max_approved_per_student: 1,
    created_at: '2026-02-20T09:00:00Z',
  }
];

export const INITIAL_APPLICATIONS: Application[] = [
  {
    id: 'app-001',
    reference_code: 'SF-982F1A03',
    scholarship_id: 'sch-001',
    scholarship_title: 'Presidential Academic Excellence Fellowship',
    student_number: '2023104821',
    first_name: 'Julian',
    last_name: 'Vance',
    email: 'jvance@student.university.edu',
    phone: '09171234567',
    program: 'BS Computer Science',
    year_level: '3rd Year',
    gwa: 1.28,
    monthly_family_income: 45000,
    household_members: [
      { id: 'hm-1', name: 'Robert Vance', relation: 'Father', occupation: 'Electrician', monthly_income: 25000 },
      { id: 'hm-2', name: 'Maria Vance', relation: 'Mother', occupation: 'Store Owner', monthly_income: 20000 },
    ],
    documents: [
      { id: 'doc-1', type: 'com', name: 'COE_2023104821_Term1.pdf', url: '#', size: '1.2 MB', uploaded_at: '2026-08-01' },
      { id: 'doc-2', type: 'itr', name: 'Tax_Assessment_2025.pdf', url: '#', size: '2.4 MB', uploaded_at: '2026-08-01' },
      { id: 'doc-3', type: 'id', name: 'Student_ID_Vance.jpg', url: '#', size: '850 KB', uploaded_at: '2026-08-01' }
    ],
    status: 'Approved',
    approved_at: '2026-08-05',
    expires_at: '2027-08-05',
    awarded_amount: 90000,
    remarks: 'Approved by Scholarship Committee. Full tuition credit & monthly stipend credited to student account.',
    staff_notes: 'Verified GWA 1.28 against University Registrar database. All requirements compliant.',
    created_at: '2026-08-01T10:15:00Z',
    updated_at: '2026-08-05T14:30:00Z'
  },
  {
    id: 'app-002',
    reference_code: 'SF-741C90B2',
    scholarship_id: 'sch-003',
    scholarship_title: 'Global Access & Need-Based Opportunity Grant',
    student_number: '2022109841',
    first_name: 'Samantha',
    last_name: 'Reyes',
    email: 'sreyes@student.university.edu',
    phone: '09189876543',
    program: 'BS Civil Engineering',
    year_level: '4th Year',
    gwa: 1.82,
    monthly_family_income: 28000,
    household_members: [
      { id: 'hm-3', name: 'Elena Reyes', relation: 'Mother (Single Parent)', occupation: 'Tailor', monthly_income: 28000 }
    ],
    documents: [
      { id: 'doc-4', type: 'com', name: 'COE_2022109841.pdf', url: '#', size: '1.1 MB', uploaded_at: '2026-08-03' },
      { id: 'doc-5', type: 'itr', name: 'Indigency_Cert.pdf', url: '#', size: '1.8 MB', uploaded_at: '2026-08-03' },
      { id: 'doc-6', type: 'id', name: 'Student_ID_Reyes.png', url: '#', size: '920 KB', uploaded_at: '2026-08-03' }
    ],
    status: 'Shortlisted',
    awarded_amount: 50000,
    remarks: 'Application shortlisted for final interview scheduled with Scholarship Coordinator.',
    staff_notes: 'Priority candidate for economic assistance. Verified single-parent household income.',
    created_at: '2026-08-03T11:20:00Z',
    updated_at: '2026-08-08T09:10:00Z'
  },
  {
    id: 'app-003',
    reference_code: 'SF-332E44A1',
    scholarship_id: 'sch-002',
    scholarship_title: 'Future Innovators STEM & Technology Grant',
    student_number: '2024100234',
    first_name: 'Marcus',
    last_name: 'Santos',
    email: 'msantos@student.university.edu',
    phone: '09223334455',
    program: 'BS Electrical Engineering',
    year_level: '2nd Year',
    gwa: 1.45,
    monthly_family_income: 62000,
    household_members: [
      { id: 'hm-4', name: 'Arthur Santos', relation: 'Father', occupation: 'Technician', monthly_income: 32000 },
      { id: 'hm-5', name: 'Clara Santos', relation: 'Mother', occupation: 'Clerk', monthly_income: 30000 }
    ],
    documents: [
      { id: 'doc-7', type: 'com', name: 'COE_2024100234.pdf', url: '#', size: '1.3 MB', uploaded_at: '2026-08-06' },
      { id: 'doc-8', type: 'id', name: 'Student_ID_Santos.jpg', url: '#', size: '780 KB', uploaded_at: '2026-08-06' }
    ],
    status: 'In Review',
    awarded_amount: 0,
    remarks: 'Documents received and under committee technical evaluation.',
    staff_notes: 'GWA is well within criteria (1.45). Submitted portfolio reviewed positively.',
    created_at: '2026-08-06T14:45:00Z',
    updated_at: '2026-08-07T16:20:00Z'
  },
  {
    id: 'app-004',
    reference_code: 'SF-119D88B5',
    scholarship_id: 'sch-002',
    scholarship_title: 'Future Innovators STEM & Technology Grant',
    student_number: '2023101192',
    first_name: 'Patricia',
    last_name: 'Chen',
    email: 'pchen@student.university.edu',
    phone: '09195556677',
    program: 'BS Information Technology',
    year_level: '3rd Year',
    gwa: 1.35,
    monthly_family_income: 50000,
    household_members: [
      { id: 'hm-6', name: 'Victor Chen', relation: 'Father', occupation: 'Systems Analyst', monthly_income: 50000 }
    ],
    documents: [
      { id: 'doc-9', type: 'com', name: 'COE_Chen.pdf', url: '#', size: '1.0 MB', uploaded_at: '2026-08-08' },
      { id: 'doc-10', type: 'id', name: 'ID_Chen.png', url: '#', size: '600 KB', uploaded_at: '2026-08-08' }
    ],
    status: 'Pending',
    awarded_amount: 0,
    remarks: 'Application submitted successfully. Reference code SF-119D88B5 issued.',
    staff_notes: 'Application in queue for initial document clearance.',
    created_at: '2026-08-08T08:30:00Z',
    updated_at: '2026-08-08T08:30:00Z'
  },
  {
    id: 'app-005',
    reference_code: 'SF-504F33C9',
    scholarship_id: 'sch-005',
    scholarship_title: 'Varsity Athletics & Sports Distinction Grant',
    student_number: '2022103322',
    first_name: 'Gabriel',
    last_name: 'Mendoza',
    email: 'gmendoza@student.university.edu',
    phone: '09178889900',
    program: 'BS Architecture',
    year_level: '4th Year',
    gwa: 2.10,
    monthly_family_income: 70000,
    household_members: [
      { id: 'hm-7', name: 'Gregorio Mendoza', relation: 'Father', occupation: 'Architect', monthly_income: 70000 }
    ],
    documents: [
      { id: 'doc-11', type: 'com', name: 'COE_Mendoza.pdf', url: '#', size: '1.5 MB', uploaded_at: '2026-08-02' }
    ],
    status: 'Approved',
    approved_at: '2026-08-04',
    expires_at: '2030-08-04',
    awarded_amount: 55000,
    remarks: 'Approved with varsity athletics distinction and faculty endorsement.',
    staff_notes: 'Athletic department endorsement confirmed.',
    created_at: '2026-08-02T09:00:00Z',
    updated_at: '2026-08-04T11:00:00Z'
  },
  {
    id: 'app-006',
    reference_code: 'SF-612A98D4',
    scholarship_id: 'sch-001',
    scholarship_title: 'Presidential Academic Excellence Fellowship',
    student_number: '2021105432',
    first_name: 'Chloe',
    last_name: 'Navarro',
    email: 'cnavarro@student.university.edu',
    phone: '09175554321',
    program: 'BS Applied Mathematics',
    year_level: '4th Year',
    gwa: 1.30,
    monthly_family_income: 58000,
    household_members: [
      { id: 'hm-8', name: 'Manuel Navarro', relation: 'Father', occupation: 'Accountant', monthly_income: 58000 }
    ],
    documents: [
      { id: 'doc-12', type: 'com', name: 'COE_Navarro.pdf', url: '#', size: '1.1 MB', uploaded_at: '2025-08-01' }
    ],
    status: 'For Renewal',
    approved_at: '2025-08-10',
    expires_at: '2026-08-10',
    awarded_amount: 90000,
    remarks: 'Grant period ending. Student submitted renewal documentation for 2026-2027.',
    staff_notes: 'Awaiting updated True Copy of Grades for renewal validation.',
    created_at: '2025-08-01T09:00:00Z',
    updated_at: '2026-08-10T10:00:00Z'
  },
  {
    id: 'app-007',
    reference_code: 'SF-778B33F1',
    scholarship_id: 'sch-002',
    scholarship_title: 'Future Innovators STEM & Technology Grant',
    student_number: '2020108876',
    first_name: 'Kevin',
    last_name: 'Del Rosario',
    email: 'kdelrosario@student.university.edu',
    phone: '09181112233',
    program: 'BS Computer Engineering',
    year_level: 'Graduated',
    gwa: 1.65,
    monthly_family_income: 42000,
    household_members: [
      { id: 'hm-9', name: 'Lourdes Del Rosario', relation: 'Mother', occupation: 'Teacher', monthly_income: 42000 }
    ],
    documents: [
      { id: 'doc-13', type: 'com', name: 'COE_DelRosario.pdf', url: '#', size: '1.4 MB', uploaded_at: '2025-01-15' }
    ],
    status: 'Expired',
    approved_at: '2025-01-20',
    expires_at: '2026-01-20',
    awarded_amount: 85000,
    remarks: 'Scholarship validity period has elapsed after graduation.',
    staff_notes: 'Completed grant term without renewal application.',
    created_at: '2025-01-15T08:00:00Z',
    updated_at: '2026-01-21T09:00:00Z'
  },
  {
    id: 'app-008',
    reference_code: 'SF-891C44E2',
    scholarship_id: 'sch-001',
    scholarship_title: 'Presidential Academic Excellence Fellowship',
    student_number: '2023107765',
    first_name: 'Dominic',
    last_name: 'Aquino',
    email: 'daquino@student.university.edu',
    phone: '09224445566',
    program: 'BS Biology',
    year_level: '2nd Year',
    gwa: 2.25,
    monthly_family_income: 60000,
    household_members: [
      { id: 'hm-10', name: 'Ramon Aquino', relation: 'Father', occupation: 'Driver', monthly_income: 60000 }
    ],
    documents: [
      { id: 'doc-14', type: 'com', name: 'COE_Aquino.pdf', url: '#', size: '1.2 MB', uploaded_at: '2025-09-01' }
    ],
    status: 'Removed',
    approved_at: '2025-09-10',
    expires_at: '2026-09-10',
    removal_reason: 'GWA dropped to 2.25, failing the minimum grade requirement of 1.50 for Presidential Fellowship.',
    awarded_amount: 90000,
    remarks: 'Removed from active scholarship roster due to academic policy violation.',
    staff_notes: 'Academic audit flag: Semester GWA did not meet minimum 1.50.',
    created_at: '2025-09-01T10:00:00Z',
    updated_at: '2026-02-15T15:00:00Z'
  },
  {
    id: 'app-009',
    reference_code: 'SF-902D55F3',
    scholarship_id: 'sch-003',
    scholarship_title: 'Global Access & Need-Based Opportunity Grant',
    student_number: '2024109988',
    first_name: 'Bea',
    last_name: 'Soriano',
    email: 'bsoriano@student.university.edu',
    phone: '09193332211',
    program: 'BA Communication',
    year_level: '1st Year',
    gwa: 2.90,
    monthly_family_income: 750000,
    household_members: [
      { id: 'hm-11', name: 'Eduardo Soriano', relation: 'Father', occupation: 'Manager', monthly_income: 750000 }
    ],
    documents: [
      { id: 'doc-15', type: 'com', name: 'COE_Soriano.pdf', url: '#', size: '1.1 MB', uploaded_at: '2026-08-05' }
    ],
    status: 'Rejected',
    awarded_amount: 0,
    remarks: 'Household monthly income exceeds maximum ceiling for need-based grant (₱380,000 threshold).',
    staff_notes: 'Financial evaluation disqualification. Income over limit.',
    created_at: '2026-08-05T11:00:00Z',
    updated_at: '2026-08-07T14:00:00Z'
  }
];

export const INITIAL_FREEZE_PERIODS: FreezePeriod[] = [];

export const INITIAL_INTERVIEWS: InterviewSchedule[] = [
  {
    id: 'int-001',
    application_id: 'app-002',
    student_name: 'Samantha Reyes (2022109841)',
    scholarship_title: 'Global Access & Need-Based Opportunity Grant',
    date_time: '2026-09-10 10:00 AM',
    location: 'Scholarship Office Rm 204 / Video Conference',
    interviewer: 'Prof. Corazon V. Santos',
    status: 'Scheduled'
  }
];
