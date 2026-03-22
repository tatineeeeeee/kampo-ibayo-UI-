"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { X, Send, Minimize2, MessageCircle } from "lucide-react";
import { MAX_CHAT_MESSAGES, MAX_CHAT_INPUT_LENGTH } from "../../lib/constants/ui";
import { Message, FAQItem, ChatbotProps, AIContext } from "./types";
import { FAQ_DATABASE } from "./faqDatabase";
import { GREETING_MESSAGES } from "./greetings";


export default function Chatbot({ onOpenStateChange }: ChatbotProps = {}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showQuickQuestions, setShowQuickQuestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // AI-enhanced conversation context
  const [conversationContext, setConversationContext] = useState<AIContext>({
    previousQuestions: [],
    userPreferences: {
      language: "english",
      topics_discussed: [],
      session_start: new Date(),
    },
    conversation_flow: [],
  });

  // AI session analytics (for potential future use)
  const [sessionAnalytics] = useState({
    questionsAnswered: 0,
    topCategories: [] as string[],
    averageResponseTime: 0,
    userSatisfaction: null as number | null,
    followUpQuestions: 0,
  });

  // Performance optimization: Create keyword index for O(1) lookups
  const keywordIndex = useMemo(() => {
    const index = new Map<string, FAQItem[]>();
    FAQ_DATABASE.forEach((faq) => {
      faq.keywords.forEach((keyword) => {
        const lowerKeyword = keyword.toLowerCase();
        if (!index.has(lowerKeyword)) {
          index.set(lowerKeyword, []);
        }
        index.get(lowerKeyword)!.push(faq);
      });
    });
    return index;
  }, []);

  // AI-powered intent analysis
  const analyzeUserIntent = useCallback(
    (
      message: string
    ): {
      intent: string;
      entities: Array<{ type: string; value: string; confidence: number }>;
      confidence: number;
    } => {
      const lowerMessage = message.toLowerCase();

      const intentPatterns = {
        get_pricing: {
          patterns: [
            /\b(price|cost|rate|magkano|how much|expensive|cheap|budget|afford)\b/gi,
          ],
          confidence: 0.9,
        },
        get_location: {
          patterns: [
            /\b(where|location|address|saan|nasaan|directions|navigate|map)\b/gi,
          ],
          confidence: 0.85,
        },
        booking_inquiry: {
          patterns: [
            /\b(book|reserve|reservation|available|vacancy|magbook|schedule)\b/gi,
          ],
          confidence: 0.8,
        },
        amenities_inquiry: {
          patterns: [
            /\b(amenities|facilities|pool|kitchen|videoke|activities|what.*offer)\b/gi,
          ],
          confidence: 0.75,
        },
        pet_policy: {
          patterns: [/\b(pet|dog|cat|animal|alaga|bring.*pet|pet.*allow)\b/gi],
          confidence: 0.8,
        },
      };

      let bestIntent = "general_inquiry";
      let maxConfidence = 0;
      const entities: Array<{
        type: string;
        value: string;
        confidence: number;
      }> = [];

      Object.entries(intentPatterns).forEach(([intent, config]) => {
        let intentScore = 0;
        config.patterns.forEach((pattern) => {
          const matches = [...lowerMessage.matchAll(pattern)];
          intentScore += matches.length * 0.3;
        });

        if (intentScore > maxConfidence) {
          maxConfidence = intentScore;
          bestIntent = intent;
        }
      });

      return {
        intent: bestIntent,
        entities,
        confidence: Math.min(maxConfidence, 1),
      };
    },
    []
  );

  // Update conversation context with AI insights
  const updateConversationContext = useCallback(
    (
      userMessage: string,
      botResponse: string,
      intent: string,
      language: "tagalog" | "english" | "taglish"
    ) => {
      setConversationContext((prev) => ({
        ...prev,
        previousQuestions: [...prev.previousQuestions.slice(-4), userMessage],
        userPreferences: {
          ...prev.userPreferences,
          language,
          topics_discussed: [
            ...new Set([...prev.userPreferences.topics_discussed, intent]),
          ],
        },
        conversation_flow: [
          ...prev.conversation_flow.slice(-9),
          `${intent}:${language}`,
        ],
      }));
    },
    []
  );

  // AI-enhanced semantic similarity calculation
  const calculateSemanticSimilarity = useCallback(
    (query: string, faqQuestion: string): number => {
      const queryWords = query.toLowerCase().split(/\s+/);
      const faqWords = faqQuestion.toLowerCase().split(/\s+/);

      let commonWords = 0;
      queryWords.forEach((qWord) => {
        if (
          faqWords.some(
            (fWord) => fWord.includes(qWord) || qWord.includes(fWord)
          )
        ) {
          commonWords++;
        }
      });

      return commonWords / Math.max(queryWords.length, faqWords.length);
    },
    []
  );

  // Custom setter that immediately calls the callback
  const setChatbotOpen = (open: boolean) => {
    setIsOpen(open);
    onOpenStateChange?.(open);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Send initial greeting
      const greeting: Message = {
        id: Date.now().toString(),
        text: GREETING_MESSAGES[
          Math.floor(Math.random() * GREETING_MESSAGES.length)
        ],
        sender: "bot",
        timestamp: new Date(),
      };
      setMessages([greeting]);
    }
  }, [isOpen, messages.length]);

  // Enhanced language detection function with Taglish support
  const detectLanguage = (
    message: string
  ): "tagalog" | "english" | "taglish" => {
    const tagalogIndicators = [
      "po",
      "ba",
      "mga",
      "ang",
      "sa",
      "ng",
      "na",
      "ay",
      "si",
      "ni",
      "kay",
      "para",
      "magkano",
      "saan",
      "nasaan",
      "ano",
      "oras",
      "pwede",
      "paano",
      "ilan",
      "may",
      "meron",
      "wala",
      "hindi",
      "opo",
      "oo",
      "tayo",
      "kayo",
      "kami",
      "namin",
      "natin",
      "inyong",
      "kailangan",
      "gusto",
      "ayaw",
      "ibig",
      "dapat",
      "pwedeng",
      "maaari",
      "puwede",
      "yung",
      "yong",
      "nyo",
      "nila",
    ];

    const englishIndicators = [
      "the",
      "and",
      "or",
      "but",
      "with",
      "from",
      "what",
      "where",
      "when",
      "how",
      "can",
      "do",
      "does",
      "are",
      "is",
      "will",
      "would",
      "could",
      "should",
      "have",
      "has",
    ];

    // Common Taglish patterns and words
    const taglishPatterns = [
      "naman",
      "kasi",
      "talaga",
      "sobrang",
      "grabe",
      "galing",
      "diba",
      "eh",
      "kaya",
      "sige",
      "ok lang",
      "okay naman",
      "sure na",
      "alam mo",
      "ano ba",
      "parang",
      "ganun",
      "ganyan",
      "yun",
      "yan",
      "dun",
      "dyan",
    ];

    const lowerMessage = message.toLowerCase();
    let tagalogScore = 0;
    let englishScore = 0;
    let taglishScore = 0;

    // Count Tagalog indicators
    tagalogIndicators.forEach((indicator) => {
      if (lowerMessage.includes(indicator)) {
        tagalogScore++;
      }
    });

    // Count English indicators
    englishIndicators.forEach((indicator) => {
      const pattern = new RegExp(`\\b${indicator}\\b`, "i");
      if (pattern.test(lowerMessage)) {
        englishScore++;
      }
    });

    // Count Taglish patterns
    taglishPatterns.forEach((pattern) => {
      if (lowerMessage.includes(pattern)) {
        taglishScore++;
      }
    });

    // Check for mixed language patterns (English + Tagalog particles)
    const hasTagalogParticles = /\b(po|ba|naman|kasi|eh)\b/i.test(message);
    const hasEnglishWords = /\b(what|where|how|can|do|is|are|the)\b/i.test(
      message
    );

    if (hasTagalogParticles && hasEnglishWords) {
      taglishScore += 2; // Boost Taglish score for mixed patterns
    }

    // Decision logic
    if (taglishScore > 0 && (tagalogScore > 0 || englishScore > 0)) {
      return "taglish";
    } else if (tagalogScore > englishScore) {
      return "tagalog";
    } else if (englishScore > tagalogScore) {
      return "english";
    } else {
      // If scores are equal, check for Filipino context clues
      return hasTagalogParticles ? "tagalog" : "english";
    }
  };

  // Extract language-specific answer from bilingual response with Taglish support
  const extractLanguageAnswer = (
    fullAnswer: string,
    language: "tagalog" | "english" | "taglish"
  ): string => {
    const englishMatch = fullAnswer.match(
      /\*\*English:\*\*\s*([\s\S]*?)(?:\n\n\*\*Tagalog:\*\*|$)/
    );
    const tagalogMatch = fullAnswer.match(
      /\*\*Tagalog:\*\*\s*([\s\S]*?)(?:\n\n\*\*English:\*\*|$)/
    );

    if (language === "tagalog" && tagalogMatch) {
      return tagalogMatch[1].trim();
    } else if (language === "english" && englishMatch) {
      return englishMatch[1].trim();
    } else if (language === "taglish") {
      // For Taglish users, provide a mixed response that's more natural
      if (tagalogMatch && englishMatch) {
        const tagalogAnswer = tagalogMatch[1].trim();
        const englishAnswer = englishMatch[1].trim();

        // Create a Taglish-style response by mixing key info from both
        return `${tagalogAnswer}\n\n*In English: ${
          englishAnswer.split(".")[0]
        }.*`;
      } else if (tagalogMatch) {
        return tagalogMatch[1].trim();
      } else if (englishMatch) {
        return englishMatch[1].trim();
      }
    }

    // Fallback to full answer if extraction fails
    return fullAnswer;
  };

  const findBestAnswer = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    const detectedLanguage = detectLanguage(userMessage);
    const intentAnalysis = analyzeUserIntent(userMessage);


    // Update conversation context for AI learning
    updateConversationContext(
      userMessage,
      "",
      intentAnalysis.intent,
      detectedLanguage
    );

    // Enhanced greeting detection that doesn't interfere with specific questions
    const isGreeting =
      /(^|\s)(hi|hello|hey|good morning|good afternoon|kumusta|kamusta|mabuhay|sup|yo)(\s|$)/i.test(
        userMessage
      ) &&
      !/\b(rate|price|cost|magkano|how much|ano|what|where|paano|saan)\b/i.test(
        userMessage
      );

    if (isGreeting) {
      if (detectedLanguage === "tagalog") {
        return "Kumusta po! Ako ang Kampo Ibayo AI assistant. Narito ako para tumulong sa inyong mga tanong tungkol sa resort. Ano po ang gusto ninyong malaman?";
      } else if (detectedLanguage === "taglish") {
        return "Hi! Kumusta naman! I'm the Kampo Ibayo AI assistant po. I can help you with questions about our resort naman. Ano bang gusto ninyong malaman?";
      } else {
        return "Hello! I'm your Kampo Ibayo AI assistant. How can I help you today? You can ask me about our rates, amenities, booking process, location, or any other questions about Kampo Ibayo.";
      }
    }

    // Enhanced help requests with AI context awareness
    const isHelpRequest =
      /(help|what can you|topics|menu|options|categories|tulong)/i.test(
        userMessage
      ) &&
      !/\b(rate|price|cost|magkano|how much|location|saan|amenities|booking|pet)\b/i.test(
        userMessage
      );

    if (isHelpRequest) {
      if (detectedLanguage === "tagalog") {
        return "Narito po ang mga topic na makakatulong ko sa inyo:\n\n📋 Booking at Reservations\n💰 Pricing at Packages\n🏊 Amenities at Facilities\n📍 Location at Directions\n📅 Cancellation at Rescheduling\n🐕 Pet Policy\n📝 House Rules at Guidelines\n🎉 Events at Parties\n📞 Contact Information\n\n🤖 **AI-Powered Features:**\n• Smart question understanding\n• Multi-language support\n• Context-aware responses\n\nTanungin lang po ako tungkol sa Kampo Ibayo Resort!";
      } else if (detectedLanguage === "taglish") {
        return "Sure! Here are the topics na makakatulong ko sa inyo:\n\n📋 Booking and Reservations\n💰 Pricing and Packages\n🏊 Amenities and Facilities\n📍 Location and Directions\n📅 Cancellation and Rescheduling\n🐕 Pet Policy\n📝 House Rules and Guidelines\n🎉 Events and Parties\n📞 Contact Information\n\n🤖 **AI Features:**\n• Smart question understanding\n• Multi-language support\n• Context-aware responses\n\nJust ask me anything about Kampo Ibayo Resort naman!";
      } else {
        return "I'm an AI-powered assistant that can help you with:\n\n📋 Booking and Reservations\n💰 Pricing and Packages\n🏊 Amenities and Facilities\n📍 Location and Directions\n📅 Cancellation and Rescheduling\n🐕 Pet Policy\n📝 House Rules and Guidelines\n🎉 Events and Parties\n📞 Contact Information\n\n🤖 **AI Features:**\n• Advanced pattern recognition\n• Natural language understanding\n• Context-aware conversations\n• Multi-language support (English/Tagalog/Taglish)\n\nFeel free to ask me anything about Kampo Ibayo Resort!";
      }
    }

    // Enhanced matching with scoring system - optimized with keyword index
    const candidateFAQs = new Set<FAQItem>();

    // Use keyword index for faster lookups
    for (const [keyword, faqs] of keywordIndex.entries()) {
      if (lowerMessage.includes(keyword)) {
        faqs.forEach((faq) => candidateFAQs.add(faq));
      }
    }

    // If no matches from index, fall back to full search (preserves functionality)
    const faqsToSearch =
      candidateFAQs.size > 0 ? Array.from(candidateFAQs) : FAQ_DATABASE;

    const matchResults = faqsToSearch.map((faq) => {
      let score = 0;
      const matchedKeywords: string[] = [];
      const keywordPositions: number[] = [];

      // AI-enhanced keyword matching with semantic understanding
      faq.keywords.forEach((keyword) => {
        const keywordLower = keyword.toLowerCase();
        const index = lowerMessage.indexOf(keywordLower);

        if (index !== -1) {
          matchedKeywords.push(keyword);
          keywordPositions.push(index);

          // Base score for keyword match
          score += faq.priority || 10;

          // AI: Intent alignment bonus
          if (
            faq.intent === intentAnalysis.intent &&
            intentAnalysis.confidence > 0.5
          ) {
            score += 25;
          }

          // Enhanced exact word match detection
          const beforeChar = index > 0 ? lowerMessage[index - 1] : " ";
          const afterChar =
            index + keywordLower.length < lowerMessage.length
              ? lowerMessage[index + keywordLower.length]
              : " ";

          if (
            (/\s/.test(beforeChar) || beforeChar === " ") &&
            (/\s/.test(afterChar) || afterChar === " ")
          ) {
            score += 15; // Enhanced exact word match bonus
          }

          // AI: Language preference bonus
          if (
            detectedLanguage === "tagalog" &&
            /\b(po|ang|sa|ng|mga)\b/i.test(keyword)
          ) {
            score += 10;
          } else if (
            detectedLanguage === "english" &&
            !/\b(po|ang|sa|ng|mga)\b/i.test(keyword)
          ) {
            score += 10;
          }

          // Enhanced importance scoring
          if (keywordLower.length > 5) {
            score += 8;
          }
        }
      });

      // AI: Context pattern matching (if available)
      if (faq.context_patterns) {
        faq.context_patterns.forEach((pattern) => {
          if (lowerMessage.includes(pattern.toLowerCase())) {
            score += 12;
          }
        });
      }

      // AI: Variations matching (if available)
      if (faq.variations) {
        faq.variations.forEach((variation) => {
          if (lowerMessage.includes(variation.toLowerCase())) {
            score += 15;
          }
        });
      }

      // AI: Semantic similarity bonus
      const semanticScore = calculateSemanticSimilarity(
        lowerMessage,
        faq.question.toLowerCase()
      );
      score += semanticScore * 20;

      // Multiple keyword proximity bonus
      if (matchedKeywords.length > 1) {
        score += matchedKeywords.length * 3; // Multi-keyword bonus

        // Proximity bonus - keywords close together get higher score
        if (keywordPositions.length > 1) {
          const maxDistance =
            Math.max(...keywordPositions) - Math.min(...keywordPositions);
          if (maxDistance < 50) {
            // Keywords within 50 characters
            score += 8;
          } else if (maxDistance < 100) {
            score += 4;
          }
        }
      }

      // Question similarity bonus (if user question is similar to FAQ question)
      const questionSimilarity = calculateQuestionSimilarity(
        lowerMessage,
        faq.question.toLowerCase()
      );
      score += questionSimilarity * 5;

      return {
        faq,
        score,
        matchedKeywords,
        keywordCount: matchedKeywords.length,
        semanticScore,
      };
    });

    // AI-enhanced sorting with multiple criteria
    matchResults.sort((a, b) => {
      // Primary: Score difference
      if (Math.abs(a.score - b.score) > 5) {
        return b.score - a.score;
      }
      // Secondary: Intent alignment
      if (
        a.faq.intent === intentAnalysis.intent &&
        b.faq.intent !== intentAnalysis.intent
      ) {
        return -1;
      }
      if (
        b.faq.intent === intentAnalysis.intent &&
        a.faq.intent !== intentAnalysis.intent
      ) {
        return 1;
      }
      // Tertiary: Keyword count
      return b.keywordCount - a.keywordCount;
    });

    const bestMatch = matchResults[0];
    const secondBest = matchResults[1];

    // Only return answer if we have a clear winner
    if (bestMatch && bestMatch.score > 0) {
      // AI-enhanced response selection based on confidence and context
      if (bestMatch.score > 30 && intentAnalysis.confidence > 0.6) {
        // High confidence - provide enhanced direct answer
        const answer = extractLanguageAnswer(
          bestMatch.faq.answer,
          detectedLanguage
        );

        // Add AI context awareness for returning users
        let enhancedResponse = answer;
        if (conversationContext.previousQuestions.length > 0) {
          const relatedTopics =
            conversationContext.userPreferences.topics_discussed
              .filter((topic) => topic !== bestMatch.faq.intent)
              .slice(0, 2);

          if (relatedTopics.length > 0 && detectedLanguage === "english") {
            enhancedResponse +=
              "\n\n💡 *Based on our conversation, you might also be interested in our " +
              relatedTopics.join(" and ") +
              " information.*";
          } else if (
            relatedTopics.length > 0 &&
            detectedLanguage === "tagalog"
          ) {
            enhancedResponse +=
              "\n\n💡 *Base sa aming usapan, baka interested din kayo sa " +
              relatedTopics.join(" at ") +
              " information.*";
          }
        }

        return enhancedResponse;
      }

      // First check if we have a specific combination FAQ that already handles multiple topics
      const hasCombinationAnswer = FAQ_DATABASE.some(
        (faq) =>
          faq.keywords.some((keyword) => lowerMessage.includes(keyword)) &&
          (faq.question.toLowerCase().includes("and") ||
            faq.keywords.length > 3)
      );

      // If the best match is already a combination answer, just return it
      if (
        hasCombinationAnswer &&
        bestMatch.faq.question.toLowerCase().includes("and")
      ) {
        return extractLanguageAnswer(bestMatch.faq.answer, detectedLanguage);
      }

      // Check for multiple distinct topics in the question
      const distinctTopics = findDistinctTopics(lowerMessage, matchResults);

      if (distinctTopics.length > 1) {
        // User asked about multiple topics, show all relevant answers
        let multiTopicResponse = "";
        if (detectedLanguage === "tagalog") {
          multiTopicResponse =
            "Nahanap ko po ang information para sa maraming topics sa inyong tanong:\n\n";
        } else if (detectedLanguage === "taglish") {
          multiTopicResponse =
            "I found information para sa multiple topics na na-mention ninyo:\n\n";
        } else {
          multiTopicResponse =
            "I found information for multiple topics in your question:\n\n";
        }

        distinctTopics.forEach((topic, index) => {
          const topicAnswer = extractLanguageAnswer(
            topic.faq.answer,
            detectedLanguage
          );
          multiTopicResponse += `**${index + 1}. ${
            topic.faq.question
          }**\n${topicAnswer}\n\n`;
        });

        if (detectedLanguage === "tagalog") {
          multiTopicResponse +=
            "Nasaklaw na po ba nito lahat ng gusto ninyong malaman?";
        } else if (detectedLanguage === "taglish") {
          multiTopicResponse +=
            "Does this cover everything na gusto ninyong malaman?";
        } else {
          multiTopicResponse +=
            "Does this cover everything you wanted to know?";
        }
        return multiTopicResponse;
      }

      // Medium confidence - offer alternatives with AI insights
      if (secondBest && Math.abs(bestMatch.score - secondBest.score) < 15) {
        const primaryAnswer = extractLanguageAnswer(
          bestMatch.faq.answer,
          detectedLanguage
        );
        const secondaryAnswer = extractLanguageAnswer(
          secondBest.faq.answer,
          detectedLanguage
        );

        if (detectedLanguage === "tagalog") {
          return `Nahanap ko po ang information related sa inyong tanong:\n\n**${bestMatch.faq.question}**\n${primaryAnswer}\n\n**Baka ito rin po ang tinatanong ninyo:**\n**${secondBest.faq.question}**\n${secondaryAnswer}\n\nIsa po ba sa mga ito ang hinahanap ninyo?`;
        } else if (detectedLanguage === "taglish") {
          return `I found information related sa inyong tanong naman. Here's what I can help with:\n\n**${bestMatch.faq.question}**\n${primaryAnswer}\n\n**You might also be asking about:**\n**${secondBest.faq.question}**\n${secondaryAnswer}\n\nIsa ba sa mga ito ang hanap ninyo?`;
        } else {
          return `I found information related to your question. Here's what I can help with:\n\n**${bestMatch.faq.question}**\n${primaryAnswer}\n\n**You might also be asking about:**\n**${secondBest.faq.question}**\n${secondaryAnswer}\n\nWas one of these what you were looking for?`;
        }
      }

      // Standard response with AI enhancement
      return extractLanguageAnswer(bestMatch.faq.answer, detectedLanguage);
    }

    // Enhanced default response with suggestions based on detected language
    const suggestedTopics = getSuggestedTopics(lowerMessage);

    if (detectedLanguage === "tagalog") {
      return `Pasensya na po, wala akong specific information tungkol sa topic na yan. Pero makakatulong ako sa:

📋 Resort rates at packages
🏊 Amenities at facilities
📍 Location at directions
📅 Booking at availability
📞 Contact information

${suggestedTopics ? `\n💡 **Baka interested kayo sa:** ${suggestedTopics}` : ""}

Para sa mga detalyadong tanong na hindi ko alam, makipag-ugnayan sa amin:
• Phone: +63 966 281 5123
• Email: kampoibayo@gmail.com

May iba pa po bang tungkol sa Kampo Ibayo na makakatulong ako?`;
    } else if (detectedLanguage === "taglish") {
      return `Sorry, wala akong specific information about that topic. But I can help you with:

📋 Resort rates and packages
🏊 Amenities and facilities
📍 Location and directions
📅 Booking and availability
📞 Contact information

${
  suggestedTopics
    ? `\n💡 **You might be interested sa:** ${suggestedTopics}`
    : ""
}

Para sa detailed questions na hindi ko alam, you can contact us:
• Phone: +63 966 281 5123
• Email: kampoibayo@gmail.com

May iba pa bang about Kampo Ibayo na makakatulong ako?`;
    } else {
      return `I apologize, but I don't have specific information about that topic. However, I can help you with:

📋 Resort rates and packages
🏊 Amenities and facilities
📍 Location and directions
📅 Booking and availability
📞 Contact information

${
  suggestedTopics
    ? `\n💡 **You might be interested in:** ${suggestedTopics}`
    : ""
}

For detailed inquiries beyond my knowledge, please contact us directly:
• Phone: +63 966 281 5123
• Email: kampoibayo@gmail.com

Is there anything else about Kampo Ibayo I can help you with?`;
    }
  };

  // Helper function to calculate question similarity
  const calculateQuestionSimilarity = (
    userQuestion: string,
    faqQuestion: string
  ): number => {
    const userWords = userQuestion
      .split(/\s+/)
      .filter((word) => word.length > 2);
    const faqWords = faqQuestion.split(/\s+/).filter((word) => word.length > 2);

    let similarWords = 0;
    userWords.forEach((userWord) => {
      if (
        faqWords.some(
          (faqWord) => faqWord.includes(userWord) || userWord.includes(faqWord)
        )
      ) {
        similarWords++;
      }
    });

    return userWords.length > 0 ? similarWords / userWords.length : 0;
  };

  // Helper function to find distinct topics in user query
  const findDistinctTopics = (
    message: string,
    matchResults: Array<{
      faq: FAQItem;
      score: number;
      matchedKeywords: string[];
      keywordCount: number;
    }>
  ) => {
    const topicCategories = [
      {
        category: "pricing",
        keywords: [
          "price",
          "cost",
          "rate",
          "how much",
          "payment",
          "fee",
          "charge",
          "money",
          "expensive",
          "cheap",
        ],
        threshold: 5,
      },
      {
        category: "pets",
        keywords: ["pet", "dog", "cat", "animal", "furbaby"],
        threshold: 5,
      },
      {
        category: "booking",
        keywords: ["book", "reserve", "reservation", "availability"],
        threshold: 5,
      },
      {
        category: "amenities",
        keywords: ["pool", "kitchen", "videoke", "amenities", "facilities"],
        threshold: 5,
      },
      {
        category: "location",
        keywords: ["location", "where", "address", "directions"],
        threshold: 5,
      },
      {
        category: "policies",
        keywords: ["cancel", "refund", "reschedule", "policy"],
        threshold: 5,
      },
    ];

    const detectedTopics: Array<{
      category: string;
      score: number;
      faq: FAQItem;
    }> = [];
    const usedFAQs = new Set<string>(); // Track used FAQ questions to avoid duplicates

    // Check which topic categories are mentioned
    topicCategories.forEach((topic) => {
      let categoryScore = 0;
      let bestFAQForCategory: FAQItem | null = null;
      let bestScoreForCategory = 0;

      topic.keywords.forEach((keyword) => {
        if (message.includes(keyword.toLowerCase())) {
          categoryScore += 1;
        }
      });

      // Find best FAQ entry for this category that hasn't been used
      matchResults.forEach((result) => {
        const hasTopicKeywords = result.matchedKeywords.some((keyword) =>
          topic.keywords.includes(keyword.toLowerCase())
        );

        if (
          hasTopicKeywords &&
          result.score > bestScoreForCategory &&
          !usedFAQs.has(result.faq.question)
        ) {
          bestScoreForCategory = result.score;
          bestFAQForCategory = result.faq;
        }
      });

      if (categoryScore >= 1 && bestFAQForCategory !== null) {
        const faq = bestFAQForCategory as FAQItem;
        detectedTopics.push({
          category: topic.category,
          score: categoryScore,
          faq: faq,
        });
        usedFAQs.add(faq.question);
      }
    });

    // If we only found one topic but the message clearly has multiple concepts,
    // try to find additional relevant FAQs
    if (detectedTopics.length === 1) {
      const remainingResults = matchResults.filter(
        (result) => !usedFAQs.has(result.faq.question) && result.score > 5
      );

      if (remainingResults.length > 0) {
        // Add the next best match if it's significantly different
        const nextBest = remainingResults[0];
        const isDifferentTopic = !detectedTopics[0].faq.keywords.some(
          (keyword) => nextBest.faq.keywords.includes(keyword)
        );

        if (isDifferentTopic) {
          detectedTopics.push({
            category: "additional",
            score: nextBest.score,
            faq: nextBest.faq,
          });
        }
      }
    }

    // Sort by score and return unique topics
    return detectedTopics.sort((a, b) => b.score - a.score).slice(0, 2); // Maximum 2 topics to keep responses focused
  };

  // Helper function to suggest related topics
  const getSuggestedTopics = (message: string): string => {
    const suggestions: string[] = [];

    if (/(money|cost|expensive|cheap|budget)/i.test(message)) {
      suggestions.push("pricing information");
    }
    if (/(stay|sleep|overnight|room)/i.test(message)) {
      suggestions.push("accommodation details");
    }
    if (/(fun|activity|do|entertainment)/i.test(message)) {
      suggestions.push("amenities and activities");
    }
    if (/(drive|car|travel|go)/i.test(message)) {
      suggestions.push("location and directions");
    }

    return suggestions.join(", ");
  };

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    /**
     * INPUT SANITIZATION - PHP Equivalent: htmlspecialchars(), filter_input()
     * - Trims whitespace to prevent empty submissions
     * - Limits input length to MAX_CHAT_INPUT_LENGTH to prevent DoS attacks
     * - Prevents XSS by treating input as plain text (React auto-escapes)
     */
    const sanitizedInput = inputText.trim().slice(0, MAX_CHAT_INPUT_LENGTH);
    if (!sanitizedInput) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: sanitizedInput,
      sender: "user",
      timestamp: new Date(),
    };

    // Add message with history limit to prevent memory bloat
    setMessages((prev) => {
      const newMessages = [...prev, userMessage];
      return newMessages.length > MAX_CHAT_MESSAGES
        ? newMessages.slice(-MAX_CHAT_MESSAGES)
        : newMessages;
    });
    const currentInput = sanitizedInput;
    setInputText("");
    setIsTyping(true);

    // Clear any existing timeout to prevent race conditions
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Simulate bot typing and response
    timeoutRef.current = setTimeout(() => {
      try {
        const botAnswer = findBestAnswer(currentInput);
        const botResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: botAnswer,
          sender: "bot",
          timestamp: new Date(),
        };

        setMessages((prev) => {
          const newMessages = [...prev, botResponse];
          return newMessages.length > MAX_CHAT_MESSAGES
            ? newMessages.slice(-MAX_CHAT_MESSAGES)
            : newMessages;
        });
        setIsTyping(false);

        // If bot couldn't answer well, show quick questions again
        if (botAnswer.includes("I'm not sure about that specific question")) {
          setTimeout(() => {
            const helpMessage: Message = {
              id: (Date.now() + 2).toString(),
              text: "Here are some topics I can definitely help with:",
              sender: "bot",
              timestamp: new Date(),
            };
            setMessages((prev) => {
              const newMessages = [...prev, helpMessage];
              return newMessages.length > MAX_CHAT_MESSAGES
                ? newMessages.slice(-MAX_CHAT_MESSAGES)
                : newMessages;
            });
          }, 1000);
        }
      } catch (error) {
        console.error("Chatbot error:", error);
        const errorResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: "I'm experiencing technical difficulties. Please try rephrasing your question or contact us directly at +63 966 281 5123.",
          sender: "bot",
          timestamp: new Date(),
        };
        setMessages((prev) => {
          const newMessages = [...prev, errorResponse];
          return newMessages.length > MAX_CHAT_MESSAGES
            ? newMessages.slice(-MAX_CHAT_MESSAGES)
            : newMessages;
        });
        setIsTyping(false);
      }
    }, 800);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickQuestions = [
    "What are your rates?",
    "How do I make a booking?",
    "Are pets allowed?",
    "Can I reschedule my booking?",
    "What amenities do you offer?",
    "Where are you located?",
  ];

  const handleQuickQuestion = (question: string) => {
    setInputText(question);
    setTimeout(() => handleSendMessage(), 100);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setChatbotOpen(true)}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 bg-primary hover:bg-primary/90 text-primary-foreground h-12 w-12 sm:h-14 sm:w-14 flex items-center justify-center rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 group border border-primary/80"
        aria-label="Open chat"
      >
        <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6" />
        {/* Online status indicator */}
        <span className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded-full animate-pulse"></span>
        {/* Help tooltip - hide on mobile */}
        <div className="hidden sm:block absolute bottom-full right-0 mb-2 px-3 py-1 bg-popover border border-border text-popover-foreground text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap shadow-lg">
          Need help? Ask me anything!
        </div>
      </button>
    );
  }

  return (
    <div
      className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 transition-all duration-300
      ${isMinimized ? "w-72 sm:w-80" : "w-full sm:w-96"}
      ${isMinimized ? "" : "max-w-[calc(100vw-2rem)] sm:max-w-none"}
      ${isMinimized ? "" : "left-4 sm:left-auto"}`}
    >
      {/* Chat Window */}
      <div
        className={`bg-card rounded-2xl shadow-2xl border border-border flex flex-col transition-all duration-300
        ${isMinimized ? "h-14 sm:h-16" : "h-[70vh] sm:h-[600px] max-h-[600px]"}
        overflow-hidden`}
      >
        {/* Header - Different styles for minimized vs expanded */}
        <div
          className={`bg-card flex items-center justify-between text-foreground transition-all duration-300
          ${
            isMinimized
              ? "h-full p-2 sm:p-3 rounded-2xl"
              : "p-3 sm:p-4 rounded-t-2xl border-b border-border"
          }`}
        >
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="relative flex-shrink-0">
              <div
                className={`bg-primary/20 rounded-lg flex items-center justify-center text-xl group-hover:scale-110 transition-transform
                ${
                  isMinimized
                    ? "w-6 h-6 sm:w-8 sm:h-8"
                    : "w-8 h-8 sm:w-10 sm:h-10"
                }`}
              >
                <MessageCircle
                  className={`text-primary ${
                    isMinimized
                      ? "w-3 h-3 sm:w-4 sm:h-4"
                      : "w-4 h-4 sm:w-5 sm:h-5"
                  }`}
                />
              </div>
              <span
                className={`absolute bg-green-500 rounded-full
                ${
                  isMinimized
                    ? "bottom-0 right-0 w-2 h-2 sm:w-2.5 sm:h-2.5"
                    : "bottom-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3"
                }`}
              ></span>
            </div>
            {!isMinimized && (
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-white text-sm sm:text-base truncate">
                  Kampo Ibayo Assistant
                </h3>
                <p className="text-xs text-muted-foreground truncate">
                  Ready • {FAQ_DATABASE.length}+ answers available
                </p>
              </div>
            )}
            {isMinimized && (
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-white text-xs sm:text-sm truncate">
                  Assistant
                </h3>
                <p className="text-xs text-green-400 truncate">Ready</p>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="text-foreground hover:bg-muted p-1 sm:p-1.5 rounded-lg transition-colors"
              aria-label={isMinimized ? "Maximize" : "Minimize"}
            >
              <Minimize2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={() => setChatbotOpen(false)}
              className="text-foreground hover:bg-muted p-1 sm:p-1.5 rounded-lg transition-colors"
              aria-label="Close chat"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 bg-background">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-2.5 sm:p-3 ${
                      message.sender === "user"
                        ? "bg-primary text-primary-foreground rounded-br-none shadow-lg"
                        : "bg-muted text-foreground rounded-bl-none shadow-md border border-border"
                    }`}
                  >
                    <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                      {message.text}
                    </p>
                    <p
                      className={`text-xs mt-1 ${
                        message.sender === "user"
                          ? "text-primary-foreground/70 text-right"
                          : "text-muted-foreground text-left"
                      }`}
                    >
                      {message.timestamp.toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-2xl rounded-bl-none p-2.5 sm:p-3 shadow-md border border-border">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Questions - Always Accessible */}
            {showQuickQuestions && (
              <div className="px-3 sm:px-4 py-2 sm:py-3 bg-card border-t border-border">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
                    Quick Topics
                  </p>
                  <button
                    onClick={() => setShowQuickQuestions(false)}
                    className="text-xs text-muted-foreground hover:text-primary transition-colors"
                  >
                    Hide
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {quickQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickQuestion(question)}
                      className="text-xs bg-muted hover:bg-primary text-foreground hover:text-primary-foreground px-2.5 sm:px-3 py-2 rounded-lg transition-all duration-200 text-left hover:scale-105 border border-border hover:border-primary"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Show Quick Questions Toggle when hidden */}
            {!showQuickQuestions && (
              <div className="px-3 sm:px-4 py-2 bg-card border-t border-border">
                <button
                  onClick={() => setShowQuickQuestions(true)}
                  className="w-full text-xs text-primary hover:text-primary/80 transition-colors font-medium text-center py-1"
                >
                  Show Quick Topics
                </button>
              </div>
            )}

            {/* Input Area */}
            <div className="p-3 sm:p-4 bg-card border-t border-border rounded-b-2xl">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="flex-1 bg-background text-foreground border border-border rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 focus:outline-none focus:border-primary focus:bg-muted transition-all text-xs sm:text-sm placeholder:text-muted-foreground"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputText.trim()}
                  className="bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed text-primary-foreground p-2 sm:p-2.5 rounded-xl transition-colors shadow-lg hover:shadow-xl flex-shrink-0"
                  aria-label="Send message"
                >
                  <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
