import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, ShieldAlert, AlertTriangle } from 'lucide-react';
import { Scholarship, FreezePeriod } from '../../types';

interface EmergencyFreezeModalProps {
  scholarships: Scholarship[];
  onClose: () => void;
  onSaveFreeze: (newFreeze: FreezePeriod) => void;
}

export const EmergencyFreezeModal: React.FC<EmergencyFreezeModalProps> = ({
  scholarships,
  onClose,
  onSaveFreeze,
}) => {
  const today = new Date().toISOString().split('T')[0];
  const [selectedScholarshipId, setSelectedScholarshipId] = useState<string>('all');
  const [actionType, setActionType] = useState<'freeze' | 'extend' | 'unfreeze'>('freeze');
  const [startDate, setStartDate] = useState<string>(today);
  const [endDate, setEndDate] = useState<string>('');
  const [dateError, setDateError] = useState<string>('');
  const [announcementNote, setAnnouncementNote] = useState<string>(
    'Notice: Submissions temporarily paused for mid-term academic verification by the Scholarship Evaluation Committee.'
  );

  const selectedScholarship = scholarships.find(s => s.id === selectedScholarshipId);
  const isCurrentlyFrozen =
    selectedScholarshipId === 'all'
      ? scholarships.some(s => s.is_frozen)
      : selectedScholarship?.is_frozen ?? false;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (actionType !== 'unfreeze') {
      if (!announcementNote.trim()) return;
      if (endDate && startDate && endDate < startDate) {
        setDateError('End date must be on or after the start date.');
        return;
      }
    }
    setDateError('');

    const matchedSch = scholarships.find(s => s.id === selectedScholarshipId);

    const freezeRecord: FreezePeriod = {
      id: `fz-${Date.now()}`,
      scholarship_id: selectedScholarshipId,
      scholarship_title: matchedSch ? matchedSch.title : 'All Scholarships',
      start_date: actionType === 'unfreeze' ? today : startDate,
      end_date: actionType === 'unfreeze' ? today : endDate,
      announcement_note:
        actionType === 'unfreeze'
          ? 'Scholarship submissions have been resumed.'
          : announcementNote.trim(),
      created_by: 'Academic Aid Coordinator (Staff)',
      created_at: new Date().toISOString(),
      is_active: actionType === 'freeze',
    };

    onSaveFreeze(freezeRecord);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden"
      >
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 border-b border-slate-800 flex justify-between items-center">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-indigo-600 text-white rounded-xl">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Emergency Freeze & Deadline Extension</h3>
              <p className="text-[11px] text-slate-400">Scholarship Operations Control</p>
            </div>
          </div>

          <button onClick={onClose} className="text-slate-400 hover:text-white p-2 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          
          <div>
            <label className="block font-bold text-slate-700 mb-1">Target Scholarship Program</label>
            <select
              value={selectedScholarshipId}
              onChange={e => setSelectedScholarshipId(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
            >
              <option value="all">⚡ ALL OPEN SCHOLARSHIP PROGRAMS</option>
              {scholarships.map(s => (
                <option key={s.id} value={s.id}>
                  {s.title} ({s.code}){s.is_frozen ? ' — Frozen' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Action Type</label>
              <select
                value={actionType}
                onChange={e => setActionType(e.target.value as 'freeze' | 'extend' | 'unfreeze')}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
              >
                <option value="freeze">Pause / Freeze Submissions</option>
                <option value="extend">Extend Application Deadline</option>
                <option value="unfreeze">Unfreeze / Resume Submissions</option>
              </select>
              {actionType === 'unfreeze' && !isCurrentlyFrozen && (
                <p className="text-[11px] text-amber-600 mt-1 font-medium">
                  Selected program is not currently frozen.
                </p>
              )}
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Effective Start Date</label>
              <input
                type="date"
                value={startDate}
                min={today}
                onChange={e => { setStartDate(e.target.value); setDateError(''); }}
                disabled={actionType === 'unfreeze'}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          {actionType !== 'unfreeze' && (
            <>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Effective End Date</label>
                <input
                  type="date"
                  value={endDate}
                  min={startDate || today}
                  onChange={e => { setEndDate(e.target.value); setDateError(''); }}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                />
                {dateError && <p className="text-[11px] text-rose-600 mt-1 font-medium">{dateError}</p>}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Student Portal Announcement Note</label>
                <textarea
                  rows={3}
                  value={announcementNote}
                  onChange={e => setAnnouncementNote(e.target.value)}
                  placeholder="Enter custom note broadcasted to students..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
                />
              </div>
            </>
          )}

          {actionType === 'unfreeze' ? (
            <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-[11px] text-emerald-900 flex items-start space-x-2">
              <span className="text-emerald-600 shrink-0 font-bold text-base leading-none mt-0.5">✓</span>
              <p>This will immediately lift the freeze and resume open student submissions. The announcement banner will be removed from the Student Portal.</p>
            </div>
          ) : (
            <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-[11px] text-amber-900 flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p>Saving this action will immediately broadcast an announcement banner across the Student Applicant Portal and update program status.</p>
            </div>
          )}

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
              disabled={actionType === 'unfreeze' && !isCurrentlyFrozen}
              className="px-5 py-2 bg-slate-900 hover:bg-indigo-600 text-white font-bold rounded-xl transition-colors shadow-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {actionType === 'unfreeze' ? 'Confirm Unfreeze' : 'Broadcast & Save Action'}
            </button>
          </div>

        </form>

      </motion.div>
    </div>
  );
};
