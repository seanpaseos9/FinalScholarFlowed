import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface StandardPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  pageSizeOptions?: number[];
  itemLabel?: string;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  className?: string;
}

export const StandardPagination: React.FC<StandardPaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  pageSizeOptions = [6, 10, 20, 50],
  itemLabel = 'items',
  onPageChange,
  onPageSizeChange,
  className = '',
}) => {
  if (totalItems === 0) return null;

  const start = (currentPage - 1) * pageSize + 1;
  const end = Math.min(currentPage * pageSize, totalItems);

  // Generate page numbers with smart ellipsis windowing
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200 p-3 sm:px-6 sm:py-3.5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs ${className}`}
    >
      {/* Left side: Showing X–Y of Z items | Per page selector */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
        <span>
          Showing <strong className="font-bold text-slate-900">{start}–{end}</strong> of{' '}
          <strong className="font-bold text-indigo-600">{totalItems}</strong> {itemLabel}
        </span>

        {onPageSizeChange && (
          <>
            <span className="text-slate-300 font-light select-none">|</span>
            <div className="flex items-center space-x-2">
              <span className="text-slate-500 font-medium">Per page:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  onPageSizeChange(Number(e.target.value));
                  onPageChange(1);
                }}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors focus:ring-1 focus:ring-indigo-500 focus:outline-none cursor-pointer"
              >
                {pageSizeOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt} items
                  </option>
                ))}
              </select>
            </div>
          </>
        )}
      </div>

      {/* Right side: Prev button, page number pills, Next button */}
      <div className="flex items-center space-x-1.5 select-none">
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          title="Previous page"
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          <span>Prev</span>
        </button>

        {getPageNumbers().map((p, idx) => {
          if (p === '...') {
            return (
              <span key={`ellipsis-${idx}`} className="px-1 text-slate-400 text-xs">
                ...
              </span>
            );
          }
          const pageNum = Number(p);
          const isActive = pageNum === currentPage;
          return (
            <button
              key={`page-${pageNum}`}
              type="button"
              onClick={() => onPageChange(pageNum)}
              className={`min-w-[28px] h-7 px-2 flex items-center justify-center rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium'
              }`}
            >
              {pageNum}
            </button>
          );
        })}

        <button
          type="button"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-xs font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
          title="Next page"
        >
          <span>Next</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
