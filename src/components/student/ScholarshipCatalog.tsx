import React, { useState, useMemo } from 'react';
import { Search, Filter, Calendar, Users, DollarSign, AlertTriangle, ArrowRight, CheckCircle2, ShieldAlert, Clock } from 'lucide-react';
import { Scholarship, ScholarshipCategory, Application } from '../../types';

interface ScholarshipCatalogProps {
  scholarships: Scholarship[];
  applications?: Application[];
  onApply: (scholarship: Scholarship) => void;
  onTrack?: (referenceCode: string) => void;
}

export const ScholarshipCatalog: React.FC<ScholarshipCatalogProps> = ({
  scholarships,
  applications = [],
  onApply,
  onTrack,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Retrieve saved applicant credentials from session/localStorage if available
  const knownEmail = useMemo(() => {
    try {
      return (localStorage.getItem('scholarflow_student_email') || '').trim().toLowerCase();
    } catch {
      return '';
    }
  }, []);

  const knownId = useMemo(() => {
    try {
      return (localStorage.getItem('scholarflow_student_id') || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    } catch {
      return '';
    }
  }, []);

  const categories: (ScholarshipCategory | 'All')[] = ['All', 'Academic', 'Financial', 'Athletic', 'Alumni', 'Industry', 'Leadership'];

  const filteredScholarships = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return scholarships.filter((s) => {
      const matchesSearch =
        !q ||
        (s.title && s.title.toLowerCase().includes(q)) ||
        (s.description && s.description.toLowerCase().includes(q)) ||
        (s.code && s.code.toLowerCase().includes(q)) ||
        (s.category && s.category.toLowerCase().includes(q)) ||
        (s.grant_type && s.grant_type.toLowerCase().includes(q)) ||
        (s.requirements && s.requirements.some((r) => r.toLowerCase().includes(q)));

      const matchesCategory =
        selectedCategory === 'All' ||
        (s.category && s.category.trim().toLowerCase() === selectedCategory.trim().toLowerCase());

      return matchesSearch && matchesCategory;
    });
  }, [scholarships, searchQuery, selectedCategory]);

  return (
    <div className="space-y-8">
      
      {/* Search & Filter Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
          
          {/* Search Bar */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search programs by title, code or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-0.5 rounded cursor-pointer"
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center space-x-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
            <Filter className="w-3.5 h-3.5 text-slate-400 mr-1 shrink-0" />
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(selectedCategory === cat && cat !== 'All' ? 'All' : cat)}
                className={`text-xs font-semibold px-3.5 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* Scholarship Cards Grid */}
      {filteredScholarships.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-3">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">No Programs Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search terms or selecting a different category filter.
          </p>
          {(searchQuery || selectedCategory !== 'All') && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('All');
              }}
              className="mt-2 text-xs font-bold px-4 py-2 bg-slate-900 text-white hover:bg-indigo-600 rounded-xl transition-colors cursor-pointer"
            >
              Reset Search & Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredScholarships.map(s => {
            const alreadyApplied = applications.find(a =>
              a.scholarship_id === s.id &&
              ((knownEmail && a.email?.trim().toLowerCase() === knownEmail) ||
               (knownId && a.student_number?.trim().toLowerCase().replace(/[^a-z0-9]/g, '') === knownId))
            );

            return (
              <div
                key={s.id}
                className={`bg-white rounded-2xl border transition-all duration-200 flex flex-col justify-between overflow-hidden relative shadow-xs ${
                  alreadyApplied
                    ? 'border-indigo-300 bg-indigo-50/10 hover:border-indigo-500'
                    : s.is_frozen
                    ? 'border-amber-300 bg-amber-50/20'
                    : 'border-slate-200 hover:border-indigo-400 hover:shadow-md'
                }`}
              >
                {/* Card Body */}
                <div className="p-6 pb-4 space-y-3">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
                        {s.category}
                      </span>
                      {alreadyApplied && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Already Applied</span>
                        </span>
                      )}
                    </div>
                    
                    {s.is_frozen ? (
                      <span className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-amber-500 text-white flex items-center space-x-1">
                        <ShieldAlert className="w-3 h-3" />
                        <span>Paused</span>
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 flex items-center space-x-1">
                        <Users className="w-3 h-3" />
                        <span>{s.slots_remaining} / {s.slots} Slots Left</span>
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="text-[10px] font-mono font-semibold text-slate-400 block">{s.code}</span>
                    <h3 className="text-base font-bold text-slate-900 leading-snug mt-0.5">
                      {s.title}
                    </h3>
                  </div>

                <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                  {s.description}
                </p>

                {/* Frozen Note Banner if active */}
                {s.is_frozen && s.freeze_note && (
                  <div className="bg-amber-100/80 text-amber-900 p-2.5 rounded-xl border border-amber-300 text-xs font-medium space-y-1">
                    <p className="font-bold text-[11px] flex items-center space-x-1 text-amber-800">
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                      <span>Notice:</span>
                    </p>
                    <p className="text-[11px] text-amber-800">{s.freeze_note}</p>
                  </div>
                )}

                {/* Key Eligibility Highlights */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase block">Min GWA / GPA</span>
                    <span className="font-bold text-slate-800">{s.min_gwa.toFixed(2)} or higher</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase block">Max Household Income</span>
                    <span className="font-bold text-slate-800">₱{s.max_family_income.toLocaleString()} / mo</span>
                  </div>
                </div>

                {/* Grant Amount Display */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                  <div className="flex items-center space-x-1.5 text-indigo-600 font-bold text-xs">
                    <DollarSign className="w-4 h-4" />
                    <span>Grant Value & Coverage:</span>
                  </div>
                  <p className="text-sm font-bold text-slate-900">
                    ₱{s.grant_amount.toLocaleString()} <span className="text-xs font-normal text-slate-500">({s.grant_type})</span>
                  </p>
                </div>

                {/* Requirements Checklist */}
                <div className="space-y-1 pt-1">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block">
                    Document Requirements:
                  </span>
                  <div className="space-y-1">
                    {s.requirements.map((req, idx) => (
                      <div key={idx} className="flex items-center space-x-1.5 text-xs text-slate-600">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate">{req}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Action Footer */}
              <div className="bg-slate-50 p-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center space-x-1.5 text-xs text-slate-500">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Deadline: <strong className="text-slate-800">{s.deadline}</strong></span>
                </div>

                {alreadyApplied ? (
                  <button
                    onClick={() => onTrack ? onTrack(alreadyApplied.reference_code) : onApply(s)}
                    className="text-xs font-bold px-4 py-2.5 rounded-xl flex items-center space-x-1.5 transition-all shadow-xs uppercase tracking-wide cursor-pointer bg-slate-900 hover:bg-indigo-600 text-white"
                    title="You already applied for this scholarship. Click to view submission details."
                  >
                    <Clock className="w-3.5 h-3.5 text-indigo-300" />
                    <span>Track Application</span>
                  </button>
                ) : (
                  <button
                    disabled={s.is_frozen || s.slots_remaining === 0}
                    onClick={() => onApply(s)}
                    className={`text-xs font-bold px-4 py-2.5 rounded-xl flex items-center space-x-1.5 transition-all shadow-xs uppercase tracking-wide cursor-pointer ${
                      s.is_frozen || s.slots_remaining === 0
                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                        : 'bg-slate-900 hover:bg-indigo-600 text-white'
                    }`}
                  >
                    <span>{s.is_frozen ? 'Paused' : s.slots_remaining === 0 ? 'Full' : 'Apply Now'}</span>
                    {!s.is_frozen && s.slots_remaining > 0 && <ArrowRight className="w-3.5 h-3.5" />}
                  </button>
                )}
              </div>

            </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
