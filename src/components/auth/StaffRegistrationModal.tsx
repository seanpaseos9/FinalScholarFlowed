import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  UserPlus,
  RotateCcw,
  Send,
  AlertCircle,
  CheckCircle2,
  Building,
  Briefcase,
  Mail,
  Phone,
  Calendar,
  CreditCard,
  User,
  ShieldCheck,
} from 'lucide-react';
import { StaffApplication, UserProfile } from '../../types';

interface StaffRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmitApplication?: (appData: Omit<StaffApplication, 'id' | 'status' | 'created_at' | 'updated_at'>) => Promise<boolean>;
  onSubmit?: (appData: Omit<StaffApplication, 'id' | 'status' | 'created_at' | 'updated_at'>) => Promise<boolean>;
  onOpenTracker?: () => void;
  onTrackRedirect?: () => void;
  staffApplications?: StaffApplication[];
  users?: UserProfile[];
}

const POSITIONS = [
  'Faculty Reviewer',
  'Scholarship Coordinator',
  'Academic Advisor',
  'Department Head',
  'Admissions Officer',
  'Administrative Assistant',
  'Dean / Associate Dean',
  'Financial Aid Officer',
];

const DEPARTMENTS = [
  'College of Computer Studies',
  'College of Engineering',
  'College of Science',
  'College of Business & Management',
  'College of Education',
  'College of Arts and Letters',
  'Office of Student Affairs',
  'Scholarship and Financial Aid Office',
  'Office of Admissions & Records',
  'University Health Services',
  'Finance and Accounting Department',
  'Information Technology Services',
  'Human Resources Department',
  'Library and Learning Resource Center',
];

