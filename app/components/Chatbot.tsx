"use client";

import { useState, useRef, useEffect } from "react";
import { X, Send, Minimize2, MessageCircle } from "lucide-react";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
}

interface FAQItem {
  keywords: string[];
  question: string;
  answer: string;
}

const FAQ_DATABASE: FAQItem[] = [
  // PRICING & PACKAGES
  {
    keywords: ["price", "cost", "rate", "how much", "payment", "fee", "charge"],
    question: "What are your rates?",
    answer: "Our rates are ₱9,000 for 22 hours (Mon-Thu) with a ₱3,000 discount, and ₱12,000 for weekends/holidays (Fri-Sun). This includes accommodation for up to 15 guests with all amenities included."
  },
  {
    keywords: ["inclusive", "included", "what's in", "package includes"],
    question: "What's included in the rate?",
    answer: "Everything! 2 AC family rooms, swimming pool, kitchen with appliances, videoke, arcade, camping area, treehouse, WiFi, parking for 8 vehicles, and 1st gallon of water FREE. Just bring food and personal items."
  },
  {
    keywords: ["extra", "additional", "exceed", "more than 15", "additional guest"],
    question: "Can we bring more than 15 guests?",
    answer: "15 guests is our maximum capacity for safety and comfort. This ensures everyone can enjoy the facilities comfortably. Please stick to the guest limit in your booking."
  },
  
  // BOOKING PROCESS
  {
    keywords: ["book", "booking", "reserve", "reservation", "how to book"],
    question: "How do I make a booking?",
    answer: "Easy! Click 'Book Your Stay' on our homepage, fill in your details, select your dates, and pay the 50% downpayment. You'll receive confirmation via email or text within 24 hours."
  },
  {
    keywords: ["available", "availability", "vacant", "open dates", "free dates"],
    question: "How do I check availability?",
    answer: "Visit our booking page or call/message us directly at +63 945 277 9541. We can check real-time availability and help you secure your preferred dates."
  },
  {
    keywords: ["payment", "downpayment", "deposit", "how to pay", "payment method"],
    question: "What's the payment process?",
    answer: "50% downpayment secures your booking (pay via GCash, bank transfer, or other methods we'll provide). The remaining 50% is due at check-in. We'll send payment details after you book."
  },
  {
    keywords: ["advance", "how far", "book ahead", "reservation time"],
    question: "How far in advance should I book?",
    answer: "We recommend booking at least 1-2 weeks in advance, especially for weekends and holidays. Peak season (summer, Holy Week) books up fast, so earlier is better!"
  },
  
  // CANCELLATION & CHANGES
  {
    keywords: ["cancel", "cancellation", "refund", "cancel booking"],
    question: "What's your cancellation policy?",
    answer: "No same-day cancellations allowed. Please provide 48-hour advance notice for changes or cancellations to receive a refund of your downpayment minus processing fee. Last-minute cancellations forfeit the deposit."
  },
  {
    keywords: ["reschedule", "change date", "move booking", "postpone"],
    question: "Can I reschedule my booking?",
    answer: "Yes! Please notify us at least 48 hours before your original date. We'll help you find alternative dates subject to availability. One free reschedule allowed per booking."
  },
  {
    keywords: ["weather", "rain", "typhoon", "bad weather"],
    question: "What if there's bad weather?",
    answer: "Safety first! In case of typhoons or severe weather warnings, we allow free rescheduling. Just contact us and we'll work out new dates together. No penalty for weather-related changes."
  },
  
  // AMENITIES & FACILITIES
  {
    keywords: ["amenities", "facilities", "what included", "features", "what's there"],
    question: "What amenities do you offer?",
    answer: "We offer 2 AC family rooms, swimming pool, fully-equipped kitchen, videoke, arcade, camping area with bonfire, treehouse, gazebo, function hall, parking for 8 vehicles, WiFi, and adventure hanging bridge!"
  },
  {
    keywords: ["pool", "swimming", "swim", "swimming pool"],
    question: "Tell me about the swimming pool",
    answer: "We have a beautiful swimming pool with poolside lounge area. Perfect for both adults and kids. Open shower area nearby with comfort room. Pool is cleaned regularly and maintained to safety standards."
  },
  {
    keywords: ["kitchen", "cooking", "cook", "food preparation"],
    question: "Can we cook our own food?",
    answer: "Absolutely! We have a fully-equipped kitchen with stove, refrigerator, utensils, and cooking equipment. There's also a grill area for BBQ. We provide the 1st gallon of drinking water free!"
  },
  {
    keywords: ["videoke", "karaoke", "sing", "singing"],
    question: "Do you have videoke/karaoke?",
    answer: "Yes! We have videoke and arcade machine for entertainment. Perfect for family fun nights. The function hall/stage area is also great for events and performances."
  },
  {
    keywords: ["camping", "tent", "camp", "bonfire"],
    question: "Can we go camping?",
    answer: "Yes! We have a dedicated camping area with a full-sized campfire spot. Bring your own tent or sleep under the stars. Very popular with families who want the outdoor experience."
  },
  {
    keywords: ["room", "bedroom", "sleep", "accommodation", "aircon"],
    question: "Tell me about the rooms",
    answer: "We have 2 poolside AC family rooms, each can fit 8 people. They're air-conditioned with private bathrooms that have bidet and hot/cold shower. Plus we have a treehouse with electricity for extra space!"
  },
  
  // LOCATION & DIRECTIONS
  {
    keywords: ["location", "where", "address", "how to get", "directions"],
    question: "Where are you located?",
    answer: "We're at 132 Ibayo, Brgy Tapia, General Trias, Cavite 4107. Landmark: Dali Grocery. About 30-45 mins from Manila via CAVITEX. Check the map on our Contact section for exact directions!"
  },
  {
    keywords: ["far", "travel time", "how long", "distance"],
    question: "How far from Manila?",
    answer: "About 30-45 minutes via CAVITEX from Manila. We're accessible from major cities: Bacoor (15 mins), Imus (20 mins), Dasmariñas (25 mins). Easy to find with GPS navigation!"
  },
  {
    keywords: ["parking", "park", "car", "vehicle"],
    question: "Is parking available?",
    answer: "Yes! We have parking space for up to 8 vehicles. Free parking included in your stay. Your cars are safe and secure within the resort premises."
  },
  
  // POLICIES & RULES
  {
    keywords: ["check in", "check out", "time", "hours", "arrival"],
    question: "What are check-in/check-out times?",
    answer: "Check-in: 2:00 PM | Check-out: 12:00 NN. You get a full 22 hours of stay! Early check-in or late check-out may be arranged depending on availability (additional fee may apply)."
  },
  {
    keywords: ["pet", "dog", "cat", "animal", "pet-friendly"],
    question: "Are pets allowed?",
    answer: "Yes! We're a pet-friendly facility. All furbabies are welcome at Kampo Ibayo. Please ensure they're well-behaved, supervised, and clean up after them. Let us know in advance how many pets."
  },
  {
    keywords: ["rules", "policy", "allowed", "not allowed", "prohibited"],
    question: "What are your house rules?",
    answer: "Respect the property and neighbors, no loud noise after 10 PM, clean up after yourself, supervise children and pets, no smoking inside AC rooms, no illegal activities. Enjoy responsibly!"
  },
  {
    keywords: ["bring", "what to bring", "need", "pack"],
    question: "What should we bring?",
    answer: "Bring your food, drinks, personal toiletries, towels, and any special items you need. We provide kitchen equipment, utensils, beddings, and 1st gallon of water. Don't forget swimwear and sunscreen!"
  },
  {
    keywords: ["alcohol", "drink", "liquor", "beer"],
    question: "Can we bring alcohol?",
    answer: "Yes, you can bring your own alcoholic beverages. Please drink responsibly and keep noise levels down especially after 10 PM. No selling of alcohol allowed on premises."
  },
  
  // SPECIAL OCCASIONS
  {
    keywords: ["birthday", "party", "celebration", "event"],
    question: "Can we host events or parties?",
    answer: "Absolutely! Perfect for birthdays, reunions, team building, and celebrations. We have a function hall/stage area and gazebo. Just let us know in advance so we can help you prepare!"
  },
  {
    keywords: ["team building", "company", "corporate", "group"],
    question: "Good for team building?",
    answer: "Yes! Great for corporate team building and group activities. We have open spaces, function hall, and various activities. Can accommodate up to 15 guests. Contact us for special arrangements."
  },
  
  // CONTACT & SUPPORT
  {
    keywords: ["contact", "phone", "email", "reach", "call", "message"],
    question: "How can I contact you?",
    answer: "Contact us at +63 945 277 9541 (call/text), email kampoibayo@gmail.com, or message our Facebook page 'Kampo Ibayo'. We're available 8 AM - 8 PM daily and respond promptly to all inquiries."
  },
  {
    keywords: ["emergency", "urgent", "help", "problem"],
    question: "What if there's an emergency?",
    answer: "Our caretaker is on-site 24/7 during your stay. For emergencies, contact them immediately. We also provide emergency contact numbers upon check-in. Your safety is our priority!"
  },
  
  // CAPACITY & GUESTS
  {
    keywords: ["capacity", "how many", "guests", "people", "maximum"],
    question: "How many guests can you accommodate?",
    answer: "Maximum 15 guests. We have 2 AC family rooms (8 pax each), plus camping area and treehouse. This ensures everyone is comfortable and can enjoy all facilities safely."
  },
  {
    keywords: ["kids", "children", "toddler", "baby", "family"],
    question: "Is it kid-friendly?",
    answer: "Very kid-friendly! Safe swimming pool (adults must supervise), open play areas, arcade games, and nature to explore. Perfect for family bonding. We recommend constant supervision for young children."
  },
  
  // ADDITIONAL SERVICES
  {
    keywords: ["wifi", "internet", "connection", "signal"],
    question: "Do you have WiFi?",
    answer: "Yes! We provide WiFi access throughout the resort. Perfect for sharing your vacation photos or staying connected. Signal is generally good but remember you're here to unplug and enjoy nature!"
  },
  {
    keywords: ["food", "catering", "restaurant", "meals"],
    question: "Do you serve food?",
    answer: "We don't have a restaurant, but our fully-equipped kitchen lets you cook your own meals. Or you can bring pre-cooked food, order delivery, or hire outside catering. Many guests love the BBQ area!"
  },
  {
    keywords: ["grocery", "store", "buy", "nearby"],
    question: "Are there nearby stores?",
    answer: "Yes! Dali Grocery is our landmark (very close). There are also sari-sari stores nearby for basics. We recommend bringing most of your supplies, but you can get essentials if needed."
  }
];

