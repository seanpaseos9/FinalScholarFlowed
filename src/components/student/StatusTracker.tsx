import React, { useState, useMemo, useEffect } from 'react';
import { motion } from 'motion/react';
import { Clock, CheckCircle2, AlertCircle, Award, XCircle, ShieldCheck, KeyRound, Lock } from 'lucide-react';
import { Application, ApplicationStatus } from '../../types';

interface StatusTrackerProps {
  applications: Application[];
  initialSearchCode?: string;
}

export const StatusTracker: React.FC<StatusTrackerProps> = ({
  applications,
  initialSearchCode = '',
}) => {
  const [referenceCode, setReferenceCode] = useState(initialSearchCode);
  const [secondaryCredential, setSecondaryCredential] = useState('');
  const [searched, setSearched] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);

  useEffect(() => {
    if (initialSearchCode) {
      setReferenceCode(initialSearchCode);
      setSearched(false);
      setVerificationError(null);
    }
  }, [initialSearchCode]);

  // Keyboard accessibility: Escape key resets tracker
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (referenceCode || secondaryCredential || searched || verificationError) {
          handleReset();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [referenceCode, secondaryCredential, searched, verificationError]);

  const hasInput = Boolean(referenceCode.trim() || secondaryCredential.trim());

  const handleReset = () => {
    setReferenceCode(initialSearchCode || '');
    setSecondaryCredential('');
    setVerificationError(null);
    setSearched(false);
  };

  // Perform secondary security verification
  const matchedApp = useMemo(() => {
    if (!searched) return null;

    const cleanRef = referenceCode.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanSec = secondaryCredential.trim().toLowerCase();

    if (!cleanRef || !cleanSec) return null;

    const foundByRef = applications.find(a => {
      const aRef = (a.reference_code || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      return aRef === cleanRef;
    });

    if (!foundByRef) {
      return null;
    }

    // Secondary security check: Student ID or Email must match
    const aStudentNum = (foundByRef.student_number || '').trim().toLowerCase();
    const aEmail = (foundByRef.email || '').trim().toLowerCase();
    const cleanSecNum = cleanSec.replace(/\D/g, '');

    const isStudentNumMatch = aStudentNum === cleanSec || (cleanSecNum && aStudentNum === cleanSecNum);
    const isEmailMatch = aEmail === cleanSec;

    if (isStudentNumMatch || isEmailMatch) {
      return foundByRef;
    }

    return null;
  }, [applications, referenceCode, secondaryCredential, searched]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setVerificationError(null);

    const cleanRef = referenceCode.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanSec = secondaryCredential.trim().toLowerCase();

    if (!cleanRef) {
      setVerificationError('Please enter your Application Reference Code (e.g. SF-982F1A03).');
      return;
    }

    if (!cleanSec) {
      setVerificationError('Secondary security credential required: Please enter your Student ID Number or registered Email Address.');
      return;
    }

    // Verify if reference code exists
    const candidate = applications.find(a => {
      const aRef = (a.reference_code || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      return aRef === cleanRef;
    });

    if (!candidate) {
      setVerificationError(`No application record found matching reference code "${referenceCode.trim()}". Please verify and try again.`);
      setSearched(true);
      return;
    }

    // Candidate found: verify secondary security credential
    const aStudentNum = (candidate.student_number || '').trim().toLowerCase();
    const aEmail = (candidate.email || '').trim().toLowerCase();
    const cleanSecNum = cleanSec.replace(/\D/g, '');

    const isStudentNumMatch = aStudentNum === cleanSec || (cleanSecNum && aStudentNum === cleanSecNum);
    const isEmailMatch = aEmail === cleanSec;

    if (!isStudentNumMatch && !isEmailMatch) {
      setVerificationError('Security Verification Failed: The provided Student ID or Email does not match our records for this reference code.');
      setSearched(true);
      return;
    }

    setSearched(true);
  };

  // Helper for Status Progress Percentage & Steps
  const statusSteps: ApplicationStatus[] = ['Pending', 'In Review', 'Shortlisted', 'Approved'];

  const getStatusIndex = (status: ApplicationStatus) => {
    if (status === 'Rejected') return -1;
    return statusSteps.indexOf(status);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      
      {/* Tracker Search Box with Secondary Security Verification */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-5 text-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">
            Track Your Scholarship Application
          </h2>
          <p className="text-xs text-slate-500 max-w-lg mx-auto mt-1">
            To safeguard applicant privacy and confidential academic records, enter your official <strong>Application Reference Code</strong> along with your <strong>Student ID Number</strong> or registered <strong>Email Address</strong>.
          </p>
        </div>

        <form onSubmit={handleSearch} className="max-w-2xl mx-auto space-y-4 pt-2 text-left">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1.5">
                <KeyRound className="w-3.5 h-3.5 text-indigo-600" />
                <span>Reference Code <span className="text-rose-500">*</span></span>
              </label>
              <input
                type="text"
                placeholder="e.g. SF-982F1A03"
                value={referenceCode}
                maxLength={30}
                onChange={(e) => {
                  setReferenceCode(e.target.value);
                  setVerificationError(null);
                }}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none focus:bg-white transition-all uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1.5">
                <Lock className="w-3.5 h-3.5 text-indigo-600" />
                <span>Student ID or Email <span className="text-rose-500">*</span></span>
              </label>
              <input
                type="text"
                placeholder="e.g. 2024104821 or student@uni.edu"
                value={secondaryCredential}
                maxLength={100}
                onChange={(e) => {
                  setSecondaryCredential(e.target.value);
                  setVerificationError(null);
                }}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Form Actions: Submit, Reset */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2 pt-1">
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleReset}
                className="px-3 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer w-full sm:w-auto text-center"
              >
                Reset
              </button>
            </div>

            <button
              type="submit"
              className="w-full sm:w-auto bg-slate-900 hover:bg-indigo-600 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition-colors shadow-xs cursor-pointer flex items-center justify-center space-x-2"
            >
              <ShieldCheck className="w-4 h-4 text-indigo-300" />
              <span>Verify & Track Status</span>
            </button>
          </div>
        </form>

        {/* Verification Error Notice */}
        {verificationError && (
          <div className="bg-rose-50 text-rose-800 p-3.5 rounded-xl border border-rose-200 text-xs font-medium flex items-center space-x-2 text-left max-w-2xl mx-auto">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{verificationError}</span>
          </div>
        )}
      </div>

      {/* Results Display Section */}
      {searched && (
        <div className="space-y-6">
          {!matchedApp ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 space-y-3">
              <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">Application Not Accessible</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {verificationError || 'Verification failed. Please check both the Reference Code and your Student ID or Email.'}
              </p>
            </div>
          ) : (
            (() => {
              const app = matchedApp;
              const currentStepIdx = getStatusIndex(app.status);
              const isRejected = app.status === 'Rejected';

              return (
                <motion.div
                  key={app.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
                >
                  {/* Card Top Header */}
                  <div className="bg-slate-900 text-white p-6 border-b border-slate-800 flex flex-col md:flex-row justify-between md:items-center gap-4">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-mono font-bold text-indigo-400">
                          {app.reference_code}
                        </span>
                        <span className="text-[10px] text-slate-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                          Student #{app.student_number}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-white mt-1">
                        {app.scholarship_title}
                      </h3>
                    </div>

                    <div className="text-left md:text-right">
                      <span className={`inline-flex items-center space-x-1.5 px-3 py-1 rounded-xl text-xs font-bold uppercase ${
                        app.status === 'Approved' ? 'bg-emerald-600 text-white' :
                        app.status === 'Shortlisted' ? 'bg-indigo-600 text-white' :
                        app.status === 'In Review' ? 'bg-sky-600 text-white' :
                        app.status === 'Rejected' ? 'bg-rose-600 text-white' :
                        'bg-amber-600 text-white'
                      }`}>
                        {app.status === 'Approved' && <CheckCircle2 className="w-3.5 h-3.5" />}
                        {app.status === 'Rejected' && <XCircle className="w-3.5 h-3.5" />}
                        <span>{app.status}</span>
                      </span>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Submitted: {new Date(app.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  {/* Animated Progress Bar (If not rejected) */}
                  <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">
                      Application Evaluation Pipeline:
                    </p>

                    {isRejected ? (
                      <div className="bg-rose-50 text-rose-800 p-4 rounded-xl border border-rose-200 flex items-center space-x-3 text-xs font-medium">
                        <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                        <div>
                          <p className="font-bold">Application Status: Not Selected</p>
                          <p className="text-slate-600 mt-0.5">This application did not meet eligibility or quota requirements for the current academic cycle.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="relative max-w-2xl mx-auto py-2">
                        {/* Connecting Line */}
                        <div className="absolute top-5 left-8 right-8 h-1 bg-slate-200 -z-0">
                          <div
                            className="bg-indigo-600 h-full transition-all duration-500"
                            style={{
                              width: `${(currentStepIdx / (statusSteps.length - 1)) * 100}%`
                            }}
                          />
                        </div>

                        {/* Step Circles */}
                        <div className="flex justify-between items-center relative z-10">
                          {statusSteps.map((stepName, idx) => {
                            const isPassed = idx <= currentStepIdx;
                            const isCurrent = idx === currentStepIdx;

                            return (
                              <div key={stepName} className="flex flex-col items-center space-y-2">
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${
                                  isPassed
                                    ? 'bg-indigo-600 text-white shadow-sm'
                                    : 'bg-white border-2 border-slate-300 text-slate-400'
                                } ${isCurrent ? 'ring-4 ring-indigo-100' : ''}`}>
                                  {isPassed ? <CheckCircle2 className="w-5 h-5" /> : idx + 1}
                                </div>
                                <span className={`text-[11px] font-bold ${
                                  isPassed ? 'text-slate-900' : 'text-slate-400'
                                }`}>
                                  {stepName}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Details Body */}
                  <div className="p-6 space-y-6 text-xs">
                    
                    {/* Awarded Benefit Callout (if approved) */}
                    {app.status === 'Approved' && (
                      <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Award className="w-8 h-8 text-emerald-600" />
                          <div>
                            <p className="text-xs font-bold text-emerald-900 uppercase">Awarded Scholarship Grant</p>
                            <p className="text-lg font-black text-emerald-700">₱{app.awarded_amount.toLocaleString()} PHP</p>
                          </div>
                        </div>
                        <span className="text-xs font-bold bg-emerald-600 text-white px-3 py-1 rounded-lg">
                          Disbursement Ready
                        </span>
                      </div>
                    )}

                    {/* Official Remarks */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Committee Evaluation Remarks
                      </span>
                      <p className="text-xs font-medium text-slate-800 leading-relaxed">
                        {app.remarks || 'No remarks posted yet.'}
                      </p>
                    </div>

                    {/* Student Info Summary */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Applicant Name</span>
                        <span className="font-bold text-slate-900">{app.first_name} {app.last_name}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Degree Program</span>
                        <span className="font-bold text-slate-900">{app.program}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Cumulative GWA</span>
                        <span className="font-bold text-indigo-600">{app.gwa.toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Documents</span>
                        <span className="font-bold text-slate-900">Submitted</span>
                      </div>
                    </div>

                  </div>

                </motion.div>
              );
            })()
          )}
        </div>
      )}

    </div>
  );
};
