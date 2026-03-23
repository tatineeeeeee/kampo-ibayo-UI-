"use client";
import {
  FaShieldAlt,
  FaDownload,
  FaChevronDown,
  FaFileCode,
  FaTable,
  FaFilePdf,
} from "react-icons/fa";

interface DataExportSectionProps {
  exporting: boolean;
  showExportDropdown: boolean;
  setShowExportDropdown: (value: boolean) => void;
  handleExportData: (format: "json" | "csv" | "pdf") => Promise<void>;
}

export default function DataExportSection({
  exporting,
  showExportDropdown,
  setShowExportDropdown,
  handleExportData,
}: DataExportSectionProps) {
  return (
    <div className="bg-muted p-6 rounded-lg">
      <div className="mb-2">
        <h3 className="text-foreground font-semibold">Data Export</h3>
      </div>
      <p className="text-muted-foreground text-sm mb-4">
        Download a copy of your personal data and booking history in
        your preferred format.
      </p>

      <div className="relative" data-export-dropdown>
        <button
          onClick={() => setShowExportDropdown(!showExportDropdown)}
          disabled={exporting}
          className="flex items-center justify-between w-full bg-muted-foreground text-foreground px-4 py-3 rounded-lg font-semibold hover:bg-muted transition disabled:opacity-50"
        >
          <div className="flex items-center gap-2">
            <FaDownload className="w-4 h-4" />
            {exporting ? "Exporting..." : "Export My Data"}
          </div>
          <FaChevronDown
            className={`w-4 h-4 transition-transform ${
              showExportDropdown ? "rotate-180" : ""
            }`}
          />
        </button>

        {showExportDropdown && !exporting && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-muted-foreground rounded-lg shadow-xl border border-border z-10">
            <button
              onClick={() => {
                handleExportData("json");
                setShowExportDropdown(false);
              }}
              className="flex items-center gap-3 w-full px-4 py-3 text-left text-foreground hover:bg-muted transition rounded-t-lg"
            >
              <FaFileCode className="w-4 h-4 text-primary" />
              <div>
                <div className="font-semibold">JSON Format</div>
                <div className="text-xs text-muted-foreground">
                  Complete data with all details
                </div>
              </div>
            </button>

            <div className="border-t border-border"></div>

            <button
              onClick={() => {
                handleExportData("csv");
                setShowExportDropdown(false);
              }}
              className="flex items-center gap-3 w-full px-4 py-3 text-left text-foreground hover:bg-muted transition"
            >
              <FaTable className="w-4 h-4 text-green-400" />
              <div>
                <div className="font-semibold">CSV Format</div>
                <div className="text-xs text-muted-foreground">
                  Spreadsheet-friendly booking data
                </div>
              </div>
            </button>

            <div className="border-t border-border"></div>

            <button
              onClick={() => {
                handleExportData("pdf");
                setShowExportDropdown(false);
              }}
              className="flex items-center gap-3 w-full px-4 py-3 text-left text-foreground hover:bg-muted transition rounded-b-lg"
            >
              <FaFilePdf className="w-4 h-4 text-primary" />
              <div>
                <div className="font-semibold">PDF Format</div>
                <div className="text-xs text-muted-foreground">
                  Professional printable report
                </div>
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
