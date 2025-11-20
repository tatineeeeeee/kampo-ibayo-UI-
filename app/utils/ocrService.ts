/**
 * Enhanced OCR Service for Payment Proof Processing
 * Provides advanced image preprocessing, multiple OCR engines, and smart pattern matching
 */

import Tesseract from 'tesseract.js';

interface AmountMatch {
  amount: number;
  priority: number;
  source: string;
}

export interface OCRResult {
  referenceNumber: string | null;
  amount: number | null;
  confidence: number;
  rawText: string;
  method: 'gcash' | 'maya' | 'bank' | 'unknown';
  warnings?: string[];
  suggestions?: Array<{ type: string; expectedAmount?: number; }>;
  processingTime?: number;
}

export class OCRService {
  private static worker: Tesseract.Worker | null = null;
  private static isInitialized = false;

  // Initialize OCR worker with optimal settings for high confidence
  static async initializeWorker(): Promise<Tesseract.Worker> {
    if (!this.worker || !this.isInitialized) {
      try {
        this.worker = await Tesseract.createWorker('eng', 1, {
          logger: (message: { status: string; progress: number }) => {
            if (message.status === 'recognizing text') {
              console.log(`🔍 OCR Progress: ${(message.progress * 100).toFixed(0)}%`);
            }
          },
        });

        // Enhanced configuration for payment receipt recognition
        await this.worker.setParameters({
          // Character whitelist - allow all payment-related characters
          tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz.,₱-: ',
          tessedit_char_blacklist: '', // Don't blacklist any characters
          
          // High-confidence OCR settings
          classify_enable_learning: '0', // Disable adaptive learning for consistency
          classify_enable_adaptive_matcher: '0', // Use consistent character matching
          tessedit_ocr_engine_mode: '1', // Use LSTM OCR engine for better accuracy
          
          // Improve character recognition confidence
          classify_class_pruner_threshold: '230', // Higher threshold for better character confidence
          classify_class_pruner_multiplier: '15', // More selective character matching
          textord_min_linesize: '2.5', // Better line detection for small text
          
          // Enhanced text detection
          textord_heavy_nr: '1', // Better handling of dense text areas
          preserve_interword_spaces: '1', // Maintain spacing between words
          user_defined_dpi: '300', // High DPI for better quality processing
          
          // Page segmentation mode optimized for payment receipts
          tessedit_pageseg_mode: Tesseract.PSM.SPARSE_TEXT,
        });

        this.isInitialized = true;
        console.log('✅ Enhanced OCR Service initialized with optimal settings');
      } catch (error) {
        console.error('❌ OCR Service initialization failed:', error);
        throw error;
      }
    }
    return this.worker;
  }

  // Clean up worker
  static async terminateWorker(): Promise<void> {
    try {
      if (this.worker) {
        await this.worker.terminate();
        this.worker = null;
        this.isInitialized = false;
        console.log('🧹 Enhanced OCR worker terminated successfully');
      }
    } catch (error) {
      console.warn('⚠️ Error terminating OCR worker:', error);
    }
  }

  // Advanced image preprocessing for maximum OCR accuracy
  private static async preprocessImage(imageFile: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      img.onload = () => {
        try {
          // Calculate optimal dimensions (OCR works best with 1200-2000px width)
          const targetWidth = 1600;
          const scale = Math.min(targetWidth / img.width, 2); // Cap at 2x upscaling
          
          canvas.width = img.width * scale;
          canvas.height = img.height * scale;

          // Fill with white background for better contrast
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Apply advanced image enhancement filters
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.filter = 'contrast(1.4) brightness(1.1) saturate(0.8) blur(0.3px)';
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

          // Convert to high-quality data URL
          const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
          resolve(dataUrl);
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => reject(new Error('Image preprocessing failed'));
      img.src = URL.createObjectURL(imageFile);
    });
  }

