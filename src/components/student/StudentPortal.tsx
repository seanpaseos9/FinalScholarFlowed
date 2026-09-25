import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Award, Clock, ShieldAlert, Sparkles, X, RotateCcw, RefreshCw, FileCheck, CheckCircle2, AlertCircle, Calendar, ArrowRight, ShieldCheck, Search, KeyRound, Lock } from 'lucide-react';
import { Scholarship, Application, FreezePeriod } from '../../types';
import { ScholarshipCatalog } from './ScholarshipCatalog';
import { ApplicationWizard } from './ApplicationWizard';
import { StatusTracker } from './StatusTracker';

interface StudentPortalProps {
  scholarships: Scholarship[];
  applications: Application[];
  freezePeriods: FreezePeriod[];
  initialTab?: 'catalog' | 'renewal' | 'tracker';
  initialScholarship?: Scholarship | null;
  onNewApplication: (app: Application) => void;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({
  scholarships,
  applications,
  freezePeriods,
  initialTab = 'catalog',
  initialScholarship = null,
  onNewApplication,
}) => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'renewal' | 'tracker'>(initialTab);
  const [selectedScholarship, setSelectedScholarship] = useState<Scholarship | null>(initialScholarship);
  const [isRenewalMode, setIsRenewalMode] = useState<boolean>(false);
  const [renewedFromRefCode, setRenewedFromRefCode] = useState<string | undefined>(undefined);
  // Renewal verification lookup state
  const [trackerSearchCode, setTrackerSearchCode] = useState<string>('');

