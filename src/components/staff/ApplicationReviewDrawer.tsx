import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  X, CheckCircle2, FileText, Award, Eye, Trash2, AlertTriangle,
  RefreshCw, Clock, ShieldAlert, CalendarX
} from 'lucide-react';
import { Application, ApplicationStatus, ApplicationDocument, Scholarship, InterviewSchedule } from '../../types';
import { DocumentViewerModal } from '../common/DocumentViewerModal';

interface ApplicationReviewDrawerProps {
  application: Application;
  scholarships?: Scholarship[];
  onClose: () => void;
  onUpdateApplication: (updatedApp: Application) => void;
  onDeleteApplication?: (id: string) => void;
  onSaveInterview?: (interview: InterviewSchedule) => void;
}

/** Compute the scholarship expiry date: approvedAt + durationYears */
function computeExpiresAt(approvedAt: string, durationYears: number): string {
  const d = new Date(approvedAt);
  d.setFullYear(d.getFullYear() + durationYears);
  return d.toISOString().split('T')[0];
}

function formatDate(dateStr: string): string {
  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    if (year && month && day) {
      const d = new Date(year, month - 1, day);
      return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    }
    return new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch { return dateStr; }
}

const STATUS_COLORS: Record<ApplicationStatus, string> = {
  'Pending':     'bg-slate-200 text-slate-800',
  'In Review':   'bg-sky-100 text-sky-800',
  'Shortlisted': 'bg-indigo-100 text-indigo-800',
  'Approved':    'bg-emerald-100 text-emerald-800',
  'Rejected':    'bg-rose-100 text-rose-800',
  'For Renewal': 'bg-amber-100 text-amber-800',
  'Expired':     'bg-orange-100 text-orange-800',
  'Removed':     'bg-red-100 text-red-900',
};

