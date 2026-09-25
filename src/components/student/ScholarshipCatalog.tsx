import React, { useState, useMemo, useEffect } from 'react';
import { Search, Filter, Calendar, Users, AlertTriangle, ArrowRight, CheckCircle2, ShieldAlert, Clock, ChevronLeft, ChevronRight, ArrowUpDown } from 'lucide-react';
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
  const [deadlineFilter, setDeadlineFilter] = useState<string>('');
  const [filterIncome, setFilterIncome] = useState<string>('');
  const [filterGpa, setFilterGpa] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(6);

  // Retrieve saved applicant credentials from session/localStorage if available
  const knownEmail = useMemo(() => {
    try {
      return (sessionStorage.getItem('scholarflow_student_email') || localStorage.getItem('scholarflow_student_email') || '').trim().toLowerCase();
    } catch {
      return '';
    }
  }, []);

  const knownId = useMemo(() => {
    try {
      return (sessionStorage.getItem('scholarflow_student_id') || localStorage.getItem('scholarflow_student_id') || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    } catch {
      return '';
    }
  }, []);

  const categories: (ScholarshipCategory | 'All')[] = ['All', 'Academic', 'Financial', 'Athletic', 'Alumni', 'Industry', 'Leadership', 'Performing Arts'];

  const hasActiveFilters = Boolean(searchQuery.trim() || selectedCategory !== 'All' || deadlineFilter || filterIncome || filterGpa);

  const handleReset = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setDeadlineFilter('');
    setFilterIncome('');
    setFilterGpa('');
    setCurrentPage(1);
  };

  // Keyboard accessibility: Escape key clears active filters
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && hasActiveFilters) {
        handleReset();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [hasActiveFilters]);

  const filteredScholarships = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const incomeVal = filterIncome ? Number(filterIncome) : NaN;
    const gpaVal = filterGpa ? Number(filterGpa) : NaN;

    return scholarships
      .filter((s) => {
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

        const matchesDeadline = !deadlineFilter || (s.deadline && s.deadline <= deadlineFilter);

        // Smart Scholarship Filter matching logic
        const matchesIncome = isNaN(incomeVal) || !s.max_family_income || s.max_family_income === 0 || incomeVal <= s.max_family_income;
        const matchesGpa = isNaN(gpaVal) || !s.min_gwa || gpaVal <= s.min_gwa;

        return matchesSearch && matchesCategory && matchesDeadline && matchesIncome && matchesGpa;
      })
      .sort((a, b) => {
        const timeA = new Date(a.created_at || a.deadline || 0).getTime();
        const timeB = new Date(b.created_at || b.deadline || 0).getTime();
        return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
      });
  }, [scholarships, searchQuery, selectedCategory, deadlineFilter, filterIncome, filterGpa, sortOrder]);

  // Reset to page 1 whenever search query, category, or deadline filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, deadlineFilter]);

  // Compute pagination bounds
  const totalItems = filteredScholarships.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  const paginatedScholarships = useMemo(() => {
    return filteredScholarships.slice(startIndex, endIndex);
  }, [filteredScholarships, startIndex, endIndex]);

  const handlePageChange = (newPage: number) => {
    const clamped = Math.max(1, Math.min(newPage, totalPages));
    setCurrentPage(clamped);
    const element = document.getElementById('scholarship-catalog-top');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div id="scholarship-catalog-top" className="space-y-8">
      
      {/* Search & Filter Header */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center">
          
          {/* Search Bar */}
          <div className="relative w-full lg:w-80">
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

          {/* Date Filter & Reset Control */}
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            {/* Date Filtering Control */}
            <div className="flex items-center space-x-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
              <Calendar className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span className="text-[11px] font-bold text-slate-600 whitespace-nowrap">Deadline By:</span>
              <input
                type="date"
                value={deadlineFilter}
                onChange={(e) => setDeadlineFilter(e.target.value)}
                className="text-xs bg-transparent border-0 focus:outline-none text-slate-800 font-medium cursor-pointer"
              />
              {deadlineFilter && (
                <button
                  type="button"
                  onClick={() => setDeadlineFilter('')}
                  className="text-slate-400 hover:text-slate-700 text-xs cursor-pointer ml-1"
                  title="Clear deadline filter"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Form Controls: Sort & Reset */}
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setSortOrder(prev => prev === 'desc' ? 'asc' : 'desc')}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer border border-slate-200"
                title={`Sort order: currently ${sortOrder === 'desc' ? 'Newest First (Descending)' : 'Oldest First (Ascending)'}`}
              >
                <ArrowUpDown className="w-3.5 h-3.5 text-indigo-600" />
                <span>{sortOrder === 'desc' ? 'Newest (Desc)' : 'Oldest (Asc)'}</span>
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Reset
              </button>
            </div>
          </div>

        </div>

        {/* Smart Scholarship Filter Panel */}
        <div className="bg-indigo-50/70 border border-indigo-100 rounded-xl p-3.5 flex flex-wrap items-center gap-4">
          <div className="flex items-center space-x-2 text-indigo-900 font-bold text-xs">
            <span className="bg-indigo-600 text-white text-[10px] px-2 py-0.5 rounded-md uppercase tracking-wider font-extrabold">Smart Filter</span>
            <span>Check Scholarship Eligibility:</span>
          </div>
          <div className="flex items-center space-x-2 text-xs">
            <label className="font-bold text-slate-700">Annual Gross Family Income (₱):</label>
            <input
              type="number"
              inputMode="numeric"
              min="0"
              step="1"
              placeholder="e.g. 360000"
              value={filterIncome}
              onChange={(e) => {
                // Allow only digits (no commas, letters, special chars)
                const raw = e.target.value.replace(/\D/g, '');
                setFilterIncome(raw);
              }}
              onKeyDown={(e) => {
                // Prevent e, E, +, - characters from number inputs
                if (['e', 'E', '+', '-', '.'].includes(e.key)) e.preventDefault();
              }}
              className="w-36 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div className="flex items-center space-x-2 text-xs">
            <label className="font-bold text-slate-700">GPA:</label>
            <input
              type="number"
              inputMode="decimal"
              min="1"
              max="5"
              step="0.01"
              placeholder="e.g. 1.75"
              value={filterGpa}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '') {
                  setFilterGpa('');
                  return;
                }
                const num = parseFloat(val);
                // Reject values outside 1.0 – 5.0
                if (!isNaN(num) && num >= 1 && num <= 5) {
                  setFilterGpa(val);
                } else if (!isNaN(num)) {
                  // Clamp to valid range
                  setFilterGpa(String(Math.min(5, Math.max(1, num))));
                }
              }}
              onKeyDown={(e) => {
                if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault();
              }}
              className="w-24 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          {(filterIncome || filterGpa) && (
            <button
              type="button"
              onClick={() => { setFilterIncome(''); setFilterGpa(''); }}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 underline cursor-pointer ml-auto"
            >
              Reset Smart Matcher
            </button>
          )}
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto w-full pb-1 scrollbar-none pt-2 border-t border-slate-100">
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

      {/* Scholarship Cards Grid */}
      {filteredScholarships.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-slate-200 space-y-3">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">No Programs Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search terms, date filter, or selecting a different category filter.
          </p>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleReset}
              className="mt-2 text-xs font-bold px-4 py-2 bg-slate-900 text-white hover:bg-indigo-600 rounded-xl transition-colors cursor-pointer"
            >
              Clear All Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedScholarships.map(s => {
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
                    <span className="text-[10px] font-semibold text-slate-400 uppercase block">Max Annual Income</span>
                    <span className="font-bold text-slate-800">₱{s.max_family_income.toLocaleString()} / yr</span>
                  </div>
                </div>

                {/* Grant Amount Display */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-1">
                  <div className="flex items-center space-x-1.5 text-indigo-600 font-bold text-xs">
                    <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-[10px] leading-none shrink-0">₱</span>
                    <span>Grant Value &amp; Coverage:</span>
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

      {/* Pagination Bar */}
      {totalItems > 0 && (
        <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span>
              Showing <strong className="text-slate-900 font-semibold">{totalItems === 0 ? 0 : startIndex + 1}</strong>–<strong className="text-slate-900 font-semibold">{endIndex}</strong> of <strong className="text-indigo-600 font-bold">{totalItems}</strong> scholarships
            </span>
            <span className="text-slate-300 hidden sm:inline">|</span>
            <div className="flex items-center space-x-1.5">
              <span className="text-[11px] text-slate-400 font-medium">Per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold rounded-lg px-2 py-1 focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                <option value={6}>6 items</option>
                <option value={9}>9 items</option>
                <option value={12}>12 items</option>
              </select>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center space-x-1.5">
              <button
                type="button"
                disabled={safeCurrentPage <= 1}
                onClick={() => handlePageChange(safeCurrentPage - 1)}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-35 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
                aria-label="Previous Page"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Prev</span>
              </button>

              <div className="flex items-center space-x-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                  if (
                    p === 1 ||
                    p === totalPages ||
                    (p >= safeCurrentPage - 1 && p <= safeCurrentPage + 1)
                  ) {
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => handlePageChange(p)}
                        className={`w-8 h-8 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center ${
                          safeCurrentPage === p
                            ? 'bg-indigo-600 text-white shadow-xs scale-105'
                            : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        {p}
                      </button>
                    );
                  }
                  if (p === safeCurrentPage - 2 || p === safeCurrentPage + 2) {
                    return (
                      <span key={p} className="text-slate-400 text-xs px-1 select-none">
                        •••
                      </span>
                    );
                  }
                  return null;
                })}
              </div>

              <button
                type="button"
                disabled={safeCurrentPage >= totalPages}
                onClick={() => handlePageChange(safeCurrentPage + 1)}
                className="flex items-center space-x-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-35 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs"
                aria-label="Next Page"
              >
                <span className="hidden sm:inline">Next</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
