import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { X, Award, Users, RefreshCw, ShieldCheck, Clock, AlertCircle } from 'lucide-react';
import { Scholarship, ScholarshipCategory } from '../../types';

interface ScholarshipModalProps {
  scholarshipToEdit?: Scholarship | null;
  onClose: () => void;
  onSave: (scholarship: Scholarship) => void;
}

export const ScholarshipModal: React.FC<ScholarshipModalProps> = ({
  scholarshipToEdit,
  onClose,
  onSave,
}) => {
  const [title, setTitle] = useState(scholarshipToEdit?.title || '');
  const [code, setCode] = useState(scholarshipToEdit?.code || `SCH-${Math.floor(100 + Math.random() * 900)}-2026`);
  const [category, setCategory] = useState<ScholarshipCategory>(scholarshipToEdit?.category || 'Academic');
  const [description, setDescription] = useState(scholarshipToEdit?.description || '');
  const occupiedSlots = scholarshipToEdit
    ? Math.max(0, scholarshipToEdit.slots - scholarshipToEdit.slots_remaining)
    : 0;
  const [slots, setSlots] = useState<number | ''>(scholarshipToEdit?.slots || 20);
  const [grantAmount, setGrantAmount] = useState<number | ''>(scholarshipToEdit?.grant_amount || 50000);
  const [grantType, setGrantType] = useState(scholarshipToEdit?.grant_type || '100% Tuition Discount');
  const [minGwa, setMinGwa] = useState<string>(scholarshipToEdit?.min_gwa ? String(scholarshipToEdit.min_gwa) : '1.75');
  const [maxFamilyIncome, setMaxFamilyIncome] = useState<string>(scholarshipToEdit?.max_family_income ? Number(scholarshipToEdit.max_family_income).toLocaleString('en-US') : '500,000');
  const [deadline, setDeadline] = useState(scholarshipToEdit?.deadline || '2026-10-30');
  const [requirementsStr, setRequirementsStr] = useState(scholarshipToEdit?.requirements.join('\n') || 'Certificate of Matriculation\nITR / Indigency Certificate\nOfficial Student ID');

  // Policy Rules
  const [durationYears, setDurationYears] = useState<number | ''>(scholarshipToEdit?.duration_years ?? 1);
  const [isRenewable, setIsRenewable] = useState<boolean>(scholarshipToEdit?.is_renewable ?? false);
  const [renewalDeadline, setRenewalDeadline] = useState(scholarshipToEdit?.renewal_deadline || '');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Keyboard accessibility: Escape key dismisses modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

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

  const hasActiveInput = Boolean(
    title || description || grantAmount !== '' || slots !== '' || minGwa || maxFamilyIncome
  );

  const handleClear = () => {
    setTitle('');
    setDescription('');
    setGrantAmount('');
    setSlots('');
    setMinGwa('');
    setMaxFamilyIncome('');
    setRequirementsStr('');
    setErrorMsg(null);
  };

  const handleReset = () => {
    setTitle(scholarshipToEdit?.title || '');
    setCode(scholarshipToEdit?.code || `SCH-${Math.floor(100 + Math.random() * 900)}-2026`);
    setCategory(scholarshipToEdit?.category || 'Academic');
    setDescription(scholarshipToEdit?.description || '');
    setSlots(scholarshipToEdit?.slots || 20);
    setGrantAmount(scholarshipToEdit?.grant_amount || 50000);
    setGrantType(scholarshipToEdit?.grant_type || '100% Tuition Discount');
    setMinGwa(scholarshipToEdit?.min_gwa ? String(scholarshipToEdit.min_gwa) : '1.75');
    setMaxFamilyIncome(scholarshipToEdit?.max_family_income ? Number(scholarshipToEdit.max_family_income).toLocaleString('en-US') : '500,000');
    setDeadline(scholarshipToEdit?.deadline || '2026-10-30');
    setRequirementsStr(scholarshipToEdit?.requirements.join('\n') || 'Certificate of Matriculation\nITR / Indigency Certificate\nOfficial Student ID');
    setDurationYears(scholarshipToEdit?.duration_years ?? 1);
    setIsRenewable(scholarshipToEdit?.is_renewable ?? false);
    setRenewalDeadline(scholarshipToEdit?.renewal_deadline || '');
    setErrorMsg(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!title.trim()) {
      setErrorMsg('Please enter a scholarship title.');
      return;
    }
    if (!code.trim()) {
      setErrorMsg('Please enter a program code.');
      return;
    }
    if (!category) {
      setErrorMsg('Please select a category.');
      return;
    }
    if (!grantType.trim()) {
      setErrorMsg('Please enter the grant benefit type.');
      return;
    }
    if (grantAmount === '' || Number(grantAmount) <= 0) {
      setErrorMsg('Please enter a valid grant value.');
      return;
    }
    if (slots === '' || Number(slots) <= 0) {
      setErrorMsg('Please enter total available slots.');
      return;
    }
    const gwaNum = Number(minGwa);
    if (!minGwa.trim() || isNaN(gwaNum) || gwaNum < 1.0 || gwaNum > 5.0) {
      setErrorMsg('Minimum GWA must be between 1.00 and 5.00.');
      return;
    }
    if (!maxFamilyIncome.trim()) {
      setErrorMsg('Please enter the maximum annual family income.');
      return;
    }
    if (!deadline.trim()) {
      setErrorMsg('Please select an application deadline.');
      return;
    }

    const reqList = requirementsStr
      .split('\n')
      .map(r => r.trim())
      .filter(r => r.length > 0);
    if (reqList.length === 0) {
      setErrorMsg('Please enter at least one required document.');
      return;
    }

    if (durationYears === '' || Number(durationYears) <= 0) {
      setErrorMsg('Please enter the duration in school years.');
      return;
    }
    if (isRenewable && !renewalDeadline.trim()) {
      setErrorMsg('Please select a renewal submission deadline.');
      return;
    }

    const cleanIncome = Number(String(maxFamilyIncome).replace(/,/g, '')) || 0;

    const schObj: Scholarship = {
      id: scholarshipToEdit?.id || `sch-${Date.now()}`,
      title: title.trim(),
      code: code.trim(),
      category,
      description: description.trim(),
      slots: Number(slots) || 1,
      slots_remaining: Math.max(0, (Number(slots) || 1) - occupiedSlots),
      grant_amount: Number(grantAmount) || 0,
      grant_type: grantType.trim(),
      min_gwa: gwaNum,
      max_family_income: cleanIncome,
      deadline,
      requirements: reqList,
      is_active: true,
      is_frozen: scholarshipToEdit?.is_frozen || false,
      created_at: scholarshipToEdit?.created_at || new Date().toISOString(),
      // Policy Rules: Global 1-per-student limit hardcoded
      duration_years: Number(durationYears) || 1,
      is_renewable: isRenewable,
      renewal_deadline: isRenewable && renewalDeadline ? renewalDeadline : undefined,
      max_approved_per_student: 1,
    };

    onSave(schObj);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8"
      >
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 border-b border-slate-800 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Award className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">
              {scholarshipToEdit ? 'Edit Scholarship Program' : 'Add New Scholarship Program'}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-2 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="bg-rose-50 text-rose-800 px-6 py-3 border-b border-rose-200 text-xs font-medium flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-xs max-h-[80vh] overflow-y-auto">

          {/* Basic Information */}
          <div>
            {/* Form Top Controls: Reset & Clear */}
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">
                Basic Information
              </span>
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={handleReset}
                className="px-2.5 py-1 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Reset
              </button>
              <button
                type="button"
                disabled={!hasActiveInput}
                onClick={handleClear}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                  hasActiveInput
                    ? 'text-rose-600 bg-rose-50 hover:bg-rose-100 cursor-pointer border border-rose-200'
                    : 'text-slate-400 bg-slate-100 cursor-not-allowed border border-slate-200'
                }`}
              >
                Clear
              </button>
            </div>
          </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Scholarship Title *</label>
                <input
                  type="text"
                  required
                  maxLength={150}
                  placeholder="e.g. Academic Excellence Scholarship"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Program Code *</label>
                <input
                  type="text"
                  required
                  maxLength={50}
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Category *</label>
                <select
                  required
                  value={category}
                  onChange={e => setCategory(e.target.value as ScholarshipCategory)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                >
                  <option value="Academic">Academic</option>
                  <option value="Financial">Financial</option>
                  <option value="Athletic">Athletic</option>
                  <option value="Performing Arts">Performing Arts</option>
                  <option value="Alumni">Alumni</option>
                  <option value="Industry">Industry</option>
                  <option value="Leadership">Leadership</option>
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Grant Benefit Type *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 100% Tuition Waiver + ₱15,000 Stipend"
                  value={grantType}
                  maxLength={150}
                  onChange={e => setGrantType(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-3">
              <label className="block font-bold text-slate-700 mb-1">
                Program Description <span className="text-[10px] text-slate-400 font-normal">(optional)</span>
              </label>
              <textarea
                rows={2}
                value={description}
                maxLength={500}
                onChange={e => setDescription(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Grant & Eligibility */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 mb-3">Grant &amp; Eligibility</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Grant Value (₱) *</label>
                <input
                  type="text"
                  required
                  inputMode="numeric"
                  placeholder="e.g. 50,000"
                  value={grantAmount !== '' ? Number(grantAmount).toLocaleString('en-US') : ''}
                  onKeyDown={(e) => handleNumericKeyDown(e, false)}
                  onChange={e => {
                    const raw = e.target.value.replace(/\D/g, '');
                    setGrantAmount(raw ? parseInt(raw, 10) : '');
                  }}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-indigo-600 focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                />
              </div>
              <div>
                <label className="flex items-center justify-between font-bold text-slate-700 mb-1">
                  <span>Total Slots *</span>
                  {occupiedSlots > 0 && (
                    <span className="text-[11px] font-normal text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                      {occupiedSlots} applied
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  required
                  inputMode="numeric"
                  placeholder="20"
                  value={slots}
                  onKeyDown={(e) => handleNumericKeyDown(e, false)}
                  onChange={e => {
                    const raw = e.target.value.replace(/\D/g, '');
                    setSlots(raw ? parseInt(raw, 10) : '');
                  }}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Min GWA (1.00-5.00) *</label>
                <input
                  type="text"
                  required
                  inputMode="decimal"
                  placeholder="1.75"
                  value={minGwa}
                  onKeyDown={(e) => handleNumericKeyDown(e, true)}
                  onChange={e => {
                    const val = e.target.value;
                    if (val === '' || /^\d*\.?\d{0,2}$/.test(val)) {
                      setMinGwa(val);
                    }
                  }}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Max Annual Income (₱) *</label>
                <input
                  type="text"
                  required
                  inputMode="numeric"
                  placeholder="500,000"
                  value={maxFamilyIncome}
                  onKeyDown={(e) => handleNumericKeyDown(e, false)}
                  onChange={e => {
                    const raw = e.target.value.replace(/\D/g, '');
                    setMaxFamilyIncome(raw ? Number(raw).toLocaleString('en-US') : '');
                  }}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-3">
              <label className="block font-bold text-slate-700 mb-1">Application Deadline *</label>
              <input
                type="date"
                required
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none cursor-pointer"
              />
            </div>

            <div className="mt-3">
              <label className="block font-bold text-slate-700 mb-1">Required Documents (One per line) *</label>
              <textarea
                rows={3}
                required
                value={requirementsStr}
                onChange={e => setRequirementsStr(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Policy Rules Section */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3">
            <div className="flex items-center space-x-2 border-b border-slate-200 pb-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-600">Scholarship Policy Rules</p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center space-x-1">
                  <Clock className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Duration (School Years) *</span>
                </label>
                <input
                  type="text"
                  required
                  inputMode="numeric"
                  placeholder="1"
                  value={durationYears}
                  onKeyDown={(e) => handleNumericKeyDown(e, false)}
                  onChange={e => {
                    const raw = e.target.value.replace(/\D/g, '');
                    setDurationYears(raw ? parseInt(raw, 10) : '');
                  }}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">How many school years the grant covers</p>
              </div>
            </div>

            <div>
              <label className="flex items-center space-x-2.5 cursor-pointer p-2.5 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 transition-colors">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={isRenewable}
                    onChange={e => setIsRenewable(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`w-9 h-5 rounded-full transition-colors ${isRenewable ? 'bg-indigo-600' : 'bg-slate-300'}`} />
                  <div className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${isRenewable ? 'translate-x-4' : ''}`} />
                </div>
                <div>
                  <p className="font-bold text-slate-800 flex items-center space-x-1.5">
                    <RefreshCw className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Scholarship is Renewable</span>
                  </p>
                  <p className="text-[10px] text-slate-500">Scholars can apply for renewal after the grant term ends</p>
                </div>
              </label>
            </div>

            {isRenewable && (
              <div>
                <label className="block font-bold text-slate-700 mb-1">Renewal Submission Deadline *</label>
                <input
                  type="date"
                  required={isRenewable}
                  value={renewalDeadline}
                  onChange={e => setRenewalDeadline(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">Deadline for scholars to submit their renewal application</p>
              </div>
            )}
          </div>

          <div className="pt-2 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-slate-900 hover:bg-indigo-600 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Save Program
            </button>
          </div>

        </form>

      </motion.div>
    </div>
  );
};
