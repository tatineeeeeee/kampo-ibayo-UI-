"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { X, Send, Minimize2, MessageCircle } from "lucide-react";

interface Message {
  id: string;
  text: string;
  sender: "user" | "bot";
  timestamp: Date;
  confidence?: number;
  intent?: string;
  entities?: Array<{ type: string; value: string; confidence: number }>;
}

interface FAQItem {
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

interface ChatbotProps {
  onOpenStateChange?: (isOpen: boolean) => void;
}

interface AIContext {
  previousQuestions: string[];
  userPreferences: {
    language: "english" | "tagalog" | "taglish";
    topics_discussed: string[];
    session_start: Date;
  };
  conversation_flow: string[];
}

const FAQ_DATABASE: FAQItem[] = [
  // PRICING & PACKAGES (English & Tagalog)
  {
    keywords: [
      "price",
      "cost",
      "rate",
      "how much",
      "payment",
      "fee",
      "charge",
      "magkano",
      "presyo",
      "bayad",
      "singil",
      "halaga",
      "rates",
      "gastos",
      "bili",
      "kabayaran",
    ],
    question: "What are your rates? / Magkano po ang rate?",
    answer:
      "**English:** The rate is ₱9,000 for 22 hours. Check-in is at 3:00 PM and check-out is at 1:00 PM the next day. The ₱9,000 package is good for up to 15 guests, and there's an additional ₱300 per extra person.\n\n**Tagalog:** Ang rate po ay ₱9,000 para sa 22 oras. Check-in ay 3:00 PM at check-out ay 1:00 PM kinabukasan. Ang ₱9,000 ay para sa 15 katao, at may dagdag na ₱300 bawat ulo kung lalampas.",
  },
  // LOCATION & DIRECTIONS (English & Tagalog)
  {
    keywords: [
      "location",
      "where",
      "address",
      "how to get",
      "directions",
      "saan",
      "nasaan",
      "lokasyon",
      "lugar",
      "daan",
      "paano pumunta",
      "paano makarating",
      "address nyo",
    ],
    question:
      "Where is Kampo Ibayo located? / Saan po matatagpuan ang Kampo Ibayo?",
    answer:
      "**English:** Kampo Ibayo is located at Brgy. Tapia, General Trias, Cavite, near Dali. Once you're nearby, one of our staff members will personally accompany you to the resort.\n\n**Tagalog:** Ang Kampo Ibayo ay matatagpuan sa Brgy. Tapia, General Trias, Cavite, malapit sa Dali. Kapag malapit na po kayo sa lokasyon, sasamahan kayo ng aming staff papunta sa resort.",
  },

  // CHECK-IN & CHECK-OUT TIMES (English & Tagalog)
  {
    keywords: [
      "check in",
      "check out",
      "time",
      "hours",
      "arrival",
      "oras",
      "anong oras",
      "kailan",
      "pasok",
      "labas",
      "open",
      "close",
      "bukas",
      "sarado",
    ],
    question:
      "What are check-in/check-out times? / Anong oras po ang check-in at check-out?",
    answer:
      "**English:** Check-in starts at 3:00 PM and check-out is at 1:00 PM the next day. The total stay is good for 22 hours.\n\n**Tagalog:** Ang check-in po ay 3:00 PM at check-out ay 1:00 PM kinabukasan. Ang stay ay good for 22 oras.",
  },

  // VIDEOKE/KARAOKE (English & Tagalog)
  {
    keywords: [
      "videoke",
      "karaoke",
      "sing",
      "singing",
      "sound",
      "kanta",
      "kumanta",
      "tugtog",
      "music",
      "hanggang anong oras",
      "videoke time",
      "karaoke time",
    ],
    question:
      "Until what time can we use videoke? / Hanggang anong oras po pwedeng gamitin ang videoke?",
    answer:
      "**English:** You can use the videoke until 10:00 PM only to avoid disturbing nearby houses.\n\n**Tagalog:** Ang videoke po ay pwedeng gamitin hanggang 10:00 PM lamang upang hindi makaistorbo sa mga kalapit na bahay.",
  },

  // PETS (English & Tagalog)
  {
    keywords: [
      "pet",
      "aso",
      "cat",
      "dog",
      "allowed",
      "pusa",
      "alaga",
      "hayop",
      "dala",
      "pets",
      "pet friendly",
      "magdala ng aso",
      "pwede ba pet",
      "dalhin ang alaga",
    ],
    question: "Are pets allowed? / Pwede po bang magdala ng alagang hayop?",
    answer:
      "**English:** Yes, Kampo Ibayo is pet-friendly. Guests may bring their pets as long as they're leashed and clean. No additional charges for pets!\n\n**Tagalog:** Opo, pet-friendly po ang Kampo Ibayo. Maaaring magdala ng alaga basta naka-leash at malinis. Walang dagdag na bayad para sa mga alaga!",
  },

  // SWIMMING POOL (English & Tagalog)
  {
    keywords: [
      "pool",
      "swimming",
      "swim",
      "swimming pool",
      "ligo",
      "maligo",
      "tubig",
      "palangoy",
      "may pool ba",
      "swimming pool ba",
      "pwede maligo",
    ],
    question: "Do you have a swimming pool? / May swimming pool po ba?",
    answer:
      "**English:** Yes, we have a clean and well-maintained swimming pool available for all guests. Proper swimwear is required to keep the water clean.\n\n**Tagalog:** Opo, may malinis na swimming pool po kami na puwedeng gamitin ng lahat ng guests. Kailangan po ng tamang swimwear para mapanatiling malinis ang tubig.",
  },

  // ROOMS/ACCOMMODATION (English & Tagalog)
  {
    keywords: [
      "room",
      "bedroom",
      "sleep",
      "accommodation",
      "aircon",
      "kwarto",
      "tulog",
      "matulog",
      "kama",
      "ilan ang kwarto",
      "cottage",
      "may kwarto ba",
    ],
    question:
      "How many rooms are available? / Ilan po ang available na kwarto?",
    answer:
      "**English:** We have two air-conditioned family rooms located near the pool, each can accommodate multiple guests.\n\n**Tagalog:** Mayroon kaming dalawang air-conditioned family rooms na malapit sa pool, na pwedeng matulugan ng maraming tao.",
  },

  // CAMPING (English & Tagalog)
  {
    keywords: [
      "camping",
      "tent",
      "camp",
      "bonfire",
      "tolda",
      "kamping",
      "apoy",
      "campfire",
      "mag-camping",
      "pwede mag bonfire",
      "may camping site ba",
    ],
    question: "Can we go camping? / Pwede po bang mag-camping?",
    answer:
      "**English:** Yes! We have a camping site with an open shower and lounge area. You may also bring your own tent. Bonfires are allowed with staff supervision for safety.\n\n**Tagalog:** Opo! May camping site po kami na may open shower at lounge area. Pwede rin kayong magdala ng sarili ninyong tent. Pinapayagan po ang bonfire basta may kasamang staff para sa kaligtasan.",
  },

  // KITCHEN/COOKING (English & Tagalog)
  {
    keywords: [
      "kitchen",
      "cooking",
      "cook",
      "food preparation",
      "luto",
      "magluto",
      "kusina",
      "ihaw",
      "grill",
    ],
    question: "Can we cook at the resort? / Pwede po bang magluto sa resort?",
    answer:
      "**English:** Yes! We have an open kitchen where guests can cook or grill their own food. Fully equipped with cooking utensils and appliances.\n\n**Tagalog:** Opo! May open kitchen po kami na pwedeng gamitin ng guests para magluto o mag-ihaw. Kumpleto po ng mga gamit sa pagluluto.",
  },

  // DINING AREA/GAZEBO (English & Tagalog)
  {
    keywords: [
      "gazebo",
      "kainan",
      "dining",
      "eating area",
      "kumain",
      "dining area",
    ],
    question: "Do you have a dining area? / May dining area po ba?",
    answer:
      "**English:** Yes, we have a dining gazebo available for guests to enjoy their meals and relax.\n\n**Tagalog:** Opo, may dining gazebo po kami na pwedeng gamitin ng guests habang kumakain at nagrerelax.",
  },

  // TREEHOUSE (English & Tagalog)
  {
    keywords: ["treehouse", "tree house", "puno", "bahay kubo"],
    question: "Do you have a treehouse? / May treehouse po ba?",
    answer:
      "**English:** Yes, we have an electric treehouse where guests can climb and take photos.\n\n**Tagalog:** Opo, mayroon kaming electric treehouse na pwedeng akyatin at pag-selfie-han ng guests.",
  },

  // GAMES/ARCADE (English & Tagalog)
  {
    keywords: [
      "arcade",
      "game",
      "board game",
      "laro",
      "games",
      "entertainment",
      "libangan",
    ],
    question:
      "Do you have games or entertainment? / May mga laro po ba sa resort?",
    answer:
      "**English:** Yes, we have an arcade machine and board games for guests to enjoy.\n\n**Tagalog:** Opo, mayroon kaming arcade machine at board games para sa mga bisita.",
  },

  // BOOKING/RESERVATION (English & Tagalog)
  {
    keywords: [
      "book",
      "booking",
      "reserve",
      "reservation",
      "magpa-reserve",
      "magbook",
      "reserve",
      "kumuha",
    ],
    question: "How can I make a reservation? / Paano po magpa-reserve?",
    answer:
      "**English:** You can book through our website or Facebook page. Only the date can be selected, and you'll need to upload your payment screenshot to confirm the reservation.\n\n**Tagalog:** Maaari po kayong mag-book sa aming website o Facebook page. Petsa lamang po ang maaaring piliin at i-upload ang screenshot ng bayad para makumpirma ang reservation.",
  },

  // PARKING (English & Tagalog)
  {
    keywords: [
      "parking",
      "park",
      "car",
      "vehicle",
      "sasakyan",
      "paradahan",
      "kotse",
    ],
    question: "Do you have parking? / May parking po ba sa resort?",
    answer:
      "**English:** Yes, we offer free parking for guests inside the resort's compound for safety and convenience.\n\n**Tagalog:** Opo, may libreng parking area po kami para sa mga guests. Ligtas at nasa loob ng compound ang parking space.",
  },

  // PAYMENT METHODS (English & Tagalog)
  {
    keywords: [
      "payment",
      "bayad",
      "gcash",
      "maya",
      "mode of payment",
      "paano magbayad",
    ],
    question: "How can we pay? / Paano po ang bayad?",
    answer:
      "**English:** You can pay via GCash or Maya. Just upload a screenshot of your payment on the booking form to confirm your reservation.\n\n**Tagalog:** Maaari po kayong magbayad sa pamamagitan ng GCash o Maya. I-upload lamang po ang screenshot ng bayad sa booking form upang makumpirma ang reservation.",
  },

  // BRINGING FOOD (English & Tagalog)
  {
    keywords: [
      "food",
      "pagkain",
      "baon",
      "magdala ng pagkain",
      "bring food",
      "dala",
      "foods",
    ],
    question:
      "Can we bring our own food? / Pwede po bang magdala ng sariling pagkain?",
    answer:
      "**English:** Yes! You may bring your own food and drinks. We also have an open kitchen if you wish to cook or grill.\n\n**Tagalog:** Opo! Puwede po kayong magdala ng sariling pagkain at inumin. May open kitchen din kami kung gusto ninyong magluto o mag-ihaw.",
  },

  // TOWELS & TOILETRIES (English & Tagalog)
  {
    keywords: [
      "towel",
      "gamit",
      "bring",
      "dalhin",
      "tuwalya",
      "toiletries",
      "sabon",
      "shampoo",
    ],
    question: "Are towels provided? / May tuwalya po ba kayong provided?",
    answer:
      "**English:** Please bring your own towels and toiletries. We don't provide personal items to maintain hygiene standards.\n\n**Tagalog:** Maaari po kayong magdala ng sariling tuwalya at toiletries. Hindi po kami nagbibigay ng personal items para masiguro ang kalinisan.",
  },

  // WEATHER/RAIN (English & Tagalog)
  {
    keywords: ["ulan", "weather", "rainy", "rain", "panahon", "maulan"],
    question: "What if it rains? / Ano po kung umulan?",
    answer:
      "**English:** If it rains on your booking date, your reservation will still continue. You may reschedule depending on date availability.\n\n**Tagalog:** Kung umulan po sa inyong booking date, tuloy pa rin po ang reservation. Maaaring magpa-reschedule depende sa availability ng petsa.",
  },

  // KIDS/CHILDREN (English & Tagalog)
  {
    keywords: ["kids", "bata", "children", "mga bata", "anak", "family"],
    question: "Can we bring kids? / Pwede po bang magdala ng bata?",
    answer:
      "**English:** Yes! Kampo Ibayo is family-friendly. Children must be accompanied by an adult, especially near the pool.\n\n**Tagalog:** Opo! Family-friendly po ang Kampo Ibayo. Ang mga bata ay dapat laging may kasamang magulang lalo na sa pool area.",
  },

  // WIFI/INTERNET (English & Tagalog)
  {
    keywords: ["wifi", "internet", "connection", "signal", "wi-fi", "net"],
    question: "Do you have Wi-Fi? / May Wi-Fi po ba?",
    answer:
      "**English:** Yes, Kampo Ibayo offers free Wi-Fi access for all guests. All major networks also have strong signal in the area.\n\n**Tagalog:** Opo, may libreng Wi-Fi po sa loob ng resort para sa lahat ng guests. Malakas po din ang signal ng mga major networks sa lugar.",
  },

  // CONTACT INFORMATION (English & Tagalog)
  {
    keywords: [
      "contact",
      "phone",
      "email",
      "reach",
      "call",
      "message",
      "tawagan",
      "kontak",
      "facebook",
    ],
    question: "How can I contact you? / Paano po kayo makontak?",
    answer:
      "**English:** You can contact us through our Facebook page Kampo Ibayo, via email at kampoibayo@gmail.com, or by phone at 0966-281-5123.\n\n**Tagalog:** Maaari po kaming makontak sa aming Facebook page na Kampo Ibayo, sa email na kampoibayo@gmail.com, o sa cellphone number na 0966-281-5123.",
  },

  // TABLES & CHAIRS (English & Tagalog)
  {
    keywords: ["tables", "upuan", "chairs", "rent", "mesa", "silya"],
    question: "Are tables and chairs included? / May tables at chairs po ba?",
    answer:
      "**English:** Yes, tables and chairs are already included in your rent. You may also request extras if needed.\n\n**Tagalog:** Opo, may tables at chairs na po kasama sa inyong renta. Maaari rin kayong mag-request kung kailangan ng dagdag.",
  },

  // CLEANING (English & Tagalog)
  {
    keywords: ["clean", "linisin", "trash", "basura", "malinis", "linis"],
    question: "Who cleans after checkout? / Sino po naglilinis?",
    answer:
      "**English:** Guests are encouraged to keep the place clean, but our staff will handle full cleaning after check-out.\n\n**Tagalog:** Ang mga guests po ay hinihikayat na panatilihing malinis ang lugar. May staff po kami na maglilinis pagkatapos ng check-out.",
  },

  // COTTAGES (English & Tagalog)
  {
    keywords: ["cottage", "kubo", "rest area", "pahingahan"],
    question: "Do you have cottages? / May mga cottage po ba?",
    answer:
      "**English:** Yes, we have cottages and resting areas near the pool for guests who want to relax.\n\n**Tagalog:** Opo, may mga kubo at resting area po kami malapit sa pool para sa mga bisitang gusto lang mag-relax.",
  },

  // ELECTRICITY/POWER OUTLETS (English & Tagalog)
  {
    keywords: [
      "electricity",
      "saksakan",
      "power outlet",
      "charge",
      "kuryente",
      "plug",
    ],
    question: "Are there power outlets? / May saksakan po ba?",
    answer:
      "**English:** Yes, there are power outlets available in the open area and inside the rooms for charging devices.\n\n**Tagalog:** Opo, may mga available na saksakan sa open area at sa kwarto para mag-charge ng gadgets.",
  },

  // COMFORT ROOMS/RESTROOMS (English & Tagalog)
  {
    keywords: [
      "cr",
      "comfort room",
      "banyo",
      "restroom",
      "toilet",
      "palikuran",
    ],
    question: "Where are the restrooms? / Nasaan po ang CR?",
    answer:
      "**English:** There's a clean restroom near the pool and another one near the open kitchen.\n\n**Tagalog:** Opo, may malinis na comfort room po malapit sa pool at isa pa malapit sa open kitchen.",
  },

  // REFUND/CANCELLATION (English & Tagalog)
  {
    keywords: ["refund", "cancel", "i-cancel", "cancellation", "policy"],
    question: "Can I get a refund? / Pwede po bang magpa-refund?",
    answer:
      "**English:** Refunds depend on our resort's cancellation policy. Please contact the admin for more information.\n\n**Tagalog:** Ang refund ay depende po sa cancellation policy ng resort. Makipag-ugnayan po sa admin para sa detalye.",
  },

  // CAPACITY & ADDITIONAL GUESTS (English & Tagalog)
  {
    keywords: [
      "capacity",
      "how many",
      "guests",
      "people",
      "maximum",
      "ilan",
      "kasya",
      "tao",
      "dagdag",
    ],
    question: "How many guests maximum? / Ilan po ang maximum na tao?",
    answer:
      "**English:** Maximum 15 guests. The ₱9,000 package is good for up to 15 guests, and there's an additional ₱300 per extra person.\n\n**Tagalog:** Maximum 15 guests po. Ang ₱9,000 ay para sa 15 katao, at may dagdag na ₱300 bawat ulo kung lalampas.",
  },

  // BOOKING PROCESS
  {
    keywords: ["book", "booking", "reserve", "reservation", "how to book"],
    question: "How do I make a booking?",
    answer:
      "Easy! Click 'Book Your Stay' on our homepage, fill in your details, select your dates, and pay the 50% downpayment. You'll receive confirmation via email or text within 24 hours.",
  },
  {
    keywords: [
      "available",
      "availability",
      "vacant",
      "open dates",
      "free dates",
    ],
    question: "How do I check availability?",
    answer:
      "Visit our booking page or call/message us directly at +63 966 281 5123. We can check real-time availability and help you secure your preferred dates.",
  },
  {
    keywords: [
      "payment",
      "downpayment",
      "deposit",
      "how to pay",
      "payment method",
    ],
    question: "What's the payment process?",
    answer:
      "50% downpayment secures your booking (pay via GCash or Maya). The remaining 50% is due at check-in. We'll send payment details after you book.",
  },
  {
    keywords: ["advance", "how far", "book ahead", "reservation time"],
    question: "How far in advance should I book?",
    answer:
      "We recommend booking at least 1-2 weeks in advance, especially for weekends and holidays. Peak season (summer, Holy Week) books up fast, so earlier is better!",
  },

  // CANCELLATION & CHANGES
  {
    keywords: ["cancel", "cancellation", "refund", "cancel booking"],
    question: "What's your cancellation policy?",
    answer:
      "No same-day cancellations allowed. Please provide 48-hour advance notice for changes or cancellations to receive a refund of your downpayment minus processing fee. Last-minute cancellations forfeit the deposit.",
  },
  {
    keywords: ["reschedule", "change date", "move booking", "postpone"],
    question: "Can I reschedule my booking?",
    answer:
      "Yes! Please notify us at least 48 hours before your original date. We'll help you find alternative dates subject to availability. One free reschedule allowed per booking.",
  },
  {
    keywords: ["weather", "rain", "typhoon", "bad weather"],
    question: "What if there's bad weather?",
    answer:
      "Safety first! In case of typhoons or severe weather warnings, we allow free rescheduling. Just contact us and we'll work out new dates together. No penalty for weather-related changes.",
  },

  // AMENITIES & FACILITIES
  {
    keywords: [
      "amenities",
      "facilities",
      "what included",
      "features",
      "what's there",
    ],
    question: "What amenities do you offer?",
    answer:
      "We offer 2 AC family rooms, swimming pool, fully-equipped kitchen, videoke, arcade, camping area with bonfire, treehouse, gazebo, function hall, parking for 8 vehicles, WiFi, and adventure hanging bridge!",
  },
  {
    keywords: ["pool", "swimming", "swim", "swimming pool"],
    question: "Tell me about the swimming pool",
    answer:
      "We have a beautiful swimming pool with poolside lounge area. Perfect for both adults and kids. Open shower area nearby with comfort room. Pool is cleaned regularly and maintained to safety standards.",
  },
  {
    keywords: ["kitchen", "cooking", "cook", "food preparation"],
    question: "Can we cook our own food?",
    answer:
      "Absolutely! We have a fully-equipped kitchen with stove, refrigerator, utensils, and cooking equipment. There's also a grill area for BBQ. We provide the 1st gallon of drinking water free!",
  },
  {
    keywords: ["videoke", "karaoke", "sing", "singing"],
    question: "Do you have videoke/karaoke?",
    answer:
      "Yes! We have videoke and arcade machine for entertainment. Perfect for family fun nights. The function hall/stage area is also great for events and performances.",
  },
  {
    keywords: ["camping", "tent", "camp", "bonfire"],
    question: "Can we go camping?",
    answer:
      "Yes! We have a dedicated camping area with a full-sized campfire spot. Bring your own tent or sleep under the stars. Very popular with families who want the outdoor experience.",
  },
  {
    keywords: ["room", "bedroom", "sleep", "accommodation", "aircon"],
    question: "Tell me about the rooms",
    answer:
      "We have 2 poolside AC family rooms, each can fit 8 people. They're air-conditioned with private bathrooms that have bidet and hot/cold shower. Plus we have a treehouse with electricity for extra space!",
  },

  // LOCATION & DIRECTIONS
  {
    keywords: ["location", "where", "address", "how to get", "directions"],
    question: "Where are you located?",
    answer:
      "We're at 132 Ibayo, Brgy Tapia, General Trias, Cavite 4107. Landmark: Dali Grocery. About 30-45 mins from Manila via CAVITEX. Check the map on our Contact section for exact directions!",
  },
  {
    keywords: ["far", "travel time", "how long", "distance"],
    question: "How far from Manila?",
    answer:
      "About 30-45 minutes via CAVITEX from Manila. We're accessible from major cities: Bacoor (15 mins), Imus (20 mins), Dasmariñas (25 mins). Easy to find with GPS navigation!",
  },
  {
    keywords: ["parking", "park", "car", "vehicle"],
    question: "Is parking available?",
    answer:
      "Yes! We have parking space for up to 8 vehicles. Free parking included in your stay. Your cars are safe and secure within the resort premises.",
  },

  // POLICIES & RULES
  {
    keywords: ["check in", "check out", "time", "hours", "arrival"],
    question: "What are check-in/check-out times?",
    answer:
      "Check-in: 3:00 PM | Check-out: 1:00 PM. You get a full 22 hours of stay! Early check-in or late check-out may be arranged depending on availability (additional fee may apply).",
  },
  {
    keywords: ["pet", "dog", "cat", "animal", "pet-friendly"],
    question: "Are pets allowed?",
    answer:
      "Yes! We're a pet-friendly facility. All furbabies are welcome at Kampo Ibayo. Please ensure they're well-behaved, supervised, and clean up after them. Let us know in advance how many pets.",
  },
  {
    keywords: ["rules", "policy", "allowed", "not allowed", "prohibited"],
    question: "What are your house rules?",
    answer:
      "Respect the property and neighbors, no loud noise after 10 PM, clean up after yourself, supervise children and pets, no smoking inside AC rooms, no illegal activities. Enjoy responsibly!",
  },
  {
    keywords: ["bring", "what to bring", "need", "pack"],
    question: "What should we bring?",
    answer:
      "Bring your food, drinks, personal toiletries, towels, and any special items you need. We provide kitchen equipment, utensils, beddings, and 1st gallon of water. Don't forget swimwear and sunscreen!",
  },
  {
    keywords: ["alcohol", "drink", "liquor", "beer"],
    question: "Can we bring alcohol?",
    answer:
      "Yes, you can bring your own alcoholic beverages. Please drink responsibly and keep noise levels down especially after 10 PM. No selling of alcohol allowed on premises.",
  },

  // SPECIAL OCCASIONS
  {
    keywords: ["birthday", "party", "celebration", "event"],
    question: "Can we host events or parties?",
    answer:
      "Absolutely! Perfect for birthdays, reunions, team building, and celebrations. We have a function hall/stage area and gazebo. Just let us know in advance so we can help you prepare!",
  },
  {
    keywords: ["team building", "company", "corporate", "group"],
    question: "Good for team building?",
    answer:
      "Yes! Great for corporate team building and group activities. We have open spaces, function hall, and various activities. Can accommodate up to 15 guests. Contact us for special arrangements.",
  },

  // CONTACT & SUPPORT
  {
    keywords: ["contact", "phone", "email", "reach", "call", "message"],
    question: "How can I contact you?",
    answer:
      "Contact us at +63 966 281 5123 (call/text), email kampoibayo@gmail.com, or message our Facebook page 'Kampo Ibayo'. We're available 8 AM - 8 PM daily and respond promptly to all inquiries.",
  },
  {
    keywords: ["emergency", "urgent", "help", "problem"],
    question: "What if there's an emergency?",
    answer:
      "Our caretaker is on-site 24/7 during your stay. For emergencies, contact them immediately. We also provide emergency contact numbers upon check-in. Your safety is our priority!",
  },

  // CAPACITY & GUESTS
  {
    keywords: ["capacity", "how many", "guests", "people", "maximum"],
    question: "How many guests can you accommodate?",
    answer:
      "Maximum 15 guests. We have 2 AC family rooms (8 pax each), plus camping area and treehouse. This ensures everyone is comfortable and can enjoy all facilities safely.",
  },
  {
    keywords: ["kids", "children", "toddler", "baby", "family"],
    question: "Is it kid-friendly?",
    answer:
      "Very kid-friendly! Safe swimming pool (adults must supervise), open play areas, arcade games, and nature to explore. Perfect for family bonding. We recommend constant supervision for young children.",
  },

  // ADDITIONAL SERVICES
  {
    keywords: ["wifi", "internet", "connection", "signal"],
    question: "Do you have WiFi?",
    answer:
      "Yes! We provide WiFi access throughout the resort. Perfect for sharing your vacation photos or staying connected. Signal is generally good but remember you're here to unplug and enjoy nature!",
  },
  {
    keywords: ["food", "catering", "restaurant", "meals"],
    question: "Do you serve food?",
    answer:
      "We don't have a restaurant, but our fully-equipped kitchen lets you cook your own meals. Or you can bring pre-cooked food, order delivery, or hire outside catering. Many guests love the BBQ area!",
  },
  {
    keywords: ["grocery", "store", "buy", "nearby"],
    question: "Are there nearby stores?",
    answer:
      "Yes! Dali Grocery is our landmark (very close). There are also sari-sari stores nearby for basics. We recommend bringing most of your supplies, but you can get essentials if needed.",
  },

  // ADDITIONAL TAGALOG ENTRIES

  // ALCOHOL/DRINKS (English & Tagalog)
  {
    keywords: [
      "alcohol",
      "drink",
      "liquor",
      "beer",
      "alak",
      "inumin",
      "serbesa",
      "pwede ba mag-alak",
    ],
    question: "Can we bring alcohol? / Pwede po bang magdala ng alak?",
    answer:
      "**English:** Yes, you can bring your own alcoholic beverages. Please drink responsibly and keep noise levels down especially after 10 PM. No selling of alcohol allowed on premises.\n\n**Tagalog:** Opo, pwedeng magdala ng sariling alak o inumin. Mag-ingat lang sa pag-inom at huwag masyadong maingay lalo na pagkatapos ng 10 PM. Bawal po magbenta ng alak sa loob.",
  },

  // ADVANCE BOOKING (English & Tagalog)
  {
    keywords: [
      "advance",
      "how far",
      "book ahead",
      "reservation time",
      "gaano katagal",
      "maaga ba",
      "ilang araw",
    ],
    question:
      "How far in advance should I book? / Gaano po katagal dapat mag-advance booking?",
    answer:
      "**English:** We recommend booking at least 1-2 weeks in advance, especially for weekends and holidays. Peak season (summer, Holy Week) books up fast, so earlier is better!\n\n**Tagalog:** Inirerekomenda po namin na mag-book ng 1-2 linggo nang maaga, lalo na sa weekends at holidays. Sa peak season (summer, Holy Week) mabilis mapuno, kaya mas maaga mas maganda!",
  },

  // EMERGENCY/HELP (English & Tagalog)
  {
    keywords: [
      "emergency",
      "urgent",
      "help",
      "problem",
      "tulong",
      "emerhensya",
      "may problema",
    ],
    question: "What if there's an emergency? / Paano po kung may emergency?",
    answer:
      "**English:** Our caretaker is on-site 24/7 during your stay. For emergencies, contact them immediately. We also provide emergency contact numbers upon check-in. Your safety is our priority!\n\n**Tagalog:** May caretaker po kami na nandito 24/7 habang nandito kayo. Kung may emergency, makipag-ugnayan agad sa kanila. Bibigay din po namin ang emergency contact numbers sa check-in. Ang inyong kaligtasan ang una naming priority!",
  },

  // GROCERY/NEARBY STORES (English & Tagalog)
  {
    keywords: [
      "grocery",
      "store",
      "buy",
      "nearby",
      "tindahan",
      "malapit na tindahan",
      "bibili",
    ],
    question: "Are there nearby stores? / May malapit ba na tindahan?",
    answer:
      "**English:** Yes! Dali Grocery is our landmark (very close). There are also sari-sari stores nearby for basics. We recommend bringing most of your supplies, but you can get essentials if needed.\n\n**Tagalog:** Opo! Ang Dali Grocery ay malapit lang (landmark po namin yan). May mga sari-sari stores din para sa basic needs. Pero mas maganda kung magdala na kayo ng mga kailangan, pwede lang bumili kung kulang.",
  },

  // TEAM BUILDING (English & Tagalog)
  {
    keywords: [
      "team building",
      "company",
      "corporate",
      "group",
      "team",
      "grupo",
      "kompanya",
    ],
    question: "Good for team building? / Maganda ba para sa team building?",
    answer:
      "**English:** Yes! Great for corporate team building and group activities. We have open spaces, function hall, and various activities. Can accommodate up to 15 guests. Contact us for special arrangements.\n\n**Tagalog:** Opo! Napakaganda para sa corporate team building at group activities. May malawak na space, function hall, at iba't ibang activities. Pwede hanggang 15 guests. Makipag-ugnayan sa amin para sa special arrangements.",
  },

  // COMBINATION QUERIES (for better multi-keyword handling)
  {
    keywords: [
      "pet",
      "cost",
      "bring pets",
      "pets cost",
      "pet fee",
      "pets price",
      "alaga bayad",
      "dagdag bayad sa alaga",
    ],
    question:
      "Can I bring pets and what's the cost? / Pwede magdala ng alaga at magkano?",
    answer:
      "**English:** YES, absolutely! We're completely pet-friendly with NO additional charges for your furbabies! 🐕🐱\n\n• **Pet Policy**: All pets welcome - dogs, cats, and other well-behaved pets\n• **Cost**: FREE - no extra fees for pets!\n• **Requirements**: Just let us know in advance how many pets you're bringing\n• **Guidelines**: Please supervise them and clean up after them\n\nBring your whole family - including the furry members! 🐾\n\n**Tagalog:** OPO, sobrang welcome ang mga alaga! WALANG dagdag na bayad para sa mga furbabies! 🐕🐱\n\n• **Pet Policy**: Lahat ng alaga welcome - aso, pusa, at iba pang mabait na hayop\n• **Bayad**: LIBRE - walang extra fee!\n• **Requirements**: Sabihan lang kami kung ilan ang dadalhin\n• **Guidelines**: Bantayan lang at linisin kung may kalat\n\nDalhin ang buong pamilya - kasama na ang mga furry members! 🐾",
  },
  {
    keywords: ["price", "pet", "additional", "extra cost"],
    question: "Are there additional costs for pets?",
    answer:
      "Great news! We're pet-friendly with NO additional charges for your furbabies. Just let us know in advance how many pets you're bringing so we can prepare. Please ensure they're supervised and well-behaved.",
  },
  {
    keywords: ["booking", "cancellation", "refund", "policy"],
    question: "What's the booking and cancellation policy?",
    answer:
      "BOOKING: 50% downpayment secures your reservation. CANCELLATION: 48-hour advance notice required for refunds (minus processing fee). Same-day cancellations forfeit the deposit. Weather-related cancellations are free to reschedule!",
  },
  {
    keywords: ["pool", "safety", "kids", "children", "supervision"],
    question: "Is the pool safe for children?",
    answer:
      "Yes! Our pool is family-friendly, but adult supervision is REQUIRED at all times for children. We have open shower areas and comfort rooms nearby. Pool depth varies, so please watch young children closely.",
  },
  {
    keywords: ["kitchen", "cooking", "utensils", "equipment"],
    question: "What cooking facilities and equipment do you provide?",
    answer:
      "FULLY EQUIPPED KITCHEN: Stove, refrigerator, cooking utensils, plates, cups, and basic cookware. OUTDOOR: BBQ grill area for outdoor cooking. We provide 1st gallon of drinking water FREE. Just bring your food and ingredients!",
  },
];

const GREETING_MESSAGES = [
  "Hello! I'm your Kampo Ibayo assistant. I'm here to help you with any questions about our resort. What would you like to know?",
  "Welcome to Kampo Ibayo! How can I assist you with your booking or resort inquiries today?",
  "Greetings! I'm here to help you learn more about Kampo Ibayo resort and assist with your booking needs.",
];

// Safety constants
const MAX_MESSAGES = 50; // Prevent memory bloat
const MAX_INPUT_LENGTH = 500; // Prevent extremely long inputs

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

