export interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
  confidence?: number;
  intent?: string;
  entities?: Array<{ type: string; value: string; confidence: number }>;
}

export interface FAQItem {
  keywords: string[];
  question: string;
  answer: string;
  // AI-enhanced metadata (optional for backward compatibility)
  category?: string;
  priority?: number;
  variations?: string[];
  context_patterns?: string[];
  intent?: string;
}

export interface ChatbotProps {
  onOpenStateChange?: (isOpen: boolean) => void;
}

export interface AIContext {
  previousQuestions: string[];
  userPreferences: {
    language: "english" | "tagalog" | "taglish";
    topics_discussed: string[];
    session_start: Date;
  };
  conversation_flow: string[];
}