  // Inline Renewal Lookup Modal (for "Submit Renewal" from program cards)
  const [renewalLookupScholarship, setRenewalLookupScholarship] = useState<Scholarship | null>(null);
  const [lookupRefCode, setLookupRefCode] = useState('');
  const [lookupSecId, setLookupSecId] = useState('');
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookupSubmitting, setLookupSubmitting] = useState(false);

  const handleOpenRenewalLookup = (scholarship: Scholarship) => {
    setRenewalLookupScholarship(scholarship);
    setLookupRefCode('');
    setLookupSecId('');
    setLookupError(null);
  };

  const handleLookupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLookupError(null);
    const cleanRef = lookupRefCode.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanSec = lookupSecId.trim().toLowerCase().replace(/[^a-z0-9]/g, '');

    if (!cleanRef) { setLookupError('Please enter your Application Reference Code.'); return; }
    if (!cleanSec) { setLookupError('Please enter your Student ID Number or Email Address.'); return; }

    const candidate = applications.find(a => {
      const aRef = (a.reference_code || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      return aRef === cleanRef;
    });

    if (!candidate) {
      setLookupError(`No record found for Reference Code "${lookupRefCode.trim()}". Please check and try again.`);
      return;
    }

    const aNum = (candidate.student_number || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const aEmail = (candidate.email || '').toLowerCase().trim();
    const isMatch = aNum === cleanSec || aEmail === lookupSecId.trim().toLowerCase();

    if (!isMatch) {
      setLookupError('Verification Failed: Student ID or Email does not match our records for this reference code.');
      return;
    }

    const eligibleStatuses = ['Approved', 'For Renewal', 'Expired'];
    if (!eligibleStatuses.includes(candidate.status)) {
      setLookupError(`Application (${candidate.reference_code}) has status "${candidate.status}" and is not eligible for renewal.`);
      return;
    }

    // Success: open the auto-populated renewal wizard
    const sch = renewalLookupScholarship!;
    setRenewalLookupScholarship(null);
    handleRenewalClick(sch, candidate.reference_code);
  };
  
  // Track dismissed freeze notice ID
  const [dismissedFreezeId, setDismissedFreezeId] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem('scholarflow_dismissed_freeze_id');
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
      window.scrollTo(0, 0);
    }
  }, [initialTab]);

  useEffect(() => {
    if (initialScholarship) {
      setSelectedScholarship(initialScholarship);
    }
  }, [initialScholarship]);

  const handleTabSwitch = (tab: 'catalog' | 'renewal' | 'tracker') => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Select latest active freeze announcement
  const latestFreezeAnnouncement = useMemo(() => {
    const active = freezePeriods.filter((f) => {
      if (!f.is_active) return false;
      if (f.scholarship_id === 'all') {
        return scholarships.some((s) => s.is_frozen);
      } else {
        const target = scholarships.find((s) => s.id === f.scholarship_id);
        return target ? target.is_frozen : false;
      }
    });

    if (active.length === 0) return null;
    return [...active].sort((a, b) => {
      const timeB = new Date(b.created_at || b.start_date || 0).getTime();
      const timeA = new Date(a.created_at || a.start_date || 0).getTime();
      return timeB - timeA;
    })[0];
  }, [freezePeriods, scholarships]);

  const showFreezeBanner = Boolean(
    latestFreezeAnnouncement && latestFreezeAnnouncement.id !== dismissedFreezeId
  );

  const handleDismissFreeze = (id: string) => {
    setDismissedFreezeId(id);
    try {
      sessionStorage.setItem('scholarflow_dismissed_freeze_id', id);
    } catch {
      // ignore
    }
  };

  const handleApplyClick = (scholarship: Scholarship) => {
    setIsRenewalMode(false);
    setRenewedFromRefCode(undefined);
    setSelectedScholarship(scholarship);
  };

  const handleRenewalClick = (scholarship: Scholarship, previousRefCode?: string) => {
    setIsRenewalMode(true);
    setRenewedFromRefCode(previousRefCode);
    setSelectedScholarship(scholarship);
  };

  const handleApplicationSuccess = (newApp: Application) => {
    try {
      sessionStorage.setItem('scholarflow_student_email', newApp.email);
      sessionStorage.setItem('scholarflow_student_id', newApp.student_number);
      localStorage.setItem('scholarflow_student_email', newApp.email);
      localStorage.setItem('scholarflow_student_id', newApp.student_number);
    } catch {
      // ignore storage errors
    }
    onNewApplication(newApp);
    // Switch to tracker tab with generated code
    handleTabSwitch('tracker');
    setTrackerSearchCode(newApp.reference_code);
  };

  const handleTrackCode = (refCode: string) => {
    setSelectedScholarship(null);
    handleTabSwitch('tracker');
    setTrackerSearchCode(refCode);
  };

  // Renewable scholarships list
  const renewableScholarships = useMemo(() => {
    return scholarships.filter(s => s.is_renewable);
  }, [scholarships]);

  // Renewal verification lookup state (Reference Number + Student ID/Email)
  const [renewalRefCode, setRenewalRefCode] = useState<string>('');
  const [renewalSecId, setRenewalSecId] = useState<string>('');
  const [renewalSearched, setRenewalSearched] = useState<boolean>(false);

  // Renewal verification matched application with strict eligibility checks
  const renewalVerificationResult = useMemo(() => {
    if (!renewalSearched || !renewalRefCode.trim() || !renewalSecId.trim()) return { app: null, error: null };
    const cleanRef = renewalRefCode.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanSec = renewalSecId.trim().toLowerCase().replace(/[^a-z0-9]/g, '');

    const candidate = applications.find(a => {
      const aRef = (a.reference_code || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      return aRef === cleanRef;
    });

    if (!candidate) {
      return { app: null, error: `No previous application record found for Reference Code "${renewalRefCode.trim()}".` };
    }

    const aNum = (candidate.student_number || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const aEmail = (candidate.email || '').toLowerCase().trim();

    const isMatch = aNum === cleanSec || aEmail === renewalSecId.trim().toLowerCase();
    if (!isMatch) {
      return { app: null, error: `Verification Failed: Provided Student ID/Email does not match Reference Code "${renewalRefCode.trim()}".` };
    }

    // Check strict eligibility: Must be Approved/For Renewal/Expired
    const eligibleStatuses = ['Approved', 'For Renewal', 'Expired'];
    if (!eligibleStatuses.includes(candidate.status)) {
      return { app: null, error: `Application ${candidate.reference_code} (Status: "${candidate.status}") is not eligible for renewal. Renewal requires a previously Approved or Expired grant.` };
    }

    // Check boolean flag: is_renewable on target scholarship
    const targetScholarship = scholarships.find(s => s.id === candidate.scholarship_id || s.title === candidate.scholarship_title);
    if (!targetScholarship || !targetScholarship.is_renewable) {
      return { app: null, error: `The program "${candidate.scholarship_title}" is non-renewable under university policy.` };
    }

    return { app: candidate, scholarship: targetScholarship, error: null };
  }, [applications, scholarships, renewalSearched, renewalRefCode, renewalSecId]);

  const matchedRenewalApp = renewalVerificationResult.app;
  const hasRenewalInput = Boolean(renewalRefCode.trim() && renewalSecId.trim());

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
      
      {/* Active Emergency Freeze Alert Banner */}
      <AnimatePresence>
        {showFreezeBanner && latestFreezeAnnouncement && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
            className="bg-amber-50 border border-amber-200 p-4 sm:p-5 rounded-2xl shadow-xs space-y-2 relative"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center space-x-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
                <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0" />
                <span>Scholarship Committee Notice: Submission Schedule Update</span>
              </div>
              <button
                type="button"
                onClick={() => handleDismissFreeze(latestFreezeAnnouncement.id)}
                className="text-amber-700 hover:text-amber-950 p-1 hover:bg-amber-200/60 rounded-lg transition-colors cursor-pointer shrink-0"
                title="Dismiss notice"
                aria-label="Dismiss notice"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-amber-800 space-y-1 pl-7 pr-6">
              <p className="font-semibold">{latestFreezeAnnouncement.announcement_note}</p>
              <p className="text-[11px] text-amber-700 font-medium">
                {latestFreezeAnnouncement.start_date && latestFreezeAnnouncement.end_date && latestFreezeAnnouncement.start_date !== latestFreezeAnnouncement.end_date ? (
                  <>
                    Effective Period: <strong>{latestFreezeAnnouncement.start_date}</strong> to <strong>{latestFreezeAnnouncement.end_date}</strong>
                  </>
                ) : latestFreezeAnnouncement.start_date ? (
                  <>
                    Effective: <strong>Starting {latestFreezeAnnouncement.start_date}</strong>
                  </>
                ) : (
                  <>
                    Effective: <strong>Immediately</strong>
                  </>
                )}
                {latestFreezeAnnouncement.scholarship_title && latestFreezeAnnouncement.scholarship_id !== 'all' && (
                  <span className="ml-2 text-amber-900 font-semibold">
                    (Target: {latestFreezeAnnouncement.scholarship_title})
                  </span>
                )}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Section Header & Tab Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase border border-indigo-100">
              Student Applicant Portal
            </span>
            <span className="text-xs text-slate-400">• Open Access Submission</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
            {activeTab === 'renewal'
              ? 'Scholarship Renewal Center'
              : activeTab === 'tracker'
              ? 'Application Status Tracker'
              : 'Scholarship & Grant Opportunities'}
          </h1>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center bg-slate-100 p-1.5 rounded-xl border border-slate-200 w-full sm:w-auto overflow-x-auto">
          <button
            onClick={() => handleTabSwitch('catalog')}
            className={`flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-3.5 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'catalog'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Award className="w-4 h-4 text-indigo-600" />
            <span>Browse Programs</span>
          </button>

          <button
            onClick={() => handleTabSwitch('renewal')}
            className={`flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-3.5 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'renewal'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <RefreshCw className="w-4 h-4 text-emerald-600" />
            <span>Renewal</span>
          </button>

          <button
            onClick={() => handleTabSwitch('tracker')}
            className={`flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-3.5 sm:px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'tracker'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4 text-indigo-600" />
            <span>Track Application</span>
          </button>
        </div>
      </div>

      {/* Tab Content Rendering */}
      {activeTab === 'catalog' && (
        <ScholarshipCatalog
          scholarships={scholarships}
          applications={applications}
          onApply={handleApplyClick}
          onTrack={handleTrackCode}
        />
      )}

      {/* Dedicated Renewal Tab */}
      {activeTab === 'renewal' && (
        <div className="space-y-8">
          
          {/* Renewal Hub Hero Banner */}
          <div className="bg-gradient-to-r from-emerald-900 to-teal-900 rounded-2xl p-6 sm:p-8 text-white shadow-md relative overflow-hidden">
            <div className="max-w-2xl space-y-3 relative z-10">
              <div className="inline-flex items-center space-x-2 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-3 py-1 rounded-full text-xs font-semibold">
                <RotateCcw className="w-3.5 h-3.5 text-emerald-300" />
                <span>Continuing Scholar Re-Application</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Scholarship Renewal & Grant Continuation
              </h2>
              <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed">
                Existing awardees in renewable programs can apply for scholarship continuation each academic term. Verify your previous award record below to launch your expedited renewal dossier.
              </p>
            </div>
          </div>

          {/* Quick Renewal Eligibility Lookup */}
          <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Auto-Pull Records &amp; Verify Renewal Eligibility</span>
            </div>
            <p className="text-xs text-slate-500">
              Enter your previous <strong>Application Reference Code</strong> alongside your <strong>Student ID Number</strong> or registered <strong>Email Address</strong> to auto-fill your profile records and launch your renewal.
            </p>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setRenewalSearched(true);
              }}
              className="space-y-3 max-w-2xl"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Reference Code (e.g. SF-982F1A03)..."
                    value={renewalRefCode}
                    onChange={(e) => {
                      setRenewalRefCode(e.target.value);
                      setRenewalSearched(false);
                    }}
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none focus:bg-white transition-all uppercase"
                  />
                </div>

                <div className="relative">
                  <input
                    type="text"
                    placeholder="Student ID # or Email Address..."
                    value={renewalSecId}
                    onChange={(e) => {
                      setRenewalSecId(e.target.value);
                      setRenewalSearched(false);
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none focus:bg-white transition-all"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-1">
                {(renewalRefCode || renewalSecId || renewalSearched) && (
                  <button
                    type="button"
                    onClick={() => {
                      setRenewalRefCode('');
                      setRenewalSecId('');
                      setRenewalSearched(false);
                    }}
                    className="px-4 py-2.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                  >
                    Clear
                  </button>
                )}
                <button
                  type="submit"
                  disabled={!hasRenewalInput}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs px-6 py-2.5 rounded-xl transition-colors shadow-xs cursor-pointer whitespace-nowrap flex items-center space-x-2"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Auto-Pull Records &amp; Verify</span>
                </button>
              </div>
            </form>

            {/* Matched Renewal Results */}
            {renewalSearched && (
              <div className="pt-2">
                {matchedRenewalApp ? (
                  <div className="bg-emerald-50/70 border border-emerald-300 rounded-2xl p-5 space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-600 text-white">
                            Eligible for Renewal
                          </span>
                          <span className="text-xs font-mono text-emerald-800 font-bold">{matchedRenewalApp.reference_code}</span>
                        </div>
                        <h3 className="text-base font-bold text-slate-900">{matchedRenewalApp.scholarship_title}</h3>
                        <p className="text-xs text-slate-600">
                          Applicant: <strong>{matchedRenewalApp.first_name} {matchedRenewalApp.last_name}</strong> (Student #{matchedRenewalApp.student_number}) • Status: <span className="font-bold text-emerald-700">{matchedRenewalApp.status}</span>
                        </p>
                      </div>

                      {(() => {
                        const targetScholarship = scholarships.find(s => s.id === matchedRenewalApp.scholarship_id || s.title === matchedRenewalApp.scholarship_title);
                        if (!targetScholarship) {
                          return (
                            <span className="text-xs font-medium text-slate-500">Program currently not listed</span>
                          );
                        }
                        return (
                          <button
                            type="button"
                            onClick={() => handleRenewalClick(targetScholarship, matchedRenewalApp.reference_code)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer flex items-center space-x-2"
                          >
                            <RotateCcw className="w-4 h-4" />
                            <span>Auto-Fill &amp; Apply for Renewal Now</span>
                          </button>
                        );
                      })()}
                    </div>
                  </div>
                ) : (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 flex items-center space-x-3">
                    <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                    <div>
                      <p className="font-bold">{renewalVerificationResult.error || 'No matching record found.'}</p>
                      <p className="text-amber-800 mt-0.5">Please check your reference code and student ID/email, or browse open renewable programs.</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Renewable Programs Directory */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-slate-900">Renewable Scholarship Programs</h3>
                <p className="text-xs text-slate-500">Programs that support ongoing multi-year semester continuation grants.</p>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                {renewableScholarships.length} Renewable Programs
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {renewableScholarships.map(s => (
                <div
                  key={s.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
                >
                  <div className="p-6 space-y-4">
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                        Renewable Grant
                      </span>
                      {s.renewal_deadline && (
                        <span className="text-[10px] font-medium text-slate-500 flex items-center space-x-1">
                          <Calendar className="w-3 h-3 text-emerald-600" />
                          <span>Renew by: {s.renewal_deadline}</span>
                        </span>
                      )}
                    </div>

                    <div>
                      <span className="text-[10px] font-mono font-semibold text-slate-400 block">{s.code}</span>
                      <h4 className="text-base font-bold text-slate-900 mt-0.5">{s.title}</h4>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-2">{s.description}</p>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                      <div className="bg-slate-50 p-2 rounded-xl">
                        <span className="text-[10px] text-slate-400 font-semibold block">Min GWA</span>
                        <span className="font-bold text-slate-800">{s.min_gwa.toFixed(2)} or higher</span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-xl">
                        <span className="text-[10px] text-slate-400 font-semibold block">Duration</span>
                        <span className="font-bold text-slate-800">{s.duration_years} Year(s)</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">₱{s.grant_amount.toLocaleString()} / term</span>
                    <button
                      type="button"
                      onClick={() => handleOpenRenewalLookup(s)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors shadow-2xs flex items-center space-x-1 cursor-pointer"
                    >
                      <span>Submit Renewal</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Renewal Policy & Guidelines Accordion */}
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200 space-y-3 text-xs">
            <h4 className="font-bold text-slate-900 uppercase tracking-wide flex items-center space-x-2">
              <FileCheck className="w-4 h-4 text-emerald-600" />
              <span>Standard Scholarship Renewal Requirements</span>
            </h4>
            <ul className="space-y-1.5 text-slate-600 list-disc list-inside">
              <li>Must have maintained the cumulative minimum GWA / GPA specified by your specific grant with no failing or uncompleted grades.</li>
              <li>Must submit an updated official Certificate of Enrollment (COE) for the incoming semester.</li>
              <li>Must provide certified True Copy of Grades (TCG) from the preceding academic term.</li>
              <li>Must submit latest household income assessment or certificate of good standing.</li>
              <li>Renewal applications are reviewed on a rolling basis by the faculty scholarship committee.</li>
            </ul>
          </div>

        </div>
      )}

      {activeTab === 'tracker' && (
        <StatusTracker
          applications={applications}
          initialSearchCode={trackerSearchCode}
        />
      )}

      {/* 3-Step Wizard Modal (Supports New and Renewal Applications) */}
      <AnimatePresence>
        {selectedScholarship && (
          <ApplicationWizard
            scholarship={selectedScholarship}
            applications={applications}
            isRenewal={isRenewalMode}
            renewedFrom={renewedFromRefCode}
            onClose={() => {
              setSelectedScholarship(null);
              setIsRenewalMode(false);
              setRenewedFromRefCode(undefined);
            }}
            onSubmitSuccess={handleApplicationSuccess}
            onTrackExisting={handleTrackCode}
          />
        )}
      </AnimatePresence>

      {/* Renewal Lookup Modal — shown when clicking "Submit Renewal" on program cards */}
      <AnimatePresence>
        {renewalLookupScholarship && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden"
            >
              {/* Modal Header */}
              <div className="bg-slate-900 text-white p-5 flex justify-between items-start">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded uppercase">Renewal Verification</span>
                  </div>
                  <h3 className="text-sm font-bold">{renewalLookupScholarship.title}</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Enter your previous award credentials to auto-populate the renewal form.</p>
                </div>
                <button type="button" onClick={() => setRenewalLookupScholarship(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition cursor-pointer ml-3 shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleLookupSubmit} className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1.5">
                    <Search className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Application Reference Code <span className="text-rose-500">*</span></span>
                  </label>
                  <input type="text" placeholder="e.g. SF-982F1A03"
                    value={lookupRefCode}
                    onChange={e => { setLookupRefCode(e.target.value); setLookupError(null); }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none uppercase transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center space-x-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Student ID or Email Address <span className="text-rose-500">*</span></span>
                  </label>
                  <input type="text" placeholder="e.g. 2024104821 or student@uni.edu"
                    value={lookupSecId}
                    onChange={e => { setLookupSecId(e.target.value); setLookupError(null); }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none transition-all" />
                </div>

                {lookupError && (
                  <div className="bg-rose-50 text-rose-800 p-3 rounded-xl border border-rose-200 text-xs font-medium flex items-center space-x-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{lookupError}</span>
                  </div>
                )}

                <div className="flex justify-end space-x-2 pt-1">
                  <button type="button" onClick={() => setRenewalLookupScholarship(null)}
                    className="px-4 py-2.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer">
                    Cancel
                  </button>
                  <button type="submit"
                    disabled={!lookupRefCode.trim() || !lookupSecId.trim()}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition shadow-xs cursor-pointer flex items-center space-x-2">
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Verify & Auto-Fill Renewal</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
