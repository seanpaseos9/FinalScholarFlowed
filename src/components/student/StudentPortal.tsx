import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Award, Clock, ShieldAlert, Sparkles, X } from 'lucide-react';
import { Scholarship, Application, FreezePeriod } from '../../types';
import { ScholarshipCatalog } from './ScholarshipCatalog';
import { ApplicationWizard } from './ApplicationWizard';
import { StatusTracker } from './StatusTracker';

interface StudentPortalProps {
  scholarships: Scholarship[];
  applications: Application[];
  freezePeriods: FreezePeriod[];
  initialTab?: 'catalog' | 'tracker';
  onNewApplication: (app: Application) => void;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({
  scholarships,
  applications,
  freezePeriods,
  initialTab = 'catalog',
  onNewApplication,
}) => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'tracker'>(initialTab);
  const [selectedScholarship, setSelectedScholarship] = useState<Scholarship | null>(null);
  const [trackerSearchCode, setTrackerSearchCode] = useState<string>('');
  
  // Track dismissed freeze notice ID so students can close ("x") the update,
  // but if staff issues a new freeze, it pops up again automatically.
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
    }
  }, [initialTab]);

  // Select ONLY the single latest active freeze announcement,
  // but ONLY if there is actually a frozen scholarship in effect right now.
  // This prevents stale "active" freeze records from showing phantom banners
  // after staff have already unfrozen programs.
  const latestFreezeAnnouncement = useMemo(() => {
    const active = freezePeriods.filter((f) => {
      if (!f.is_active) return false;

      // Confirm there is actually a frozen scholarship matching this record
      if (f.scholarship_id === 'all') {
        // "All scholarships" freeze: only valid if at least one scholarship is currently frozen
        return scholarships.some((s) => s.is_frozen);
      } else {
        // Specific scholarship freeze: only valid if that scholarship is still frozen
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
      // ignore storage errors
    }
  };

  const handleApplyClick = (scholarship: Scholarship) => {
    setSelectedScholarship(scholarship);
  };

  const handleApplicationSuccess = (newApp: Application) => {
    try {
      localStorage.setItem('scholarflow_student_email', newApp.email);
      localStorage.setItem('scholarflow_student_id', newApp.student_number);
    } catch {
      // ignore storage errors
    }
    onNewApplication(newApp);
    // Automatically switch to tracker tab with generated code
    setActiveTab('tracker');
    setTrackerSearchCode(newApp.reference_code);
  };

  const handleTrackCode = (refCode: string) => {
    setSelectedScholarship(null);
    setActiveTab('tracker');
    setTrackerSearchCode(refCode);
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
      
      {/* Active Emergency Freeze Alert Banner (Single latest update with dismiss option) */}
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
                ) : latestFreezeAnnouncement.start_date && latestFreezeAnnouncement.end_date && latestFreezeAnnouncement.start_date === latestFreezeAnnouncement.end_date ? (
                  <>
                    Effective Date: <strong>{latestFreezeAnnouncement.start_date}</strong>
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
            Scholarship & Grant Opportunities
          </h1>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center bg-slate-100 p-1.5 rounded-xl border border-slate-200 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-4 sm:px-5 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'catalog'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Award className="w-4 h-4 text-indigo-600" />
            <span>Browse Programs</span>
          </button>

          <button
            onClick={() => setActiveTab('tracker')}
            className={`flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-4 sm:px-5 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
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
      {activeTab === 'catalog' ? (
        <ScholarshipCatalog
          scholarships={scholarships}
          applications={applications}
          onApply={handleApplyClick}
          onTrack={handleTrackCode}
        />
      ) : (
        <StatusTracker
          applications={applications}
          initialSearchCode={trackerSearchCode}
        />
      )}

      {/* 3-Step Wizard Modal */}
      <AnimatePresence>
        {selectedScholarship && (
          <ApplicationWizard
            scholarship={selectedScholarship}
            applications={applications}
            onClose={() => setSelectedScholarship(null)}
            onSubmitSuccess={handleApplicationSuccess}
            onTrackExisting={handleTrackCode}
          />
        )}
      </AnimatePresence>

    </div>
  );
};
