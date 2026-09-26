import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Check, ChevronRight, ChevronLeft, Upload, FileText, Trash2, Plus, Pencil, CheckCircle2 as CheckIcon,
  ShieldCheck, ShieldAlert, AlertCircle, Copy, GraduationCap, DollarSign, Sparkles, Eye, Clock,
  RotateCcw, Search, FileCheck, Lock
} from 'lucide-react';
import { Scholarship, HouseholdMember, ApplicationDocument, Application } from '../../types';
import { DocumentUploader } from '../common/DocumentUploader';
import { DocumentViewerModal } from '../common/DocumentViewerModal';
import { checkDuplicateApplication } from '../../lib/duplicateCheck';

interface ApplicationWizardProps {
  scholarship: Scholarship;
  onClose: () => void;
  onSubmitSuccess: (newApp: Application) => void;
  applications?: Application[];
  onTrackExisting?: (referenceCode: string) => void;
  isRenewal?: boolean;
  renewedFrom?: string;
  initialEmail?: string;
  initialStudentId?: string;
}

export const ApplicationWizard: React.FC<ApplicationWizardProps> = ({
  scholarship,
  onClose,
  onSubmitSuccess,
  applications = [],
  onTrackExisting,
  isRenewal = false,
  renewedFrom,
  initialEmail,
  initialStudentId,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1); // 4 is Success state

  // Keyboard Accessibility: Dismiss overlay on Escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Form State
  const [studentNumber, setStudentNumber] = useState('');
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [gender, setGender] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [program, setProgram] = useState('BS Computer Science');
  const [yearLevel, setYearLevel] = useState('1st Year');
  const [gwa, setGwa] = useState<string>('');
  const [monthlyFamilyIncome, setMonthlyFamilyIncome] = useState<string>('');

  // Working Student State
  const [isWorkingStudent, setIsWorkingStudent] = useState<boolean>(false);
  const [studentAnnualIncome, setStudentAnnualIncome] = useState<string>('');

  // Age calculation helper (Applicant must be at least 18 years old)
  const calculateAge = (dobString: string): number => {
    if (!dobString) return 0;
    const today = new Date();
    const birthDate = new Date(dobString);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const maxBirthdateFor18 = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 18);
    return d.toISOString().split('T')[0];
  }, []);

  // Household Members
  const [householdMembers, setHouseholdMembers] = useState<HouseholdMember[]>([]);

  // Automatically calculate Annual Gross Family Income by summing household members' annual incomes + student's annual income
  const calculatedAnnualIncome = useMemo(() => {
    const totalHousehold = householdMembers.reduce((acc, curr) => {
      const val = curr.annual_income !== undefined ? Number(curr.annual_income) : (Number(curr.monthly_income) || 0) * 12;
      return acc + (isNaN(val) ? 0 : val);
    }, 0);
    const studentIncome = isWorkingStudent ? (Number(studentAnnualIncome.replace(/,/g, '')) || 0) : 0;
    return totalHousehold + studentIncome;
  }, [householdMembers, isWorkingStudent, studentAnnualIncome]);

  React.useEffect(() => {
    setMonthlyFamilyIncome(calculatedAnnualIncome > 0 ? calculatedAnnualIncome.toLocaleString('en-US') : '0');
  }, [calculatedAnnualIncome]);

  // Dynamic document slots from scholarship.requirements
  const docSlots: string[] = useMemo(() => {
    if (scholarship.requirements && scholarship.requirements.length > 0) {
      return scholarship.requirements;
    }
    return ['Certificate of Enrollment / Transcript', 'Income Tax Assessment or Indigency Certificate', 'Official Student ID Card'];
  }, [scholarship.requirements]);

  // Dynamic document state: array matching docSlots length
  const [dynamicDocs, setDynamicDocs] = useState<(ApplicationDocument | null)[]>(() =>
    Array(Math.max(3, scholarship.requirements?.length || 3)).fill(null)
  );

  const setDynamicDoc = (index: number, doc: ApplicationDocument | null) => {
    setDynamicDocs(prev => {
      const next = [...prev];
      next[index] = doc;
      return next;
    });
  };

  const [previewDoc, setPreviewDoc] = useState<ApplicationDocument | null>(null);

  // Track if re-application records were auto-pulled
  const [reapplyAutoPulled, setReapplyAutoPulled] = useState(false);

  // Auto-Pull records for renewal
  React.useEffect(() => {
    if (isRenewal && renewedFrom && applications.length > 0) {
      const prevApp = applications.find(
        (a) => a.reference_code?.toLowerCase() === renewedFrom.toLowerCase()
      );
      if (prevApp) {
        setStudentNumber(prevApp.student_number || '');
        setFirstName(prevApp.first_name || '');
        setMiddleName(prevApp.middle_name || '');
        setLastName(prevApp.last_name || '');
        setGender(prevApp.gender || '');
        setBirthdate(prevApp.birthdate || '');
        setEmail(prevApp.email || '');
        setPhone(prevApp.phone || '');
        setProgram(prevApp.program || 'BS Computer Science');
        setYearLevel(prevApp.year_level || '1st Year');
        setGwa(prevApp.gwa ? String(prevApp.gwa) : '');
        if (prevApp.household_members) {
          setHouseholdMembers(prevApp.household_members);
        }
        if (prevApp.documents && prevApp.documents.length > 0) {
          const newDocs: (ApplicationDocument | null)[] = Array(docSlots.length).fill(null);
          docSlots.forEach((_, idx) => {
            const slotType = idx === 0 ? 'com' : idx === 1 ? 'itr' : idx === 2 ? 'id' : 'other';
            const docMatch = prevApp.documents.find((d) => d.type === slotType) || prevApp.documents[idx];
            if (docMatch) newDocs[idx] = { ...docMatch };
          });
          setDynamicDocs(newDocs);
        }
      }
    }
  }, [isRenewal, renewedFrom, applications, docSlots]);

  // Temp inputs for adding household member (First, Middle, Last Name)
  const [newHmFirstName, setNewHmFirstName] = useState('');
  const [newHmMiddleName, setNewHmMiddleName] = useState('');
  const [newHmLastName, setNewHmLastName] = useState('');
  const [newHmRelation, setNewHmRelation] = useState('Father');
  const [newHmOccupation, setNewHmOccupation] = useState('');
  const [newHmIncome, setNewHmIncome] = useState<string>('');
  const [showAddHm, setShowAddHm] = useState(false);

  // Edit Household Member inline state
  const [editingHmId, setEditingHmId] = useState<string | null>(null);
  const [editHmFirstName, setEditHmFirstName] = useState('');
  const [editHmMiddleName, setEditHmMiddleName] = useState('');
  const [editHmLastName, setEditHmLastName] = useState('');
  const [editHmRelation, setEditHmRelation] = useState('Father');
  const [editHmOccupation, setEditHmOccupation] = useState('');
  const [editHmIncome, setEditHmIncome] = useState<string>('');

  const handleStartEditHm = (m: HouseholdMember) => {
    setEditingHmId(m.id);
    setEditHmFirstName(m.first_name || m.name?.split(' ')[0] || '');
    setEditHmMiddleName(m.middle_name || '');
    setEditHmLastName(m.last_name || m.name?.split(' ').slice(-1)[0] || '');
    setEditHmRelation(m.relation);
    setEditHmOccupation(m.occupation);
    const existingAnnual = m.annual_income !== undefined ? m.annual_income : (m.monthly_income ? m.monthly_income * 12 : 0);
    setEditHmIncome(existingAnnual ? Number(existingAnnual).toLocaleString('en-US') : '');
  };

  const handleSaveEditHm = () => {
    if (!editingHmId) return;
    setHouseholdMembers(prev => prev.map(m => {
      if (m.id !== editingHmId) return m;
      const cleanIncome = Number(editHmIncome.replace(/,/g, '')) || 0;
      const fullName = `${editHmFirstName.trim()} ${editHmMiddleName.trim() ? editHmMiddleName.trim() + ' ' : ''}${editHmLastName.trim()}`;
      return {
        ...m,
        first_name: editHmFirstName.trim(),
        middle_name: editHmMiddleName.trim(),
        last_name: editHmLastName.trim(),
        name: fullName,
        relation: editHmRelation,
        occupation: editHmOccupation.trim() || 'N/A',
        annual_income: cleanIncome,
        monthly_income: Math.round(cleanIncome / 12),
      };
    }));
    setEditingHmId(null);
    setFormError(null);
  };

  const [agreeTerms, setAgreeTerms] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Internal renewal / reapplication state (tracks whether user loaded an existing record to reapply/renew)
  const [internalIsRenewal, setInternalIsRenewal] = useState<boolean>(isRenewal);
  const [internalRenewedFrom, setInternalRenewedFrom] = useState<string | undefined>(renewedFrom);

  React.useEffect(() => {
    if (isRenewal) setInternalIsRenewal(true);
    if (renewedFrom) setInternalRenewedFrom(renewedFrom);
  }, [isRenewal, renewedFrom]);

  const isEffectiveRenewal = isRenewal || internalIsRenewal;
  const effectiveRenewedFrom = renewedFrom || internalRenewedFrom;

  // Real-time Duplicate Check: Checks if the applicant has already applied for this scholarship
  // program matching the same email address or student ID number (unless submitting a renewal)
  const duplicateCheck = useMemo(() => {
    if (isEffectiveRenewal) return { isDuplicate: false, message: '' };
    return checkDuplicateApplication(applications, scholarship.id, email, studentNumber, isEffectiveRenewal);
  }, [applications, scholarship.id, email, studentNumber, isEffectiveRenewal]);

  // Record Retrieval State for Reapplication & Renewal
  const [retrievalEmail, setRetrievalEmail] = useState('');
  const [retrievalStudentId, setRetrievalStudentId] = useState('');
  const [retrievalFeedback, setRetrievalFeedback] = useState<{
    type: 'idle' | 'success' | 'not_found' | 'error';
    message?: string;
    record?: Application;
    docsCount?: number;
  }>({ type: 'idle' });
  const [isRetrievingRecord, setIsRetrievingRecord] = useState(false);

  // Lock Personal Identity fields (Name, Sex, Birthdate, Student ID) when record is retrieved
  const isRecordLocked = retrievalFeedback.type === 'success' && Boolean(retrievalFeedback.record);

  // Pull up existing database record by Institutional Email and School ID
  const handlePullRecord = (inputEmail?: string, inputId?: string) => {
    const rawEmail = (inputEmail !== undefined ? inputEmail : (retrievalEmail || email)).trim().toLowerCase();
    const rawId = (inputId !== undefined ? inputId : (retrievalStudentId || studentNumber)).trim().toLowerCase().replace(/[^a-z0-9]/g, '');

    if (!rawEmail || !rawId) {
      setRetrievalFeedback({
        type: 'error',
        message: 'Please enter both your Institutional Email and School ID Number to pull up your existing record.',
      });
      return;
    }

    setIsRetrievingRecord(true);

    // Search existing applications for match on both institutional email and student ID number
    const matched = applications.filter((app) => {
      const aEmail = (app.email || '').trim().toLowerCase();
      const aId = (app.student_number || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      return aEmail === rawEmail && aId === rawId;
    });

    if (matched.length === 0) {
      setIsRetrievingRecord(false);
      setRetrievalFeedback({
        type: 'not_found',
        message: `No existing student record found matching Institutional Email "${rawEmail}" and School ID "${rawId}". Please verify your credentials or proceed with a new application.`,
      });
      return;
    }

    // Enforce strict Reapplication Eligibility:
    // Allow ONLY students with "Expired", "Removed", "Rejected", or "For Renewal" statuses,
    // OR "Approved" if this is an authorized renewal.
    // Explicitly block students who currently have a "Pending", "In Review", or "Shortlisted" application.
    const BLOCKED_STATUSES = isEffectiveRenewal
      ? ['Pending', 'In Review', 'Shortlisted']
      : ['Pending', 'In Review', 'Approved', 'Shortlisted'];
    const ALLOWED_STATUSES = isEffectiveRenewal
      ? ['Approved', 'For Renewal', 'Expired', 'Removed', 'Rejected']
      : ['Expired', 'Removed', 'Rejected', 'For Renewal'];

    const activeOrPendingApp = matched.find(a =>
      BLOCKED_STATUSES.some(s => s.toLowerCase() === (a.status || '').toLowerCase())
    );

    if (activeOrPendingApp) {
      setIsRetrievingRecord(false);
      setRetrievalFeedback({
        type: 'error',
        message: `Reapplication Blocked: You currently have an active application (${activeOrPendingApp.reference_code}) with status "${activeOrPendingApp.status}". Students with Pending, In Review, or Shortlisted status cannot submit a reapplication.`,
      });
      return;
    }

    const eligibleApps = matched.filter(a =>
      ALLOWED_STATUSES.some(s => s.toLowerCase() === (a.status || '').toLowerCase())
    );

    if (eligibleApps.length === 0) {
      setIsRetrievingRecord(false);
      setRetrievalFeedback({
        type: 'error',
        message: `Ineligible for Reapplication: No record with an eligible status ("Expired", "Removed", "Rejected", or "For Renewal") was found. Only students with these historical statuses are permitted to reapply.`,
      });
      return;
    }

    // Prioritize application for this scholarship, or the most recent application among eligible ones
    const sameScholarship = eligibleApps.find((a) => a.scholarship_id === scholarship.id);
    const chosen = sameScholarship || [...eligibleApps].sort((a, b) => {
      const tB = new Date(b.updated_at || b.created_at || 0).getTime();
      const tA = new Date(a.updated_at || a.created_at || 0).getTime();
      return tB - tA;
    })[0];

    // Safely extract and format birthdate to YYYY-MM-DD so HTML5 input[type="date"] accepts it
    let rawBirthdate = chosen.birthdate || (chosen as any).birth_date || (chosen as any).dob || '';
    let formattedBirthdate = '';
    if (rawBirthdate) {
      if (typeof rawBirthdate === 'string') {
        const isoDatePart = rawBirthdate.split('T')[0];
        if (/^\d{4}-\d{2}-\d{2}$/.test(isoDatePart)) {
          formattedBirthdate = isoDatePart;
        } else {
          const parsed = new Date(rawBirthdate);
          if (!isNaN(parsed.getTime())) {
            formattedBirthdate = parsed.toISOString().split('T')[0];
          } else {
            formattedBirthdate = rawBirthdate;
          }
        }
      }
    }

    // Populate personal information
    setStudentNumber(chosen.student_number || '');
    setEmail(chosen.email || '');
    setRetrievalStudentId(chosen.student_number || '');
    setRetrievalEmail(chosen.email || '');
    setFirstName(chosen.first_name || '');
    setMiddleName(chosen.middle_name || '');
    setLastName(chosen.last_name || '');
    setGender(chosen.gender || '');
    setBirthdate(formattedBirthdate);
    setPhone(chosen.phone || '');
    setProgram(chosen.program || 'BS Computer Science');
    setYearLevel(chosen.year_level || '1st Year');
    setGwa(chosen.gwa ? String(chosen.gwa) : '');

    // Populate Working Student & Student Income
    setIsWorkingStudent(Boolean(chosen.is_working_student));
    setStudentAnnualIncome(
      chosen.student_annual_income
        ? Number(chosen.student_annual_income).toLocaleString('en-US')
        : ''
    );

    // Populate Household Members
    if (chosen.household_members && chosen.household_members.length > 0) {
      setHouseholdMembers([...chosen.household_members]);
    }

    // Populate Supporting Documents into slots
    let docsLoaded = 0;
    if (chosen.documents && chosen.documents.length > 0) {
      const updatedDocs: (ApplicationDocument | null)[] = Array(docSlots.length).fill(null);
      docSlots.forEach((_, idx) => {
        const slotType = idx === 0 ? 'com' : idx === 1 ? 'itr' : idx === 2 ? 'id' : 'other';
        const docMatch = chosen.documents.find((d) => d.type === slotType) || chosen.documents[idx];
        if (docMatch) {
          updatedDocs[idx] = { ...docMatch };
          docsLoaded++;
        }
      });
      setDynamicDocs(updatedDocs);
    }

    // Mark as renewal / reapplication
    setInternalIsRenewal(true);
    setInternalRenewedFrom(chosen.reference_code);
    setIsRetrievingRecord(false);

    setRetrievalFeedback({
      type: 'success',
      record: chosen,
      docsCount: docsLoaded,
      message: `Existing record loaded for ${chosen.first_name} ${chosen.last_name} (School ID: ${chosen.student_number}). Personal information, household income, and ${docsLoaded} attached file(s) have been populated. You can review, update, or edit any details below and replace or upload new documents before submitting.`,
    });

    setFormError(null);
  };

  const handleClearRetrievedRecord = () => {
    setRetrievalFeedback({ type: 'idle' });
    setInternalIsRenewal(isRenewal);
    setInternalRenewedFrom(renewedFrom);
    handleResetStep1();
    setDynamicDocs(Array(docSlots.length).fill(null));
  };

  // Smart Re-Application Auto-Pull: If previous application was Removed, Expired, or Rejected, pre-fill form
  React.useEffect(() => {
    if (!isEffectiveRenewal && duplicateCheck.canReapply && duplicateCheck.previousApp && !reapplyAutoPulled) {
      const prev = duplicateCheck.previousApp;
      if (prev.first_name) setFirstName(prev.first_name);
      if (prev.middle_name) setMiddleName(prev.middle_name);
      if (prev.last_name) setLastName(prev.last_name);
      if (prev.gender) setGender(prev.gender);
      if (prev.birthdate) {
        const b = String(prev.birthdate).split('T')[0];
        setBirthdate(b);
      }
      if (prev.phone) setPhone(prev.phone);
      if (prev.program) setProgram(prev.program);
      if (prev.year_level) setYearLevel(prev.year_level);
      if (prev.gwa) setGwa(String(prev.gwa));
      if (prev.household_members && prev.household_members.length > 0) {
        setHouseholdMembers(prev.household_members);
      }
      if (prev.documents && prev.documents.length > 0) {
        const newDocs: (ApplicationDocument | null)[] = Array(docSlots.length).fill(null);
        docSlots.forEach((_, idx) => {
          const slotType = idx === 0 ? 'com' : idx === 1 ? 'itr' : idx === 2 ? 'id' : 'other';
          const docMatch = prev.documents.find((d) => d.type === slotType) || prev.documents[idx];
          if (docMatch) newDocs[idx] = { ...docMatch };
        });
        setDynamicDocs(newDocs);
      }
      setReapplyAutoPulled(true);
    }
  }, [isEffectiveRenewal, duplicateCheck.canReapply, duplicateCheck.previousApp, reapplyAutoPulled, docSlots]);

  // Auto-trigger "Find Record" when entering wizard via "Apply for Renewal Now"
  const [renewalAutoTriggered, setRenewalAutoTriggered] = useState(false);
  React.useEffect(() => {
    if ((isRenewal || renewedFrom || initialEmail || initialStudentId) && !renewalAutoTriggered) {
      let targetEmail = initialEmail || retrievalEmail || email;
      let targetId = initialStudentId || retrievalStudentId || studentNumber;
      if ((!targetEmail || !targetId) && renewedFrom) {
        const appMatch = applications.find(a => a.reference_code === renewedFrom);
        if (appMatch) {
          targetEmail = appMatch.email;
          targetId = appMatch.student_number;
        }
      }
      if (targetEmail && targetId) {
        setRenewalAutoTriggered(true);
        handlePullRecord(targetEmail, targetId);
      }
    }
  }, [isRenewal, renewedFrom, initialEmail, initialStudentId, applications, renewalAutoTriggered]);

  // Submitted Result State
  const [createdApp, setCreatedApp] = useState<Application | null>(null);
  const [copiedRef, setCopiedRef] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Academic Degree Programs list
  const academicPrograms = [
    'BS Computer Science',
    'BS Information Technology',
    'BS Software Engineering',
    'BS Data Science & Analytics',
    'BS Civil Engineering',
    'BS Electrical Engineering',
    'BS Mechanical Engineering',
    'BS Chemical Engineering',
    'BS Architecture',
    'BS Business Administration'
  ];

  // Dynamic input tracking for Clear button state
  const hasStep1Input = Boolean(
    studentNumber || firstName || middleName || lastName || gender || birthdate || email || phone || gwa !== '' || monthlyFamilyIncome !== '' || householdMembers.length > 0
  );

  const handleClearStep1 = () => {
    setStudentNumber('');
    setFirstName('');
    setMiddleName('');
    setLastName('');
    setGender('');
    setBirthdate('');
    setEmail('');
    setPhone('');
    setGwa('');
    setMonthlyFamilyIncome('');
    setIsWorkingStudent(false);
    setStudentAnnualIncome('');
    setHouseholdMembers([]);
    setRetrievalEmail('');
    setRetrievalStudentId('');
    setRetrievalFeedback({ type: 'idle' });
    setFormError(null);
  };

  const handleResetStep1 = () => {
    setStudentNumber('');
    setFirstName('');
    setMiddleName('');
    setLastName('');
    setGender('');
    setBirthdate('');
    setEmail('');
    setPhone('');
    setProgram('BS Computer Science');
    setYearLevel('1st Year');
    setGwa('');
    setMonthlyFamilyIncome('');
    setIsWorkingStudent(false);
    setStudentAnnualIncome('');
    setHouseholdMembers([]);
    setRetrievalEmail('');
    setRetrievalStudentId('');
    setRetrievalFeedback({ type: 'idle' });
    setFormError(null);
  };

  // Strict numeric input preventer for alphabetic characters like "e", "g", etc.
  const handleNumericKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, allowDecimal = false) => {
    if (['e', 'E', 'g', 'G', '+', '-'].includes(e.key)) {
      e.preventDefault();
      return;
    }
    if (!allowDecimal && e.key === '.') {
      e.preventDefault();
      return;
    }
  };

  // Strict Name validation regex (only letters, spaces, hyphens)
  const validateNameRegex = (val: string) => /^[A-Za-z\s\-]+$/.test(val.trim());

  // Philippine Mobile Phone formatting & validation helper
  const formatPhilippinePhone = (val: string) => {
    let raw = val.replace(/[^\d+]/g, '');
    if (raw.startsWith('+63')) {
      let digits = raw.slice(3).replace(/\D/g, '').slice(0, 10);
      let res = '+63';
      if (digits.length > 0) res += ' ' + digits.slice(0, 3);
      if (digits.length > 3) res += ' ' + digits.slice(3, 6);
      if (digits.length > 6) res += ' ' + digits.slice(6, 10);
      return res;
    } else {
      let digits = raw.replace(/\D/g, '').slice(0, 11);
      if (digits.length > 0 && !digits.startsWith('09')) {
        if (digits.startsWith('9')) digits = '09' + digits.slice(1);
      }
      let res = '';
      if (digits.length > 0) res += digits.slice(0, 4);
      if (digits.length > 4) res += ' ' + digits.slice(4, 7);
      if (digits.length > 7) res += ' ' + digits.slice(7, 11);
      return res;
    }
  };

  const validatePhilippinePhone = (val: string) => {
    const clean = val.replace(/[\s\-]/g, '');
    return /^(?:(?:\+639\d{9})|(?:09\d{9}))$/.test(clean);
  };

  const handleAddHouseholdMember = () => {
    if (!newHmFirstName.trim()) {
      setFormError('Please enter household member First Name.');
      return;
    }
    if (!validateNameRegex(newHmFirstName)) {
      setFormError('Household member First Name can only contain letters, spaces, and hyphens.');
      return;
    }
    if (newHmMiddleName.trim() && !validateNameRegex(newHmMiddleName)) {
      setFormError('Household member Middle Name can only contain letters, spaces, and hyphens.');
      return;
    }
    if (!newHmLastName.trim()) {
      setFormError('Please enter household member Last Name.');
      return;
    }
    if (!validateNameRegex(newHmLastName)) {
      setFormError('Household member Last Name can only contain letters, spaces, and hyphens.');
      return;
    }

    const cleanIncome = Number(newHmIncome.replace(/,/g, '')) || 0;
    const fullName = `${newHmFirstName.trim()} ${newHmMiddleName.trim() ? newHmMiddleName.trim() + ' ' : ''}${newHmLastName.trim()}`;
    const member: HouseholdMember = {
      id: `hm-${Date.now()}`,
      first_name: newHmFirstName.trim(),
      middle_name: newHmMiddleName.trim(),
      last_name: newHmLastName.trim(),
      name: fullName,
      relation: newHmRelation,
      occupation: newHmOccupation.trim() || 'N/A',
      annual_income: cleanIncome,
      monthly_income: Math.round(cleanIncome / 12),
    };
    setHouseholdMembers([...householdMembers, member]);
    setNewHmFirstName('');
    setNewHmMiddleName('');
    setNewHmLastName('');
    setNewHmOccupation('');
    setNewHmIncome('');
    setShowAddHm(false);
    setFormError(null);
  };

  const handleRemoveHouseholdMember = (id: string) => {
    setHouseholdMembers(householdMembers.filter(m => m.id !== id));
  };

  const isEmailFormatValid = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());
  const gwaNumVal = Number(gwa);
  const isGwaValid = gwa !== '' && !isNaN(gwaNumVal) && gwaNumVal >= 1.0 && gwaNumVal <= 5.0 && /^\d+(\.\d{1,2})?$/.test(String(gwa));
  const isGwaFailingRequirement = isGwaValid && scholarship.min_gwa > 0 && gwaNumVal > scholarship.min_gwa;
  const isIncomeExceeded = scholarship.max_family_income > 0 && calculatedAnnualIncome > scholarship.max_family_income;

  const isStep1Valid = Boolean(
    studentNumber.trim() &&
    /^\d+$/.test(studentNumber.trim()) &&
    studentNumber.trim().length === 10 &&
    firstName.trim() &&
    validateNameRegex(firstName) &&
    firstName.trim().length <= 50 &&
    (!middleName.trim() || validateNameRegex(middleName)) &&
    middleName.trim().length <= 50 &&
    lastName.trim() &&
    validateNameRegex(lastName) &&
    lastName.trim().length <= 50 &&
    gender &&
    birthdate &&
    calculateAge(birthdate) >= 18 &&
    (!isWorkingStudent || (studentAnnualIncome.trim() !== '' && !isNaN(Number(studentAnnualIncome.replace(/,/g, ''))))) &&
    email.trim() &&
    isEmailFormatValid(email) &&
    phone.trim() &&
    validatePhilippinePhone(phone) &&
    isGwaValid &&
    !isGwaFailingRequirement &&
    !isIncomeExceeded &&
    !duplicateCheck.isDuplicate
  );

  const validateStep1 = () => {
    setFormError(null);
    if (!studentNumber.trim()) {
      setFormError('Please enter your Student ID Number.');
      return false;
    }
    if (!/^\d+$/.test(studentNumber.trim())) {
      setFormError('Student ID Number must contain numbers only.');
      return false;
    }
    if (studentNumber.trim().length !== 10) {
      setFormError('Student ID Number must be exactly 10 digits (e.g. 2024104821).');
      return false;
    }
    if (!firstName.trim()) {
      setFormError('Please enter your First Name.');
      return false;
    }
    if (!validateNameRegex(firstName)) {
      setFormError('First Name can only contain letters, spaces, and hyphens (numbers and special characters are rejected).');
      return false;
    }
    if (firstName.trim().length > 50) {
      setFormError('First Name cannot exceed 50 characters.');
      return false;
    }
    if (middleName.trim() && !validateNameRegex(middleName)) {
      setFormError('Middle Name can only contain letters, spaces, and hyphens.');
      return false;
    }
    if (middleName.trim().length > 50) {
      setFormError('Middle Name cannot exceed 50 characters.');
      return false;
    }
    if (!lastName.trim()) {
      setFormError('Please enter your Last Name.');
      return false;
    }
    if (!validateNameRegex(lastName)) {
      setFormError('Last Name can only contain letters, spaces, and hyphens.');
      return false;
    }
    if (lastName.trim().length > 50) {
      setFormError('Last Name cannot exceed 50 characters.');
      return false;
    }
    if (!gender) {
      setFormError('Please select your Sex from the dropdown menu.');
      return false;
    }
    if (!birthdate) {
      setFormError('Please select your Birthdate.');
      return false;
    }
    const age = calculateAge(birthdate);
    if (age < 18) {
      setFormError('Applicant must be at least 18 years old as of the current date.');
      return false;
    }
    if (isWorkingStudent && !studentAnnualIncome.trim()) {
      setFormError("Please enter the student's annual income.");
      return false;
    }
    if (!email.trim() || !isEmailFormatValid(email)) {
      setFormError('Please provide a valid institutional email address (e.g. user@domain.com).');
      return false;
    }
    if (duplicateCheck.isDuplicate) {
      setFormError(duplicateCheck.message || 'You already applied for this scholarship.');
      return false;
    }
    if (!phone.trim() || !validatePhilippinePhone(phone)) {
      setFormError('Please enter a valid Philippine mobile number (e.g. +63 917 123 4567 or 0917 123 4567).');
      return false;
    }
    if (gwa === '') {
      setFormError('Please enter your cumulative GPA.');
      return false;
    }
    const num = Number(gwa);
    if (isNaN(num) || num < 1.0 || num > 5.0) {
      setFormError('GPA must be a valid number between 1.00 and 5.00.');
      return false;
    }
    if (!/^\d+(\.\d{1,2})?$/.test(String(gwa))) {
      setFormError('GPA is limited to two decimal places (e.g. 1.75).');
      return false;
    }
    if (isGwaFailingRequirement) {
      setFormError(`Your Cumulative GWA (${num.toFixed(2)}) does not meet the minimum requirement of ${scholarship.min_gwa.toFixed(2)} for ${scholarship.title}.`);
      return false;
    }
    if (isIncomeExceeded) {
      setFormError(`Calculated Annual Gross Family Income (₱${calculatedAnnualIncome.toLocaleString()}) exceeds the maximum annual income limit of ₱${scholarship.max_family_income.toLocaleString()} for this scholarship.`);
      return false;
    }
    return true;
  };

  // Step 2 is valid only when ALL dynamic document slots are filled
  const isStep2Valid = dynamicDocs.slice(0, docSlots.length).every(d => d !== null);

  // Step 3 is valid only when the terms agreement checkbox is checked
  const isStep3Valid = agreeTerms && !duplicateCheck.isDuplicate;

  const validateStep2 = () => {
    setFormError(null);
    const missing = docSlots.findIndex((_, i) => !dynamicDocs[i]);
    if (missing !== -1) {
      setFormError(`Please upload the required document: "${docSlots[missing] || `Document ${missing + 1}`}".`);
      return false;
    }
    return true;
  };

  const handleSubmitApplication = async () => {
    if (duplicateCheck.isDuplicate) {
      setFormError('You already applied for this scholarship');
      return;
    }
    if (!agreeTerms) {
      setFormError('You must agree to the academic integrity declaration and data privacy terms.');
      return;
    }

    setIsSubmitting(true);
    setFormError(null);

    try {
      // Generate Meridian University reference code: MU-XXXXXXXX
      const refCode = `MU-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

      const attachedDocs = dynamicDocs.filter(Boolean) as ApplicationDocument[];

      const newApp: Application = {
        id: `app-${Date.now()}`,
        reference_code: refCode,
        scholarship_id: scholarship.id,
        scholarship_title: scholarship.title,
        student_number: studentNumber.trim(),
        first_name: firstName.trim(),
        middle_name: middleName.trim() || undefined,
        last_name: lastName.trim(),
        gender,
        birthdate,
        email: email.trim(),
        phone: phone.trim(),
        program,
        year_level: yearLevel,
        gwa: Number(gwa) || 1.5,
        is_working_student: isWorkingStudent,
        student_annual_income: isWorkingStudent ? (Number(studentAnnualIncome.replace(/,/g, '')) || 0) : 0,
        monthly_family_income: Math.round(calculatedAnnualIncome / 12),
        annual_family_income: calculatedAnnualIncome,
        household_members: householdMembers,
        documents: attachedDocs,
        status: 'Pending',
        awarded_amount: 0,
        remarks: isEffectiveRenewal
          ? `Renewal/reapplication submitted (Previous Ref: ${effectiveRenewedFrom || 'N/A'}). Under queue for committee review.`
          : 'Application submitted successfully. Under queue for coordinator verification.',
        is_renewal: isEffectiveRenewal,
        renewed_from: effectiveRenewedFrom,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      await onSubmitSuccess(newApp);
      setCreatedApp(newApp);
      setStep(4);
    } catch (err: any) {
      console.error('Submission error:', err);
      setFormError(err.message || 'Failed to submit application. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const copyRefCode = () => {
    if (createdApp) {
      navigator.clipboard.writeText(createdApp.reference_code);
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 3000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8"
      >
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-6 border-b border-slate-800 flex justify-between items-center">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-indigo-600 text-white">
                Application Form
              </span>
              <span className="text-xs text-slate-400 font-mono">{scholarship.code}</span>
            </div>
            <h2 className="text-lg font-bold text-white">{scholarship.title}</h2>
          </div>

          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 p-2 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Step Progress Bar */}
        {step <= 3 && (
          <div className="bg-slate-50 border-b border-slate-200 px-6 py-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-500">
              <span className={step >= 1 ? 'text-indigo-600' : ''}>1. Student Details</span>
              <ChevronRight className="w-4 h-4 text-slate-300" />
              <span className={step >= 2 ? 'text-indigo-600' : ''}>2. Document Verification</span>
              <ChevronRight className="w-4 h-4 text-slate-300" />
              <span className={step >= 3 ? 'text-indigo-600' : ''}>3. Review & Submit</span>
            </div>
            <div className="w-full bg-slate-200 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-indigo-600 h-full transition-all duration-300"
                style={{ width: `${(step / 3) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Error Alert Message */}
        {formError && (
          <div className="bg-rose-50 text-rose-800 px-6 py-3 border-b border-rose-200 text-xs font-medium flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{formError}</span>
          </div>
        )}

        {/* Modal Body Steps */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-6">
          
          {/* STEP 1: Student Information */}
          {step === 1 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="border-b border-slate-100 pb-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                    Step 1: Student Academic & Contact Details
                  </h3>
                  <p className="text-xs text-slate-500">
                    Ensure all details accurately match your official university enrollment records.
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleResetStep1}
                    className="px-2.5 py-1.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                  >
                    Reset Form
                  </button>
                  <button
                    type="button"
                    disabled={!hasStep1Input}
                    onClick={handleClearStep1}
                    className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                      hasStep1Input
                        ? 'text-rose-600 bg-rose-50 hover:bg-rose-100 cursor-pointer border border-rose-200'
                        : 'text-slate-400 bg-slate-100 cursor-not-allowed border border-slate-200'
                    }`}
                  >
                    Clear Form
                  </button>
                </div>
              </div>

              {/* Record Retrieval for Reapplication & Renewal Module */}
              <div className="bg-slate-50 border-2 border-indigo-200/90 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-2xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/80 pb-3">
                  <div className="flex items-center space-x-2.5">
                    <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <RotateCcw className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                          Scholarship Renewal & Reapplication Record Retrieval
                        </h4>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                          Direct Database Search
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        For scholarship renewals or reapplications, enter your Institutional Email and School ID below to pull up your existing database records, update your personal info, and attach new files.
                      </p>
                    </div>
                  </div>

                  {retrievalFeedback.type === 'success' && (
                    <button
                      type="button"
                      onClick={handleClearRetrievedRecord}
                      className="text-[11px] font-semibold text-slate-500 hover:text-rose-600 underline cursor-pointer shrink-0 self-end sm:self-center"
                    >
                      Clear & Discard Retrieved Record
                    </button>
                  )}
                </div>

                {/* Quick Input & Retrieval Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
                  <div className="sm:col-span-5">
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                      Institutional Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. cnavarro@student.university.edu"
                      value={retrievalEmail || email}
                      onChange={(e) => {
                        setRetrievalEmail(e.target.value);
                        setEmail(e.target.value);
                        if (retrievalFeedback.type !== 'idle') setRetrievalFeedback({ type: 'idle' });
                      }}
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-4">
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                      School ID Number (10 digits)
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      placeholder="e.g. 2021105432"
                      maxLength={10}
                      value={retrievalStudentId || studentNumber}
                      onKeyDown={(e) => handleNumericKeyDown(e, false)}
                      onChange={(e) => {
                        const clean = e.target.value.replace(/\D/g, '').slice(0, 10);
                        setRetrievalStudentId(clean);
                        setStudentNumber(clean);
                        if (retrievalFeedback.type !== 'idle') setRetrievalFeedback({ type: 'idle' });
                      }}
                      className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <button
                      type="button"
                      onClick={() => handlePullRecord(retrievalEmail || email, retrievalStudentId || studentNumber)}
                      disabled={isRetrievingRecord || !(retrievalEmail || email).trim() || !(retrievalStudentId || studentNumber).trim()}
                      className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer flex items-center justify-center space-x-1.5"
                    >
                      {isRetrievingRecord ? (
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Search className="w-3.5 h-3.5" />
                      )}
                      <span>{isRetrievingRecord ? 'Searching...' : 'Find Record'}</span>
                    </button>
                  </div>
                </div>

                {/* Success Notification Alert */}
                {retrievalFeedback.type === 'success' && retrievalFeedback.record && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-emerald-50 border border-emerald-300 rounded-xl p-3.5 space-y-2 text-xs"
                  >
                    <div className="flex items-start space-x-2.5">
                      <CheckIcon className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-bold text-emerald-950">Record Retrieved Successfully!</span>
                          <span className="text-[10px] font-bold px-2 py-0.2 rounded bg-emerald-200 text-emerald-900">
                            Status: {retrievalFeedback.record.status}
                          </span>
                          <span className="text-[10px] font-mono text-emerald-800">
                            Ref: {retrievalFeedback.record.reference_code}
                          </span>
                        </div>
                        <p className="text-emerald-900 text-[11px] mt-1 leading-relaxed">
                          {retrievalFeedback.message}
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-emerald-200/70 text-[11px] text-emerald-950">
                      <div>
                        <span className="text-[9px] uppercase font-bold text-emerald-700 block">Applicant</span>
                        <span className="font-semibold">{retrievalFeedback.record.first_name} {retrievalFeedback.record.last_name}</span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-bold text-emerald-700 block">Program & Year</span>
                        <span className="font-semibold">{retrievalFeedback.record.program} ({retrievalFeedback.record.year_level})</span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-bold text-emerald-700 block">Pre-loaded Files</span>
                        <span className="font-semibold">{retrievalFeedback.docsCount || 0} file(s) loaded</span>
                      </div>
                      <div>
                        <span className="text-[9px] uppercase font-bold text-emerald-700 block">Annual Income</span>
                        <span className="font-semibold">₱{(retrievalFeedback.record.annual_family_income || retrievalFeedback.record.monthly_family_income * 12).toLocaleString()}</span>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Error / Not Found Alert */}
                {(retrievalFeedback.type === 'not_found' || retrievalFeedback.type === 'error') && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-amber-50 border border-amber-300 rounded-xl p-3 text-xs text-amber-900 flex items-start space-x-2"
                  >
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-bold text-amber-950">
                        {retrievalFeedback.type === 'not_found' ? 'No Student Record Found' : 'Retrieval Error'}
                      </p>
                      <p className="text-[11px] text-amber-800 mt-0.5">{retrievalFeedback.message}</p>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Prominent Duplicate Application Rejection Alert */}
              {duplicateCheck.isDuplicate && duplicateCheck.existingApp && (
                <div className="bg-rose-50 border-2 border-rose-500 rounded-2xl p-4 sm:p-5 space-y-3 shadow-xs">
                  <div className="flex items-start space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-200 text-rose-900">
                          Application Blocked
                        </span>
                        <span className="text-xs font-semibold text-rose-700">Duplicate Submission Policy</span>
                      </div>
                      <p className="text-xs text-rose-800 mt-2 leading-relaxed">
                        You already applied for this scholarship. University regulations prohibit applying to the same scholarship program twice. An existing submission under <strong>{duplicateCheck.existingApp.scholarship_title || scholarship.title}</strong> was detected with your email address or student ID number.
                      </p>
                    </div>
                  </div>

                  {onTrackExisting && (
                    <div className="pt-2 border-t border-rose-200/70 flex justify-end">
                      <button
                        type="button"
                        onClick={() => onTrackExisting(duplicateCheck.existingApp!.reference_code)}
                        className="px-3.5 py-1.5 bg-slate-900 hover:bg-indigo-600 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer flex items-center space-x-1.5 shadow-2xs"
                      >
                        <Clock className="w-3.5 h-3.5 text-indigo-300" />
                        <span>Track Existing Application</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Re-application Exception Notice */}
              {duplicateCheck.canReapply && duplicateCheck.previousApp && (
                <div className="bg-sky-50 border border-sky-300 rounded-2xl p-4 text-xs space-y-1.5 shadow-2xs">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-sky-200 text-sky-900">
                      Re-application Eligible
                    </span>
                    <span className="font-semibold text-sky-800">
                      Previous Status: {duplicateCheck.previousApp.status}
                    </span>
                  </div>
                  <p className="text-sky-900 text-xs leading-relaxed">
                    Because your previous submission was marked as <strong>{duplicateCheck.previousApp.status}</strong>, you are eligible to submit a fresh application. Your historical student records have been automatically loaded to save you time.
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700 flex items-center gap-1.5">
                      <span>Student ID Number</span>
                      <span className="text-rose-500">*</span>
                      {isRecordLocked && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                          <Lock className="w-2.5 h-2.5 text-amber-600" /> Locked
                        </span>
                      )}
                    </label>
                  </div>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="e.g. 2024104821"
                    value={studentNumber}
                    readOnly={isRecordLocked}
                    minLength={10}
                    maxLength={10}
                    onKeyDown={(e) => handleNumericKeyDown(e, false)}
                    onChange={(e) => {
                      if (isRecordLocked) return;
                      const clean = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setStudentNumber(clean);
                    }}
                    className={`w-full p-2.5 rounded-xl font-mono focus:outline-none ${
                      isRecordLocked
                        ? 'bg-slate-100 text-slate-600 border border-slate-200 cursor-not-allowed select-none'
                        : duplicateCheck.isDuplicate && (duplicateCheck.matchType === 'student_number' || duplicateCheck.matchType === 'both')
                        ? 'bg-rose-50/60 border-2 border-rose-400 text-rose-900 focus:ring-rose-500 focus:ring-2 focus:bg-white'
                        : 'bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:bg-white'
                    }`}
                  />
                  {studentNumber.length > 0 && !isRecordLocked && (
                    <div className="flex justify-between items-center mt-1">
                      {duplicateCheck.isDuplicate && (duplicateCheck.matchType === 'student_number' || duplicateCheck.matchType === 'both') ? (
                        <span className="text-[10px] text-rose-600 font-semibold">
                          Student ID already used for this scholarship
                        </span>
                      ) : <span />}
                      <span className={`text-[10px] font-mono ml-auto ${studentNumber.length === 10 ? 'text-emerald-600 font-bold' : 'text-rose-500 font-bold'}`}>
                        {studentNumber.length}/10 digits
                      </span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Institutional Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. student@university.edu"
                    value={email}
                    maxLength={100}
                    onChange={e => setEmail(e.target.value)}
                    className={`w-full p-2.5 rounded-xl focus:ring-2 focus:bg-white focus:outline-none ${
                      duplicateCheck.isDuplicate && (duplicateCheck.matchType === 'email' || duplicateCheck.matchType === 'both')
                        ? 'bg-rose-50/60 border-2 border-rose-400 text-rose-900 focus:ring-rose-500'
                        : 'bg-slate-50 border border-slate-200 focus:ring-indigo-500'
                    }`}
                  />
                  {duplicateCheck.isDuplicate && (duplicateCheck.matchType === 'email' || duplicateCheck.matchType === 'both') && (
                    <span className="text-[10px] text-rose-600 font-semibold block mt-1">
                      Email address already used for this scholarship
                    </span>
                  )}
                </div>



                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-bold text-slate-700 flex items-center gap-1.5">
                      <span>First Name</span>
                      <span className="text-rose-500">*</span>
                      {isRecordLocked && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                          <Lock className="w-2.5 h-2.5 text-amber-600" /> Locked
                        </span>
                      )}
                    </label>
                    {!isRecordLocked && (
                      <span className={`text-[10px] font-mono ${firstName.length >= 50 ? 'text-rose-600 font-bold' : 'text-slate-400'}`}>
                        {firstName.length}/50
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. Julian"
                    value={firstName}
                    readOnly={isRecordLocked}
                    maxLength={50}
                    onChange={e => {
                      if (isRecordLocked) return;
                      const val = e.target.value;
                      if (val === '' || /^[A-Za-z\s\-]*$/.test(val)) {
                        setFirstName(val);
                      }
                    }}
                    className={`w-full p-2.5 rounded-xl focus:outline-none ${
                      isRecordLocked
                        ? 'bg-slate-100 text-slate-600 border border-slate-200 cursor-not-allowed select-none'
                        : 'bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:bg-white'
                    }`}
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-bold text-slate-700 flex items-center gap-1.5">
                      <span>Middle Name</span>
                      <span className="text-[10px] font-normal text-slate-400 ml-1">(optional)</span>
                      {isRecordLocked && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                          <Lock className="w-2.5 h-2.5 text-amber-600" /> Locked
                        </span>
                      )}
                    </label>
                    {!isRecordLocked && (
                      <span className={`text-[10px] font-mono ${middleName.length >= 50 ? 'text-rose-600 font-bold' : 'text-slate-400'}`}>
                        {middleName.length}/50
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. Cruz"
                    value={middleName}
                    readOnly={isRecordLocked}
                    maxLength={50}
                    onChange={e => {
                      if (isRecordLocked) return;
                      const val = e.target.value;
                      if (val === '' || /^[A-Za-z\s\-]*$/.test(val)) {
                        setMiddleName(val);
                      }
                    }}
                    className={`w-full p-2.5 rounded-xl focus:outline-none ${
                      isRecordLocked
                        ? 'bg-slate-100 text-slate-600 border border-slate-200 cursor-not-allowed select-none'
                        : 'bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:bg-white'
                    }`}
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-bold text-slate-700 flex items-center gap-1.5">
                      <span>Last Name</span>
                      <span className="text-rose-500">*</span>
                      {isRecordLocked && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                          <Lock className="w-2.5 h-2.5 text-amber-600" /> Locked
                        </span>
                      )}
                    </label>
                    {!isRecordLocked && (
                      <span className={`text-[10px] font-mono ${lastName.length >= 50 ? 'text-rose-600 font-bold' : 'text-slate-400'}`}>
                        {lastName.length}/50
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. Vance"
                    value={lastName}
                    readOnly={isRecordLocked}
                    maxLength={50}
                    onChange={e => {
                      if (isRecordLocked) return;
                      const val = e.target.value;
                      if (val === '' || /^[A-Za-z\s\-]*$/.test(val)) {
                        setLastName(val);
                      }
                    }}
                    className={`w-full p-2.5 rounded-xl focus:outline-none ${
                      isRecordLocked
                        ? 'bg-slate-100 text-slate-600 border border-slate-200 cursor-not-allowed select-none'
                        : 'bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:bg-white'
                    }`}
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1.5">
                    <span>Sex</span>
                    <span className="text-rose-500">*</span>
                    {isRecordLocked && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                        <Lock className="w-2.5 h-2.5 text-amber-600" /> Locked
                      </span>
                    )}
                  </label>
                  <select
                    value={gender}
                    disabled={isRecordLocked}
                    onChange={e => setGender(e.target.value)}
                    className={`w-full p-2.5 rounded-xl focus:outline-none ${
                      isRecordLocked
                        ? 'bg-slate-100 text-slate-600 border border-slate-200 cursor-not-allowed select-none'
                        : 'bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:bg-white'
                    }`}
                  >
                    <option value="">-- Select Sex --</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-bold text-slate-700 flex items-center gap-1.5">
                      <span>Birthdate</span>
                      <span className="text-rose-500">*</span>
                      {isRecordLocked && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                          <Lock className="w-2.5 h-2.5 text-amber-600" /> Locked
                        </span>
                      )}
                    </label>
                    {birthdate && calculateAge(birthdate) < 18 && (
                      <span className="text-[10px] font-bold text-rose-600">
                        (Must be ≥ 18)
                      </span>
                    )}
                  </div>
                  <input
                    type="date"
                    value={birthdate}
                    readOnly={isRecordLocked}
                    disabled={isRecordLocked}
                    max={maxBirthdateFor18}
                    onChange={e => {
                      if (isRecordLocked) return;
                      setBirthdate(e.target.value);
                    }}
                    className={`w-full p-2.5 rounded-xl focus:outline-none ${
                      isRecordLocked
                        ? 'bg-slate-100 text-slate-600 border border-slate-200 cursor-not-allowed select-none'
                        : birthdate && calculateAge(birthdate) < 18
                        ? 'bg-rose-50 border-2 border-rose-400 text-rose-800 focus:ring-rose-500 focus:ring-2 focus:bg-white'
                        : 'bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:bg-white'
                    }`}
                  />
                  {birthdate && calculateAge(birthdate) < 18 && (
                    <span className="text-[10px] text-rose-600 font-semibold block mt-1">
                      Applicant must be at least 18 years old as of the current date.
                    </span>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Mobile Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    inputMode="tel"
                    placeholder="+63 917 123 4567 or 0917 123 4567"
                    value={phone}
                    maxLength={16}
                    onChange={e => setPhone(formatPhilippinePhone(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                  />
                  {phone && !validatePhilippinePhone(phone) && (
                    <span className="text-[10px] text-rose-500 font-semibold block mt-0.5">
                      Must be a valid Philippine mobile number (+63 9XX... or 09XX...)
                    </span>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Academic Degree Program <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={program}
                    onChange={e => setProgram(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                  >
                    {academicPrograms.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Year Level</label>
                  <select
                    value={yearLevel}
                    onChange={e => setYearLevel(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                    <option value="5th Year">5th Year</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Cumulative GWA / GPA <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
                    placeholder="e.g. 1.25"
                    value={gwa}
                    onKeyDown={(e) => handleNumericKeyDown(e, true)}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === '' || /^\d*\.?\d{0,2}$/.test(val)) {
                        setGwa(val);
                      }
                    }}
                    className={`w-full p-2.5 rounded-xl font-bold focus:ring-2 focus:bg-white focus:outline-none ${
                      (gwa !== '' && (Number(gwa) < 1.0 || Number(gwa) > 5.0)) || isGwaFailingRequirement
                        ? 'bg-rose-50 border-2 border-rose-400 text-rose-800 focus:ring-rose-500'
                        : 'bg-slate-50 border border-slate-200 text-indigo-600 focus:ring-indigo-500'
                    }`}
                  />
                  {gwa !== '' && (Number(gwa) < 1.0 || Number(gwa) > 5.0) && (
                    <span className="text-[10px] text-rose-600 font-semibold block mt-1">
                      GPA must be between 1.00 and 5.00
                    </span>
                  )}
                  {isGwaFailingRequirement && (
                    <span className="text-[10px] text-rose-600 font-bold block mt-1 flex items-center space-x-1">
                      <AlertCircle className="w-3 h-3 inline shrink-0" />
                      <span>Does not meet minimum requirement ({scholarship.min_gwa.toFixed(2)}) for this scholarship</span>
                    </span>
                  )}
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Annual Gross Family Income (₱) <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      readOnly
                      disabled
                      value={calculatedAnnualIncome > 0 ? `₱${calculatedAnnualIncome.toLocaleString()}` : '₱0 (auto-calculated)'}
                      className={`w-full p-2.5 bg-slate-100 rounded-xl font-bold cursor-not-allowed text-slate-800 border ${
                        isIncomeExceeded
                          ? 'border-rose-400 bg-rose-50/50 text-rose-800'
                          : 'border-slate-200'
                      }`}
                    />
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-1">
                    Auto-calculated sum of all family members' annual incomes{isWorkingStudent ? " + student's annual income" : ''}.
                  </span>
                  {isIncomeExceeded && (
                    <span className="text-[10px] text-rose-600 font-bold block mt-1 flex items-center space-x-1">
                      <AlertCircle className="w-3 h-3 inline shrink-0" />
                      <span>Exceeds maximum annual income limit of ₱{scholarship.max_family_income.toLocaleString()}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Working Student Section */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <label htmlFor="working-student-toggle" className="font-bold text-slate-800 text-xs cursor-pointer">
                      Working Student?
                    </label>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Toggle on if you are currently working or earning personal income while studying.
                    </p>
                  </div>

                  {/* Standard Unified Binary Switch */}
                  <div className="flex items-center self-start sm:self-auto">
                    <button
                      id="working-student-toggle"
                      type="button"
                      role="switch"
                      aria-checked={isWorkingStudent}
                      onClick={() => {
                        const next = !isWorkingStudent;
                        setIsWorkingStudent(next);
                        if (!next) {
                          setStudentAnnualIncome('');
                        }
                      }}
                      className="inline-flex items-center gap-2.5 py-1 px-1.5 rounded-full hover:bg-slate-200/50 transition-colors cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
                      title={isWorkingStudent ? 'Working Student: Yes (Click to turn off)' : 'Working Student: No (Click to turn on)'}
                    >
                      {/* Track */}
                      <span
                        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                          isWorkingStudent ? 'bg-indigo-600' : 'bg-slate-300'
                        }`}
                      >
                        {/* Thumb */}
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-md transform transition-transform duration-200 ease-in-out ${
                            isWorkingStudent ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </span>

                      {/* Integrated text beside track (no disjointed square button) */}
                      <span
                        className={`text-xs font-bold transition-colors duration-200 w-7 text-left select-none ${
                          isWorkingStudent ? 'text-indigo-600' : 'text-slate-500'
                        }`}
                      >
                        {isWorkingStudent ? 'Yes' : 'No'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Dynamically displayed numeric-only text box */}
                {isWorkingStudent && (
                  <div
                    className="mt-3 pt-3 border-t border-slate-200 animate-in fade-in slide-in-from-top-1 duration-200"
                  >
                    <label className="block font-bold text-slate-700 text-xs mb-1">
                      Student's Annual Income (₱) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative max-w-sm">
                      <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-xs">₱</span>
                      <input
                        id="student-annual-income-input"
                        type="text"
                        autoFocus
                        required={isWorkingStudent}
                        inputMode="numeric"
                        placeholder="e.g. 120,000"
                        value={studentAnnualIncome}
                        onKeyDown={(e) => handleNumericKeyDown(e, false)}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/\D/g, '');
                          if (!raw) {
                            setStudentAnnualIncome('');
                          } else {
                            setStudentAnnualIncome(Number(raw).toLocaleString('en-US'));
                          }
                        }}
                        className="w-full pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 block mt-1">
                      Enter your personal annual earnings. This is automatically factored into the Annual Gross Family Income.
                    </span>
                  </div>
                )}
              </div>

              {/* Household Members Section */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase">Household Members</h4>
                    <p className="text-[11px] text-slate-500">Add parents, guardians or working dependents in your household.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAddHm(!showAddHm)}
                    className="text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-600 hover:text-white px-3 py-1.5 rounded-lg transition-colors flex items-center space-x-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Member</span>
                  </button>
                </div>

                {/* Form to add household member with split names */}
                {showAddHm && (
                  <div className="bg-white p-3 rounded-xl border border-indigo-200 space-y-3 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500">First Name *</label>
                        <input
                          type="text"
                          placeholder="e.g. Robert"
                          value={newHmFirstName}
                          maxLength={50}
                          onChange={e => {
                            const val = e.target.value;
                            if (val === '' || /^[A-Za-z\s\-]*$/.test(val)) setNewHmFirstName(val);
                          }}
                          className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500">Middle Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Alan"
                          value={newHmMiddleName}
                          maxLength={50}
                          onChange={e => {
                            const val = e.target.value;
                            if (val === '' || /^[A-Za-z\s\-]*$/.test(val)) setNewHmMiddleName(val);
                          }}
                          className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500">Last Name *</label>
                        <input
                          type="text"
                          placeholder="e.g. Vance"
                          value={newHmLastName}
                          maxLength={50}
                          onChange={e => {
                            const val = e.target.value;
                            if (val === '' || /^[A-Za-z\s\-]*$/.test(val)) setNewHmLastName(val);
                          }}
                          className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500">Relation</label>
                        <select
                          value={newHmRelation}
                          onChange={e => setNewHmRelation(e.target.value)}
                          className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                        >
                          <option value="Father">Father</option>
                          <option value="Mother">Mother</option>
                          <option value="Guardian">Guardian</option>
                          <option value="Sibling">Sibling</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500">Occupation</label>
                        <input
                          type="text"
                          placeholder="e.g. Engineer"
                          value={newHmOccupation}
                          maxLength={50}
                          onChange={e => setNewHmOccupation(e.target.value)}
                          className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500">Annual Income (₱)</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="300,000"
                          value={newHmIncome}
                          onKeyDown={(e) => handleNumericKeyDown(e, false)}
                          onChange={e => {
                            const raw = e.target.value.replace(/\D/g, '');
                            if (!raw) {
                              setNewHmIncome('');
                            } else {
                              setNewHmIncome(Number(raw).toLocaleString('en-US'));
                            }
                          }}
                          className="w-full p-2 border border-slate-200 rounded-lg text-xs font-bold"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end space-x-2">
                      <button
                        type="button"
                        onClick={() => setShowAddHm(false)}
                        className="px-3 py-1 bg-slate-200 text-slate-700 text-xs rounded-lg cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleAddHouseholdMember}
                        className="px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded-lg cursor-pointer"
                      >
                        Save Member
                      </button>
                    </div>
                  </div>
                )}

                {/* List of Household Members */}
                {householdMembers.length > 0 ? (
                  <div className="space-y-1.5">
                    {householdMembers.map(m => (
                      <div key={m.id}>
                        {editingHmId === m.id ? (
                          // Inline Edit Form
                          <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-300 space-y-3 text-xs">
                            <p className="font-bold text-indigo-800 text-[11px] uppercase tracking-wide">Editing: {m.name}</p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500">First Name *</label>
                                <input type="text" value={editHmFirstName} maxLength={50}
                                   onChange={e => { const v = e.target.value; if (v === '' || /^[A-Za-z\s\-]*$/.test(v)) setEditHmFirstName(v); }}
                                   className="w-full p-2 border border-slate-200 rounded-lg text-xs" />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500">Middle Name</label>
                                <input type="text" value={editHmMiddleName} maxLength={50}
                                   onChange={e => { const v = e.target.value; if (v === '' || /^[A-Za-z\s\-]*$/.test(v)) setEditHmMiddleName(v); }}
                                   className="w-full p-2 border border-slate-200 rounded-lg text-xs" />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500">Last Name *</label>
                                <input type="text" value={editHmLastName} maxLength={50}
                                   onChange={e => { const v = e.target.value; if (v === '' || /^[A-Za-z\s\-]*$/.test(v)) setEditHmLastName(v); }}
                                   className="w-full p-2 border border-slate-200 rounded-lg text-xs" />
                              </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500">Relation</label>
                                <select value={editHmRelation} onChange={e => setEditHmRelation(e.target.value)}
                                  className="w-full p-2 border border-slate-200 rounded-lg text-xs">
                                  <option value="Father">Father</option>
                                  <option value="Mother">Mother</option>
                                  <option value="Guardian">Guardian</option>
                                  <option value="Sibling">Sibling</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500">Occupation</label>
                                <input type="text" value={editHmOccupation} maxLength={50}
                                  onChange={e => setEditHmOccupation(e.target.value)}
                                  className="w-full p-2 border border-slate-200 rounded-lg text-xs" />
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold text-slate-500">Annual Income (₱)</label>
                                <input type="text" inputMode="numeric" value={editHmIncome}
                                  onKeyDown={e => handleNumericKeyDown(e, false)}
                                  onChange={e => {
                                    const raw = e.target.value.replace(/\D/g, '');
                                    if (!raw) { setEditHmIncome(''); } else { setEditHmIncome(Number(raw).toLocaleString('en-US')); }
                                  }}
                                  className="w-full p-2 border border-slate-200 rounded-lg text-xs font-bold" />
                              </div>
                            </div>
                            <div className="flex justify-end space-x-2">
                              <button type="button" onClick={() => setEditingHmId(null)}
                                className="px-3 py-1 bg-slate-200 text-slate-700 text-xs rounded-lg cursor-pointer">Cancel</button>
                              <button type="button" onClick={handleSaveEditHm}
                                className="px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded-lg cursor-pointer">Save Changes</button>
                            </div>
                          </div>
                        ) : (
                          // Normal display row
                          <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex justify-between items-center text-xs">
                            <div>
                              <span className="font-bold text-slate-900">{m.name}</span>{' '}
                              <span className="text-slate-500">({m.relation})</span> —{' '}
                              <span className="text-slate-600">{m.occupation}</span>
                            </div>
                            <div className="flex items-center space-x-3">
                              <span className="font-bold text-indigo-600">₱{(m.annual_income !== undefined ? m.annual_income : m.monthly_income * 12).toLocaleString()} / year</span>
                              <button type="button" onClick={() => handleStartEditHm(m)}
                                className="text-indigo-500 hover:text-indigo-700 cursor-pointer" title="Edit member">
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button type="button" onClick={() => handleRemoveHouseholdMember(m.id)}
                                className="text-rose-500 hover:text-rose-700 cursor-pointer">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 italic">No household members added yet.</p>
                )}
              </div>

            </motion.div>
          )}

          {/* STEP 2: Document Uploads */}
          {step === 2 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Step 2: Upload Required Supporting Documents
                </h3>
                <p className="text-xs text-slate-500">
                  Upload official academic & financial documents. Formats: PDF, JPG, PNG, WEBP (Max 10MB per file).
                </p>
              </div>

              {/* Reapplication / Renewal Pre-Loaded Files Banner */}
              {(isEffectiveRenewal || retrievalFeedback.type === 'success') && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-3.5 flex items-start space-x-2.5 text-xs text-indigo-950 shadow-2xs">
                  <FileCheck className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold">Pre-loaded Files from Previous Record</span>
                      {effectiveRenewedFrom && (
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-indigo-200/80 text-indigo-900">
                          Ref: {effectiveRenewedFrom}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-indigo-800 mt-0.5 leading-relaxed">
                      Your previously submitted files have been automatically attached. You may click <strong>Inspect/Preview</strong> to review them, or click the <strong>Trash/Remove</strong> button on any file to upload a new or updated document (e.g. latest Certificate of Enrollment, updated True Copy of Grades, or current proof of income).
                    </p>
                  </div>
                </div>
              )}

              {/* Dynamic Document Upload Slots */}
              <div className="space-y-4">
                {docSlots.map((label, idx) => (
                  <DocumentUploader
                    key={idx}
                    type={idx === 0 ? 'com' : idx === 1 ? 'itr' : idx === 2 ? 'id' : 'other'}
                    title={`${idx + 1}. ${label}`}
                    subtitle={`Upload the required document: ${label}`}
                    required={true}
                    document={dynamicDocs[idx] || null}
                    onDocumentChange={(doc) => setDynamicDoc(idx, doc)}
                    onPreviewRequest={(doc) => setPreviewDoc(doc)}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 3: Summary Review & Confirmation */}
          {step === 3 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Step 3: Review Application & Finalize Submission
                </h3>
                <p className="text-xs text-slate-500">
                  Please carefully review all information and verified documents before finalizing your submission.
                </p>
              </div>

              {/* Review Card Summary */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4 text-xs">
                
                {(isEffectiveRenewal || retrievalFeedback.type === 'success') && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center space-x-2 text-xs text-emerald-900 font-medium">
                    <CheckIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>
                      Scholarship Renewal / Reapplication Submission
                      {effectiveRenewedFrom ? ` (Original Reference: ${effectiveRenewedFrom})` : ''}.
                    </span>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-3 border-b border-slate-200 pb-3">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Scholarship Program</span>
                    <span className="font-bold text-indigo-600">{scholarship.title}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Student ID Number</span>
                    <span className="font-mono font-bold text-slate-900">{studentNumber}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Applicant Full Name</span>
                    <span className="font-bold text-slate-900">
                      {firstName} {middleName ? `${middleName} ` : ''}{lastName} {gender ? `(${gender})` : ''}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Birthdate</span>
                    <span className="font-medium text-slate-800">{birthdate || '—'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Email Address</span>
                    <span className="font-medium text-slate-800">{email}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Degree Program & Year</span>
                    <span className="font-medium text-slate-800">{program} ({yearLevel})</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Cumulative GWA</span>
                    <span className="font-bold text-indigo-600">{gwa !== '' ? Number(gwa).toFixed(2) : '—'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Annual Gross Family Income</span>
                    <span className="font-bold text-slate-900">₱{calculatedAnnualIncome.toLocaleString()} / year</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Attached Files</span>
                    <span className="font-bold text-emerald-600">
                      {dynamicDocs.filter(Boolean).length} / {docSlots.length} Files Attached
                    </span>
                  </div>
                </div>

                {/* Attached Documents Quick Check List */}
                <div className="space-y-2 pt-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    Attached Supporting Documents:
                  </span>
                  {[...dynamicDocs].filter(Boolean).length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No files attached.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {dynamicDocs.filter(Boolean).map((doc, idx) => (
                        <div key={doc!.id || idx} className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between">
                          <div className="flex items-center space-x-2 min-w-0">
                            <FileText className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                            <span className="font-bold text-slate-800 truncate">{doc!.name}</span>
                            <span className="text-[10px] text-slate-400 font-mono">({doc!.size})</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setPreviewDoc(doc!)}
                            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center space-x-1 px-2 py-1 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition cursor-pointer"
                          >
                            <Eye className="w-3 h-3" />
                            <span>Inspect</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Duplicate Rejection Notice in Step 3 if applicable */}
                {duplicateCheck.isDuplicate && duplicateCheck.existingApp && (
                  <div className="bg-rose-50 border-2 border-rose-500 rounded-xl p-3.5 flex items-start space-x-3 text-xs text-rose-900">
                    <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="font-bold text-rose-950">You already applied for this scholarship</p>
                      <p className="text-rose-800 text-[11px]">
                        University policy prevents multiple submissions for the same program. Existing reference code: <strong>{duplicateCheck.existingApp.reference_code}</strong> ({duplicateCheck.existingApp.status}).
                      </p>
                    </div>
                  </div>
                )}

                {/* Terms Agreement Checkbox */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
                  <label className="flex items-start space-x-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreeTerms}
                      onChange={e => setAgreeTerms(e.target.checked)}
                      className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-xs text-slate-700 leading-relaxed">
                      I hereby certify that all information and attached documentation are authentic, valid, and correct. I authorize the scholarship evaluation committee to verify my academic records.
                    </span>
                  </label>
                </div>

              </div>
            </motion.div>
          )}

          {/* STEP 4: Success Confirmation Card */}
          {step === 4 && createdApp && (
            <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6 text-center py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-sm">
                <Sparkles className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-bold text-slate-900">
                  Application Submitted Successfully!
                </h3>
                <p className="text-xs text-slate-600 max-w-md mx-auto">
                  Your scholarship application has been registered and is under review by the scholarship evaluation committee.
                </p>
              </div>

              {/* Reference Code Display Box */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-3 max-w-md mx-auto shadow-xs">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Your Tracking Reference Code
                </span>
                <div className="flex items-center justify-center space-x-3">
                  <span className="text-2xl sm:text-3xl font-black font-mono text-indigo-600 tracking-widest select-all">
                    {createdApp.reference_code}
                  </span>
                  <button
                    onClick={copyRefCode}
                    className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-700 transition-colors shadow-2xs cursor-pointer"
                    title="Copy Reference Code"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
                {copiedRef && <p className="text-[11px] font-bold text-emerald-600">Copied to Clipboard!</p>}
                <p className="text-[11px] text-slate-500">
                  Save or copy this reference code to track your application status anytime on the Student Portal.
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  type="button"
                  onClick={() => {
                    if (onTrackExisting) {
                      onTrackExisting(createdApp.reference_code);
                    }
                    onClose();
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-3 px-6 rounded-xl transition-colors shadow-xs cursor-pointer inline-flex items-center justify-center space-x-1.5"
                >
                  <Clock className="w-4 h-4" />
                  <span>Track Status Now</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-xs py-3 px-6 rounded-xl transition-colors shadow-2xs cursor-pointer"
                >
                  Done & Close
                </button>
              </div>
            </motion.div>
          )}

        </div>

        {/* Modal Wizard Navigation Footer */}
        {step <= 3 && (
          <div className="bg-slate-100 p-4 border-t border-slate-200 flex justify-between items-center">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((step - 1) as 1 | 2 | 3)}
                className="flex items-center space-x-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-white px-4 py-2.5 rounded-xl border border-slate-300 shadow-2xs cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            ) : <div />}

            {step === 1 && (
              <button
                type="button"
                disabled={!isStep1Valid}
                onClick={() => {
                  if (validateStep1()) setStep(2);
                }}
                className={`flex items-center space-x-1.5 text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-xs ${
                  !isStep1Valid
                    ? 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed'
                    : 'text-white bg-slate-900 hover:bg-indigo-600 cursor-pointer'
                }`}
              >
                <span>
                  {duplicateCheck.isDuplicate
                    ? 'You already applied for this scholarship'
                    : !isStep1Valid
                    ? 'Fill Required Details to Continue'
                    : 'Continue to Uploads'}
                </span>
                {isStep1Valid && <ChevronRight className="w-4 h-4" />}
              </button>
            )}

            {step === 2 && (
              <button
                type="button"
                disabled={!isStep2Valid}
                onClick={() => {
                  if (validateStep2()) setStep(3);
                }}
                className={`flex items-center space-x-1.5 text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-xs ${
                  !isStep2Valid
                    ? 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed'
                    : 'text-white bg-slate-900 hover:bg-indigo-600 cursor-pointer'
                }`}
              >
                <span>{!isStep2Valid ? `Upload All ${docSlots.length} Required Documents` : 'Continue to Summary'}</span>
                {isStep2Valid && <ChevronRight className="w-4 h-4" />}
              </button>
            )}

            {step === 3 && (
              <button
                type="button"
                disabled={!isStep3Valid || isSubmitting}
                onClick={handleSubmitApplication}
                className={`flex items-center space-x-1.5 text-xs font-bold px-6 py-2.5 rounded-xl transition-colors shadow-xs uppercase tracking-wider ${
                  !isStep3Valid || isSubmitting
                    ? 'bg-slate-200 text-slate-400 border border-slate-300 cursor-not-allowed'
                    : 'text-white bg-indigo-600 hover:bg-indigo-700 cursor-pointer'
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
                <span>
                  {isSubmitting
                    ? 'Recording to Cloud Database...'
                    : duplicateCheck.isDuplicate
                    ? 'You already applied for this scholarship'
                    : !agreeTerms
                    ? 'Please Accept the Declaration to Submit'
                    : isRenewal
                    ? 'Confirm & Submit Renewal'
                    : 'Confirm & Submit Application'}
                </span>
              </button>
            )}
          </div>
        )}

      </motion.div>

      {/* Interactive Document Viewer Modal */}
      {previewDoc && (
        <DocumentViewerModal
          document={previewDoc}
          studentName={`${firstName} ${lastName}`.trim()}
          studentNumber={studentNumber}
          onClose={() => setPreviewDoc(null)}
        />
      )}
    </div>
  );
};
