"use client";

import { useState, useEffect, useCallback } from "react";
import { OCRService, OCRResult } from "../utils/ocrService";
import { Eye, Zap, AlertTriangle, CheckCircle, X } from "lucide-react";

interface OCRProcessorProps {
  file: File | null;
  onOCRResult: (data: {
    referenceNumber: string;
    amount: string;
    method: string;
  }) => void;
  expectedAmount?: number;
  className?: string;
}

export default function OCRProcessor({
  file,
  onOCRResult,
  expectedAmount,
  className = "",
}: OCRProcessorProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState<OCRResult | null>(null);
  const [showRawText, setShowRawText] = useState(false);
  const [processingStep, setProcessingStep] = useState("");
  const [autoProcessed, setAutoProcessed] = useState(false);

  const processImage = useCallback(async () => {
    if (!file) return;

    setIsProcessing(true);
    setProcessingStep("Initializing OCR...");

    try {
      setProcessingStep("Reading image...");
      const result = await OCRService.processPaymentImage(file);
      setOcrResult(result);

      setProcessingStep("Validating data...");

      if (result.referenceNumber || result.amount) {
        // Auto-fill the form with extracted data
        onOCRResult({
          referenceNumber: result.referenceNumber || "",
          amount: result.amount?.toString() || "",
          method: result.method === "unknown" ? "" : result.method,
        });
      }

      setProcessingStep("Complete!");
    } catch (error) {
      console.error("OCR processing failed:", error);
      setOcrResult({
        referenceNumber: null,
        amount: null,
        confidence: 0,
        rawText: "",
        method: "unknown",
      });
    } finally {
      setIsProcessing(false);
      setProcessingStep("");
    }
  }, [file, onOCRResult]);

  // Auto-process when file changes
  useEffect(() => {
    if (file && !autoProcessed) {
      processImage();
      setAutoProcessed(true);
    } else if (!file) {
      // Reset when no file
      setAutoProcessed(false);
      setOcrResult(null);
    }
  }, [file, autoProcessed, processImage]);

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "text-green-400";
    if (confidence >= 60) return "text-yellow-400";
    return "text-red-400";
  };

  const getMethodLabel = (method: string) => {
    switch (method) {
      case "gcash":
        return "📱 GCash";
      case "maya":
        return "💳 Maya/PayMaya";
      default:
        return "❓ Unknown";
    }
  };

  if (!file) {
    return (
      <div
        className={`p-4 bg-muted/50 border border-border rounded-lg text-center ${className}`}
      >
        <Eye className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-muted-foreground text-sm">
          Upload an image to enable auto-fill
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* OCR Action Button */}
      <div className="bg-gradient-to-r from-primary/10 to-purple-800/20 border border-primary/30 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div
              className={`p-2 rounded-full ${
                isProcessing
                  ? "bg-yellow-600/30"
                  : ocrResult
                  ? "bg-green-600/30"
                  : "bg-primary/30"
              }`}
            >
              {isProcessing ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-400"></div>
              ) : (
                <Zap
                  className={`w-5 h-5 ${
                    ocrResult ? "text-green-400" : "text-primary"
                  }`}
                />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-foreground">
                {isProcessing
                  ? "Processing Image..."
                  : ocrResult
                  ? "Auto-Fill Complete"
                  : "Smart Auto-Fill"}
              </h3>
              <p className="text-sm text-blue-200">
                {isProcessing
                  ? processingStep || "Analyzing payment details..."
                  : ocrResult
                  ? "Payment details extracted successfully"
                  : "Automatically extracts payment details when you upload"}
              </p>
            </div>
          </div>
        </div>

        {!isProcessing && !autoProcessed && (
          <button
            onClick={processImage}
            className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 text-foreground py-2 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4" />
            🚀 Process Image Manually
          </button>
        )}

        {isProcessing && (
          <div className="w-full bg-muted rounded-lg p-3 flex items-center justify-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary/80"></div>
            <span className="text-blue-200 text-sm">
              {processingStep || "Processing..."}
            </span>
          </div>
        )}

        {!isProcessing && (
          <p className="text-xs text-blue-200 mt-2 text-center">
            {autoProcessed
              ? "✅ Automatically processed your uploaded image"
              : "✨ Upload an image and we'll automatically extract payment details"}
          </p>
        )}
      </div>

      {/* OCR Results */}
      {ocrResult && !isProcessing && (
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-foreground flex items-center gap-2">
              <Eye className="w-4 h-4 text-primary" />
              Extracted Information
            </h4>
            <span
              className={`text-xs px-2 py-1 rounded-full bg-muted ${getConfidenceColor(
                ocrResult.confidence
              )}`}
            >
              {ocrResult.confidence.toFixed(0)}% confidence
            </span>
          </div>

          <div className="space-y-3">
            {/* Payment Method */}
            {ocrResult.method !== "unknown" && (
              <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                <span className="text-muted-foreground text-sm">Detected Method:</span>
                <span className="text-foreground font-medium">
                  {getMethodLabel(ocrResult.method)}
                </span>
              </div>
            )}

            {/* Reference Number */}
            <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
              <span className="text-muted-foreground text-sm">Reference Number:</span>
              <div className="flex items-center gap-2">
                {ocrResult.referenceNumber ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-foreground font-mono text-sm">
                      {ocrResult.referenceNumber}
                    </span>
                  </>
                ) : (
                  <>
                    <X className="w-4 h-4 text-red-400" />
                    <span className="text-red-300 text-sm">Not detected</span>
                  </>
                )}
              </div>
            </div>

            {/* Amount */}
            <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
              <span className="text-muted-foreground text-sm">Amount:</span>
              <div className="flex items-center gap-2">
                {ocrResult.amount ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-foreground font-semibold">
                      ₱{ocrResult.amount.toLocaleString()}
                    </span>
                    {expectedAmount &&
                      Math.abs(ocrResult.amount - expectedAmount) >
                        expectedAmount * 0.1 && (
                        <div title="Amount differs from expected">
                          <AlertTriangle className="w-4 h-4 text-yellow-400" />
                        </div>
                      )}
                  </>
                ) : (
                  <>
                    <X className="w-4 h-4 text-red-400" />
                    <span className="text-red-300 text-sm">Not detected</span>
                  </>
                )}
              </div>
            </div>

            {/* Data Quality Indicators */}
            <div className="flex items-center gap-2 text-xs">
              {ocrResult.confidence >= 80 && (
                <span className="bg-green-800/30 text-green-300 px-2 py-1 rounded">
                  ✅ High Accuracy
                </span>
              )}
              {ocrResult.confidence < 60 && (
                <span className="bg-red-800/30 text-red-300 px-2 py-1 rounded">
                  ⚠️ Please Verify
                </span>
              )}
              {!ocrResult.referenceNumber && !ocrResult.amount && (
                <span className="bg-yellow-800/30 text-yellow-300 px-2 py-1 rounded">
                  💡 Try Different Image
                </span>
              )}
            </div>

            {/* Raw Text Toggle */}
            <button
              onClick={() => setShowRawText(!showRawText)}
              className="text-xs text-primary hover:text-primary/80 transition-colors"
            >
              {showRawText ? "🙈 Hide" : "👁️ Show"} Raw OCR Text
            </button>

            {/* Raw OCR Text */}
            {showRawText && ocrResult.rawText && (
              <div className="mt-2 p-3 bg-background/50 border border-border rounded text-xs">
                <p className="text-muted-foreground mb-1">Raw OCR Output:</p>
                <pre className="text-muted-foreground whitespace-pre-wrap font-mono text-xs overflow-auto max-h-32">
                  {ocrResult.rawText}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tips for Better OCR */}
      <div className="bg-yellow-800/20 border border-yellow-600/30 rounded-lg p-3">
        <h5 className="text-yellow-300 font-medium text-sm mb-2">
          💡 Tips for Better Detection:
        </h5>
        <ul className="text-yellow-200 text-xs space-y-1">
          <li>• 📸 Use clear, well-lit screenshots</li>
          <li>• 🔍 Ensure text is large and readable</li>
          <li>• 📱 Crop to show only the payment details</li>
          <li>• ✨ Avoid blurry or low-quality images</li>
          <li>• 🔢 Make sure numbers are clearly visible</li>
        </ul>
      </div>
    </div>
  );
}
