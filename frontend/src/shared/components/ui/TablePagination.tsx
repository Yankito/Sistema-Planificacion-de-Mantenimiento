import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface TablePaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export const TablePagination: React.FC<TablePaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  className = "mt-12"
}) => {
  if (totalPages <= 1) return null;

  return (
    <div className={`${className} px-8 py-8 bg-pf-neutral-50 rounded-[2rem] border border-pf-neutral-100 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm`}>
      <div className="text-[10px] font-black text-pf-neutral-400 uppercase tracking-[0.2em] flex items-center gap-3">
        Mostrando
        <span className="text-pf-neutral-900 bg-white px-3 py-1.5 rounded-lg border border-pf-neutral-200 shadow-sm font-black tabular-nums">
          {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, totalItems)}
        </span>
        de
        <span className="text-pf-neutral-800 font-bold">{totalItems}</span> registros
      </div>
      <div className="flex items-center gap-4">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="p-3.5 rounded-2xl border border-pf-neutral-200 bg-white text-pf-neutral-400 hover:bg-pf-neutral-900 hover:text-white hover:border-pf-neutral-900 disabled:opacity-30 disabled:pointer-events-none transition-all duration-300 shadow-sm active:scale-95"
          title="Página Anterior"
        >
          <ChevronLeft size={20} />
        </button>

        <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-3xl border border-pf-neutral-200 shadow-inner overflow-x-auto max-w-full">
          {[...Array(totalPages)].map((_, i) => {
            const page = i + 1;
            if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
              return (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  className={`w-11 h-11 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 flex-shrink-0 ${currentPage === page
                    ? 'bg-pf-neutral-900 text-white shadow-xl shadow-pf-neutral-900/20 scale-110'
                    : 'bg-transparent text-pf-neutral-400 hover:text-pf-neutral-900 hover:bg-pf-neutral-50'
                    }`}
                >
                  {page}
                </button>
              );
            }
            if (page === currentPage - 2 || page === currentPage + 2) {
              return <span key={page} className="px-1.5 text-pf-neutral-300 font-black flex-shrink-0">...</span>;
            }
            return null;
          })}
        </div>

        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="p-3.5 rounded-2xl border border-pf-neutral-200 bg-white text-pf-neutral-400 hover:bg-pf-neutral-900 hover:text-white hover:border-pf-neutral-900 disabled:opacity-30 disabled:pointer-events-none transition-all duration-300 shadow-sm active:scale-95"
          title="Página Siguiente"
        >
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
};
