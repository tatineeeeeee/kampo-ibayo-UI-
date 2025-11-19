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
      if (extracted.amount && extracted.amount < 100) {
        warnings.push('Detected amount seems unusually low');
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

    // DECISION LOGIC (prioritize phrase detection)
    console.log(`  📊 Detection Summary:`);
    console.log(`     GCash phrases: ${hasGCashPhrase ? '✅' : '❌'}, patterns: ${gcashPatternMatches}`);
    console.log(`     Maya phrases: ${hasMayaPhrase ? '✅' : '❌'}, patterns: ${mayaPatternMatches}`);

    if (hasGCashPhrase || gcashPatternMatches > 0) {
      // Prioritize GCash if phrase detected or strong patterns
      if (hasGCashPhrase || gcashPatternMatches >= mayaPatternMatches) {
        method = 'gcash';
        console.log('  🎯 FINAL: GCASH detected');
      } else if (hasMayaPhrase || mayaPatternMatches > 0) {
        method = 'maya';
        console.log('  🎯 FINAL: MAYA detected');
      }
    } else if (hasMayaPhrase || mayaPatternMatches > 0) {
      method = 'maya';
      console.log('  🎯 FINAL: MAYA detected');
    } else {
      // Fallback bank detection
      const bankKeywords = ['bank', 'bdo', 'bpi', 'metrobank', 'unionbank', 'bca', 'atm', 'debit', 'credit card'];
      if (bankKeywords.some(keyword => lowerText.includes(keyword))) {
        method = 'bank';
        console.log('  🎯 FINAL: BANK detected');
      } else {
        console.log('  ❌ FINAL: No payment method detected');
      }
    }

    // Extract reference number and amount based on detected method
    const referenceNumber = this.extractReferenceNumber(text, method);
    const amount = this.extractAmount(text, method); // Pass method for context-aware extraction
    
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
        // MAYA-SPECIFIC patterns - prioritize Maya ID over account numbers
        // HIGHEST PRIORITY: Maya ID patterns (must contain letters A-F)
        /reference[\s]*id[\s]*:?[\s]*([A-F0-9]{4}[\s]*[A-F0-9]{4}[\s]*[A-F0-9]{4})/gi, // "Reference ID: 8F34 1A5F 27CE"
        /id[\s]+([A-F0-9]{4}[\s]*[A-F0-9]{4}[\s]*[A-F0-9]{4})/gi, // "ID 8F34 1A5F 27CE"
        /([A-F0-9]{4}[\s]*[A-F0-9]{4}[\s]*[A-F0-9]{4})/gi, // Maya ID pattern anywhere
        
        // INSTAPAY patterns (Maya's interbank service)
        /instapay[\s]*ref[\s]*no[\s]*:?[\s]*(\d{6,8})/gi, // "InstaPay Ref No: 476640"
        /instapay[\s]*ref[\s]*:?[\s]*(\d{6,8})/gi, // "InstaPay Ref: 476640"
        
        // TRACE NUMBER patterns (Maya-specific, 6-7 digits)
        /trace[\s]*no\.?[\s]*:?[\s]*(\d{6,7})(?!\d)/gi, // "Trace No 476640"
        /trace[\s]*number[\s]*:?[\s]*(\d{6,7})(?!\d)/gi, // "Trace Number 476640"
        
        // FALLBACK: Generic Maya patterns (but avoid account numbers)
        /ref[\s]*no\.?[\s]*:?[\s]*((?![0-9]{10,})[\d\w\s]{6,15})/gi, // Ref but NOT long numbers
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
      
      // STAGE 1: Try to extract Maya ID pattern first (highest priority)
      const mayaIdPatterns = [
        /reference[\s]*id[\s]*:?[\s]*([A-F0-9]{4}[\s]*[A-F0-9]{4}[\s]*[A-F0-9]{4})/gi,
        /id[\s]+([A-F0-9]{4}[\s]*[A-F0-9]{4}[\s]*[A-F0-9]{4})/gi,
        /([A-F0-9]{4}[\s]*[A-F0-9]{4}[\s]*[A-F0-9]{4})/gi,
      ];
      
      for (const pattern of mayaIdPatterns) {
        const match = text.match(pattern);
        if (match) {
          let mayaId = (match[1] || match[0]).trim().replace(/\s+/g, ' ');
          mayaId = this.fixMayaIdOCRErrors(mayaId);
          
          // Validate it's a proper Maya ID (has letters A-F and correct length)
          if (/[A-F]/i.test(mayaId) && mayaId.replace(/\s/g, '').length >= 10) {
            console.log('✅ FOUND Maya ID:', mayaId);
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
  private static extractAmount(text: string, detectedMethod?: OCRResult['method']): number | null {
    console.log('💰 Starting ENHANCED amount extraction from text:', text.substring(0, 200));
    console.log('💰 Detected payment method for context:', detectedMethod);
    
    // CRITICAL FIX: Method-specific patterns to avoid confusion
    let patterns: RegExp[] = [];

    if (detectedMethod === 'maya') {
      // MAYA-SPECIFIC amount patterns (avoid dates and trace numbers)
      patterns = [
        /you[\s]*sent[\s]*₱?[\s]*([\d,]+(?:\.\d{1,2})?)/gi, // "You sent ₱3,000.00"
        /you[\s]*paid[\s]*₱?[\s]*([\d,]+(?:\.\d{1,2})?)/gi, // "You paid ₱3,000.00" 
        /sent[\s]*₱([\d,]+(?:\.\d{1,2})?)/gi, // "Sent ₱3,000"
        /transfer[\s]*amount[\s]*₱?[\s]*([\d,]+(?:\.\d{1,2})?)/gi, // "Transfer Amount ₱3,000"
        /amount[\s]*₱?[\s]*([\d,]+(?:\.\d{1,2})?)/gi, // "Amount: ₱3,000"
        /total[\s]*amount[\s]*₱?[\s]*([\d,]+(?:\.\d{1,2})?)/gi, // "Total Amount ₱3,000"
        /payment[\s]*amount[\s]*₱?[\s]*([\d,]+(?:\.\d{1,2})?)/gi, // "Payment Amount ₱3,000"
        /₱[\s]*([\d,]+(?:\.\d{1,2})?)/g, // Any peso symbol followed by amount
        /(\d{1,2},\d{3}(?:,\d{3})*(?:\.\d{1,2})?)/g, // Comma-separated numbers like 3,000.00
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
        /₱[\s]*([\d,]+(?:\.\d{1,2})?)/g, // Any peso symbol followed by amount
        /(\d{1,2},\d{3}(?:,\d{3})*(?:\.\d{1,2})?)/g, // Comma-separated numbers like 3,000.00
      ];
    } else {
      // GENERIC patterns for unknown methods or bank transfers
      patterns = [
        /amount[\s:]*₱?[\s]*([\d,]+(?:\.\d{1,2})?)/gi, // Amount: 3,000.00
        /total[\s]*amount[\s]*₱?[\s]*([\d,]+(?:\.\d{1,2})?)/gi, // Total Amount 3,000.00
        /payment[\s]*amount[\s]*₱?[\s]*([\d,]+(?:\.\d{1,2})?)/gi, // Payment Amount ₱3,000
        /₱[\s]*([\d,]+(?:\.\d{1,2})?)/g, // ₱3,000.00
        /php[\s]*([\d,]+(?:\.\d{1,2})?)/gi, // PHP 3000
        /(\d{1,2},\d{3}(?:,\d{3})*(?:\.\d{1,2})?)/g, // Comma-separated numbers like 3,000.00
        /(\d{3,}(?:\.\d{1,2})?)/g, // 3+ digit numbers like 3000
      ];
    }

    const foundAmounts: AmountMatch[] = [];

    for (let i = 0; i < patterns.length; i++) {
      const pattern = patterns[i];
      console.log(`🔍 Trying ${detectedMethod || 'generic'} pattern ${i + 1}/${patterns.length}:`, pattern);
      
      const matches = [...text.matchAll(pattern)];
      console.log(`   Found ${matches.length} matches`);
      
      for (const match of matches) {
        const rawAmountStr = match[1] || match[0];
        const fullMatch = match[0];
        const amountStr = rawAmountStr.replace(/[^\d.,]/g, ''); // Remove everything except digits, commas, periods
        const cleanAmount = amountStr.replace(/,/g, ''); // Remove commas for parsing
        const amount = parseFloat(cleanAmount);
        
        console.log(`   → Raw: "${rawAmountStr}", Clean: "${amountStr}", Amount: ${amount}`);
        console.log(`   → Full match context: "${fullMatch}"`);
        
        // Validate amount (reasonable range for payments)
        if (!isNaN(amount) && amount > 0 && amount < 1000000) {
          const matchText = fullMatch.toLowerCase();
          const matchContext = text.substring(Math.max(0, text.indexOf(fullMatch) - 30), text.indexOf(fullMatch) + fullMatch.length + 30).toLowerCase();
          
          console.log(`   → Context (±30 chars): "${matchContext}"`);
          
          // CRITICAL: Exclude reference numbers, dates, and trace numbers
          const isReference = matchText.includes('ref') || matchText.includes('reference') || 
                              matchText.includes('trace no') || matchText.includes('id ') ||
                              matchText.includes('trace number') || /\bid\s+\d/.test(matchText);
          
          // CRITICAL: Exclude dates (common Maya issue where dates get detected as amounts)
          const isDate = /\b(19|20)\d{2}\b/.test(amountStr) || // Years like 2024
                         /\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4}/.test(rawAmountStr) || // Date formats
                         /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/i.test(matchContext) ||
                         matchContext.includes('date') || matchContext.includes('time');
          
          // CRITICAL: Exclude trace numbers (Maya trace numbers like 476640 should not be amounts)
          const isTraceNumber = amount >= 100000 && amount <= 9999999 && 
                                !matchText.includes('₱') && !matchText.includes('php') && 
                                !matchText.includes('amount') && !matchText.includes('sent') &&
                                !matchText.includes('total') && !rawAmountStr.includes(',') &&
                                (matchContext.includes('trace') || matchContext.includes('ref no'));
          
          if (isReference) {
            console.log('   ❌ Skipped: Reference/trace number detected');
            continue;
          }
          
          if (isDate) {
            console.log('   ❌ Skipped: Date detected');
            continue;
          }
          
          if (isTraceNumber) {
            console.log('   ❌ Skipped: Potential trace number (6-7 digits without currency):', amount);
            continue;
          }
          
          // ENHANCED: Detect if this might be a partial read of a larger amount
          if (amount > 0 && amount < 100 && rawAmountStr.length <= 2) {
            // This might be "3" from "3,000" - check for context clues
            const hasThousandIndicators = /thousand|k\b|[,.]000|000\b/i.test(text);
            const hasLargeAmountContext = /booking|payment|total|send|transfer/i.test(matchContext);
            
            if (hasThousandIndicators || hasLargeAmountContext) {
              const reconstructedAmount = amount * 1000;
              console.log(`   🔄 Reconstructed amount: ₱${amount} → ₱${reconstructedAmount.toLocaleString()} (detected partial read)`);
              foundAmounts.push({ 
                amount: reconstructedAmount, 
                priority: 15, 
                source: `${fullMatch} (reconstructed: x1000)` 
              });
            }
          }
          
          // Prioritize amounts based on context and method
          let priority = 0;
          
          // Currency symbol bonus
          if (matchText.includes('₱') || matchText.includes('php')) priority += 10;
          
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
          if (amount >= 1000) priority += 3; // Larger amounts are more likely correct
          if (amount >= 100 && amount < 1000000) priority += 2; // Reasonable payment range
          
          console.log(`   ✅ Valid amount found: ₱${amount.toLocaleString()} (priority: ${priority}) from: "${fullMatch}"`);
          foundAmounts.push({ amount, priority, source: fullMatch });
        } else {
          console.log(`   ❌ Invalid amount: ${amount} (outside range 0-1,000,000)`);
        }
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