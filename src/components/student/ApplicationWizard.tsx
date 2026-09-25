import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Check, ChevronRight, ChevronLeft, Upload, FileText, Trash2, Plus, Pencil, CheckCircle2 as CheckIcon,
  ShieldCheck, ShieldAlert, AlertCircle, Copy, GraduationCap, DollarSign, Sparkles, Eye, Clock
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
}

export const ApplicationWizard: React.FC<ApplicationWizardProps> = ({
  scholarship,
  onClose,
  onSubmitSuccess,
  applications = [],
  onTrackExisting,
  isRenewal = false,
  renewedFrom,
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

  // Household Members
  const [householdMembers, setHouseholdMembers] = useState<HouseholdMember[]>([]);

  // Automatically calculate Annual Gross Family Income by summing household members' income * 12
  const calculatedAnnualIncome = useMemo(() => {
    const totalMonthly = householdMembers.reduce((acc, curr) => acc + (Number(curr.monthly_income) || 0), 0);
    return totalMonthly * 12;
  }, [householdMembers]);

  React.useEffect(() => {
    setMonthlyFamilyIncome(calculatedAnnualIncome > 0 ? calculatedAnnualIncome.toLocaleString('en-US') : '0');
  }, [calculatedAnnualIncome]);

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
      }
    }
  }, [isRenewal, renewedFrom, applications]);

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
    setEditHmIncome(m.monthly_income ? String(m.monthly_income) : '');
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
        monthly_income: cleanIncome,
      };
    }));
    setEditingHmId(null);
    setFormError(null);
  };

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

  const [agreeTerms, setAgreeTerms] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Real-time Duplicate Check: Checks if the applicant has already applied for this scholarship
  // program matching the same email address or student ID number (unless submitting a renewal)
  const duplicateCheck = useMemo(() => {
    if (isRenewal) return { isDuplicate: false, message: '' };
    return checkDuplicateApplication(applications, scholarship.id, email, studentNumber);
  }, [applications, scholarship.id, email, studentNumber, isRenewal]);

  // Smart Re-Application Auto-Pull: If previous application was Removed, Expired, or Rejected, pre-fill form
  React.useEffect(() => {
    if (!isRenewal && duplicateCheck.canReapply && duplicateCheck.previousApp && !reapplyAutoPulled) {
      const prev = duplicateCheck.previousApp;
      if (prev.first_name) setFirstName(prev.first_name);
      if (prev.middle_name) setMiddleName(prev.middle_name);
      if (prev.last_name) setLastName(prev.last_name);
      if (prev.gender) setGender(prev.gender);
      if (prev.birthdate) setBirthdate(prev.birthdate);
      if (prev.phone) setPhone(prev.phone);
      if (prev.program) setProgram(prev.program);
      if (prev.year_level) setYearLevel(prev.year_level);
      if (prev.gwa) setGwa(String(prev.gwa));
      if (prev.household_members && prev.household_members.length > 0) {
        setHouseholdMembers(prev.household_members);
      }
      setReapplyAutoPulled(true);
    }
  }, [isRenewal, duplicateCheck.canReapply, duplicateCheck.previousApp, reapplyAutoPulled]);

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
    setHouseholdMembers([]);
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
    setHouseholdMembers([]);
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
      monthly_income: cleanIncome,
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
      // Generate ScholarFlow reference code: SF-XXXXXXXX
      const refCode = `SF-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;

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
        monthly_family_income: Math.round(calculatedAnnualIncome / 12),
        annual_family_income: calculatedAnnualIncome,
        household_members: householdMembers,
        documents: attachedDocs,
        status: 'Pending',
        awarded_amount: 0,
        remarks: isRenewal
          ? `Renewal application submitted (Original Ref: ${renewedFrom || 'N/A'}). Under queue for committee verification.`
          : 'Application submitted successfully. Under queue for coordinator verification.',
        is_renewal: isRenewal,
        renewed_from: renewedFrom,
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
                      <h4 className="text-sm font-bold text-rose-950 mt-1">
                        You already applied for this scholarship
                      </h4>
                      <p className="text-xs text-rose-800 mt-0.5 leading-relaxed">
                        University regulations prohibit applying to the same scholarship program twice. An existing submission under <strong>{scholarship.title}</strong> was detected with your email address or student ID number.
                      </p>
                    </div>
                  </div>

                  {/* Duplicate Match Details Card */}
                  <div className="bg-white rounded-xl p-3.5 border border-rose-200 text-xs space-y-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Existing Reference Code</span>
                        <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 inline-block mt-0.5">
                          {duplicateCheck.existingApp.reference_code}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Application Status</span>
                        <span className="inline-flex items-center space-x-1 font-bold text-slate-900 mt-0.5">
                          <span className={`w-2 h-2 rounded-full ${
                            duplicateCheck.existingApp.status === 'Approved' ? 'bg-emerald-500' :
                            duplicateCheck.existingApp.status === 'Shortlisted' ? 'bg-indigo-500' :
                            duplicateCheck.existingApp.status === 'Rejected' ? 'bg-rose-500' : 'bg-amber-500'
                          }`} />
                          <span>{duplicateCheck.existingApp.status}</span>
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Matched Credential</span>
                        <span className="font-semibold text-rose-700">
                          {duplicateCheck.matchType === 'both'
                            ? `Email (${duplicateCheck.existingApp.email}) & Student ID (${duplicateCheck.existingApp.student_number})`
                            : duplicateCheck.matchType === 'email'
                            ? `Institutional Email (${duplicateCheck.existingApp.email})`
                            : `Student ID Number (${duplicateCheck.existingApp.student_number})`}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block uppercase font-bold">Submission Date</span>
                        <span className="text-slate-600">
                          {new Date(duplicateCheck.existingApp.created_at).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <p className="text-[11px] text-slate-500">
                        Check your submitted files, evaluation remarks, and committee updates:
                      </p>
                      {onTrackExisting && (
                        <button
                          type="button"
                          onClick={() => onTrackExisting(duplicateCheck.existingApp!.reference_code)}
                          className="px-3.5 py-1.5 bg-slate-900 hover:bg-indigo-600 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer flex items-center space-x-1.5 shadow-2xs"
                        >
                          <Clock className="w-3.5 h-3.5 text-indigo-300" />
                          <span>Track Existing Application</span>
                        </button>
                      )}
                    </div>
                  </div>
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
                  <label className="block font-bold text-slate-700 mb-1">
                    Student ID Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="e.g. 2024104821"
                    value={studentNumber}
                    minLength={10}
                    maxLength={10}
                    onKeyDown={(e) => handleNumericKeyDown(e, false)}
                    onChange={(e) => {
                      const clean = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setStudentNumber(clean);
                    }}
                    className={`w-full p-2.5 rounded-xl font-mono focus:ring-2 focus:bg-white focus:outline-none ${
                      duplicateCheck.isDuplicate && (duplicateCheck.matchType === 'student_number' || duplicateCheck.matchType === 'both')
                        ? 'bg-rose-50/60 border-2 border-rose-400 text-rose-900 focus:ring-rose-500'
                        : 'bg-slate-50 border border-slate-200 focus:ring-indigo-500'
                    }`}
                  />
                  {studentNumber.length > 0 && (
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
                    <label className="font-bold text-slate-700">
                      First Name <span className="text-rose-500">*</span>
                    </label>
                    <span className={`text-[10px] font-mono ${firstName.length >= 50 ? 'text-rose-600 font-bold' : 'text-slate-400'}`}>
                      {firstName.length}/50
                    </span>
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. Julian"
                    value={firstName}
                    maxLength={50}
                    onChange={e => {
                      const val = e.target.value;
                      if (val === '' || /^[A-Za-z\s\-]*$/.test(val)) {
                        setFirstName(val);
                      }
                    }}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-bold text-slate-700">
                      Middle Name
                      <span className="text-[10px] font-normal text-slate-400 ml-1.5">(optional)</span>
                    </label>
                    <span className={`text-[10px] font-mono ${middleName.length >= 50 ? 'text-rose-600 font-bold' : 'text-slate-400'}`}>
                      {middleName.length}/50
                    </span>
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. Cruz"
                    value={middleName}
                    maxLength={50}
                    onChange={e => {
                      const val = e.target.value;
                      if (val === '' || /^[A-Za-z\s\-]*$/.test(val)) {
                        setMiddleName(val);
                      }
                    }}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-bold text-slate-700">
                      Last Name <span className="text-rose-500">*</span>
                    </label>
                    <span className={`text-[10px] font-mono ${lastName.length >= 50 ? 'text-rose-600 font-bold' : 'text-slate-400'}`}>
                      {lastName.length}/50
                    </span>
                  </div>
                  <input
                    type="text"
                    placeholder="e.g. Vance"
                    value={lastName}
                    maxLength={50}
                    onChange={e => {
                      const val = e.target.value;
                      if (val === '' || /^[A-Za-z\s\-]*$/.test(val)) {
                        setLastName(val);
                      }
                    }}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Sex <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={gender}
                    onChange={e => setGender(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                  >
                    <option value="">-- Select Sex --</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Birthdate <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={birthdate}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={e => setBirthdate(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                  />
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
                    Auto-calculated from Household Members section (sum of monthly incomes × 12).
                  </span>
                  {isIncomeExceeded && (
                    <span className="text-[10px] text-rose-600 font-bold block mt-1 flex items-center space-x-1">
                      <AlertCircle className="w-3 h-3 inline shrink-0" />
                      <span>Exceeds maximum annual income limit of ₱{scholarship.max_family_income.toLocaleString()}</span>
                    </span>
                  )}
                </div>
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
                        <label className="block text-[10px] font-bold text-slate-500">Monthly Income (₱)</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="25,000"
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
                                <label className="block text-[10px] font-bold text-slate-500">Monthly Income (₱)</label>
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
                              <span className="font-bold text-indigo-600">₱{m.monthly_income.toLocaleString()}/mo</span>
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
