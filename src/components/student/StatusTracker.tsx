import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Search, Clock, CheckCircle2, AlertCircle, Award, Calendar, FileText, UserCheck, ShieldCheck, Printer, XCircle, Eye } from 'lucide-react';
import { Application, ApplicationStatus, ApplicationDocument } from '../../types';
import { DocumentViewerModal } from '../common/DocumentViewerModal';

interface StatusTrackerProps {
  applications: Application[];
  initialSearchCode?: string;
}

export const StatusTracker: React.FC<StatusTrackerProps> = ({
  applications,
  initialSearchCode = '',
}) => {
  const [searchQuery, setSearchQuery] = useState(initialSearchCode);
  const [searched, setSearched] = useState(Boolean(initialSearchCode));
  const [previewDoc, setPreviewDoc] = useState<{ doc: ApplicationDocument; app: Application } | null>(null);

  React.useEffect(() => {
    if (initialSearchCode) {
      setSearchQuery(initialSearchCode);
      setSearched(true);
    }
  }, [initialSearchCode]);

  const cleanQuery = searchQuery.trim().toLowerCase();
  const cleanAlpha = cleanQuery.replace(/[^a-z0-9]/g, '');

  // Filter matching application by Reference Code, Student Number, Email, or Name (case-insensitive, non-capital friendly)
  const matchedApps = useMemo(() => {
    if (!cleanQuery) return [];
    return applications.filter((a) => {
      const refCode = (a.reference_code || '').toLowerCase();
      const refAlpha = refCode.replace(/[^a-z0-9]/g, '');

      const studentNum = (a.student_number || '').toLowerCase();
      const studentNumAlpha = studentNum.replace(/[^a-z0-9]/g, '');

      const email = (a.email || '').toLowerCase();
      const fullName = `${a.first_name || ''} ${a.last_name || ''}`.toLowerCase();

      // 1. Reference code match (case-insensitive, handles lower/uppercase and with or without hyphens)
      const matchesRef =
        refCode === cleanQuery ||
        refCode.includes(cleanQuery) ||
        (cleanAlpha.length >= 3 && (refAlpha === cleanAlpha || refAlpha.includes(cleanAlpha)));

      // 2. Student ID match (case-insensitive, handles lower/uppercase and with or without hyphens)
      const matchesStudentNum =
        studentNum === cleanQuery ||
        studentNum.includes(cleanQuery) ||
        (cleanAlpha.length >= 3 && (studentNumAlpha === cleanAlpha || studentNumAlpha.includes(cleanAlpha)));

      // 3. Institutional email match (case-insensitive)
      const matchesEmail = email === cleanQuery || email.includes(cleanQuery);

      // 4. Student Full Name match (case-insensitive)
      const matchesName = cleanQuery.length >= 3 && fullName.includes(cleanQuery);

      return matchesRef || matchesStudentNum || matchesEmail || matchesName;
    });
  }, [applications, cleanQuery, cleanAlpha]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
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
      
      {/* Tracker Search Box */}
      <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-xs space-y-4 text-center">
        <div className="inline-flex items-center space-x-2 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-xs font-semibold border border-indigo-100">
          <Clock className="w-3.5 h-3.5 text-indigo-600" />
          <span>Real-Time Application Tracking</span>
        </div>

        <h2 className="text-2xl font-bold text-slate-900">
          Track Your Scholarship Application
        </h2>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Enter your official <strong>Reference Code</strong> (e.g. SF-982F1A03 or sf-982f1a03), <strong>Student ID Number</strong>, or registered <strong>Email Address</strong> below.
        </p>

        <form onSubmit={handleSearch} className="max-w-xl mx-auto flex flex-col sm:flex-row gap-2 pt-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Enter Reference Code, Student ID, or Email..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                if (e.target.value.trim().length >= 2) {
                  setSearched(true);
                }
              }}
              className="w-full pl-10 pr-9 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSearched(false);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5 rounded cursor-pointer"
                title="Clear query"
              >
                ✕
              </button>
            )}
          </div>
          <button
            type="submit"
            className="bg-slate-900 hover:bg-indigo-600 text-white font-bold text-xs px-6 py-3 rounded-xl transition-colors shadow-xs cursor-pointer shrink-0"
          >
            Track Application
          </button>
        </form>
      </div>

      {/* Results Display Section */}
      {searched && (
        <div className="space-y-6">
          {matchedApps.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center border border-slate-200 space-y-3">
              <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
              <h3 className="text-base font-bold text-slate-900">No Record Found</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                We couldn't find any scholarship application matching "<strong>{searchQuery}</strong>". Please double check your reference code or student ID number.
              </p>
            </div>
          ) : (
            matchedApps.map(app => {
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

                    {/* Attached Documents */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Submitted Verification Documents ({app.documents.length})
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {app.documents.map((doc) => (
                          <div key={doc.id} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between">
                            <div className="flex items-center space-x-2 min-w-0">
                              <FileText className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                              <div className="truncate">
                                <p className="font-bold text-slate-800 text-[11px] truncate">{doc.name}</p>
                                <p className="text-[9px] text-slate-400 font-mono">{doc.size}</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => setPreviewDoc({ doc, app })}
                              className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center space-x-1 px-2 py-1 bg-white hover:bg-indigo-50 border border-slate-200 rounded-lg transition shrink-0 ml-1 cursor-pointer"
                            >
                              <Eye className="w-3 h-3" />
                              <span>View</span>
                            </button>
                          </div>
                        ))}
                      </div>
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
                        <span className="text-[10px] text-slate-400 uppercase font-bold block">Verified Files</span>
                        <span className="font-bold text-slate-900">{app.documents.length} Files</span>
                      </div>
                    </div>

                  </div>

                </motion.div>
              );
            })
          )}
        </div>
      )}

      {/* Document Viewer Modal for Student Status Tracker */}
      {previewDoc && (
        <DocumentViewerModal
          document={previewDoc.doc}
          studentName={`${previewDoc.app.first_name} ${previewDoc.app.last_name}`}
          studentNumber={previewDoc.app.student_number}
          onClose={() => setPreviewDoc(null)}
        />
      )}

    </div>
  );
};
