"use client";

import React from "react";
import {
  AlertCircle,
  CheckCircle,
  Bot,
  Sparkles,
} from "lucide-react";
import type { EnhancedOCRResult, OCRProgress } from "../../lib/types";

interface OCRResultDisplayProps {
  ocrProgress: OCRProgress;
  ocrResult: EnhancedOCRResult | null;
  proofImage: File | null;
  showOCREditor: boolean;
  setShowOCREditor: (show: boolean) => void;
  setOcrResult: React.Dispatch<React.SetStateAction<EnhancedOCRResult | null>>;
  setReferenceNumber: (ref: string) => void;
  setAmount: (amount: string) => void;
  setIsManualAmountSet: (manual: boolean) => void;
}

export default function OCRResultDisplay({
  ocrProgress,
  ocrResult,
  proofImage,
  showOCREditor,
  setShowOCREditor,
  setOcrResult,
  setReferenceNumber,
  setAmount,
  setIsManualAmountSet,
}: OCRResultDisplayProps) {
  if (ocrProgress.stage === "idle" || !proofImage) return null;

  return (
    <div className="mt-3 p-3 bg-card/40 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-muted-foreground flex items-center gap-2">
          <Bot className="w-4 h-4 text-primary" />
          {ocrProgress.stage === "preprocessing"
            ? "Enhancing image..."
            : ocrProgress.stage === "analyzing"
            ? "Analyzing content..."
            : ocrProgress.stage === "extracting"
            ? "Extracting details..."
            : ocrProgress.stage === "validating"
            ? "Validating data..."
            : ocrProgress.stage === "complete"
            ? "Analysis complete!"
            : ocrProgress.stage === "error"
            ? "Processing failed"
            : "Processing..."}
        </span>
        {ocrProgress.progress > 0 && (
          <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
            {ocrProgress.progress}%
          </span>
        )}
      </div>

      {/* Progress bar */}
      {ocrProgress.progress > 0 && (
        <div className="w-full bg-muted rounded-full h-1.5 mb-2">
          <div
            className="bg-primary h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${ocrProgress.progress}%` }}
          />
        </div>
      )}

      {/* Live detection feedback */}
      {Object.keys(ocrProgress.detected).length > 0 && (
        <div className="flex gap-4 text-sm mb-2">
          {ocrProgress.detected.amount && (
            <span className="text-green-400 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Amount: ₱{ocrProgress.detected.amount.toLocaleString()}
            </span>
          )}
          {ocrProgress.detected.reference && (
            <span className="text-green-400 flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Reference: {ocrProgress.detected.reference}
            </span>
          )}
          {ocrProgress.detected.method && (
            <span className="text-primary flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Method: {ocrProgress.detected.method}
            </span>
          )}
        </div>
      )}

      {/* Status message */}
      {ocrProgress.message && (
        <p className="text-xs text-muted-foreground">{ocrProgress.message}</p>
      )}

      {/* Final OCR Results with Confidence and Actions */}
      {ocrResult && ocrProgress.stage === "complete" && (
        <div className="mt-3 pt-3 border-t border-border">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-yellow-400" /> Final
              Results
              <span className="text-xs px-2 py-1 rounded-full bg-green-900/30 text-green-400">
                {ocrResult.confidence.toFixed(0)}% confidence
              </span>
            </span>
            <button
              onClick={() => setShowOCREditor(!showOCREditor)}
              className="text-xs text-primary hover:text-primary/80 px-2 py-1 rounded border border-primary/70/30"
            >
              {showOCREditor ? "Hide Editor" : "Edit Results"}
            </button>
          </div>

          {showOCREditor ? (
            <div className="space-y-2">
              <input
                type="text"
                value={ocrResult.referenceNumber || ""}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setOcrResult((prev) =>
                    prev
                      ? { ...prev, referenceNumber: newValue }
                      : null
                  );
                  setReferenceNumber(newValue);
                }}
                placeholder="Reference Number"
                className="w-full px-2 py-1 bg-muted border border-border rounded text-sm text-foreground"
              />
              <input
                type="number"
                value={ocrResult.amount || ""}
                onChange={(e) => {
                  const newValue = parseFloat(e.target.value) || null;
                  setOcrResult((prev) =>
                    prev ? { ...prev, amount: newValue } : null
                  );
                  setAmount(e.target.value);
                  setIsManualAmountSet(true);
                }}
                placeholder="Amount"
                className="w-full px-2 py-1 bg-muted border border-border rounded text-sm text-foreground"
              />
            </div>
          ) : (
            <div className="text-sm space-y-1">
              {ocrResult.amount && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="text-foreground font-mono">
                    ₱{ocrResult.amount.toLocaleString()}
                  </span>
                </div>
              )}
              {ocrResult.referenceNumber && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Reference:</span>
                  <span className="text-foreground font-mono">
                    {ocrResult.referenceNumber}
                  </span>
                </div>
              )}
              {ocrResult.processingTime && (
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">
                    Processing time:
                  </span>
                  <span className="text-muted-foreground">
                    {(ocrResult.processingTime / 1000).toFixed(1)}s
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Validation warnings */}
      {ocrResult?.warnings && ocrResult.warnings.length > 0 && (
        <div className="mt-3 space-y-1">
          {ocrResult.warnings.map((warning, idx) => (
            <div
              key={idx}
              className="p-2 bg-yellow-900/20 border border-yellow-600/30 rounded text-xs text-yellow-300 flex items-start gap-2"
            >
              <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
              {warning}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