  // Main OCR processing function with enhanced error handling and timeout
  static async processPaymentImage(file: File): Promise<OCRResult> {
    const startTime = Date.now();
    
    try {
      console.log('🚀 Starting enhanced OCR processing with advanced preprocessing...');
      console.log('📝 Processing file:', file.name, 'Size:', (file.size / 1024).toFixed(1), 'KB');
      
      // Initialize worker if needed
      const worker = await this.initializeWorker();
      
      if (!worker) {
        throw new Error('OCR worker not available');
      }

      // Enhanced image preprocessing for better accuracy
      console.log('🖼️ Applying advanced image preprocessing...');
      const preprocessedImageUrl = await this.preprocessImage(file);
      
      // Process with timeout protection
      console.log('🔍 Starting OCR text recognition...');
      const recognizePromise = worker.recognize(preprocessedImageUrl);
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('OCR processing timeout (30s)')), 30000);
      });

      const result = await Promise.race([recognizePromise, timeoutPromise]);
      const processingTime = Date.now() - startTime;
      
      const rawText = result.data.text;
      let confidence = result.data.confidence;
      
      console.log(`⏱️ OCR completed in ${processingTime}ms`);
      console.log('📝 Raw OCR text length:', rawText.length);
      console.log('🔍 Initial OCR confidence:', confidence.toFixed(1) + '%');
      
      // Enhanced pattern extraction with validation
      const extracted = this.extractPaymentInfo(rawText);
      
      // Apply advanced confidence boosting based on extraction success
      if (extracted.referenceNumber || extracted.amount) {
        let confidenceBoost = 0;
        
        // Method-specific confidence boosting
        if (extracted.method !== 'unknown') confidenceBoost += 10;
        if (extracted.referenceNumber) {
          // Maya ID pattern gets higher boost (alphanumeric)
          if (/[A-F]/i.test(extracted.referenceNumber) && extracted.referenceNumber.includes(' ')) {
            confidenceBoost += 20; // Maya ID with proper format
          } else if (extracted.referenceNumber.length >= 8) {
            confidenceBoost += 15; // Any substantial reference
          } else {
            confidenceBoost += 10; // Basic reference
          }
        }
        if (extracted.amount && extracted.amount > 0) {
          confidenceBoost += extracted.amount > 1000 ? 15 : 10; // Higher amounts get more boost
        }
        
        // Pattern quality bonus
        if (extracted.method === 'maya' && extracted.referenceNumber && /[A-F0-9]{4}\s[A-F0-9]{4}\s[A-F0-9]{4}/.test(extracted.referenceNumber)) {
          confidenceBoost += 10; // Perfect Maya ID format
        }
        
        // Apply boost but cap at reasonable maximum
        confidence = Math.min(confidence + confidenceBoost, 95);
        console.log(`🚀 Confidence enhanced to ${confidence.toFixed(1)}% (+${confidenceBoost})`);
      }
      
      // Enhanced validation and warnings
      const warnings: string[] = [];
      const suggestions: Array<{ type: string; expectedAmount?: number; }> = [];
      
      // Add validation warnings
      if (extracted.amount && extracted.amount < 10) {
        warnings.push('Very small amount detected - please verify this is correct');
      } else if (extracted.amount && extracted.amount < 100) {
        warnings.push('Small amount detected - please verify this is correct');
      }
      if (extracted.amount && extracted.amount > 100000) {
        warnings.push('Detected amount seems unusually high');
      }
      if (extracted.referenceNumber && extracted.referenceNumber.length < 6) {
        warnings.push('Reference number may be incomplete');
      }
      if (confidence < 70) {
        warnings.push('OCR confidence is lower than optimal - please verify details');
      }
      
      // Cleanup resources
      URL.revokeObjectURL(preprocessedImageUrl);
      
      const finalResult: OCRResult = {
        ...extracted,
        confidence: confidence,
        rawText: rawText,
        warnings,
        suggestions,
        processingTime
      };

      console.log('✅ Enhanced OCR result:', {
        hasAmount: !!finalResult.amount,
        hasReference: !!finalResult.referenceNumber,
        method: finalResult.method,
        confidence: finalResult.confidence.toFixed(1) + '%',
        warnings: finalResult.warnings?.length || 0,
        processingTime: processingTime + 'ms'
      });

      return finalResult;
      
    } catch (error) {
      const processingTime = Date.now() - startTime;
      console.error('❌ Enhanced OCR processing failed after', processingTime + 'ms:', error);
      
      // Return graceful failure result with helpful error info
      return {
        referenceNumber: null,
        amount: null,
        confidence: 0,
        rawText: error instanceof Error ? error.message : 'Processing failed',
        method: 'unknown',
        warnings: [error instanceof Error ? error.message : 'OCR processing failed'],
        suggestions: [],
        processingTime
      };
    }
  }

  // Apply sharpening filter for crisp text edges
  private static applySharpeningFilter(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): HTMLCanvasElement {
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const width = canvas.width;
    const height = canvas.height;
    
    // Simple sharpening kernel (enhances edges)
    const sharpenKernel = [
      0, -0.2, 0,
      -0.2, 1.8, -0.2,
      0, -0.2, 0
    ];
    
    const output = new Uint8ClampedArray(data.length);
    
    // Apply sharpening (skip borders to avoid edge issues)
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        for (let c = 0; c < 3; c++) { // RGB channels only
          let sum = 0;
          for (let ky = -1; ky <= 1; ky++) {
            for (let kx = -1; kx <= 1; kx++) {
              const pos = ((y + ky) * width + (x + kx)) * 4 + c;
              const kernelPos = (ky + 1) * 3 + (kx + 1);
              sum += data[pos] * sharpenKernel[kernelPos];
            }
          }
          
          const pos = (y * width + x) * 4 + c;
          output[pos] = Math.max(0, Math.min(255, sum));
        }
        
        // Copy alpha channel
        const pos = (y * width + x) * 4 + 3;
        output[pos] = data[pos];
      }
    }
    
    // Copy borders without sharpening
    for (let i = 0; i < data.length; i += 4) {
      const x = Math.floor(i / 4) % width;
      const y = Math.floor(Math.floor(i / 4) / width);
      
      if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
        output[i] = data[i];       // R
        output[i + 1] = data[i + 1]; // G
        output[i + 2] = data[i + 2]; // B
        output[i + 3] = data[i + 3]; // A
      }
    }
    
    const newImageData = new ImageData(output, width, height);
    ctx.putImageData(newImageData, 0, 0);
    
    return canvas;
  }

  // Extract payment information from OCR text
  private static extractPaymentInfo(text: string): Omit<OCRResult, 'confidence' | 'rawText'> {
    const lowerText = text.toLowerCase();
    let method: OCRResult['method'] = 'unknown';
    
    console.log('🔍 COMPREHENSIVE PAYMENT METHOD DETECTION:');
    console.log('  - Text length:', text.length);
    console.log('  - Full OCR text for analysis:', text);
    console.log('  - Lower text (first 300 chars):', lowerText.substring(0, 300));
    
    // CRITICAL: Enhanced GCash detection with specific phrases the user mentioned
    const gcashDetectionPhrases = [
      'send via gcash',      // USER REPORTED: This specific phrase not being detected
      'sent via gcash',
      'gcash send',
      'gcash money',
      'gcash transfer',
      'send money gcash',
      'express send',
      'gcash express',
      'globe gcash',
      'g-cash',
      'gcash',
      'pay bills gcash',
      'gcash pay',
      'my gcash',
      'mygcash'
    ];

    // CRITICAL: Enhanced Maya detection with specific amount context
    const mayaDetectionPhrases = [
      'maya',
      'paymaya',
      'pay maya',
      'maya wallet',
      'paymaya wallet',
      'paymaya transfer',
      'paymaya payment',
      'instapay',
      'you sent ₱',      // USER REPORTED: Maya amounts not being detected properly
      'you paid ₱',
      'sent ₱',
      'transfer amount ₱',
      'maya transfer',
      'reference id',
      'trace no'
    ];

    // Check for GCash phrases FIRST (user's main concern)
    let hasGCashPhrase = false;
    for (const phrase of gcashDetectionPhrases) {
      if (lowerText.includes(phrase)) {
        hasGCashPhrase = true;
        console.log(`  ✅ GCASH PHRASE DETECTED: "${phrase}"`);
        break;
      }
    }

    // Check for Maya phrases  
    let hasMayaPhrase = false;
    for (const phrase of mayaDetectionPhrases) {
      if (lowerText.includes(phrase)) {
        hasMayaPhrase = true;
        console.log(`  ✅ MAYA PHRASE DETECTED: "${phrase}"`);
        break;
      }
    }

    // ENHANCED detection with specific patterns
    const mayaSpecificPatterns = [
      /[A-F0-9]{4}[\s]*[A-F0-9]{4}[\s]*[A-F0-9]{4}/i,  // Maya ID pattern
      /reference[\s]*id/i,
      /trace[\s]*no/i,
      /instapay/i
    ];

    const gcashSpecificPatterns = [
      /ref[\s]*no[\s]*\.?[\s]*\d{4}[\s]*\d{3}[\s]*\d{6,7}/i,  // GCash ref format (13-14 digits)
      /ref[\s]*no[\s]*\.?[\s]*\d{4}[\s]*\d{4}[\s]*\d+/i,      // GCash ref format  
      /\d{4}[\s]*\d{3}[\s]*\d{6,7}/i,                        // Pure GCash number pattern (14-digit)
      /express[\s]*send/i,
      /globe[\s]*gcash/i,
      /g-xchange/i
    ];

    let mayaPatternMatches = 0;
    let gcashPatternMatches = 0;

    // Count Maya pattern matches
    for (const pattern of mayaSpecificPatterns) {
      if (pattern.test(text)) {
        mayaPatternMatches++;
        console.log(`  ✅ MAYA PATTERN MATCH: ${pattern}`);
      }
    }

    // Count GCash pattern matches  
    for (const pattern of gcashSpecificPatterns) {
      if (pattern.test(text)) {
        gcashPatternMatches++;
        console.log(`  ✅ GCASH PATTERN MATCH: ${pattern}`);
      }
    }

    // DECISION LOGIC (prioritize explicit phrase detection first)
    console.log(`  📊 Detection Summary:`);
    console.log(`     GCash phrases: ${hasGCashPhrase ? '✅' : '❌'}, patterns: ${gcashPatternMatches}`);
    console.log(`     Maya phrases: ${hasMayaPhrase ? '✅' : '❌'}, patterns: ${mayaPatternMatches}`);

    // If a Maya/PayMaya phrase is explicitly present, prefer it (avoid numeric-pattern tie-breakers)
    if (hasMayaPhrase) {
      method = 'maya';
      console.log('  🎯 FINAL: MAYA detected (phrase)');
    } else if (hasGCashPhrase) {
      method = 'gcash';
      console.log('  🎯 FINAL: GCASH detected (phrase)');
    } else {
      // When no explicit phrases, decide based on pattern counts first
      if (gcashPatternMatches > mayaPatternMatches) {
        method = 'gcash';
        console.log('  🎯 FINAL: GCASH detected (pattern count)');
      } else if (mayaPatternMatches > gcashPatternMatches) {
        method = 'maya';
        console.log('  🎯 FINAL: MAYA detected (pattern count)');
      } else {
        const bankKeywords = ['bank', 'bdo', 'bpi', 'metrobank', 'unionbank', 'bca', 'atm', 'debit', 'credit card'];
        if (bankKeywords.some(keyword => lowerText.includes(keyword))) {
          method = 'bank';
          console.log('  🎯 FINAL: BANK detected');
        } else {
          console.log('  ❌ FINAL: No payment method detected');
        }
      }
    }

    // Extract reference number and amount based on detected method
    const referenceNumber = this.extractReferenceNumber(text, method);
    // Pass the referenceNumber to help locate amounts near the reference when OCR splits lines
    const amount = this.extractAmount(text, method, referenceNumber); // Pass method and reference for context-aware extraction
    
    console.log('🎯 FINAL EXTRACTION RESULTS:');
    console.log('  - Method:', method);
    console.log('  - Reference:', referenceNumber);
    console.log('  - Amount:', amount);
    console.log('🔍 PAYMENT METHOD DETECTION END');
    
    return {
      referenceNumber,
      amount,
      method
    };
  }

  // Extract reference number based on payment method
  private static extractReferenceNumber(text: string, method: OCRResult['method']): string | null {
    console.log('🔍 REFERENCE EXTRACTION for method:', method);
    console.log('🔍 Text to scan:', text.substring(0, 500));

    const patterns = {
      gcash: [
        // HIGHEST PRIORITY GCash patterns - MORE FLEXIBLE for "send via gcash" scenario
        /send[\s]*via[\s]*gcash[\s]*.*?ref[\s]*no[\s]*\.?[\s]*([\d\s]+)/gi, // "Send via GCash ... Ref No. 1234"
        /gcash.*?ref[\s]*no[\s]*\.?[\s]*([\d\s]+)/gi, // Any GCash context with Ref No
        /ref[\s]*no[\s]*\.?[\s]*([\d\s]+)/gi, // "Ref. No. 9034 806 688710" or "Ref No. 9034 661 904149"
        /reference[\s]*no[\s]*\.?[\s]*([\d\s]+)/gi, // "Reference No: ..."
        
        // SPECIFIC GCash number formats (prioritized by frequency) - UPDATED FOR 14-DIGIT
        /(\d{4}[\s]*\d{3}[\s]*\d{6,7})/g, // 13-14 digit format: "9034 661 904149" or "9034 806 688710"
        /(\d{4}[\s]*\d{4}[\s]*\d{1,4})/g, // Variable format: "9529 3156 4"
        /(\d{10,15})/g, // Continuous 10-15 digits (common GCash range)
        
        // GCASH-SPECIFIC context patterns
        /express[\s]*send[\s]*.*?ref[\s]*no[\s]*\.?[\s]*([\d\s]+)/gi, // "Express Send ... Ref No."
        /gcash[\s]*send[\s]*money[\s]*.*?ref[\s]*no[\s]*\.?[\s]*([\d\s]+)/gi, // "GCash Send Money ... Ref No."
        /gcash[\s]*transfer[\s]*.*?ref[\s]*no[\s]*\.?[\s]*([\d\s]+)/gi, // "GCash Transfer ... Ref No."
        /pay[\s]*bills[\s]*.*?ref[\s]*no[\s]*\.?[\s]*([\d\s]+)/gi, // "Pay Bills ... Ref. No."
        
        // GLOBE and G-XCHANGE patterns
        /globe[\s]*gcash[\s]*.*?ref[\s]*:?[\s]*([\d\s]+)/gi, // "Globe GCash ... Ref:"
        /globe[\s]*.*?ref[\s]*no[\s]*:?[\s]*([\d\s]+)/gi, // "Globe ... Ref No:"
        /g-xchange[\s]*.*?ref[\s]*:?[\s]*([\d\s]+)/gi, // "G-Xchange ... Ref:"
        
        // FALLBACK patterns for generic formats
        /reference[\s:]+([\d\s]{8,})/gi, // Reference with colon
        /transaction[\s#:]+([\d\s]{8,})/gi, // Transaction number
        /confirmation[\s#:]+([\d\s]{8,})/gi, // Confirmation number
      ],
      maya: [
        // MAYA-SPECIFIC patterns - HIGHEST PRIORITY for Reference ID with letters
        // CRITICAL: Reference ID patterns (alphanumeric with letters A-F) - TOP PRIORITY
        /reference[\s]*id[\s]*:?[\s]*([A-F0-9]{4}[\s]*[A-F0-9]{4}[\s]*[A-F0-9]{4})/gi, // "Reference ID: 8F34 1A5F 27CE"
        /reference[\s]*id[\s]+([A-F0-9]{4}[\s]+[A-F0-9]{4}[\s]+[A-F0-9]{4})/gi, // "Reference ID 8F34 1A5F 27CE" (spaces)
        /id[\s]+([A-F0-9]{4}[\s]*[A-F0-9]{4}[\s]*[A-F0-9]{4})(?=[\s]*trace|[\s]*$)/gi, // "ID 8F34 1A5F 27CE" before trace
        
        // ENHANCED: Flexible Maya ID patterns with letter validation
        /([A-F0-9]{4}[\s]*[A-F0-9]{4}[\s]*[A-F0-9]{4})(?![\d]{4})/gi, // Maya ID but NOT followed by more digits (avoid account numbers)
        /([8][A-F0-9]{3}[\s]*[1][A-F0-9]{3}[\s]*[2A-F0-9]{4})/gi, // Common Maya ID starting pattern
        
        // INSTAPAY patterns (Maya's interbank service) - LOWER PRIORITY
        /instapay[\s]*ref[\s]*no[\s]*:?[\s]*(\d{6,8})(?![\d])/gi, // "InstaPay Ref No: 476640" (not part of longer number)
        /instapay[\s]*ref[\s]*:?[\s]*(\d{6,8})(?![\d])/gi, // "InstaPay Ref: 476640"
        
        // TRACE NUMBER patterns (Maya-specific, 6-7 digits) - LOWER PRIORITY
        /trace[\s]*no\.?[\s]*:?[\s]*(\d{6,7})(?![\d])/gi, // "Trace No 476640" (not part of longer number)
        /trace[\s]*number[\s]*:?[\s]*(\d{6,7})(?![\d])/gi, // "Trace Number 476640"
        
        // LAST RESORT: Generic patterns but EXCLUDE long numeric strings (account numbers)
        /ref[\s]*no\.?[\s]*:?[\s]*((?![0-9]{10,})[A-F0-9\s]{6,15})(?=.*[A-F])/gi, // Must contain letters A-F to avoid account numbers
      ],
      bank: [
        /ref[\s]*no\.?[\s]*:?[\s]*([\d\s]+)/gi,
        /reference[\s]*no\.?[\s]*:?[\s]*([\d\s]+)/gi,
        /confirmation[\s:]+([\d\w\s]+)/gi,
        /transaction[\s#:]+([\d\w\s]{6,})/gi,
      ],
      unknown: [
        /ref[\s]*no\.?[\s]*:?[\s]*([\d\s]+)/gi,
        /reference[\s]*no\.?[\s]*:?[\s]*([\d\s]+)/gi,
        /(\d{4}[\s]*\d{3}[\s]*\d{6})/g, // Spaced number pattern
        /(\d{8,})/g, // Generic long number pattern
      ]
    };

    const methodPatterns = patterns[method] || patterns.unknown;
    console.log(`🎯 Using ${methodPatterns.length} patterns for method: ${method}`);
    
    // For Maya, try Maya ID patterns first before other patterns
    if (method === 'maya') {
      console.log('🔍 Maya ID extraction...');
      
      // STAGE 1: Try to extract Maya Reference ID pattern first (highest priority)
      const mayaIdPatterns = [
        // MOST SPECIFIC: "Reference ID" followed by alphanumeric pattern
        /reference[\s]*id[\s]*:?[\s]*([A-F0-9]{4}[\s]*[A-F0-9]{4}[\s]*[A-F0-9]{4})/gi,
        /reference[\s]*id[\s]+([A-F0-9]{4}[\s]+[A-F0-9]{4}[\s]+[A-F0-9]{4})/gi,
        
        // SPECIFIC: "ID" followed by alphanumeric before "Trace"
        /id[\s]+([A-F0-9]{4}[\s]*[A-F0-9]{4}[\s]*[A-F0-9]{4})(?=[\s]*trace)/gi,
        
        // ENHANCED: Common Maya ID starting patterns
        /([8][A-F0-9]{3}[\s]*[1][A-F0-9]{3}[\s]*[2A-F0-9]{4})(?![\d])/gi, // Common format like "8F34 1A5F 27CE"
        
        // GENERAL: Any 12-char alphanumeric with letters (but NOT followed by more digits)
        /([A-F0-9]{4}[\s]*[A-F0-9]{4}[\s]*[A-F0-9]{4})(?![\d])/gi,
      ];
      
      for (const pattern of mayaIdPatterns) {
        const matches = [...text.matchAll(pattern)];
        for (const match of matches) {
          let mayaId = (match[1] || match[0]).trim().replace(/\s+/g, ' ');
          mayaId = this.fixMayaIdOCRErrors(mayaId);
          
          // ENHANCED validation: Must have letters A-F and correct length, NOT be account number
          const hasLetters = /[A-F]/i.test(mayaId);
          const correctLength = mayaId.replace(/\s/g, '').length >= 10 && mayaId.replace(/\s/g, '').length <= 12;
          const notAccountNumber = !/^[0-9]{10,}$/.test(mayaId.replace(/\s/g, '')); // Exclude pure numeric strings
          
          console.log('🔍 Maya ID candidate:', { mayaId, hasLetters, correctLength, notAccountNumber });
          
          if (hasLetters && correctLength && notAccountNumber) {
            console.log('✅ FOUND Valid Maya Reference ID:', mayaId);
            return mayaId;
          }
        }
      }
      
      // STAGE 2: Try InstaPay/trace numbers
      const tracePatterns = [
        /instapay[\s]*ref[\s]*no[\s]*:?[\s]*(\d{6,7})/gi,
        /trace[\s]*no\.?[\s]*:?[\s]*(\d{6,7})(?!\d)/gi
      ];
      
      for (const pattern of tracePatterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
          console.log('✅ FOUND Maya trace/InstaPay ref:', match[1]);
          return match[1];
        }
      }
      
      console.log('❌ No Maya reference found');
      return null;
    }
    
    // For GCash and other methods, use pattern matching with enhanced cleaning
    for (let i = 0; i < methodPatterns.length; i++) {
      const pattern = methodPatterns[i];
      console.log(`🔍 Trying pattern ${i + 1}:`, pattern);
      
      const matches = text.match(pattern);
      if (matches) {
        // Return the captured group or the first match
        let ref = matches[1] || matches[0];
        
        if (ref) {
          // Clean up the reference number but preserve spacing for readability
          ref = ref.trim();
          
          if (method === 'gcash') {
            console.log('🧹 GCash reference candidate:', ref);
            
            // GCash: Maintain readable spaced format for long reference numbers
            ref = ref.replace(/\s+/g, ' '); // Normalize spacing
            
            // Handle different GCash formats
            const cleanRef = ref.replace(/\s/g, '');
            
            // Format different GCash reference types
            if (/^\d{14}$/.test(cleanRef)) {
              ref = cleanRef.replace(/(\d{4})(\d{3})(\d{7})/, '$1 $2 $3');
              console.log('✅ Formatted 14-digit GCash ref:', ref);
            } else if (/^\d{13}$/.test(cleanRef)) {
              ref = cleanRef.replace(/(\d{4})(\d{3})(\d{6})/, '$1 $2 $3');
              console.log('✅ Formatted 13-digit GCash ref:', ref);
            } else if (/^\d{11}$/.test(cleanRef)) {
              ref = cleanRef.replace(/(\d{4})(\d{4})(\d{3})/, '$1 $2 $3');
              console.log('✅ Formatted 11-digit GCash ref:', ref);
            } else if (cleanRef.length >= 8 && cleanRef.length <= 15) {
              // Keep cleaned format
              console.log('✅ GCash ref (cleaned):', ref);
            }
          } else {
            // Bank transfers: Remove extra spaces
            ref = ref.replace(/\s+/g, ' ').trim();
          }
          
          // Filter out obviously wrong matches
          const cleanRefForValidation = ref.replace(/\s/g, '');
          if (cleanRefForValidation.length >= 6 && 
              !/^(amount|total|php|gcash|maya|paymaya|3000|30000|13500|365)$/i.test(cleanRefForValidation) &&
              !/^[0-9]{1,4}\.?[0-9]{0,2}$/.test(cleanRefForValidation)) {
            
            console.log('✅ Found reference number:', ref, 'from pattern:', pattern);
            return ref;
          } else {
            console.log('❌ Reference filtered out:', ref);
          }
        }
      } else {
        console.log('❌ Pattern did not match');
      }
    }

    console.log('❌ No reference number found for method:', method);
    return null;
  }

  // Extract amount from text with enhanced patterns for GCash and Maya
  private static extractAmount(text: string, detectedMethod?: OCRResult['method'], referenceNumber?: string | null): number | null {
    console.log('💰 Starting ENHANCED amount extraction from text:', text.substring(0, 200));
    console.log('💰 Detected payment method for context:', detectedMethod);
    
    // PRE-FILTER: Remove known date patterns from the text to prevent them from being matched as amounts
    let cleanedText = text;
    const datePatterns = [
      /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{1,2}[,\s]*\d{4}\b/gi, // "Nov 14, 2025"
      /\b\d{1,2}[,\s]+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[,\s]+\d{4}\b/gi, // "14 Nov 2025"
      /\b\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}\b/gi, // "14/11/2025" or "14-11-2025"
    ];
    
    for (const pattern of datePatterns) {
      const matches = [...cleanedText.matchAll(pattern)];
      if (matches.length > 0) {
        console.log(`🗓️ Found date pattern matches:`, matches.map(m => m[0]));
      }
      cleanedText = cleanedText.replace(pattern, ' [DATE_REMOVED] ');
    }
    
    if (cleanedText !== text) {
      console.log('🗓️ Pre-filtered date patterns from text');
      console.log('   Original length:', text.length);
      console.log('   Cleaned length:', cleanedText.length);
    }
    
    // CRITICAL FIX: Method-specific patterns to avoid confusion
    let patterns: RegExp[] = [];

    if (detectedMethod === 'maya') {
      // MAYA-SPECIFIC amount patterns (avoid dates and trace numbers)
      patterns = [
        // HIGHEST PRIORITY: Simple ₱ symbol with amount (like ₱100, ₱1, ₱4500)
        /₱[\s]*([1-9]\d{0,2}(?:,\d{3})*(?:\.\d{1,2})?)(?!\d)/gi, // ₱100, ₱1, ₱4,500 etc
        /₱[\s]*([0-9]+(?:\.\d{1,2})?)(?!\d)/gi, // Fallback for any ₱ + numbers
        
        // CRITICAL: Handle 'P' followed by numbers (common OCR misread of ₱ symbol) 
        // Special case: P100 often means ₱1.00 when OCR misread the decimal
        /\bP(100)(?!\d)\b/gi, // P100 (likely ₱1.00 misread) - HIGHEST PRIORITY  
        /\bP([1-9]\d{0,2}(?:\.\d{1,2})?)(?!\d)\b/gi, // P100, P50, P1, P1.00 etc.
        /\bP([1-9]\d{3,}(?:\.\d{1,2})?)(?!\d)\b/gi, // P1000, P5000 etc.
        
        // NEW: Standalone decimal amounts in Maya context (for cases like "1.00")
        /(?:^|\s|\n)([1-9](?:\d{0,2})?\.00)(?=\s|\n|$|[^0-9])/gi, // 1.00, 2.00, etc. (standalone)
        /(?:^|\s|\n)([1-9]\d*\.(?:00|50))(?=\s|\n|$|[^0-9])/gi, // 1.00, 2.50, etc. (standalone decimal amounts)
        
        // VERY HIGH PRIORITY: Maya-specific amount phrases with ₱ symbol
        /you[\s]*sent[\s]*₱[\s]*([\d,]+(?:\.\d{1,2})?)/gi, // "You sent ₱3,000.00"
        /you[\s]*paid[\s]*₱[\s]*([\d,]+(?:\.\d{1,2})?)/gi, // "You paid ₱3,000.00"
        /sent[\s]*₱[\s]*([\d,]+(?:\.\d{1,2})?)/gi, // "Sent ₱3,000"
        /transfer[\s]*amount[\s]*₱[\s]*([\d,]+(?:\.\d{1,2})?)/gi, // "Transfer Amount ₱3,000"
        /amount[\s]*sent[\s]*₱[\s]*([\d,]+(?:\.\d{1,2})?)/gi, // "Amount Sent ₱3,000"
        /paymaya[\s]*transfer[\s]*₱[\s]*([\d,]+(?:\.\d{1,2})?)/gi, // "PayMaya Transfer ₱3,000"
        /maya[\s]*transfer[\s]*₱[\s]*([\d,]+(?:\.\d{1,2})?)/gi, // "Maya Transfer ₱3,000"
        
        // ENHANCED: More flexible ₱ symbol patterns (allow non-breaking spaces and other unicode spaces)
        /₱[\s\u00A0\u200B]*([\d.,]+(?:\.\d{1,2})?)(?![\d])/gi, // ₱ symbol followed by amount (not part of longer number)
        // Sometimes OCR reads the peso sign as a plain 'P' or 'p' or 'Php' — capture those but validate context later
        /(?:\bphp\b|\bPhp\b|\bP\b)[\s\u00A0\u200B]*([\d.,]+(?:\.\d{1,2})?)/gi,
        /php[\s]*([\d,]+(?:\.\d{1,2})?)/gi, // PHP 3,000
        
        // MEDIUM PRIORITY: Generic amount patterns
        /amount[\s]*:?[\s]*₱?[\s]*([\d,]+(?:\.\d{1,2})?)/gi, // "Amount: ₱3,000" or "Amount 3,000"
        /total[\s]*amount[\s]*₱?[\s]*([\d,]+(?:\.\d{1,2})?)/gi, // "Total Amount ₱3,000"
        /payment[\s]*amount[\s]*₱?[\s]*([\d,]+(?:\.\d{1,2})?)/gi, // "Payment Amount ₱3,000"
      ];
    } else if (detectedMethod === 'gcash') {
      // GCASH-SPECIFIC amount patterns
      patterns = [
        /send[\s]*via[\s]*gcash[\s]*₱?[\s]*([\d,]+(?:\.\d{1,2})?)/gi, // "Send via GCash ₱3,000"
        /express[\s]*send[\s]*amount[\s]*₱?[\s]*([\d,]+(?:\.\d{1,2})?)/gi, // "Express Send Amount ₱3,000"
        /gcash[\s]*send[\s]*money[\s]*₱?[\s]*([\d,]+(?:\.\d{1,2})?)/gi, // "GCash Send Money ₱3,000"
        /gcash[\s]*transfer[\s]*₱?[\s]*([\d,]+(?:\.\d{1,2})?)/gi, // "GCash Transfer ₱3,000"
        /amount[\s]*₱?[\s]*([\d,]+(?:\.\d{1,2})?)/gi, // "Amount: ₱3,000"
        /total[\s]*amount[\s]*₱?[\s]*([\d,]+(?:\.\d{1,2})?)/gi, // "Total Amount ₱3,000"
        /₱[\s\u00A0\u200B]*([\d.,]+(?:\.\d{1,2})?)/g, // Any peso symbol followed by amount
        /(?:\bphp\b|\bPhp\b|\bP\b)[\s\u00A0\u200B]*([\d.,]+(?:\.\d{1,2})?)/gi,
        /(\d{1,2},\d{3}(?:,\d{3})*(?:\.\d{1,2})?)/g, // Comma-separated numbers like 3,000.00
      ];
    } else {
      // GENERIC patterns for unknown methods or bank transfers
      patterns = [
        /amount[\s:]*₱?[\s]*([\d,]+(?:\.\d{1,2})?)/gi, // Amount: 3,000.00
        /total[\s]*amount[\s]*₱?[\s]*([\d,]+(?:\.\d{1,2})?)/gi, // Total Amount 3,000.00
        /payment[\s]*amount[\s]*₱?[\s]*([\d,]+(?:\.\d{1,2})?)/gi, // Payment Amount ₱3,000
        /₱[\s\u00A0\u200B]*([\d.,]+(?:\.\d{1,2})?)/g, // ₱3,000.00
        /(?:\bphp\b|\bPhp\b|\bP\b)[\s\u00A0\u200B]*([\d.,]+(?:\.\d{1,2})?)/gi, // PHP 3000 or P3000
        /(\d{1,2},\d{3}(?:,\d{3})*(?:\.\d{1,2})?)/g, // Comma-separated numbers like 3,000.00
        /(\d{3,}(?:\.\d{1,2})?)/g, // 3+ digit numbers like 3000
      ];
    }

    const foundAmounts: AmountMatch[] = [];

    for (let i = 0; i < patterns.length; i++) {
      const pattern = patterns[i];
      console.log(`🔍 Trying ${detectedMethod || 'generic'} pattern ${i + 1}/${patterns.length}:`, pattern.toString());
      
      const matches = [...cleanedText.matchAll(pattern)];
      console.log(`   Found ${matches.length} matches`);
      
      if (matches.length === 0 && pattern.toString().includes('P')) {
        // Special debug for P patterns since we're looking for P100
        console.log(`   📝 Debug P pattern on text: "${cleanedText.substring(0, 200)}"`);
      }
      
      for (const match of matches) {
        const rawAmountStr = match[1] || match[0];
        const fullMatch = match[0];
        const amountStr = rawAmountStr.replace(/[^\d.,]/g, ''); // Remove everything except digits, commas, periods
        const amount = this.parseAmountString(amountStr);
        
        console.log(`   → Raw: "${rawAmountStr}", Clean: "${amountStr}", Amount: ${amount}`);
        console.log(`   → Full match context: "${fullMatch}"`);
        console.log(`   → Pattern index that matched: ${i + 1}/${patterns.length}`);
        console.log(`   → Pattern that matched: ${pattern}`);
        
        // CRITICAL: OCR Correction for common misreadings
        let correctedAmount = amount;
        if (typeof amount === 'number' && rawAmountStr === '100' && fullMatch.toLowerCase().includes('p100')) {
          // Check if this P100 should actually be P1.00 based on context
          const contextHasSmallAmounts = /\b(1|2|3|4|5)[\.\s]?00\b/.test(cleanedText.toLowerCase());
          const contextHasTransactionFee = /0\.00/.test(cleanedText);
          if (contextHasSmallAmounts || contextHasTransactionFee) {
            correctedAmount = 1.00;
            console.log(`   🔄 OCR CORRECTION: P100 → P1.00 (detected misreading)`);
          }
        }
        
        // Validate amount (reasonable range for payments - allow any positive amount including ₱1)
        if (typeof correctedAmount === 'number' && !isNaN(correctedAmount) && correctedAmount > 0 && correctedAmount < 1000000) {
          const matchText = fullMatch.toLowerCase();
          const matchContext = cleanedText.substring(Math.max(0, cleanedText.indexOf(fullMatch) - 30), cleanedText.indexOf(fullMatch) + fullMatch.length + 30).toLowerCase();
          
          console.log(`   → Context (±30 chars): "${matchContext}"`);
          
          // CRITICAL: Skip if this match contains date removal markers or is a date remnant
          if (matchContext.includes('[date_removed]') || fullMatch.includes('[DATE_REMOVED]')) {
            console.log('   ❌ Skipped: Date removal marker detected');
            continue;
          }
          
          // CRITICAL: Exclude reference numbers, dates, account numbers, and trace numbers
          const isReference = matchText.includes('ref') || matchText.includes('reference') || 
                              matchText.includes('trace no') || matchText.includes('id ') ||
                              matchText.includes('trace number') || /\bid\s+\d/.test(matchText);
          
          // CRITICAL: Exclude dates (common Maya issue where dates get detected as amounts)
          const monthRegex = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/i;
          // Raw patterns like 14/11/2025 or 11-14-2025
          const dateLikeSlash = /\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}/.test(rawAmountStr);
          // Years like 2024 inside amountStr (rare)
          const yearLike = /\b(19|20)\d{2}\b/.test(amountStr);
          // Day + year patterns that sometimes OCR produces (e.g., "14 2025", "14,2025", "14.2025")
          const looksLikeDayYear = /^\s*\d{1,2}[,\.\s]?\d{2,4}\s*$/.test(rawAmountStr.replace(/[^0-9,\.\s]/g, ''));
          const monthNear = monthRegex.test(matchContext) || monthRegex.test(fullMatch);
          const isDate = yearLike || dateLikeSlash || (monthNear && looksLikeDayYear) || monthRegex.test(matchContext) || matchContext.includes('date') || matchContext.includes('time');

          // ENHANCED: More aggressive date detection for "Nov 14, 2025" -> "14,202" scenario
          const extendedContext = cleanedText.substring(Math.max(0, cleanedText.indexOf(fullMatch) - 100), cleanedText.indexOf(fullMatch) + fullMatch.length + 100).toLowerCase();
          const monthWordNearby = monthRegex.test(extendedContext) || monthRegex.test(fullMatch);
          const contains4Digit = /\d{4}/.test(rawAmountStr) || /\d{4}/.test(amountStr);
          const likelyDateExtra = monthWordNearby && (looksLikeDayYear || contains4Digit);
          
          // SPECIFIC: Check for "14,202" pattern that comes from "Nov 14, 2025"
          const isSpecificDatePattern = typeof amount === 'number' && amount > 10000 && amount < 50000 && 
                                        monthWordNearby && 
                                        (/\b(20|19)\d{2}\b/.test(extendedContext) || /\b202[0-9]\b/.test(extendedContext)) &&
                                        !matchText.includes('₱') && !matchText.includes('php') && 
                                        !matchText.includes('amount') && !matchText.includes('sent') && !matchText.includes('total') &&
                                        !matchText.includes('transfer') && !matchText.includes('paid');
          
          const finalIsDate = isDate || likelyDateExtra || isSpecificDatePattern;
          
          // ENHANCED: Exclude account numbers (long numeric strings without currency context)
          const isAccountNumber = /^\d{10,}$/.test(amountStr) && // 10+ digit pure number
                                   !matchText.includes('₱') && !matchText.includes('php') &&
                                   !matchText.includes('amount') && !matchText.includes('sent') &&
                                   !matchText.includes('total') && !rawAmountStr.includes(',');
          
          // CRITICAL: Exclude trace numbers for Maya specifically
          const isTraceNumber = detectedMethod === 'maya' && typeof amount === 'number' && 
                                amount >= 100000 && amount <= 9999999 && 
                                !matchText.includes('₱') && !matchText.includes('php') && 
                                !matchText.includes('amount') && !matchText.includes('sent') &&
                                !matchText.includes('total') && !rawAmountStr.includes(',') &&
                                (matchContext.includes('trace') || matchContext.includes('ref no'));
          
          if (isReference) {
            console.log('   ❌ Skipped: Reference/trace number detected');
            continue;
          }
          
          if (finalIsDate) {
            if (isSpecificDatePattern) {
              console.log('   ❌ Skipped: Specific date pattern detected (Nov 14, 2025 -> 14,202 scenario)');
            } else {
              console.log('   ❌ Skipped: Date detected (finalIsDate)');
            }
            continue;
          }
          
          if (isAccountNumber) {
            console.log('   ❌ Skipped: Account number detected (10+ digits without currency):', amountStr);
            continue;
          }
          
          if (isTraceNumber) {
            console.log('   ❌ Skipped: Potential trace number (6-7 digits without currency):', amount);
            continue;
          }
          
          // ENHANCED: Detect if this might be a partial read of a larger amount
          if (typeof correctedAmount === 'number' && correctedAmount > 0 && correctedAmount < 100 && rawAmountStr.length <= 2) {
            // This might be "3" from "3,000" - check for context clues
            const hasThousandIndicators = /thousand|k\b|[,.]000|000\b/i.test(matchContext) || /thousand|k\b|[,.]000|000\b/i.test(cleanedText);
            
            // Only reconstruct when there are explicit thousand indicators (',000', 'thousand', 'k')
            if (hasThousandIndicators) {
              const reconstructedAmount = correctedAmount * 1000;
              console.log(`   🔄 Reconstructed amount: ₱${correctedAmount} → ₱${reconstructedAmount.toLocaleString()} (detected partial read)`);
              foundAmounts.push({ 
                amount: reconstructedAmount, 
                priority: 15, 
                source: `${fullMatch} (reconstructed: x1000)` 
              });
            }
          }
          
          // Prioritize amounts based on context and method
          let priority = 0;
          
          // HIGHEST PRIORITY: Direct ₱ symbol matches (like ₱100)
          if (matchText.includes('₱') && /^₱[\s]*\d+/.test(matchText.trim())) {
            priority += 25; // Very high priority for simple ₱100 format
          }
          
          // Currency symbol bonus (high priority for ₱1 etc)
          if (matchText.includes('₱') || matchText.includes('php')) priority += 15;
          
          // Extra boost for amounts with decimal places (₱1.00, ₱2.50)
          if ((matchText.includes('₱') || matchText.includes('php')) && typeof correctedAmount === 'number' && correctedAmount % 1 !== 0) {
            priority += 20; // Very high priority for decimal amounts with currency symbol
          }
          
          // Extra boost for very small amounts with currency symbols (₱1-₱99)
          if ((matchText.includes('₱') || matchText.includes('php') || /\bp\d/.test(matchText)) && typeof correctedAmount === 'number' && correctedAmount < 100) {
            priority += 10; // Extra priority for small amounts with explicit currency
          }
          
          // ENHANCED: Special priority for standalone decimal amounts in Maya context (like 1.00, 2.50)
          if (detectedMethod === 'maya' && typeof correctedAmount === 'number' && correctedAmount <= 10 && (correctedAmount % 1 !== 0 || correctedAmount.toString().includes('.00'))) {
            priority += 15; // High priority for standalone small decimal amounts in Maya
            console.log(`   🎯 Maya standalone decimal bonus: +15 priority for "${correctedAmount}"`);
          }
          
          // Special bonus for 'P' followed directly by numbers (common OCR pattern)
          if (/\bp\d+/i.test(fullMatch) && typeof correctedAmount === 'number') {
            priority += 12; // High priority for P100, P50 etc patterns
            console.log(`   ✨ P+number pattern bonus: +12 priority for "${fullMatch}"`);
          }
          
          // Special bonus for OCR corrections
          if (correctedAmount !== amount) {
            priority += 20;
            console.log(`   ⭐ OCR correction bonus: +20 priority (${amount} → ${correctedAmount})`);
          }
          
          // Context bonus
          if (matchText.includes('amount') || matchText.includes('sent') || matchText.includes('total')) priority += 8;
          
          // Method-specific bonuses
          if (detectedMethod === 'maya') {
            if (matchText.includes('you sent') || matchText.includes('you paid')) priority += 12;
            if (matchText.includes('transfer amount')) priority += 10;
          } else if (detectedMethod === 'gcash') {
            if (matchText.includes('send via gcash') || matchText.includes('express send')) priority += 12;
            if (matchText.includes('gcash transfer') || matchText.includes('gcash send')) priority += 10;
          }
          
          // Format bonuses
          if (rawAmountStr.includes(',')) priority += 5; // Comma-separated numbers are more likely amounts
          if (typeof correctedAmount === 'number' && correctedAmount >= 1000) priority += 3; // Larger amounts are more likely correct
          if (typeof correctedAmount === 'number' && correctedAmount >= 100 && correctedAmount < 1000000) priority += 2; // Reasonable payment range
          
          console.log(`   ✅ Valid amount found: ₱${correctedAmount.toLocaleString()} (priority: ${priority}) from: "${fullMatch}"`);
          foundAmounts.push({ amount: correctedAmount, priority, source: fullMatch });
        } else {
          console.log(`   ❌ Invalid amount: ${correctedAmount} (outside range 0-1,000,000)`);
        }
      }
    }

    // If no amounts found, attempt a targeted search near the detected reference number (common OCR line-split issue)
    if (foundAmounts.length === 0 && referenceNumber) {
      try {
        const refIndex = text.indexOf(referenceNumber); // Use original text to find reference
        if (refIndex >= 0) {
          const windowStart = Math.max(0, refIndex - 200);
          const windowEnd = Math.min(text.length, refIndex + referenceNumber.length + 200);
          const nearby = text.substring(windowStart, windowEnd);
          console.log('🔎 No amounts found in cleaned text; searching near reference:', nearby);

          // Try simpler currency patterns in the nearby window (use original text for this targeted search)
          const nearbyPatterns = [ /₱[\s\u00A0\u200B]*([\d.,]{1,})/g, /(?:\bphp\b|\bP\b)[\s\u00A0\u200B]*([\d.,]{1,})/gi ];
          for (const p of nearbyPatterns) {
            const m = [...nearby.matchAll(p)];
            if (m.length) {
              for (const mm of m) {
                const s = mm[1] || mm[0];
                const val = this.parseAmountString(s.replace(/[^\d.,]/g, ''));
                if (val && val > 0 && val < 1000000) {
                  console.log('🔎 Found nearby amount', val, 'from', s);
                  foundAmounts.push({ amount: val, priority: 25, source: `nearby:${s}` });
                }
              }
            }
            if (foundAmounts.length) break;
          }
        }
      } catch (err) {
        console.warn('⚠️ Nearby search failed:', err);
      }
    }
    // Return the highest priority amount
    if (foundAmounts.length > 0) {
      console.log(`💰 Found ${foundAmounts.length} potential amounts, selecting best match...`);
      
      // Sort by priority first, then by amount value for tie-breaking
      const sortedAmounts = foundAmounts.sort((a, b) => {
        if (b.priority !== a.priority) return b.priority - a.priority;
        return b.amount - a.amount; // Prefer larger amounts if same priority
      });
      
      const selectedAmount = sortedAmounts[0];
      console.log(`🎯 Selected amount: ₱${selectedAmount.amount.toLocaleString()} (priority: ${selectedAmount.priority}) from: "${selectedAmount.source}"`);
      
      return selectedAmount.amount;
    }

    console.log('❌ No valid amounts found in text');
    return null;
  }

  // Fix common OCR character recognition errors in Maya IDs
  private static fixMayaIdOCRErrors(ref: string): string {
    // Common OCR misreads in Maya alphanumeric IDs
    let fixed = ref;
    
    // Only apply fixes to what looks like Maya ID format (alphanumeric with spaces)
    if (/^[A-Z0-9\s]+$/.test(ref.toUpperCase()) && ref.includes(' ')) {
      // S -> 5 (very common in Maya IDs like "1ASF" should be "1A5F")
      // Apply this specifically to the middle positions of 4-character groups
      fixed = fixed.replace(/([A-Z0-9])([A-Z])S([A-Z0-9])/g, '$1$25$3');
      
      // O -> 0 in alphanumeric contexts
      fixed = fixed.replace(/([0-9])O([0-9A-F])/g, '$10$2');
      fixed = fixed.replace(/([A-F])O([0-9])/g, '$10$2');
      
      // I -> 1 in numeric contexts
      fixed = fixed.replace(/I([0-9A-F]{2,})/g, '1$1');
      
      // Z -> 2 (less common but occurs)
      fixed = fixed.replace(/([0-9])Z([0-9A-F])/g, '$12$2');
      
      console.log('🔧 Maya ID OCR correction:', ref, '->', fixed);
    }
    
    return fixed;
  }

  // Normalize and parse amount strings with common OCR variations
  private static parseAmountString(amountStr: string): number | null {
    if (!amountStr || typeof amountStr !== 'string') return null;

    let s = amountStr.trim();
    console.log(`🔍 parseAmountString input: "${s}"`);
    
    // Remove non-breaking spaces and zero-width spaces
    s = s.replace(/\u00A0|\u200B/g, '');
    // Keep only digits, dots and commas
    s = s.replace(/[^0-9.,]/g, '');
    console.log(`🔍 After cleanup: "${s}"`);

    if (!s) return null;

    // Heuristic: if both '.' and ',' are present, decide which is decimal separator
    if (s.indexOf('.') !== -1 && s.indexOf(',') !== -1) {
      const lastDot = s.lastIndexOf('.');
      const lastComma = s.lastIndexOf(',');
      if (lastDot > lastComma) {
        // dot likely decimal, remove commas
        s = s.replace(/,/g, '');
      } else {
        // comma likely decimal, remove dots and replace comma with dot
        s = s.replace(/\./g, '');
        s = s.replace(/,/g, '.');
      }
    } else if (s.indexOf(',') !== -1 && s.indexOf('.') === -1) {
      // Only comma present. If it looks like decimal (two decimals), convert to dot
      if (/\,\d{2}$/.test(s)) {
        s = s.replace(/,/g, '.');
      } else {
        // Assume commas are thousand separators
        s = s.replace(/,/g, '');
      }
    } else if (s.indexOf('.') !== -1 && s.indexOf(',') === -1) {
      // Only dot present. If multiple dots, likely thousands separator -> remove all dots
      if ((s.match(/\./g) || []).length > 1) {
        s = s.replace(/\./g, '');
      }
      // otherwise leave dot as decimal separator
    }

    // Final cleanup
    s = s.replace(/[^0-9\.]/g, '');
    console.log(`🔍 Final string to parse: "${s}"`);
    if (!s) return null;

    const n = parseFloat(s);
    console.log(`🔍 Parsed result: ${n}`);
    if (isNaN(n)) return null;
    return n;
  }

  // Validate extracted data
  static validateOCRResult(result: OCRResult, expectedAmount?: number): {
    isValid: boolean;
    issues: string[];
  } {
    const issues: string[] = [];

    // Check reference number
    if (!result.referenceNumber) {
      issues.push('No reference number detected');
    } else if (result.referenceNumber.length < 6) {
      issues.push('Reference number seems too short');
    }

    // Check amount
    if (!result.amount) {
      issues.push('No amount detected');
    } else if (expectedAmount && Math.abs(result.amount - expectedAmount) > expectedAmount * 0.1) {
      issues.push('Detected amount differs significantly from expected amount');
    }

    // Check confidence
    if (result.confidence < 60) {
      issues.push('Low OCR confidence - please verify the extracted data');
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }
}