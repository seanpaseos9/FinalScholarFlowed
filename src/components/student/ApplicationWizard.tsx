import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Check, ChevronRight, ChevronLeft, Upload, FileText, Trash2, Plus,
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
}

export const ApplicationWizard: React.FC<ApplicationWizardProps> = ({
  scholarship,
  onClose,
  onSubmitSuccess,
  applications = [],
  onTrackExisting,
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1); // 4 is Success state

  // Form State
  const [studentNumber, setStudentNumber] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [program, setProgram] = useState('BS Computer Science');
  const [yearLevel, setYearLevel] = useState('1st Year');
  const [gwa, setGwa] = useState<number | ''>('');
  const [monthlyFamilyIncome, setMonthlyFamilyIncome] = useState<number | ''>('');

  // Household Members
  const [householdMembers, setHouseholdMembers] = useState<HouseholdMember[]>([]);

  // Temp input for adding household member
  const [newHmName, setNewHmName] = useState('');
  const [newHmRelation, setNewHmRelation] = useState('Father');
  const [newHmOccupation, setNewHmOccupation] = useState('');
  const [newHmIncome, setNewHmIncome] = useState<number | ''>('');
  const [showAddHm, setShowAddHm] = useState(false);

  // Documents (clean empty state so applicant uploads their genuine files)
  const [docCom, setDocCom] = useState<ApplicationDocument | null>(null);
  const [docItr, setDocItr] = useState<ApplicationDocument | null>(null);
  const [docId, setDocId] = useState<ApplicationDocument | null>(null);
  const [additionalDocs, setAdditionalDocs] = useState<ApplicationDocument[]>([]);
  const [previewDoc, setPreviewDoc] = useState<ApplicationDocument | null>(null);

  const [agreeTerms, setAgreeTerms] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Real-time Duplicate Check: Checks if the applicant has already applied for this scholarship
  // program matching the same email address or student ID number
  const duplicateCheck = useMemo(() => {
    return checkDuplicateApplication(applications, scholarship.id, email, studentNumber);
  }, [applications, scholarship.id, email, studentNumber]);

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

  const handleAddHouseholdMember = () => {
    if (!newHmName.trim()) return;
    const member: HouseholdMember = {
      id: `hm-${Date.now()}`,
      name: newHmName.trim(),
      relation: newHmRelation,
      occupation: newHmOccupation.trim() || 'N/A',
      monthly_income: Number(newHmIncome) || 0,
    };
    setHouseholdMembers([...householdMembers, member]);
    setNewHmName('');
    setNewHmOccupation('');
    setNewHmIncome('');
    setShowAddHm(false);
  };

  const handleRemoveHouseholdMember = (id: string) => {
    setHouseholdMembers(householdMembers.filter(m => m.id !== id));
  };

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
    if (!firstName.trim() || !lastName.trim()) {
      setFormError('Please enter your complete full name.');
      return false;
    }
    if (!email.trim() || !email.includes('@')) {
      setFormError('Please provide a valid institutional email address.');
      return false;
    }
    if (duplicateCheck.isDuplicate) {
      setFormError('You already applied for this scholarship');
      return false;
    }
    if (!phone.trim()) {
      setFormError('Please enter a valid contact telephone or mobile number.');
      return false;
    }
    if (gwa === '' || Number(gwa) <= 0 || Number(gwa) > 5.0) {
      setFormError('Please enter a valid cumulative GWA / GPA (1.00 to 5.00).');
      return false;
    }
    return true;
  };

  const isStep1Valid = Boolean(
    studentNumber.trim() &&
    /^\d+$/.test(studentNumber.trim()) &&
    firstName.trim() &&
    lastName.trim() &&
    email.trim() &&
    email.includes('@') &&
    phone.trim() &&
    gwa !== '' &&
    Number(gwa) > 0 &&
    Number(gwa) <= 5.0 &&
    !duplicateCheck.isDuplicate
  );

  // Step 2 is valid only when all 3 required documents are uploaded
  const isStep2Valid = Boolean(docCom && docItr && docId);

  // Step 3 is valid only when the terms agreement checkbox is checked
  const isStep3Valid = agreeTerms && !duplicateCheck.isDuplicate;

  const validateStep2 = () => {
    setFormError(null);
    if (!docCom || !docItr || !docId) {
      setFormError('Please ensure all 3 primary supporting files (COE, Income Proof, Student ID) are attached.');
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

      const attachedDocs = [docCom!, docItr!, docId!, ...additionalDocs].filter(Boolean);

      const newApp: Application = {
        id: `app-${Date.now()}`,
        reference_code: refCode,
        scholarship_id: scholarship.id,
        scholarship_title: scholarship.title,
        student_number: studentNumber.trim(),
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        program,
        year_level: yearLevel,
        gwa: Number(gwa) || 1.5,
        monthly_family_income: Number(monthlyFamilyIncome) || 0,
        household_members: householdMembers,
        documents: attachedDocs,
        status: 'Pending',
        awarded_amount: 0,
        remarks: 'Application submitted successfully. Under queue for coordinator verification.',
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
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                  Step 1: Student Academic & Contact Details
                </h3>
                <p className="text-xs text-slate-500">
                  Ensure all details accurately match your official university enrollment records.
                </p>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Student ID Number <span className="text-rose-500">*</span>
                    <span className="text-[10px] font-normal text-slate-400 ml-1.5">(numbers only)</span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="e.g. 2024104821"
                    value={studentNumber}
                    onKeyDown={(e) => {
                      if (
                        ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(e.key) ||
                        (e.ctrlKey || e.metaKey)
                      ) {
                        return;
                      }
                      if (!/^[0-9]$/.test(e.key)) {
                        e.preventDefault();
                      }
                    }}
                    onChange={(e) => setStudentNumber(e.target.value.replace(/\D/g, ''))}
                    className={`w-full p-2.5 rounded-xl font-mono focus:ring-2 focus:bg-white focus:outline-none ${
                      duplicateCheck.isDuplicate && (duplicateCheck.matchType === 'student_number' || duplicateCheck.matchType === 'both')
                        ? 'bg-rose-50/60 border-2 border-rose-400 text-rose-900 focus:ring-rose-500'
                        : 'bg-slate-50 border border-slate-200 focus:ring-indigo-500'
                    }`}
                  />
                  {duplicateCheck.isDuplicate && (duplicateCheck.matchType === 'student_number' || duplicateCheck.matchType === 'both') && (
                    <span className="text-[10px] text-rose-600 font-semibold block mt-1">
                      Student ID already used for this scholarship
                    </span>
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
                  <label className="block font-bold text-slate-700 mb-1">
                    First Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Julian"
                    value={firstName}
                    onChange={e => setFirstName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Last Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Vance"
                    value={lastName}
                    onChange={e => setLastName(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Mobile Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="09171234567"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                  />
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
                    <option value="Graduate">Graduate</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Cumulative GWA / GPA <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1.00"
                    max="5.00"
                    placeholder="e.g. 1.25"
                    value={gwa}
                    onChange={e => setGwa(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-indigo-600 focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Monthly Gross Family Income (₱) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 35000"
                    value={monthlyFamilyIncome}
                    onChange={e => setMonthlyFamilyIncome(e.target.value === '' ? '' : parseInt(e.target.value))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                  />
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

                {/* Form to add household member */}
                {showAddHm && (
                  <div className="bg-white p-3 rounded-xl border border-indigo-200 space-y-3 text-xs">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500">Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Robert Vance"
                          value={newHmName}
                          onChange={e => setNewHmName(e.target.value)}
                          className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
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
                          onChange={e => setNewHmOccupation(e.target.value)}
                          className="w-full p-2 border border-slate-200 rounded-lg text-xs"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500">Monthly Income (₱)</label>
                        <input
                          type="number"
                          placeholder="25000"
                          value={newHmIncome}
                          onChange={e => setNewHmIncome(e.target.value === '' ? '' : parseInt(e.target.value))}
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
                      <div key={m.id} className="bg-white p-2.5 rounded-lg border border-slate-200 flex justify-between items-center text-xs">
                        <div>
                          <span className="font-bold text-slate-900">{m.name}</span>{' '}
                          <span className="text-slate-500">({m.relation})</span> —{' '}
                          <span className="text-slate-600">{m.occupation}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="font-bold text-indigo-600">₱{m.monthly_income.toLocaleString()}/mo</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveHouseholdMember(m.id)}
                            className="text-rose-500 hover:text-rose-700 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
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

              <div className="space-y-4">
                {/* 1. Certificate of Enrollment */}
                <DocumentUploader
                  type="com"
                  title="1. Certificate of Enrollment / Transcript"
                  subtitle="Official enrollment record, course load, and academic grade summary."
                  required={true}
                  document={docCom}
                  onDocumentChange={setDocCom}
                  onPreviewRequest={(doc) => setPreviewDoc(doc)}
                />

                {/* 2. Income Tax Return / Indigency */}
                <DocumentUploader
                  type="itr"
                  title="2. Income Tax Assessment or Indigency Certificate"
                  subtitle="Parents' latest tax assessment or Certificate of Household Indigency."
                  required={true}
                  document={docItr}
                  onDocumentChange={setDocItr}
                  onPreviewRequest={(doc) => setPreviewDoc(doc)}
                />

                {/* 3. Student ID */}
                <DocumentUploader
                  type="id"
                  title="3. Official Student ID Card (Front & Back)"
                  subtitle="Clear scan or photo of physical or digital student identification card."
                  required={true}
                  document={docId}
                  onDocumentChange={setDocId}
                  onPreviewRequest={(doc) => setPreviewDoc(doc)}
                />
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
                    <span className="font-bold text-slate-900">{firstName} {lastName}</span>
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
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Monthly Household Income</span>
                    <span className="font-bold text-slate-900">{monthlyFamilyIncome !== '' ? `₱${Number(monthlyFamilyIncome).toLocaleString()} / month` : '—'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase font-bold block">Attached Files</span>
                    <span className="font-bold text-emerald-600">
                      {[docCom, docItr, docId, ...additionalDocs].filter(Boolean).length} Files Attached
                    </span>
                  </div>
                </div>

                {/* Attached Documents Quick Check List */}
                <div className="space-y-2 pt-1">
                  <span className="text-[10px] text-slate-400 uppercase font-bold block">
                    Attached Supporting Documents:
                  </span>
                  {[docCom, docItr, docId, ...additionalDocs].filter(Boolean).length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No files attached.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {[docCom, docItr, docId, ...additionalDocs].filter(Boolean).map((doc) => (
                        <div key={doc!.id} className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between">
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
                <span>{!isStep2Valid ? 'Upload All 3 Required Documents' : 'Continue to Summary'}</span>
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
