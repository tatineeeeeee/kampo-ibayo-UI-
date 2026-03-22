import { FAQItem } from "./types";

export const FAQ_DATABASE: FAQItem[] = [
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
      "**English:** Refunds depend on cancellation timing: 7+ days before check-in = 100% of down payment refunded, 3-7 days = 50% refunded, less than 3 days = cancellation not allowed. Contact admin for special cases.\n\n**Tagalog:** Ang refund ay depende sa timing ng cancellation: 7+ araw bago check-in = 100% ng down payment, 3-7 araw = 50%, mas mababa sa 3 araw = hindi pwede mag-cancel. Makipag-ugnayan sa admin para sa espesyal na kaso.",
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
      "**English:** Maximum 25 guests. The ₱9,000 package is good for up to 15 guests, and there's an additional ₱300 per extra person.\n\n**Tagalog:** Maximum 25 guests po. Ang ₱9,000 ay para sa 15 katao, at may dagdag na ₱300 bawat ulo kung lalampas.",
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
      "Cancellation is not allowed within 3 days of check-in. Refund tiers: 7+ days before check-in = 100% of down payment refunded, 3-7 days = 50% refunded. Contact the resort directly for emergencies or special circumstances.",
  },
  {
    keywords: ["reschedule", "change date", "move booking", "postpone"],
    question: "Can I reschedule my booking?",
    answer:
      "Yes! You can reschedule up to 2 times per booking, at least 3 days before your check-in date. If the new dates cost more, you'll need to upload a new payment proof for the difference. Subject to availability.",
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
      "Yes! Great for corporate team building and group activities. We have open spaces, function hall, and various activities. Can accommodate up to 25 guests. Contact us for special arrangements.",
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
      "Maximum 25 guests. We have 2 AC family rooms (8 pax each), plus camping area and treehouse. This ensures everyone is comfortable and can enjoy all facilities safely.",
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
      "**English:** Yes! Great for corporate team building and group activities. We have open spaces, function hall, and various activities. Can accommodate up to 25 guests. Contact us for special arrangements.\n\n**Tagalog:** Opo! Napakaganda para sa corporate team building at group activities. May malawak na space, function hall, at iba't ibang activities. Pwede hanggang 25 guests. Makipag-ugnayan sa amin para sa special arrangements.",
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
      "BOOKING: 50% downpayment secures your reservation. CANCELLATION: Not allowed within 3 days of check-in. 7+ days = 100% refund of down payment, 3-7 days = 50% refund. RESCHEDULE: Max 2 times per booking, at least 3 days before check-in. Weather-related cancellations may qualify for free rescheduling!",
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
