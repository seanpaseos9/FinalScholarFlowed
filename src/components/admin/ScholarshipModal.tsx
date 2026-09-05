import React, { useState } from 'react';
import { motion } from 'motion/react';
import { X, Award, DollarSign, Users, Plus, CheckCircle2 } from 'lucide-react';
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
  const [slots, setSlots] = useState<number>(scholarshipToEdit?.slots || 20);
  const [slotsRemaining, setSlotsRemaining] = useState<number>(scholarshipToEdit?.slots_remaining || 20);
  const [grantAmount, setGrantAmount] = useState<number>(scholarshipToEdit?.grant_amount || 50000);
  const [grantType, setGrantType] = useState(scholarshipToEdit?.grant_type || '100% Tuition Discount');
  const [minGwa, setMinGwa] = useState<number>(scholarshipToEdit?.min_gwa || 1.75);
  const [maxFamilyIncome, setMaxFamilyIncome] = useState<number>(scholarshipToEdit?.max_family_income || 500000);
  const [deadline, setDeadline] = useState(scholarshipToEdit?.deadline || '2026-10-30');
  const [requirementsStr, setRequirementsStr] = useState(scholarshipToEdit?.requirements.join('\n') || 'Certificate of Matriculation\nITR / Indigency Certificate\nOfficial Student ID');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const reqList = requirementsStr
      .split('\n')
      .map(r => r.trim())
      .filter(r => r.length > 0);

    const schObj: Scholarship = {
      id: scholarshipToEdit?.id || `sch-${Date.now()}`,
      title: title.trim(),
      code: code.trim(),
      category,
      description: description.trim(),
      slots: Number(slots) || 1,
      slots_remaining: Number(slotsRemaining) || Number(slots) || 1,
      grant_amount: Number(grantAmount) || 0,
      grant_type: grantType.trim(),
      min_gwa: Number(minGwa) || 2.0,
      max_family_income: Number(maxFamilyIncome) || 0,
      deadline,
      requirements: reqList,
      is_active: true,
      is_frozen: scholarshipToEdit?.is_frozen || false,
      created_at: scholarshipToEdit?.created_at || new Date().toISOString(),
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Scholarship Title *</label>
              <input
                type="text"
                required
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
                value={code}
                onChange={e => setCode(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Category</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as ScholarshipCategory)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
              >
                <option value="Academic">Academic</option>
                <option value="Financial">Financial</option>
                <option value="Athletic">Athletic</option>
                <option value="Alumni">Alumni</option>
                <option value="Industry">Industry</option>
                <option value="Leadership">Leadership</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Grant Benefit Type</label>
              <input
                type="text"
                placeholder="e.g. 100% Tuition Waiver + ₱15,000 Stipend"
                value={grantType}
                onChange={e => setGrantType(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Program Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Grant Value (₱)</label>
              <input
                type="number"
                value={grantAmount}
                onChange={e => setGrantAmount(parseInt(e.target.value) || 0)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-indigo-600 focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Total Slots</label>
              <input
                type="number"
                value={slots}
                onChange={e => {
                  const s = parseInt(e.target.value) || 1;
                  setSlots(s);
                  setSlotsRemaining(s);
                }}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Min GWA Requirement</label>
              <input
                type="number"
                step="0.01"
                value={minGwa}
                onChange={e => setMinGwa(parseFloat(e.target.value) || 1.75)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Max Income Limit (₱)</label>
              <input
                type="number"
                value={maxFamilyIncome}
                onChange={e => setMaxFamilyIncome(parseInt(e.target.value) || 0)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Application Deadline</label>
            <input
              type="date"
              value={deadline}
              min={new Date().toISOString().split('T')[0]}
              onChange={e => setDeadline(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Required Documents (One per line)</label>
            <textarea
              rows={3}
              value={requirementsStr}
              onChange={e => setRequirementsStr(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:ring-2 focus:ring-indigo-500 focus:bg-white focus:outline-none"
            />
          </div>

          <div className="pt-3 flex justify-end space-x-2">
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
