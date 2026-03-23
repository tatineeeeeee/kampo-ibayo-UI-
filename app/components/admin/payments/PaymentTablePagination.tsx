"use client";

import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

interface PaymentTablePaginationProps {
  filteredCount: number;
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  startIndex: number;
  setItemsPerPage: (n: number) => void;
  goToPage: (page: number) => void;
  goToFirstPage: () => void;
  goToLastPage: () => void;
  goToPreviousPage: () => void;
  goToNextPage: () => void;
}

export default function PaymentTablePagination({
  filteredCount,
  currentPage,
  totalPages,
  itemsPerPage,
  startIndex,
  setItemsPerPage,
  goToPage,
  goToFirstPage,
  goToLastPage,
  goToPreviousPage,
  goToNextPage,
}: PaymentTablePaginationProps) {
  if (filteredCount <= 0) return null;

  return (
    <div className="mt-4 sm:mt-6 flex flex-col gap-3 sm:gap-4 bg-muted px-3 sm:px-4 py-3 rounded-lg">
      {/* Mobile: Simple pagination */}
      <div className="flex sm:hidden justify-between items-center">
        <button
          onClick={goToPreviousPage}
          disabled={currentPage === 1}
          className="px-3 py-2 rounded border border-border bg-card disabled:opacity-50 text-sm"
        >
          Previous
        </button>
        <span className="text-sm text-foreground">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={goToNextPage}
          disabled={currentPage === totalPages}
          className="px-3 py-2 rounded border border-border bg-card disabled:opacity-50 text-sm"
        >
          Next
        </button>
      </div>

      {/* Desktop: Full pagination */}
      <div className="hidden sm:flex flex-col sm:flex-row justify-between items-center gap-4">
        {/* Items per page and info */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label
              htmlFor="itemsPerPage"
              className="text-sm text-foreground font-medium"
            >
              Show:
            </label>
            <select
              id="itemsPerPage"
              value={itemsPerPage}
              onChange={(e) =>
                setItemsPerPage(Number(e.target.value))
              }
              className="border border-border rounded px-2 py-1 text-sm text-foreground font-medium bg-card"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
          <span className="text-sm text-foreground font-medium">
            Showing{" "}
            {Math.min(startIndex + 1, filteredCount)} to{" "}
            {Math.min(
              startIndex + itemsPerPage,
              filteredCount,
            )}{" "}
            of {filteredCount} payments
          </span>
        </div>

        {/* Page info and controls */}
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-foreground font-medium mr-4">
              Page {currentPage} of {totalPages}
            </span>

            {/* Navigation buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={goToFirstPage}
                disabled={currentPage === 1}
                className="p-2 rounded border border-border bg-card hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed text-foreground"
              >
                <ChevronsLeft className="h-4 w-4" />
              </button>

              <button
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                className="p-2 rounded border border-border bg-card hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed text-foreground"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>

              {/* Page numbers */}
              {Array.from(
                { length: Math.min(5, totalPages) },
                (_, i) => {
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
                      onClick={() => goToPage(pageNumber)}
                      className={`px-3 py-2 text-sm font-medium rounded border ${
                        currentPage === pageNumber
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-card text-foreground border-border hover:bg-muted"
                      }`}
                    >
                      {pageNumber}
                    </button>
                  );
                },
              )}

              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className="p-2 rounded border border-border bg-card hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed text-foreground"
              >
                <ChevronRight className="h-4 w-4" />
              </button>

              <button
                onClick={goToLastPage}
                disabled={currentPage === totalPages}
                className="p-2 rounded border border-border bg-card hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed text-foreground"
              >
                <ChevronsRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