const GREETING_MESSAGES = [
  "Hello! I'm your Kampo Ibayo assistant. I'm here to help you with any questions about our resort. What would you like to know?",
  "Welcome to Kampo Ibayo! How can I assist you with your booking or resort inquiries today?",
  "Greetings! I'm here to help you learn more about Kampo Ibayo resort and assist with your booking needs."
];

const HELP_MESSAGE = `I can assist you with the following topics:

📋 Booking & Reservations
💰 Pricing & Packages  
🏊 Amenities & Facilities
📍 Location & Directions
📅 Cancellation & Rescheduling
🐕 Pet Policy
📝 House Rules & Guidelines
🎉 Events & Parties
📞 Contact Information

Feel free to ask me anything about Kampo Ibayo Resort, or select from the quick questions below for instant answers.`;

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showQuickQuestions, setShowQuickQuestions] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Send initial greeting
      const greeting: Message = {
        id: Date.now().toString(),
        text: GREETING_MESSAGES[Math.floor(Math.random() * GREETING_MESSAGES.length)],
        sender: "bot",
        timestamp: new Date()
      };
      setMessages([greeting]);
    }
  }, [isOpen, messages.length]);

  const findBestAnswer = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    // Check for greetings
    if (/(hi|hello|hey|good morning|good afternoon)/i.test(userMessage)) {
      return "Hello! How can I help you today? You can ask me about our rates, amenities, booking process, location, or any other questions about Kampo Ibayo.";
    }

    // Check for help requests
    if (/(help|what can you|topics|menu|options|categories)/i.test(userMessage)) {
      return HELP_MESSAGE;
    }

    // Find matching FAQ
    let bestMatch: FAQItem | undefined;
    let maxMatches = 0;

    FAQ_DATABASE.forEach(faq => {
      const matches = faq.keywords.filter(keyword => 
        lowerMessage.includes(keyword.toLowerCase())
      ).length;

      if (matches > maxMatches) {
        maxMatches = matches;
        bestMatch = faq;
      }
    });

    if (bestMatch && maxMatches > 0) {
      return bestMatch.answer;
    }

    // Default response
    return `I apologize, but I don't have specific information about that topic. However, I can help you with:

📋 Resort rates and packages
🏊 Amenities and facilities  
📍 Location and directions
📅 Booking and availability
📞 Contact information

For detailed inquiries beyond my knowledge, please contact us directly:
• Phone: +63 945 277 9541
• Email: kampoibayo@gmail.com

Is there anything else about Kampo Ibayo I can help you with?`;
  };

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: "user",
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputText;
    setInputText("");
    setIsTyping(true);

    // Simulate bot typing and response
    setTimeout(() => {
      const botAnswer = findBestAnswer(currentInput);
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: botAnswer,
        sender: "bot",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);

      // If bot couldn't answer well, show quick questions again
      if (botAnswer.includes("I'm not sure about that specific question")) {
        setTimeout(() => {
          const helpMessage: Message = {
            id: (Date.now() + 2).toString(),
            text: "Here are some topics I can definitely help with:",
            sender: "bot",
            timestamp: new Date()
          };
          setMessages(prev => [...prev, helpMessage]);
        }, 1000);
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
    "Where are you located?"
  ];

  const handleQuickQuestion = (question: string) => {
    setInputText(question);
    setTimeout(() => handleSendMessage(), 100);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 bg-red-600 hover:bg-red-700 text-white h-12 w-12 sm:h-14 sm:w-14 flex items-center justify-center rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-110 group border border-red-500 hover:border-red-400"
        aria-label="Open chat"
      >
          <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6" />
          {/* Online status indicator */}
          <span className="absolute -top-1 -right-1 w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded-full animate-pulse"></span>
          {/* Help tooltip - hide on mobile */}
          <div className="hidden sm:block absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-800 border border-gray-600 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap shadow-lg">
            Need help? Ask me anything!
            <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800"></div>
          </div>
        </button>
    );
  }

  return (
    <div className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 transition-all duration-300 
      ${isMinimized ? 'w-72 sm:w-80' : 'w-full sm:w-96'} 
      ${isMinimized ? '' : 'max-w-[calc(100vw-2rem)] sm:max-w-none'}
      ${isMinimized ? '' : 'left-4 sm:left-auto'}`}>
      {/* Chat Window */}
      <div className={`bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl border border-gray-700 flex flex-col transition-all duration-300 
        ${isMinimized ? 'h-14 sm:h-16' : 'h-[70vh] sm:h-[600px] max-h-[600px]'} 
        overflow-hidden`}>
        {/* Header - Different styles for minimized vs expanded */}
        <div className={`bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-between text-white transition-all duration-300 
          ${isMinimized ? 'h-full p-2 sm:p-3 rounded-2xl' : 'p-3 sm:p-4 rounded-t-2xl border-b border-gray-700'}`}>
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="relative flex-shrink-0">
              <div className={`bg-red-500/20 rounded-lg flex items-center justify-center text-xl group-hover:scale-110 transition-transform 
                ${isMinimized ? 'w-6 h-6 sm:w-8 sm:h-8' : 'w-8 h-8 sm:w-10 sm:h-10'}`}>
                <MessageCircle className={`text-red-400 ${isMinimized ? 'w-3 h-3 sm:w-4 sm:h-4' : 'w-4 h-4 sm:w-5 sm:h-5'}`} />
              </div>
              <span className={`absolute bg-green-500 rounded-full 
                ${isMinimized ? 'bottom-0 right-0 w-2 h-2 sm:w-2.5 sm:h-2.5' : 'bottom-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3'}`}></span>
            </div>
            {!isMinimized && (
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-white text-sm sm:text-base truncate">Kampo Ibayo Assistant</h3>
                <p className="text-xs text-red-100 truncate">Online • {FAQ_DATABASE.length}+ answers ready</p>
              </div>
            )}
            {isMinimized && (
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-white text-xs sm:text-sm truncate">Assistant</h3>
                <p className="text-xs text-green-400 truncate">Online</p>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="text-white hover:bg-red-800 p-1 sm:p-1.5 rounded-lg transition-colors"
              aria-label={isMinimized ? "Maximize" : "Minimize"}
            >
              <Minimize2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-red-800 p-1 sm:p-1.5 rounded-lg transition-colors"
              aria-label="Close chat"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 bg-gray-800">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-2.5 sm:p-3 ${
                      message.sender === "user"
                        ? "bg-red-600 text-white rounded-br-none shadow-lg"
                        : "bg-gray-700 text-gray-100 rounded-bl-none shadow-md border border-gray-600"
                    }`}
                  >
                    <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-line">{message.text}</p>
                    <p className={`text-xs mt-1 ${
                      message.sender === "user" 
                        ? "text-red-100 text-right" 
                        : "text-gray-400 text-left"
                    }`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-700 rounded-2xl rounded-bl-none p-2.5 sm:p-3 shadow-md border border-gray-600">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Questions - Always Accessible */}
            {showQuickQuestions && (
              <div className="px-3 sm:px-4 py-2 sm:py-3 bg-gray-800 border-t border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">Quick Topics</p>
                  <button 
                    onClick={() => setShowQuickQuestions(false)}
                    className="text-xs text-gray-400 hover:text-red-400 transition-colors"
                  >
                    Hide
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {quickQuestions.map((question, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickQuestion(question)}
                      className="text-xs bg-gray-700 hover:bg-red-600 text-gray-200 hover:text-white px-2.5 sm:px-3 py-2 rounded-lg transition-all duration-200 text-left hover:scale-105 border border-gray-600 hover:border-red-600"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Show Quick Questions Toggle when hidden */}
            {!showQuickQuestions && (
              <div className="px-3 sm:px-4 py-2 bg-gray-800 border-t border-gray-700">
                <button 
                  onClick={() => setShowQuickQuestions(true)}
                  className="w-full text-xs text-red-400 hover:text-red-300 transition-colors font-medium text-center py-1"
                >
                  Show Quick Topics
                </button>
              </div>
            )}

            {/* Input Area */}
            <div className="p-3 sm:p-4 bg-gradient-to-br from-gray-800 to-gray-900 border-t border-gray-700 rounded-b-2xl">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="flex-1 bg-gray-800 text-white border border-gray-600 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 focus:outline-none focus:border-red-500 focus:bg-gray-700 transition-all text-xs sm:text-sm placeholder-gray-400"
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputText.trim()}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white p-2 sm:p-2.5 rounded-xl transition-colors shadow-lg hover:shadow-xl flex-shrink-0"
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