  // Debug session analytics
  useEffect(() => {
    if (sessionAnalytics.questionsAnswered > 0) {
      console.log("🤖 AI Session Analytics:", sessionAnalytics);
    }
  }, [sessionAnalytics]);

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

    console.log("🤖 AI Analysis:", {
      detectedLanguage,
      intent: intentAnalysis.intent,
      confidence: intentAnalysis.confidence,
      entities: intentAnalysis.entities,
    });

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
     * - Limits input length to MAX_INPUT_LENGTH to prevent DoS attacks
     * - Prevents XSS by treating input as plain text (React auto-escapes)
     */
    const sanitizedInput = inputText.trim().slice(0, MAX_INPUT_LENGTH);
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
      return newMessages.length > MAX_MESSAGES
        ? newMessages.slice(-MAX_MESSAGES)
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
          return newMessages.length > MAX_MESSAGES
            ? newMessages.slice(-MAX_MESSAGES)
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
              return newMessages.length > MAX_MESSAGES
                ? newMessages.slice(-MAX_MESSAGES)
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
          return newMessages.length > MAX_MESSAGES
            ? newMessages.slice(-MAX_MESSAGES)
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
    <div
      className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 transition-all duration-300 
      ${isMinimized ? "w-72 sm:w-80" : "w-full sm:w-96"} 
      ${isMinimized ? "" : "max-w-[calc(100vw-2rem)] sm:max-w-none"}
      ${isMinimized ? "" : "left-4 sm:left-auto"}`}
    >
      {/* Chat Window */}
      <div
        className={`bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl border border-gray-700 flex flex-col transition-all duration-300 
        ${isMinimized ? "h-14 sm:h-16" : "h-[70vh] sm:h-[600px] max-h-[600px]"} 
        overflow-hidden`}
      >
        {/* Header - Different styles for minimized vs expanded */}
        <div
          className={`bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-between text-white transition-all duration-300 
          ${
            isMinimized
              ? "h-full p-2 sm:p-3 rounded-2xl"
              : "p-3 sm:p-4 rounded-t-2xl border-b border-gray-700"
          }`}
        >
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="relative flex-shrink-0">
              <div
                className={`bg-red-500/20 rounded-lg flex items-center justify-center text-xl group-hover:scale-110 transition-transform 
                ${
                  isMinimized
                    ? "w-6 h-6 sm:w-8 sm:h-8"
                    : "w-8 h-8 sm:w-10 sm:h-10"
                }`}
              >
                <MessageCircle
                  className={`text-red-400 ${
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
                <p className="text-xs text-red-100 truncate">
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
              className="text-white hover:bg-red-800 p-1 sm:p-1.5 rounded-lg transition-colors"
              aria-label={isMinimized ? "Maximize" : "Minimize"}
            >
              <Minimize2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={() => setChatbotOpen(false)}
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
                  className={`flex ${
                    message.sender === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-2.5 sm:p-3 ${
                      message.sender === "user"
                        ? "bg-red-600 text-white rounded-br-none shadow-lg"
                        : "bg-gray-700 text-gray-100 rounded-bl-none shadow-md border border-gray-600"
                    }`}
                  >
                    <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-line">
                      {message.text}
                    </p>
                    <p
                      className={`text-xs mt-1 ${
                        message.sender === "user"
                          ? "text-red-100 text-right"
                          : "text-gray-400 text-left"
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
                  <div className="bg-gray-700 rounded-2xl rounded-bl-none p-2.5 sm:p-3 shadow-md border border-gray-600">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.1s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
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
              <div className="px-3 sm:px-4 py-2 sm:py-3 bg-gray-800 border-t border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-gray-400 uppercase tracking-wider font-medium">
                    Quick Topics
                  </p>
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
