"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface BookingsPaginationProps {
  currentPage: number;
  totalPages: number;
  onGoToPage: (page: number) => void;
  onPreviousPage: () => void;
  onNextPage: () => void;
}

export function BookingsPagination({
  currentPage,
  totalPages,
  onGoToPage,
  onPreviousPage,
  onNextPage,
}: BookingsPaginationProps) {
  return (
    <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-border">
      <div className="flex items-center justify-between gap-2 sm:gap-3">
        <button
          onClick={onPreviousPage}
          disabled={currentPage === 1}
          className="flex items-center gap-1 px-2 sm:px-3 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition text-xs sm:text-sm flex-shrink-0"
          title="Previous page"
        >
          <ChevronLeft className="w-3 h-3" />
          <span className="hidden sm:inline">Previous</span>
          <span className="sm:hidden">Prev</span>
        </button>

        <div className="flex items-center gap-1 flex-1 justify-center">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNumber;
            if (totalPages <= 5) {
              pageNumber = i + 1;
            } else if (currentPage <= 3) {
              pageNumber = i + 1;
            } else if (currentPage >= totalPages - 2) {
              pageNumber = totalPages - 4 + i;
            } else {
              pageNumber = currentPage - 2 + i;
            }

            return (
              <button
                key={pageNumber}
                onClick={() => onGoToPage(pageNumber)}
                className={`px-2 sm:px-3 py-2 text-xs sm:text-sm rounded-lg transition min-w-[28px] sm:min-w-[32px] ${
                  currentPage === pageNumber
                    ? "bg-primary text-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {pageNumber}
              </button>
            );
          })}
        </div>

        <button
          onClick={onNextPage}
          disabled={currentPage === totalPages}
          className="flex items-center gap-1 px-2 sm:px-3 py-2 bg-muted text-muted-foreground rounded-lg hover:bg-muted hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition text-xs sm:text-sm flex-shrink-0"
          title="Next page"
        >
          <span>Next</span>
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