export const ApplicationReviewDrawer: React.FC<ApplicationReviewDrawerProps> = ({
  application,
  scholarships = [],
  onClose,
  onUpdateApplication,
  onDeleteApplication,
  onSaveInterview,
}) => {
  const [status, setStatus] = useState<ApplicationStatus>(application.status);
  const [awardedAmount, setAwardedAmount] = useState<number | ''>(application.awarded_amount || 0);
  const [remarks, setRemarks] = useState<string>(application.remarks || '');
  const [staffNotes, setStaffNotes] = useState<string>(application.staff_notes || '');
  const [removalReason, setRemovalReason] = useState<string>(application.removal_reason || '');
  const [inspectDoc, setInspectDoc] = useState<ApplicationDocument | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Shortlist interview state
  const [interviewDateTime, setInterviewDateTime] = useState<string>('');
  const [interviewLocation, setInterviewLocation] = useState<string>('Scholarship Evaluation Office / Zoom');
  const [interviewerName, setInterviewerName] = useState<string>('Prof. Corazon V. Santos');
  const [interviewError, setInterviewError] = useState<string | null>(null);

  const getMinInterviewDateTime = () => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;
  };
  const minInterviewDateTime = getMinInterviewDateTime();

  // Keyboard accessibility: Escape key dismisses drawer or inspect doc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (inspectDoc) {
          setInspectDoc(null);
        } else if (confirmDelete) {
          setConfirmDelete(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [inspectDoc, confirmDelete, onClose]);

  const handleNumericKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (['e', 'E', 'g', 'G', '+', '-'].includes(e.key)) {
      e.preventDefault();
    }
  };

  const hasReviewNotesInput = Boolean(remarks || staffNotes || removalReason);

  const handleClearReviewNotes = () => {
    setRemarks('');
    setStaffNotes('');
    setRemovalReason('');
  };

  const handleResetReviewNotes = () => {
    setStatus(application.status);
    setAwardedAmount(application.awarded_amount || 0);
    setRemarks(application.remarks || '');
    setStaffNotes(application.staff_notes || '');
    setRemovalReason(application.removal_reason || '');
  };

  // Find matching scholarship to get policy info
  const scholarship = scholarships.find(s => s.id === application.scholarship_id);

  const handleSave = () => {
    const now = new Date().toISOString();
    let approved_at = application.approved_at;
    let expires_at = application.expires_at;

    // Auto-set lifecycle timestamps when approving
    if (status === 'Approved' && application.status !== 'Approved') {
      approved_at = now;
      const durYears = scholarship?.duration_years ?? 1;
      expires_at = computeExpiresAt(now, durYears);
    }

    if (status === 'Shortlisted') {
      if (interviewDateTime && interviewDateTime < minInterviewDateTime) {
        setInterviewError('Interview date and time must be in the future.');
        return;
      }
      if (onSaveInterview) {
        onSaveInterview({
          id: `inv-${Date.now()}`,
          application_id: application.id,
          student_name: `${application.first_name} ${application.last_name}`,
          scholarship_title: application.scholarship_title,
          date_time: interviewDateTime ? formatDate(interviewDateTime.split('T')[0]) + (interviewDateTime.includes('T') ? ` at ${interviewDateTime.split('T')[1]}` : '') : 'TBD (Scheduled)',
          location: interviewLocation.trim() || 'Scholarship Evaluation Office / Zoom',
          interviewer: interviewerName.trim() || 'Scholarship Coordinator',
          status: 'Scheduled',
        });
      }
    }

    const updated: Application = {
      ...application,
      status,
      awarded_amount: Number(awardedAmount) || 0,
      remarks: remarks.trim(),
      staff_notes: staffNotes.trim(),
      removal_reason: status === 'Removed' ? removalReason.trim() : application.removal_reason,
      approved_at,
      expires_at,
      updated_at: now,
    };

    onUpdateApplication(updated);
    onClose();
  };

  const handleDelete = () => {
    if (onDeleteApplication) {
      onDeleteApplication(application.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/60 backdrop-blur-xs flex justify-end">
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col overflow-y-auto border-l border-slate-200"
      >

        {/* Drawer Header */}
        <div className="bg-slate-900 text-white p-6 border-b border-slate-800 flex justify-between items-start sticky top-0 z-10">
          <div>
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <span className="text-xs font-mono font-bold text-indigo-400 bg-slate-800 px-2.5 py-1 rounded-md border border-slate-700">
                {application.reference_code}
              </span>
              <span className="text-xs text-slate-400">ID #{application.student_number}</span>
              {application.is_renewal && (
                <span className="inline-flex items-center space-x-1 text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-600/40 px-2 py-0.5 rounded-md">
                  <RefreshCw className="w-3 h-3" />
                  <span>Renewal Application</span>
                </span>
              )}
            </div>
            <h2 className="text-lg font-bold text-white mt-1">
              {application.first_name} {application.last_name}
            </h2>
            <p className="text-xs text-indigo-200 font-medium">{application.scholarship_title}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-2 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="p-6 space-y-6 text-xs flex-1">

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Degree & Year</span>
              <span className="font-bold text-slate-900">{application.program}</span>
              <span className="text-slate-500 block text-[10px]">{application.year_level}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Cumulative GWA</span>
              <span className="font-extrabold text-indigo-600 text-sm">{application.gwa.toFixed(2)}</span>
              {scholarship && (
                <span className={`text-[10px] font-bold block ${application.gwa <= scholarship.min_gwa ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {application.gwa <= scholarship.min_gwa ? '✓ Meets min' : '✗ Below min ' + scholarship.min_gwa.toFixed(2)}
                </span>
              )}
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Annual Income</span>
              <span className="font-bold text-slate-900">₱{(application.annual_family_income ?? (application.monthly_family_income * 12)).toLocaleString()}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Email</span>
              <span className="font-medium text-slate-800 truncate block">{application.email}</span>
            </div>
          </div>

          {/* Lifecycle Info (Approved applications) */}
          {(application.approved_at || application.expires_at) && (
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl space-y-2">
              <p className="font-bold text-emerald-800 text-[11px] uppercase tracking-wider flex items-center space-x-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Scholar Lifecycle</span>
              </p>
              <div className="grid grid-cols-2 gap-3 text-xs">
                {application.approved_at && (
                  <div>
                    <span className="text-[10px] text-emerald-600 font-bold uppercase block">Approved On</span>
                    <span className="font-bold text-slate-900">{formatDate(application.approved_at.split('T')[0])}</span>
                  </div>
                )}
                {application.expires_at && (
                  <div>
                    <span className="text-[10px] text-emerald-600 font-bold uppercase block">Grant Expires</span>
                    <span className="font-bold text-slate-900">{formatDate(application.expires_at)}</span>
                    {scholarship?.is_renewable && (
                      <span className="text-[10px] text-indigo-600 block font-medium">Renewable</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Removal Reason (Removed applications) */}
          {application.status === 'Removed' && application.removal_reason && (
            <div className="bg-red-50 border border-red-200 p-3.5 rounded-xl flex items-start space-x-2.5">
              <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-red-800 text-[11px] uppercase tracking-wide">Removal Reason</p>
                <p className="text-red-700 text-xs mt-0.5">{application.removal_reason}</p>
              </div>
            </div>
          )}

          {/* Attached Documents */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2">
              Submitted Documents ({application.documents.length})
            </h3>
            <div className="space-y-2">
              {application.documents.map(doc => (
                <div key={doc.id} className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex justify-between items-center">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 text-xs">{doc.name}</p>
                      <p className="text-[10px] text-slate-400 uppercase font-mono">{doc.type} • {doc.size}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setInspectDoc(doc)}
                    className="flex items-center space-x-1.5 text-xs font-bold text-indigo-600 bg-white border border-slate-200 hover:bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors shadow-2xs cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Inspect</span>
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Household Members */}
          {application.household_members && application.household_members.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2">
                Declared Household Members
              </h3>
              <div className="space-y-1.5">
                {application.household_members.map(hm => (
                  <div key={hm.id} className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 flex justify-between text-xs">
                    <div>
                      <span className="font-bold text-slate-800">{hm.name}</span> ({hm.relation}) — <span className="text-slate-500">{hm.occupation}</span>
                    </div>
                    <span className="font-bold text-indigo-600">₱{hm.monthly_income.toLocaleString()}/mo</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Evaluation Controls */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
            <h3 className="text-xs font-bold text-indigo-600 uppercase tracking-wider flex items-center space-x-1.5">
              <Award className="w-4 h-4" />
              <span>Committee Review &amp; Decision Panel</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Update Status</label>
                <select
                  value={status}
                  onChange={e => setStatus(e.target.value as ApplicationStatus)}
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                >
                  <option value="Pending">Pending Evaluation</option>
                  <option value="In Review">In Review</option>
                  <option value="Shortlisted">Shortlisted for Interview</option>
                  <option value="Approved">Approved Scholar</option>
                  <option value="Rejected">Not Selected / Rejected</option>
                  <option value="Removed">Removed (Policy Failure)</option>
                </select>

                {/* Inline status badge preview */}
                <span className={`inline-flex items-center mt-1.5 px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${STATUS_COLORS[status]}`}>
                  {status}
                </span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Awarded Grant Amount (₱)
                  {scholarship?.grant_amount && (
                    <span className="text-[10px] text-slate-400 font-normal ml-1">
                      (Max: ₱{scholarship.grant_amount.toLocaleString()})
                    </span>
                  )}
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  disabled={status !== 'Approved'}
                  value={status === 'Approved' ? (awardedAmount !== '' ? Number(awardedAmount).toLocaleString('en-US') : '') : ''}
                  onKeyDown={handleNumericKeyDown}
                  onChange={e => {
                    const raw = e.target.value.replace(/\D/g, '');
                    if (!raw) {
                      setAwardedAmount('');
                      return;
                    }
                    let num = parseInt(raw, 10);
                    const maxGrant = scholarship?.grant_amount || Number.MAX_SAFE_INTEGER;
                    if (num > maxGrant) {
                      num = maxGrant;
                    }
                    setAwardedAmount(num);
                  }}
                  placeholder={status === 'Approved' ? `Max ₱${scholarship?.grant_amount.toLocaleString() || '0'}` : 'Requires Approved Status'}
                  className={`w-full p-2.5 border rounded-xl font-bold text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none ${
                    status === 'Approved'
                      ? 'bg-white border-slate-300 text-indigo-600'
                      : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                  }`}
                />
                {status === 'Approved' && scholarship ? (
                  <p className="text-[10px] text-indigo-600 mt-0.5">
                    Grant expires in {scholarship.duration_years} school year{scholarship.duration_years !== 1 ? 's' : ''}
                    {scholarship.is_renewable ? ' · Renewable' : ' · Non-renewable'}
                  </p>
                ) : (
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Award input is disabled until status is formally set to Approved.
                  </p>
                )}
              </div>
            </div>

            {/* Shortlist Interview Fields — shown when status is Shortlisted */}
            {status === 'Shortlisted' && (
              <div className="bg-indigo-50 border border-indigo-200 p-3.5 rounded-xl space-y-3">
                <label className="block font-bold text-indigo-900 flex items-center space-x-1.5">
                  <Clock className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Interview Schedule & Venue Details</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Date & Time</label>
                    <input
                      type="datetime-local"
                      min={minInterviewDateTime}
                      value={interviewDateTime}
                      onChange={e => {
                        setInterviewDateTime(e.target.value);
                        setInterviewError(null);
                      }}
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none font-sans"
                    />
                    {interviewError && (
                      <p className="text-[10px] text-rose-600 font-semibold mt-1">{interviewError}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Interviewer Name</label>
                    <input
                      type="text"
                      value={interviewerName}
                      onChange={e => setInterviewerName(e.target.value)}
                      placeholder="e.g. Prof. Corazon V. Santos"
                      className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">Venue / Online Link</label>
                  <input
                    type="text"
                    value={interviewLocation}
                    onChange={e => setInterviewLocation(e.target.value)}
                    placeholder="e.g. Scholarship Evaluation Office Rm 302 or Zoom Link"
                    className="w-full p-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>
            )}

            {/* Removal Reason Field — only shown when setting to Removed */}
            {status === 'Removed' && (
              <div className="bg-red-50 border border-red-200 p-3.5 rounded-xl space-y-2">
                <label className="block font-bold text-red-700 flex items-center space-x-1.5">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Removal Reason *</span>
                </label>
                <textarea
                  rows={2}
                  value={removalReason}
                  maxLength={300}
                  onChange={e => setRemovalReason(e.target.value)}
                  placeholder="e.g. GWA dropped below minimum requirement of 1.75 in 2nd semester..."
                  className="w-full p-2.5 bg-white border border-red-300 rounded-xl text-xs focus:ring-2 focus:ring-red-400 focus:outline-none"
                  required
                />
                <p className="text-[10px] text-red-500">This reason will be visible to the student in their status tracker.</p>
              </div>
            )}

            <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
                Evaluation Notes & Remarks
              </span>
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleResetReviewNotes}
                  className="px-2.5 py-1 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Reset Notes
                </button>
                <button
                  type="button"
                  disabled={!hasReviewNotesInput}
                  onClick={handleClearReviewNotes}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                    hasReviewNotesInput
                      ? 'text-rose-600 bg-rose-50 hover:bg-rose-100 cursor-pointer border border-rose-200'
                      : 'text-slate-400 bg-slate-100 cursor-not-allowed border border-slate-200'
                  }`}
                >
                  Clear Notes
                </button>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Student-Visible Remarks</label>
              <textarea
                rows={2}
                value={remarks}
                maxLength={300}
                onChange={e => setRemarks(e.target.value)}
                placeholder="Enter remarks visible to student on Status Tracker..."
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Internal Coordinator Notes</label>
              <textarea
                rows={2}
                value={staffNotes}
                maxLength={300}
                onChange={e => setStaffNotes(e.target.value)}
                placeholder="Enter internal evaluation notes..."
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

        </div>

        {/* Drawer Action Footer */}
        <div className="bg-slate-100 p-4 border-t border-slate-200 flex justify-between items-center sticky bottom-0">
          <div>
            {onDeleteApplication && (
              !confirmDelete ? (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="px-3 py-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 font-bold text-xs rounded-xl inline-flex items-center space-x-1 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              ) : (
                <div className="inline-flex items-center space-x-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span className="text-[11px] font-bold text-rose-600">Permanently delete?</span>
                  <button type="button" onClick={handleDelete} className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] rounded-lg cursor-pointer">Confirm</button>
                  <button type="button" onClick={() => setConfirmDelete(false)} className="px-2 py-1.5 bg-white border border-slate-300 text-slate-600 font-medium text-[11px] rounded-lg cursor-pointer">Cancel</button>
                </div>
              )
            )}
          </div>

          <div className="flex items-center space-x-3">
            <button onClick={onClose} className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 cursor-pointer">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={status === 'Removed' && !removalReason.trim()}
              className={`px-6 py-2 text-white font-bold text-xs rounded-xl shadow-xs flex items-center space-x-1.5 transition-colors ${
                status === 'Removed' && !removalReason.trim()
                  ? 'bg-slate-300 cursor-not-allowed'
                  : 'bg-slate-900 hover:bg-indigo-600 cursor-pointer'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-white" />
              <span>Save Decision</span>
            </button>
          </div>
        </div>

      </motion.div>

      {/* Document Inspection Modal */}
      {inspectDoc && (
        <DocumentViewerModal
          document={inspectDoc}
          studentName={`${application.first_name} ${application.last_name}`}
          studentNumber={application.student_number}
          onClose={() => setInspectDoc(null)}
        />
      )}
    </div>
  );
};