export const StaffRegistrationModal: React.FC<StaffRegistrationModalProps> = ({
  isOpen,
  onClose,
  onSubmitApplication,
  onSubmit,
  onOpenTracker,
  onTrackRedirect,
  staffApplications = [],
  users = [],
}) => {
  const actualSubmit = onSubmitApplication || onSubmit;
  const actualTracker = onOpenTracker || onTrackRedirect;
  // Form State
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [staffIdNumber, setStaffIdNumber] = useState('');
  const [department, setDepartment] = useState('');
  const [position, setPosition] = useState('');

  // Status & Submission States
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submittedApp, setSubmittedApp] = useState<StaffApplication | null>(null);

  // Form State Reset on open/close to allow fresh registrations without lingering success prompt
  React.useEffect(() => {
    if (isOpen) {
      setSubmittedApp(null);
      setErrorMessage(null);
      setSubmitting(false);
      handleResetOrClear();
    }
  }, [isOpen]);

  const handleModalClose = () => {
    setSubmittedApp(null);
    setErrorMessage(null);
    setSubmitting(false);
    handleResetOrClear();
    onClose();
  };

  // Close on Escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !submitting) {
        handleModalClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, submitting]);

  // Age calculation helper
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

  // Strict Name validation regex (letters, spaces, hyphens only)
  const validateLettersOnly = (val: string) => /^[A-Za-z\s\-]+$/.test(val.trim());

  // Department validation (letters, spaces, hyphens, ampersand, periods)
  const validateDepartment = (val: string) => /^[A-Za-z\s\-&.,]+$/.test(val.trim());

  // Email format validation
  const validateEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());

  // Philippine Mobile Phone formatting & validation
  const formatPhilippinePhone = (val: string) => {
    const raw = val.replace(/[^\d+]/g, '');
    if (raw.startsWith('+63')) {
      const digits = raw.slice(3).replace(/\D/g, '').slice(0, 10);
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

  const handleResetOrClear = () => {
    setFirstName('');
    setMiddleName('');
    setLastName('');
    setEmail('');
    setPhone('');
    setBirthdate('');
    setStaffIdNumber('');
    setDepartment('');
    setPosition('');
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // 1. First & Last name required, letters only
    if (!firstName.trim()) {
      setErrorMessage('First Name is required.');
      return;
    }
    if (!validateLettersOnly(firstName)) {
      setErrorMessage('First Name can only contain letters, spaces, and hyphens.');
      return;
    }

    if (middleName.trim() && !validateLettersOnly(middleName)) {
      setErrorMessage('Middle Name can only contain letters, spaces, and hyphens.');
      return;
    }

    if (!lastName.trim()) {
      setErrorMessage('Last Name is required.');
      return;
    }
    if (!validateLettersOnly(lastName)) {
      setErrorMessage('Last Name can only contain letters, spaces, and hyphens.');
      return;
    }

    // 2. Institutional Email validation
    if (!email.trim() || !validateEmail(email)) {
      setErrorMessage('Please provide a valid institutional email address (e.g. name@meridian.edu).');
      return;
    }

    // 3. Philippine Phone Number validation
    if (!phone.trim() || !validatePhilippinePhone(phone)) {
      setErrorMessage('Phone Number must strictly follow Philippine phone format (e.g. +63 917 123 4567 or 0917 123 4567).');
      return;
    }

    // 4. Birthdate validation (at least 18 years old)
    if (!birthdate) {
      setErrorMessage('Birthdate is required.');
      return;
    }
    const age = calculateAge(birthdate);
    if (age < 18) {
      setErrorMessage('Applicant must be at least 18 years old as of the current date.');
      return;
    }

    // 5. Staff ID Number validation: numbers only, strictly limited to exactly 10 digits
    if (!staffIdNumber.trim() || !/^\d{10}$/.test(staffIdNumber.trim())) {
      setErrorMessage('Staff ID Number must accept numbers only and be strictly limited to exactly 10 digits.');
      return;
    }

    // 6. Department/Office: letters only (Required)
    if (!department.trim()) {
      setErrorMessage('Department/Office is required.');
      return;
    }
    if (!validateDepartment(department)) {
      setErrorMessage('Department/Office can only contain letters, spaces, and standard punctuation.');
      return;
    }

    // 7. Position: Dropdown selection (Required)
    if (!position) {
      setErrorMessage('Please select your Position from the dropdown menu.');
      return;
    }

    // Frontend validation: Duplicate Institutional Email prevention
    const normEmail = email.trim().toLowerCase();
    const emailExists =
      (staffApplications || []).some(
        (a) => (a.email || a.institutional_email || '').trim().toLowerCase() === normEmail
      ) ||
      (users || []).some((u) => (u.email || '').trim().toLowerCase() === normEmail);

    if (emailExists) {
      setErrorMessage(`The Institutional Email "${email.trim()}" is already registered in the system.`);
      return;
    }

    // Frontend validation: Duplicate Staff ID Number prevention
    const normStaffId = staffIdNumber.trim();
    const staffIdExists =
      (staffApplications || []).some(
        (a) => (a.staff_id || a.staff_id_number || '').trim() === normStaffId
      ) ||
      (users || []).some((u) => u.id === `user-${normStaffId}` || u.id === normStaffId);

    if (staffIdExists) {
      setErrorMessage(`The Staff ID Number "${staffIdNumber.trim()}" is already registered in the system.`);
      return;
    }

    setSubmitting(true);
    try {
      const fullName = `${firstName.trim()} ${middleName.trim() ? middleName.trim() + ' ' : ''}${lastName.trim()}`;
      const newStaffAppData: Omit<StaffApplication, 'id' | 'status' | 'created_at' | 'updated_at'> = {
        first_name: firstName.trim(),
        middle_name: middleName.trim() || undefined,
        last_name: lastName.trim(),
        full_name: fullName,
        email: email.trim().toLowerCase(),
        institutional_email: email.trim().toLowerCase(),
        phone: phone.trim(),
        phone_number: phone.trim(),
        birthdate,
        staff_id: staffIdNumber.trim(),
        staff_id_number: staffIdNumber.trim(),
        department: department.trim(),
        position,
      };

      const success = actualSubmit ? await actualSubmit(newStaffAppData) : true;
      if (success) {
        const newStaffApp: StaffApplication = {
          ...newStaffAppData,
          id: `staff-app-${Date.now()}`,
          status: 'Pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        // Reset form fields immediately upon completion
        handleResetOrClear();
        setSubmittedApp(newStaffApp);
      } else {
        setErrorMessage('Failed to submit staff account registration. Please try again.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit staff account registration.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.96 }}
        className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8"
      >
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-6 border-b border-slate-800 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Staff Account Registration</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Meridian University Faculty &amp; Staff Credential Request
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleModalClose}
            className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 p-2 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {submittedApp ? (
              // Confirmation Prompt View (Prevent immediate login & display confirmation)
              <motion.div
                key="confirmation"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6 text-center py-4"
              >
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center shadow-xs">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div className="space-y-2 max-w-md mx-auto">
                  <h3 className="text-lg font-bold text-slate-900">Application Submitted</h3>
                  <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 text-xs font-medium text-amber-900 leading-relaxed text-left">
                    <p className="font-bold text-amber-950 mb-1 flex items-center space-x-1.5">
                      <ShieldCheck className="w-4 h-4 text-amber-700 inline shrink-0" />
                      <span>Administrative Approval Notice</span>
                    </p>
                    <p className="text-amber-800">
                      "Your information has been sent to the admin and is subject to approval. If there are any concerns, please contact the admin."
                    </p>
                  </div>
                </div>

                {/* Account Details Box for Tracking */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-left max-w-md mx-auto text-xs space-y-2">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                    <span className="text-slate-500 font-medium">Applicant Name:</span>
                    <span className="font-bold text-slate-900">{submittedApp.full_name}</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                    <span className="text-slate-500 font-medium">Staff ID Number:</span>
                    <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                      {submittedApp.staff_id_number}
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                    <span className="text-slate-500 font-medium">Institutional Email:</span>
                    <span className="font-medium text-slate-800">{submittedApp.email}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Application Status:</span>
                    <span className="font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                      Pending Admin Approval
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSubmittedApp(null);
                      handleResetOrClear();
                      setErrorMessage(null);
                    }}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
                  >
                    Register Another Account
                  </button>
                  {actualTracker && (
                    <button
                      type="button"
                      onClick={() => {
                        handleModalClose();
                        actualTracker();
                      }}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer shadow-xs"
                    >
                      Track Application Status
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleModalClose}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  >
                    Return to Login
                  </button>
                </div>
              </motion.div>
            ) : (
              // Registration Form
              <form onSubmit={handleSubmit} className="space-y-4">
                {errorMessage && (
                  <div className="bg-rose-50 text-rose-800 p-3 rounded-xl border border-rose-200 text-xs font-medium flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Name Row: First, Middle, Last */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      First Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Corazon"
                      value={firstName}
                      maxLength={50}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' || /^[A-Za-z\s\-]*$/.test(val)) setFirstName(val);
                      }}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Middle Name <span className="text-slate-400 font-normal">(optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Vicente"
                      value={middleName}
                      maxLength={50}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' || /^[A-Za-z\s\-]*$/.test(val)) setMiddleName(val);
                      }}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Last Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Santos"
                      value={lastName}
                      maxLength={50}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' || /^[A-Za-z\s\-]*$/.test(val)) setLastName(val);
                      }}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Institutional Email & Philippine Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Institutional Email <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="email"
                        placeholder="e.g. csantos@meridian.edu"
                        value={email}
                        maxLength={100}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Mobile Phone Number <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        inputMode="tel"
                        placeholder="+63 917 123 4567 or 0917 123 4567"
                        value={phone}
                        maxLength={16}
                        onChange={(e) => setPhone(formatPhilippinePhone(e.target.value))}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Birthdate & Staff ID Number */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-bold text-slate-700">
                        Birthdate <span className="text-rose-500">*</span>
                      </label>
                      {birthdate && calculateAge(birthdate) < 18 && (
                        <span className="text-[10px] font-bold text-rose-600">
                          (Must be ≥ 18)
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type="date"
                        value={birthdate}
                        max={maxBirthdateFor18}
                        onChange={(e) => setBirthdate(e.target.value)}
                        className={`w-full p-2 bg-slate-50 border rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:outline-none ${
                          birthdate && calculateAge(birthdate) < 18
                            ? 'border-rose-400 focus:ring-rose-500'
                            : 'border-slate-200 focus:ring-indigo-500'
                        }`}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs font-bold text-slate-700">
                        Staff ID Number <span className="text-rose-500">*</span>
                      </label>
                      <span className={`text-[10px] font-mono font-bold ${staffIdNumber.length === 10 ? 'text-emerald-600' : 'text-rose-500'}`}>
                        {staffIdNumber.length}/10 digits
                      </span>
                    </div>
                    <div className="relative">
                      <CreditCard className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="e.g. 2026001045"
                        value={staffIdNumber}
                        maxLength={10}
                        onKeyDown={(e) => {
                          if (['e', 'E', '+', '-', '.'].includes(e.key)) e.preventDefault();
                        }}
                        onChange={(e) => {
                          const clean = e.target.value.replace(/\D/g, '').slice(0, 10);
                          setStaffIdNumber(clean);
                        }}
                        className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Department/Office & Position */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Department / Office <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
                      >
                        <option value="">-- Select Department / Office --</option>
                        {DEPARTMENTS.map((dept) => (
                          <option key={dept} value={dept}>
                            {dept}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Position <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={position}
                        onChange={(e) => setPosition(e.target.value)}
                        className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                      >
                        <option value="">-- Select Position --</option>
                        {POSITIONS.map((pos) => (
                          <option key={pos} value={pos}>
                            {pos}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Form Controls: Reset/Clear and Submit buttons */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={handleResetOrClear}
                    disabled={submitting}
                    className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-bold transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset / Clear</span>
                  </button>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={onClose}
                      disabled={submitting}
                      className="px-4 py-2.5 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-medium transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {submitting ? (
                        <span>Submitting...</span>
                      ) : (
                        <>
                          <Send className="w-3.5 h-3.5 text-indigo-300" />
                          <span>Submit Application</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
