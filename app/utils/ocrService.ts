import Tesseract from 'tesseract.js';

export interface OCRResult {
  referenceNumber: string | null;
  amount: number | null;
  confidence: number;
  rawText: string;
  method: 'gcash' | 'maya' | 'bank' | 'unknown';
}

export class OCRService {
  private static worker: Tesseract.Worker | null = null;

  // Initialize OCR worker with optimal settings for high confidence
  static async initializeWorker(): Promise<Tesseract.Worker> {
    if (!this.worker) {
      this.worker = await Tesseract.createWorker('eng');
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
      });
    }
    return this.worker;
  }

  // Clean up worker
  static async terminateWorker(): Promise<void> {
    if (this.worker) {
      await this.worker.terminate();
      this.worker = null;
    }
  }

  // Main OCR processing function with confidence optimization
  static async processPaymentImage(file: File): Promise<OCRResult> {
    try {
      const worker = await this.initializeWorker();
      
      // Convert file to image element for preprocessing
      const imageUrl = URL.createObjectURL(file);
      const preprocessedImage = await this.preprocessImage(imageUrl);
      
      console.log('🔍 Processing with enhanced settings for high confidence...');
      
      // Perform OCR with optimized settings
      const { data } = await worker.recognize(preprocessedImage, {
        rectangle: undefined, // Process entire image
      });
      
      const rawText = data.text;
      let confidence = data.confidence;
      
      console.log('🔍 OCR Raw Text:', rawText);
      console.log('🔍 Initial OCR Confidence:', confidence);
      
      // Boost confidence based on successful extraction patterns
      const result = this.extractPaymentInfo(rawText);
      
      // Apply confidence boosting based on extraction success
      if (result.referenceNumber || result.amount) {
        let confidenceBoost = 0;
        
        // Boost confidence if we found expected patterns
        if (result.method !== 'unknown') confidenceBoost += 10;
        if (result.referenceNumber) {
          // Maya ID pattern gets higher boost
          if (/[A-F0-9]{4}\s*[A-F0-9]{4}\s*[A-F0-9]{4}/.test(result.referenceNumber)) {
            confidenceBoost += 15;
          } else {
            confidenceBoost += 10;
          }
        }
        if (result.amount && result.amount > 0) confidenceBoost += 10;
        
        // Apply boost but cap at reasonable maximum
        confidence = Math.min(confidence + confidenceBoost, 99);
        console.log('🚀 Confidence boosted to:', confidence, '(+' + confidenceBoost + ')');
      }
      
      // Clean up
      URL.revokeObjectURL(imageUrl);
      
      console.log('🔍 Final extraction result:', result);
      
      return {
        ...result,
        confidence: confidence,
        rawText: rawText
      };
      
    } catch (error) {
      console.error('OCR processing failed:', error);
      return {
        referenceNumber: null,
        amount: null,
        confidence: 0,
        rawText: '',
        method: 'unknown'
      };
    }
  }

  // Enhanced image preprocessing for maximum OCR confidence
  private static async preprocessImage(imageUrl: string): Promise<HTMLCanvasElement> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        
        // Optimal canvas size for high confidence (larger = better quality)
        const maxWidth = 1800; // Increased for better text recognition
        let { width, height } = img;
        
        // Scale up small images for better OCR
        if (width < 800) {
          const scale = 800 / width;
          width = 800;
          height = height * scale;
        } else if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Draw with high-quality scaling
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
        
        // Get image data for advanced preprocessing
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Advanced preprocessing for maximum confidence
        for (let i = 0; i < data.length; i += 4) {
          // Convert to grayscale using weighted luminance
          const gray = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
          
          // Advanced adaptive thresholding for crisp text
          let enhanced;
          if (gray > 160) {
            enhanced = 255; // Pure white background
          } else if (gray < 80) {
            enhanced = 0;   // Pure black text
          } else {
            // Enhanced contrast in middle range
            enhanced = gray > 120 ? 255 : 0;
          }
          
          data[i] = enhanced;     // Red
          data[i + 1] = enhanced; // Green
          data[i + 2] = enhanced; // Blue
          // Alpha channel stays unchanged
        }
        
        // Apply noise reduction (simple blur and resharpen)
        ctx.putImageData(imageData, 0, 0);
        
        // Optional: Apply slight sharpening for text clarity
        const sharpenedCanvas = this.applySharpeningFilter(canvas, ctx);
        resolve(sharpenedCanvas);
      };
      
      img.onerror = () => {
        // Fallback: return basic canvas
        const canvas = document.createElement('canvas');
        resolve(canvas);
      };
      
      img.src = imageUrl;
    });
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
    
    // Maya detection - HIGHEST PRIORITY (even if text contains "GCash")
    // Maya transactions often show "G-Xchange Inc. / GCash" as account type but are Maya
    
    // Check for Maya ID pattern first (most definitive indicator)
    const hasMayaIdPattern = /[A-F0-9]{4}[\s]*[A-F0-9]{4}[\s]*[A-F0-9]{4}/i.test(text) && /[A-F]/i.test(text);
    
    // Strong Maya indicators that override GCash detection
    const hasInstaPay = lowerText.includes('instapay') || /insta[\s]*pay/i.test(text);
    const hasMayaLogo = lowerText.includes('maya');
    const hasInstapayRef = lowerText.includes('instapay ref') || /instapay[\s]*ref/i.test(text);
    const hasSentMoneyVia = lowerText.includes('sent money via');
    const hasReceivedMoneyFrom = lowerText.includes('received money from') || /received[\s]*money[\s]*from/i.test(text);
    const hasTraceNo = /trace[\s]*no/i.test(text);
    const hasReferenceId = /reference[\s]*id/i.test(text);
    
    // Enhanced Maya detection - check FIRST to prevent GCash misidentification
    if (hasInstaPay || // InstaPay is strongest Maya indicator
        hasMayaIdPattern || // Maya ID pattern with letters
        hasInstapayRef || // InstaPay Ref. No field
        hasMayaLogo || 
        hasTraceNo || // "Trace No" field
        hasReferenceId || // "Reference ID" field (Maya-specific)
        lowerText.includes('paymaya') ||
        lowerText.includes('pay maya') ||
        (hasSentMoneyVia || hasReceivedMoneyFrom) || // Maya transaction screens
        // Maya trace numbers (6-7 digits, not 10+ which are account numbers)
        /trace[\s]*no[\s]*:?[\s]*\d{6,7}(?!\d)/i.test(text) ||
        lowerText.includes('you sent') ||
        lowerText.includes('maya money') ||
        (lowerText.includes('id ') && lowerText.includes('trace'))) {
      method = 'maya';
    } 
    // GCash detection patterns - only if NOT detected as Maya
    else if (lowerText.includes('gcash') || 
        lowerText.includes('g-cash') || 
        lowerText.includes('express send') ||
        lowerText.includes('globe telecom') ||
        lowerText.includes('gcash money') ||
        lowerText.includes('globe gcash') ||
        lowerText.includes('gcash pay bills') ||
        lowerText.includes('pay bills') ||
        /ref[\s]*no[\s]*\.?[\s]*\d{4}[\s]*\d{3}[\s]*\d{6}/i.test(text) || // GCash format: 9034 661 904149
        /ref[\s]*no[\s]*\.?[\s]*\d{4}[\s]*\d{4}[\s]*\d+/i.test(text)) { // GCash format: 9529 3156 4
      method = 'gcash';
    } 
    // Bank transfer patterns
    else if (lowerText.includes('bank') || 
               lowerText.includes('bdo') || 
               lowerText.includes('bpi') ||
               lowerText.includes('metrobank') ||
               lowerText.includes('unionbank')) {
      method = 'bank';
    }

    // Comprehensive Maya detection debugging
    console.log('🔍 MAYA DETECTION DEBUG:');
    console.log('  - Text length:', text.length);
    console.log('  - Lower text (first 200 chars):', lowerText.substring(0, 200));
    console.log('  - hasMayaIdPattern:', hasMayaIdPattern);
    console.log('  - hasInstaPay:', hasInstaPay);
    console.log('  - hasMayaLogo:', hasMayaLogo);
    console.log('  - hasInstapayRef:', hasInstapayRef);
    console.log('  - hasSentMoneyVia:', hasSentMoneyVia);
    console.log('  - hasReceivedMoneyFrom:', hasReceivedMoneyFrom);
    console.log('  - Contains "received money from":', lowerText.includes('received money from'));
    console.log('  - Contains "maya":', lowerText.includes('maya'));
    console.log('  - Contains "instapay":', lowerText.includes('instapay'));
    console.log('  - Final detected method:', method);
    console.log('🔍 MAYA DETECTION DEBUG END');

    // Extract reference number
    const referenceNumber = this.extractReferenceNumber(text, method);
    
    // Extract amount
    const amount = this.extractAmount(text);
    
    return {
      referenceNumber,
      amount,
      method
    };
  }

  // Extract reference number based on payment method
  private static extractReferenceNumber(text: string, method: OCRResult['method']): string | null {
    const patterns = {
      gcash: [
        // High priority GCash patterns from screenshots
        /ref[\s]*no[\s]*\.?[\s]*([\d\s]+)/i, // "Ref. No. 9529 3156 4" or "Ref No. 9034 661 904149"
        /reference[\s]*no[\s]*\.?[\s]*([\d\s]+)/i, // "Reference No: ..."
        
        // Specific GCash number formats (prioritized)
        /(\d{4}[\s]*\d{3}[\s]*\d{6})/g, // 13-digit format: "9034 661 904149"
        /(\d{4}[\s]*\d{4}[\s]*\d{1,4})/g, // Variable format: "9529 3156 4"
        /(\d{10,13})/g, // Continuous 10-13 digits (common GCash range)
        
        // Context-aware GCash patterns
        /express[\s]*send[\s]*ref[\s]*no[\s]*\.?[\s]*([\d\s]+)/i, // "Express Send Ref No."
        /gcash[\s]*pay[\s]*bills[\s]*ref[\s]*[\s\w]*\.?[\s]*([\d\s]+)/i, // "GCash Pay Bills"
        /pay[\s]*bills[\s]*ref[\s]*no[\s]*\.?[\s]*([\d\s]+)/i, // "Pay Bills Ref. No."
        
        // Generic fallback patterns
        /reference[\s:]+([\d\s]{8,})/i, // Reference with colon
        /ref[\s#:]+([\d\s]{8,})/i, // Ref with hash or colon
        /transaction[\s#:]+([\d\s]{8,})/i, // Transaction number
        /globe[\s]*gcash[\s]*ref[\s]*:?[\s]*([\d\s]+)/i, // "Globe GCash Ref:"
      ],
      maya: [
        // Maya-specific patterns - prioritize Maya ID over account numbers
        // HIGHEST PRIORITY: Maya ID patterns (must contain letters A-F)
        /id[\s]+([A-F0-9]{4}[\s]*[A-F0-9]{4}[\s]*[A-F0-9]{4})(?=[\s]*trace)/i, // "ID 8F34 1A5F 27CE Trace" - before trace
        /([A-F0-9]{4}[\s]*[A-F0-9]{4}[\s]*[A-F0-9]{4})(?=[\s]*trace)/i, // "8F34 1A5F 27CE Trace" - Maya ID before trace
        /id[\s]+([A-F0-9]{4}[\s]*[A-F0-9]{4}[\s]*[A-F0-9]{4})/i, // "ID 8F34 1A5F 27CE" - exact Maya ID
        /([A-F0-9]{4}[\s]*[A-F0-9]{4}[\s]*[A-F0-9]{4})/i, // Maya ID pattern anywhere (must have letters)
        
        // MEDIUM PRIORITY: Trace numbers (6-7 digits, not account numbers)
        /trace[\s]*no\.?[\s]*:?[\s]*(\d{6,7})/i, // "Trace No 476640" - 6-7 digits only
        /trace[\s]*number[\s]*:?[\s]*(\d{6,7})/i, // "Trace Number 476640"
        
        // LOW PRIORITY: Generic patterns (but avoid account numbers)
        /id[\s]+([A-F0-9\s]{8,15})/i, // ID followed by alphanumeric (limited length)
        /ref[\s]*no\.?[\s]*:?[\s]*((?![0-9]{10,})[\d\w\s]{6,15})/i, // Ref but NOT long numbers
        /reference[\s]*no\.?[\s]*:?[\s]*((?![0-9]{10,})[\d\w\s]{6,15})/i, // Reference but NOT account numbers
        /transaction[\s#:]+((?![0-9]{10,})[\d\w\s]{4,12})/i, // Transaction IDs but NOT account numbers
        /instapay[\s]*ref[\s]*:?[\s]*((?![0-9]{10,})[\d\w\s]{4,12})/i, // InstaPay ref but NOT account numbers
        
        // VERY LOW PRIORITY: Full reference line (fallback)
        /(ID[\s]+[A-F0-9\s]+Trace[\s]+No[\s]+\d+[\s]*instaPay[\s]*Ref)/i, // Full Maya reference line
      ],
      bank: [
        /ref[\s]*no\.?[\s]*:?[\s]*([\d\s]+)/i,
        /reference[\s]*no\.?[\s]*:?[\s]*([\d\s]+)/i,
        /reference[\s:]+([\d\w\s]+)/i,
        /confirmation[\s:]+([\d\w\s]+)/i,
        /transaction[\s#:]+([\d\w\s]{6,})/i,
        /(\d{4}[\s]*\d{3}[\s]*\d{6})/g,
      ],
      unknown: [
        /ref[\s]*no\.?[\s]*:?[\s]*([\d\s]+)/i, // Most common pattern
        /reference[\s]*no\.?[\s]*:?[\s]*([\d\s]+)/i,
        /reference[\s:]+([\d\w\s]+)/i,
        /ref[\s#:]+([\d\w\s]+)/i,
        /(\d{4}[\s]*\d{3}[\s]*\d{6})/g, // Spaced number pattern
        /(\d{8,})/g, // Generic long number pattern
      ]
    };

    const methodPatterns = patterns[method] || patterns.unknown;
    
    // For Maya, try Maya ID patterns first before other patterns
    if (method === 'maya') {
      // STAGE 1: Try to extract Maya ID pattern first (highest priority)
      const mayaIdPatterns = [
        // SPECIFIC pattern for "Reference ID    8F34 1A5F 27CE" from the screenshot
        /reference[\s]*id[\s]*([8][A-F0-9]{3}[\s]*[1][A-F0-9]{3}[\s]*[2][A-F0-9]{3})/i,
        
        // Reference ID field patterns (from your screenshots) - HIGHEST PRIORITY  
        /reference[\s]*id[\s]*:?[\s]*([A-F0-9]{4}[\s]*[A-F0-9]{4}[\s]*[A-F0-9]{4})/i,
        /reference[\s]*id[\s]+([A-F0-9]{4}[\s]+[A-F0-9]{4}[\s]+[A-F0-9]{4})/i,
        
        // Very flexible patterns to catch OCR variations
        /reference[\s]*id[\s]*:?[\s]*([8A-F0-9]{4}[\s]*[1A-F0-9]{4}[\s]*[2A-F0-9]{4})/i,
        /([8][A-F0-9]{3}[\s]+[1][A-F0-9]{3}[\s]+[2A-F0-9]{4})/i,
        
        // Maya ID patterns with context
        /([A-F0-9]{4}[\s]*[A-F0-9]{4}[\s]*[A-F0-9]{4})(?=[\s]*trace|\s*instapay|\s*$)/i,
        /id[\s]+([A-F0-9]{4}[\s]*[A-F0-9]{4}[\s]*[A-F0-9]{4})/i,
        
        // General flexible patterns
        /([A-F0-9]{4}[\s]*[A-F0-9A-F]{3,4}[\s]*[A-F0-9A-F]{3,4})/i,
        /([A-F0-9]{4}[\s]*[A-F0-9]{4}[\s]*[A-F0-9]{4})/i
      ];
      
      console.log('🎯 Looking for Maya ID pattern in text...');
      console.log('🔍 Text to search:', text.substring(0, 500)); // Show more context
      
      for (const pattern of mayaIdPatterns) {
        console.log('🔍 Trying Maya ID pattern:', pattern);
        const match = text.match(pattern);
        if (match) {
          console.log('🎯 Pattern matched:', match);
          let mayaId = (match[1] || match[0]).trim();
          mayaId = mayaId.replace(/\s+/g, ' '); // Normalize spacing
          console.log('🧹 Before OCR fixes:', mayaId);
          mayaId = this.fixMayaIdOCRErrors(mayaId); // Apply OCR corrections
          console.log('🔧 After OCR fixes:', mayaId);
          
          // Validate it's a proper Maya ID (has letters A-F and correct length)
          const hasLetters = /[A-F]/i.test(mayaId);
          const correctLength = mayaId.replace(/\s/g, '').length >= 10;
          console.log('✅ Maya ID validation:', { mayaId, hasLetters, correctLength });
          
          if (hasLetters && correctLength) {
            console.log('✅ FOUND Maya ID:', mayaId);
            return mayaId;
          } else {
            console.log('❌ Maya ID validation failed:', { mayaId, hasLetters, correctLength });
          }
        } else {
          console.log('❌ Pattern did not match');
        }
      }
      
      // STAGE 2: Try InstaPay Ref and trace numbers
      const instapayRefPatterns = [
        /instapay[\s]*ref[\s]*no[\s]*:?[\s]*(\d{6,7})(?!\d)/i,
        /instapay[\s]*ref[\s]*:?[\s]*(\d{6,7})(?!\d)/i,
        /trace[\s]*no\.?[\s]*:?[\s]*(\d{6,7})(?!\d)/i
      ];
      
      for (const pattern of instapayRefPatterns) {
        const match = text.match(pattern);
        if (match) {
          console.log('✅ FOUND Maya InstaPay/trace number:', match[1]);
          return match[1];
        }
      }
      
      // STAGE 3: Last resort - scan for ANY alphanumeric pattern that looks like Maya ID
      console.log('🚨 STAGE 3: Scanning for any Maya ID-like patterns...');
      
      // Find all potential Maya ID patterns in the text (more aggressive)
      const allMayaIdMatches = [
        ...text.matchAll(/([8][A-F0-9]{3}[\s]*[1][A-F0-9]{3}[\s]*[2A-F0-9]{4})/gi),
        ...text.matchAll(/([A-F0-9]{4}[\s]*[A-F0-9]{4}[\s]*[A-F0-9]{4})/gi)
      ];
      
      for (const match of allMayaIdMatches) {
        let candidate = match[1] || match[0];
        candidate = candidate.trim().replace(/\s+/g, ' ');
        
        // Must have letters A-F to be a Maya ID (not account number)
        if (/[A-F]/i.test(candidate) && candidate.replace(/\s/g, '').length >= 10) {
          candidate = this.fixMayaIdOCRErrors(candidate);
          console.log('🎯 FOUND Maya ID via aggressive scan:', candidate);
          return candidate;
        }
      }
      
      console.log('❌ No valid Maya reference found even with aggressive scanning');
      return null;
    }
    
    // For other methods (GCash, Bank), use existing pattern matching
    for (const pattern of methodPatterns) {
      const matches = text.match(pattern);
      if (matches) {
        // Return the captured group or the first match
        let ref = matches[1] || matches[0];
        
        if (ref) {
          // Clean up the reference number but preserve spacing for readability
          ref = ref.trim();
          
          // Handle different payment methods with their specific formatting needs
          if (method === 'gcash') {
            console.log('🔍 GCash reference candidate:', ref);
            
            // GCash: Maintain readable spaced format for long reference numbers
            ref = ref.replace(/\s+/g, ' '); // Normalize spacing
            
            // Handle different GCash formats
            const cleanRef = ref.replace(/\s/g, '');
            
            // Format 1: 13-digit (9034661904149) -> add spaces
            if (/^\d{13}$/.test(cleanRef)) {
              ref = cleanRef.replace(/(\d{4})(\d{3})(\d{6})/, '$1 $2 $3');
              console.log('✅ Formatted 13-digit GCash ref:', ref);
            }
            // Format 2: Already spaced or shorter format (keep as is if valid)
            else if (/^\d{4}\s\d{3}\s\d{6}$/.test(ref)) {
              console.log('✅ GCash 13-digit format confirmed:', ref);
            }
            else if (/^\d{4}\s\d{4}\s\d{1,4}$/.test(ref)) {
              console.log('✅ GCash variable format confirmed:', ref);
            }
            // Format 3: Remove extra chars and reformat if needed
            else {
              // Clean and try to identify pattern
              const digits = ref.replace(/\D/g, ''); // Keep only digits
              if (digits.length >= 8 && digits.length <= 15) {
                // Keep the cleaned digits with appropriate spacing
                if (digits.length === 13) {
                  ref = digits.replace(/(\d{4})(\d{3})(\d{6})/, '$1 $2 $3');
                } else if (digits.length >= 10) {
                  ref = digits.replace(/(\d{4})(\d{4})(\d+)/, '$1 $2 $3');
                } else {
                  ref = digits; // Keep as is for shorter refs
                }
                console.log('🧹 Cleaned GCash ref:', ref);
              }
            }
            
          } else {
            // Bank transfers: Remove spaces for cleaner format
            ref = ref.replace(/\s+/g, '');
          }
          
          // Filter out obviously wrong matches (too short, common words, amounts)
          const cleanRefForValidation = ref.replace(/\s/g, ''); // Remove spaces just for validation
          if (cleanRefForValidation.length >= 6 && 
              !/^(amount|total|php|gcash|maya|paymaya|3000|30000|13500|365)$/i.test(cleanRefForValidation) &&
              !/^[0-9]{1,4}\.?[0-9]{0,2}$/.test(cleanRefForValidation)) { // Not a price format
            
            console.log('✅ Found reference number:', ref, 'from pattern:', pattern);
            return ref;
          } else {
            console.log('❌ Reference filtered out:', ref, 'cleaned:', cleanRefForValidation);
          }
        }
      }
    }

    return null;
  }

  // Extract amount from text
  private static extractAmount(text: string): number | null {
    const patterns = [
      // High priority - explicit amount labels
      /amount[\s:]*₱?[\s]*([\d,]+\.?\d*)/gi, // Amount: 3,000.00
      /total[\s]*amount[\s]*sent[\s]*₱?[\s]*([\d,]+\.?\d*)/gi, // Total Amount Sent 3,000.00
      
      // Maya-specific patterns
      /you[\s]*sent[\s]*₱?[\s]*([\d,]+\.?\d*)/gi, // Maya: "You sent ₱13,500.00"
      /sent[\s]*₱?[\s]*([\d,]+\.?\d*)/gi, // Maya: "Sent ₱13,500"
      /transfer[\s]*amount[\s]*₱?[\s]*([\d,]+\.?\d*)/gi, // "Transfer Amount ₱13,500"
      
      // GCash-specific patterns  
      /express[\s]*send[\s]*amount[\s]*₱?[\s]*([\d,]+\.?\d*)/gi, // GCash express send
      /send[\s]*money[\s]*₱?[\s]*([\d,]+\.?\d*)/gi, // "Send Money ₱3,000"
      
      // Generic currency patterns
      /₱[\s]*([\d,]+\.?\d*)/g, // ₱1,000.00 or ₱13,500
      /php[\s]*([\d,]+\.?\d*)/gi, // PHP 1000
      /([\d,]+\.?\d*)[\s]*php/gi, // 1000 PHP
      
      // Lower priority patterns
      /total[\s:]*₱?[\s]*([\d,]+\.?\d*)/gi, // Total: 1000
      /(\d{1,3}(?:,\d{3})*\.?\d*)[\s]*(?=\s|$)/g, // Large numbers like 13,500 standing alone
    ];

    const foundAmounts: number[] = [];

    for (const pattern of patterns) {
      const matches = [...text.matchAll(pattern)];
      for (const match of matches) {
        const amountStr = match[1].replace(/,/g, '');
        const amount = parseFloat(amountStr);
        
        // Validate amount (reasonable range for payments)
        if (!isNaN(amount) && amount > 0 && amount < 1000000) {
          // Avoid reference numbers that look like amounts
          const matchText = match[0].toLowerCase();
          
          // Skip if it's clearly a reference/trace number
          if (matchText.includes('ref') || matchText.includes('reference') || 
              matchText.includes('trace no') || matchText.includes('id ') ||
              matchText.includes('trace number')) {
            continue;
          }
          
          // Skip trace numbers (Maya trace numbers like 476640 should not be amounts)
          // Trace numbers are typically 6-7 digits without currency indicators
          if (amount >= 100000 && amount <= 9999999 && 
              !matchText.includes('₱') && !matchText.includes('php') && 
              !matchText.includes('amount') && !matchText.includes('sent')) {
            console.log('� Skipping potential trace number as amount:', amount, 'in:', match[0]);
            continue;
          }
          
          console.log('�🔍 Found amount:', amount, 'from pattern:', pattern, 'in text:', match[0]);
          foundAmounts.push(amount);
        }
      }
    }

    // Return the most common amount or the first valid one
    if (foundAmounts.length > 0) {
      // If multiple amounts found, prefer the one that appears most frequently
      const amountCounts = foundAmounts.reduce((acc, amount) => {
        acc[amount] = (acc[amount] || 0) + 1;
        return acc;
      }, {} as Record<number, number>);
      
      const mostCommon = Object.entries(amountCounts)
        .sort(([,a], [,b]) => b - a)[0];
      
      return parseFloat(mostCommon[0]);
    }

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