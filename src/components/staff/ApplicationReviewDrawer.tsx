import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, CheckCircle2, FileText, Download, Award, DollarSign, UserCheck, ShieldCheck, Clock, ExternalLink, MessageSquare, Eye, Trash2 } from 'lucide-react';
import { Application, ApplicationStatus, ApplicationDocument } from '../../types';
import { DocumentViewerModal } from '../common/DocumentViewerModal';

interface ApplicationReviewDrawerProps {
  application: Application;
  onClose: () => void;
  onUpdateApplication: (updatedApp: Application) => void;
  onDeleteApplication?: (id: string) => void;
}

export const ApplicationReviewDrawer: React.FC<ApplicationReviewDrawerProps> = ({
  application,
  onClose,
  onUpdateApplication,
  onDeleteApplication,
}) => {
  const [status, setStatus] = useState<ApplicationStatus>(application.status);
  const [awardedAmount, setAwardedAmount] = useState<number>(application.awarded_amount || 0);
  const [remarks, setRemarks] = useState<string>(application.remarks || '');
  const [staffNotes, setStaffNotes] = useState<string>(application.staff_notes || '');
  const [inspectDoc, setInspectDoc] = useState<ApplicationDocument | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleSave = () => {
    const updated: Application = {
      ...application,
      status,
      awarded_amount: Number(awardedAmount) || 0,
      remarks: remarks.trim(),
      staff_notes: staffNotes.trim(),
      updated_at: new Date().toISOString(),
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
        className="bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col justify-between overflow-y-auto border-l border-slate-200"
      >
        
        {/* Drawer Header */}
        <div className="bg-slate-900 text-white p-6 border-b border-slate-800 flex justify-between items-start sticky top-0 z-10">
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono font-bold text-indigo-400 bg-slate-800 px-2.5 py-1 rounded-md border border-slate-700">
                {application.reference_code}
              </span>
              <span className="text-xs text-slate-400">ID #{application.student_number}</span>
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
          
          {/* Quick Metrics & Info Box */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Degree & Year</span>
              <span className="font-bold text-slate-900">{application.program}</span>
              <span className="text-slate-500 block text-[10px]">{application.year_level}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Cumulative GWA</span>
              <span className="font-extrabold text-indigo-600 text-sm">{application.gwa.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Monthly Income</span>
              <span className="font-bold text-slate-900">₱{application.monthly_family_income.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Email Address</span>
              <span className="font-medium text-slate-800 truncate block">{application.email}</span>
            </div>
          </div>

          {/* Attached Supporting Documents */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-200 pb-2">
              Submitted Supporting Documents ({application.documents.length})
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
                    <span>Inspect File</span>
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
              <span>Committee Review & Decision Panel</span>
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
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Awarded Grant Amount (₱)</label>
                <input
                  type="number"
                  value={awardedAmount}
                  onChange={e => setAwardedAmount(parseFloat(e.target.value) || 0)}
                  placeholder="e.g. 50000"
                  className="w-full p-2.5 bg-white border border-slate-300 rounded-xl font-bold text-xs text-indigo-600 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Student-Visible Remarks
              </label>
              <textarea
                rows={2}
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                placeholder="Enter remarks visible to student on Status Tracker..."
                className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Internal Coordinator Notes
              </label>
              <textarea
                rows={2}
                value={staffNotes}
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
                  title="Delete this application record"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              ) : (
                <div className="inline-flex items-center space-x-2">
                  <span className="text-[11px] font-bold text-rose-600">Permanently delete?</span>
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[11px] rounded-lg transition-colors cursor-pointer"
                  >
                    Confirm
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmDelete(false)}
                    className="px-2 py-1.5 bg-white border border-slate-300 text-slate-600 font-medium text-[11px] rounded-lg hover:bg-slate-50 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              )
            )}
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white border border-slate-300 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-slate-900 hover:bg-indigo-600 text-white font-bold text-xs rounded-xl shadow-xs flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-white" />
              <span>Save Decision</span>
            </button>
          </div>
        </div>

      </motion.div>

      {/* Staff Document Inspection Modal */}
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
