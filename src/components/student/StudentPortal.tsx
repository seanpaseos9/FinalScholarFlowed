import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Award, Clock, ShieldAlert, Sparkles } from 'lucide-react';
import { Scholarship, Application, FreezePeriod } from '../../types';
import { ScholarshipCatalog } from './ScholarshipCatalog';
import { ApplicationWizard } from './ApplicationWizard';
import { StatusTracker } from './StatusTracker';

interface StudentPortalProps {
  scholarships: Scholarship[];
  applications: Application[];
  freezePeriods: FreezePeriod[];
  onNewApplication: (app: Application) => void;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({
  scholarships,
  applications,
  freezePeriods,
  onNewApplication,
}) => {
  const [activeTab, setActiveTab] = useState<'catalog' | 'tracker'>('catalog');
  const [selectedScholarship, setSelectedScholarship] = useState<Scholarship | null>(null);
  const [trackerSearchCode, setTrackerSearchCode] = useState<string>('');

  // Check if there are active freeze announcements
  const activeFreezeAnnouncements = freezePeriods.filter(f => f.is_active);

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
    setTrackerSearchCode(newApp.reference_code);
  };

  const handleTrackCode = (refCode: string) => {
    setSelectedScholarship(null);
    setActiveTab('tracker');
    setTrackerSearchCode(refCode);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      
      {/* Active Emergency Freeze Alert Banner (if broadcasted by Staff) */}
      {activeFreezeAnnouncements.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50 border border-amber-200 p-4 sm:p-5 rounded-2xl shadow-xs space-y-2"
        >
          <div className="flex items-center space-x-2 text-amber-900 font-bold text-xs uppercase tracking-wider">
            <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0" />
            <span>Scholarship Committee Notice: Submission Schedule Update</span>
          </div>
          {activeFreezeAnnouncements.map(f => (
            <div key={f.id} className="text-xs text-amber-800 space-y-1 pl-7">
              <p className="font-semibold">{f.announcement_note}</p>
              <p className="text-[11px] text-amber-700">
                Effective Period: <strong>{f.start_date}</strong> to <strong>{f.end_date}</strong>
              </p>
            </div>
          ))}
        </motion.div>
      )}

      {/* Top Section Header & Tab Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase border border-indigo-100">
              Student Applicant Portal
            </span>
            <span className="text-xs text-slate-400">• Open Access Submission</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">
            Scholarship & Grant Opportunities
          </h1>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center bg-slate-100 p-1.5 rounded-xl border border-slate-200 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('catalog')}
            className={`flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
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
            className={`flex-1 sm:flex-initial flex items-center justify-center space-x-2 px-5 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
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
