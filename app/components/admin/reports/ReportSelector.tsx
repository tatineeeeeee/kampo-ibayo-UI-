"use client";

import { ReportType, REPORT_TYPES } from "@/app/hooks/useReportData";

interface ReportSelectorProps {
  selectedReport: ReportType;
  onSelectReport: (report: ReportType) => void;
}

export default function ReportSelector({
  selectedReport,
  onSelectReport,
}: ReportSelectorProps) {
  return (
    <div className="mb-4 sm:mb-6">
      <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2 sm:mb-3">
        Choose Your Report
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {REPORT_TYPES.map((report) => {
          const IconComponent = report.icon;
          const isSelected = selectedReport.id === report.id;

          // Define specific colors for each type
          const getCardStyles = () => {
            if (!isSelected) {
              return {
                card: "border-border hover:border-border bg-card",
                icon: "text-muted-foreground",
                title: "text-foreground",
              };
            }

            switch (report.color) {
              case "blue":
                return {
                  card: "border-primary bg-primary/10",
                  icon: "text-info",
                  title: "text-foreground",
                };
              case "green":
                return {
                  card: "border-success bg-success/10",
                  icon: "text-success",
                  title: "text-foreground",
                };
              case "purple":
                return {
                  card: "border-chart-4 bg-chart-4/10",
                  icon: "text-chart-4",
                  title: "text-foreground",
                };
              case "orange":
                return {
                  card: "border-warning bg-warning/10",
                  icon: "text-warning",
                  title: "text-foreground",
                };
              case "red":
                return {
                  card: "border-destructive bg-destructive/10",
                  icon: "text-destructive",
                  title: "text-foreground",
                };
              default:
                return {
                  card: "border-muted-foreground bg-muted",
                  icon: "text-muted-foreground",
                  title: "text-foreground",
                };
            }
          };

          const styles = getCardStyles();

          return (
            <button
              key={report.id}
              onClick={() => onSelectReport(report)}
              className={`p-3 sm:p-4 rounded-lg border-2 text-left transition-all ${styles.card}`}
            >
              <IconComponent
                className={`w-5 h-5 sm:w-6 sm:h-6 mb-1.5 sm:mb-2 ${styles.icon}`}
              />
              <h4
                className={`font-semibold text-xs sm:text-sm ${styles.title}`}
              >
                {report.name}
              </h4>
              <p className="text-xs text-foreground mt-1">
                {report.description}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
