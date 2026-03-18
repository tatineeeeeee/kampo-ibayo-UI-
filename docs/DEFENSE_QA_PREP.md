# KAMPO IBAYO RESORT BOOKING SYSTEM — Final Defense Q&A Prep

## System Overview (Quick Reference)
- **Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4
- **Database:** Supabase (PostgreSQL) — 7 tables, 1 view, 2 RPC functions
- **Auth:** Supabase Auth (bcrypt + JWT RS256)
- **Payments:** PayMongo (GCash/card) + Manual payment proof upload
- **Email:** Gmail SMTP via Nodemailer (STARTTLS, AES-256)
- **SMS:** SMSGate
- **OCR:** Tesseract.js (payment proof verification)
- **Hosting:** Vercel

---

## Question 1: "Anong database ang ginamit niyo at bakit niyo pinili over MySQL or MongoDB?"

### Answer:
Ginamit po namin ang **Supabase**, which is a Backend-as-a-Service platform na naka-built on top ng **PostgreSQL**, isang relational database.

Pinili po namin ang relational database kasi yung data namin ay may clear relationships — ang users may bookings, ang bookings may payment proofs, may reviews — so relational database talaga ang best fit para sa system namin.

Pinili namin ang Supabase over raw PostgreSQL kasi may built-in na siyang features na kailangan namin:
- **Authentication** na gumagamit ng bcrypt para sa password hashing
- **Row-Level Security (RLS)** para protected yung data per user
- **File Storage** para sa gallery images at payment proofs
- **Auto-generated API endpoints** — na-reduce niya yung development time namin

Hindi po namin pinili ang **MongoDB** kasi NoSQL siya — document-based, walang strict relationships, mag-le-lead lang sa data duplication at inconsistency. Hindi rin namin pinili ang **MySQL** kasi yung PostgreSQL ay may mas advanced features like RLS at JSON support, at Supabase ay PostgreSQL lang ang sinusupport.

### Key Terms:
- **Supabase** = Backend-as-a-Service (BaaS) platform
- **PostgreSQL** = yung actual relational database engine
- **Relational Database** = data organized in tables with relationships via foreign keys
- **NoSQL (MongoDB)** = document-based, walang strict table structure

---

## Question 2: "Ano yung Row-Level Security at paano niyo ginamit?"

### Answer:
Ang Row-Level Security po, or RLS, ay isang security feature ng **PostgreSQL** na naka-enforce directly sa **database level**. Meaning, kahit may access ka sa database, yung makukuha mo lang na data ay yung mga rows na **authorized ka** i-access.

Halimbawa po, pag nag-query ang isang user ng bookings, hindi niya makikita yung bookings ng ibang users — ang mare-return lang sa kanya ay yung **sarili niyang bookings**. Naka-filter na siya sa database mismo, hindi lang sa code namin.

Ito po ay important kasi **kahit may bug sa application code namin**, hindi pa rin ma-le-leak yung data ng ibang users kasi ang database mismo ang nagbo-block. It's like a **second layer of protection**.

Sa system namin, dalawa po ang klase ng access:
- **Anon Key** — ginagamit ng regular users, naka-subject sa RLS policies
- **Service Role Key** — ginagamit ng admin API routes, nagba-bypass ng RLS para ma-access lahat ng data na kailangan for admin operations

### Key Terms:
- **RLS** = database-level filtering, per-row ang protection
- **Anon Key** = restricted access, may RLS
- **Service Role Key** = full access, bypasses RLS (admin only)
- **Different from role-based access** = RLS is sa database level, role-based access is sa page/route level

---

## Question 3: "Naka-normalize ba yung database niyo? Explain First, Second, and Third Normal Form."

### Answer:
Opo, ang database namin po ay naka-follow sa **Third Normal Form**.

**Para sa 1NF (First Normal Form)** — lahat ng columns namin ay atomic, isang value lang per cell. Halimbawa, instead na i-store ang multiple dates sa isang column ng bookings, gumawa po kami ng separate na **`booking_dates` table** — isa-isang row per date. Ganun din sa `review_photos` — separate table po siya para sa mga photos ng isang review, hindi namin dinagsak lahat ng photo URLs sa isang column.

**Para sa 2NF (Second Normal Form)** — lahat ng tables namin ay gumagamit ng **single-column primary key** (`id`), kaya walang partial dependency. Lahat ng attributes sa bawat table ay fully dependent sa primary key niya. Halimbawa sa `bookings` — ang `guest_name`, `total_amount`, `status` — lahat depende sa `bookings.id`.

**Para sa 3NF (Third Normal Form)** — ina-avoid namin ang transitive dependencies sa pamamagitan ng **foreign keys**. Halimbawa, sa bookings table, hindi namin dini-duplicate yung user's full name or email — naka-store lang po ang `user_id` as foreign key, tapos kapag kailangan ang user info, i-join na lang namin sa users table.

Ang exception lang po ay yung `guest_name` at `guest_email` sa bookings table — ito po ay **intentional denormalization** para sa walk-in guests na walang account, at para ma-preserve ang booking records kahit mag-delete ng account ang user.

### Key Terms:
- **1NF** = atomic values, no repeating groups (booking_dates, review_photos = separate tables)
- **2NF** = no partial dependency (single PK sa lahat ng tables = automatic 2NF)
- **3NF** = no transitive dependency (foreign keys instead of duplicating data)
- **Denormalization** = intentional breaking of normalization for practical reasons

---

## Question 4: "Anong encryption ang ginagamit niyo para sa passwords, at paano niyo ini-implement?"

### Answer:
Para sa password encryption po, gumagamit kami ng **bcrypt with salt**, na handled po ng **Supabase Auth** — hindi po namin manually ini-implement sa code namin.

Ang bcrypt po ay isang **hashing algorithm** — meaning one-way po siya, irreversible. Kapag nag-register ang user, yung password niya ay dina-dagdagan ng **salt**, isang random string, tapos hina-hash — nag-produce po siya ng irreversible na string na yun lang ang naka-store sa database.

So kahit kami as developers, o kahit ma-breach yung database, **walang makakakita ng actual password** — hash lang po ang nandun. Kapag nag-login ang user, hina-hash ulit yung input niya at cini-compare sa stored hash — kung match, valid yung password.

Ang reason po na bcrypt ang pinili ng Supabase is kasi may built-in siyang **cost factor** — pwede i-adjust kung gaano ka-slow yung hashing, para ma-prevent ang brute force attacks. Mas mabagal mag-hash, mas mahirap i-crack.

### Encryption Summary Table:

| Layer | Encryption Used | Purpose |
|---|---|---|
| **Passwords** | bcrypt with salt (hashing) | One-way hash, hindi na ma-reverse |
| **Session Tokens** | JWT signed with RS256 (RSA + SHA-256) | Para ma-verify kung legit yung session |
| **Data in Transit** | TLS/HTTPS (AES-256) | Lahat ng API calls encrypted |
| **Email** | STARTTLS (AES-256) | Gmail SMTP encrypted |

### Key Terms:
- **Hashing** = one-way conversion, hindi na ma-reverse back to original
- **Salt** = random string na idinadagdag para unique ang bawat hash kahit same password
- **bcrypt** = hashing algorithm na may adjustable cost/slowness
- **Cost Factor** = controls kung gaano ka-slow ang hashing (anti-brute force)
- **JWT (RS256)** = JSON Web Token signed with RSA + SHA-256

---

## Question 5: "Walk us through the flow — from booking to database."

### Answer:
I-wa-walk through ko po yung complete flow:

**Step 1 — Authentication:**
Kapag pinindot ng user ang Book Now, chi-ne-check muna ng system kung naka-login siya. Kung hindi pa, iri-redirect siya sa auth page. Dun siya mag-sign up — ang Supabase Auth po ang magha-hash ng password niya gamit bcrypt, tapos magse-send ng verification email. Kapag na-verify, maglo-login siya at mag-ge-generate ng **JWT token** na gagamitin sa lahat ng succeeding requests.

**Step 2 — Date Selection:**
Sa booking page, naglo-load yung **availability calendar** — nag-qu-query po ito sa `booking_dates` table para makita kung anong dates ang available. Pipili yung user ng check-in at check-out date, number of guests, at kung may pet.

**Step 3 — Booking Creation:**
Kapag nag-submit siya, may API call na mangyayari — i-va-validate muna yung JWT token sa server gamit ang `validateAuth()` function namin, tapos mag-i-INSERT sa **`bookings` table** with status na `pending`, at mag-i-INSERT din sa **`booking_dates` table** para sa bawat date ng stay niya.

**Step 4 — Payment:**
May dalawang option po:
- **PayMongo** for online payment (GCash, card) — ige-generate ng payment intent at ita-track sa bookings table yung `payment_intent_id`
- **Manual Upload** ng payment proof — mag-i-INSERT sa **`payment_proofs` table** yung image URL, reference number, at amount, with status na `pending`

**Step 5 — Admin Review:**
Yung admin po, makikita niya sa dashboard yung pending bookings at payment proofs. Pag na-verify niya, mag-u-UPDATE ng status sa `bookings` table to `confirmed` at sa `payment_proofs` table to `verified`.

**Step 6 — Notifications:**
After confirmation, automatic na magse-send ng **confirmation email** via Gmail SMTP at **SMS** via SMSGate sa user na na-confirm na yung booking niya.

### Visual Flow:
```
User clicks Book Now
    |
Not logged in? --> Auth page --> Sign up --> Email verify --> Login (JWT created)
    |
Availability Calendar (SELECT from booking_dates table)
    |
Select dates, guests, pet --> Submit
    |
API: validateAuth() --> INSERT into bookings (status: pending)
                     --> INSERT into booking_dates (per date)
    |
Payment: PayMongo OR Upload proof --> INSERT into payment_proofs
    |
Admin reviews --> UPDATE bookings.status = confirmed
              --> UPDATE payment_proofs.status = verified
    |
Email (Gmail SMTP) + SMS (SMSGate) notification sent to user
```

### Tables Involved:
`users` --> `bookings` --> `booking_dates` --> `payment_proofs`

---

## Question 6: "Paano niyo prinoprotektahan yung API routes niyo?"

### Answer:
May **4 levels of API validation** po kami na naka-implement sa server-side, lahat nasa `serverAuth.ts` file namin:

**1. `validateAuth()`** — Para sa any authenticated user. Kine-check niya yung **Bearer token** sa Authorization header ng request. I-ve-verify niya yung JWT token gamit ang Supabase Auth — kung valid, ire-return niya yung user ID, email, role. Kung hindi valid, **401 Unauthorized** ang ire-return.

**2. `validateAdminAuth()`** — Para sa admin/staff only. Tina-tatawag niya muna yung `validateAuth()`, tapos chi-ne-check kung yung role ng user ay `admin` o `staff`. Kung hindi, **403 Forbidden** ang ire-return.

**3. `validateInternalOrAdmin()`** — Para sa server-to-server calls o admin. Chi-ne-check muna yung `x-internal-secret` header — kung valid, proceed. Kung hindi, fina-fall back sa admin auth. Ginagamit to sa email at SMS routes.

**4. `validateCronOrAdmin()`** — Para sa automated/cron jobs o admin. Chi-ne-check muna yung `x-cron-secret` header, tapos fina-fall back sa admin auth kung wala.

So kung may nag-try mag-access ng admin endpoint na hindi naman admin:
1. Kukuhanin yung JWT token niya sa header
2. I-ve-verify kung valid yung token — kung hindi, **401 error**
3. Kung valid naman, i-che-check yung role niya — kung hindi admin, **403 error**
4. Hindi siya makakapasok sa admin operations

May **23+ API routes** po kami na protected ng mga validation functions na to.

### Key Terms:
- **Bearer Token** = JWT token na isine-send sa every API request via Authorization header
- **401 Unauthorized** = hindi authenticated (walang valid token)
- **403 Forbidden** = authenticated pero walang permission (hindi admin)
- **Internal Secret** = server-to-server authentication para sa email/SMS routes
- **Cron Secret** = authentication para sa automated scheduled tasks

---

## Question 7: "Ano yung Entity Relationships ng database niyo? Explain the cardinality."

### Answer:
Ang database po namin ay may **7 main tables** at lahat ng relationships ay **One-to-Many** through foreign keys.

**Users as Central Entity:**
- `users` (1) --> (N) `bookings` — Isang user, maraming bookings
- `users` (1) --> (N) `guest_reviews` — Isang user, maraming reviews
- `users` (1) --> (N) `gallery_images` — Isang admin, maraming uploaded images
- `users` (1) --> (N) `maintenance_settings` — Isang admin, maraming maintenance updates

**Bookings as Secondary Hub:**
- `bookings` (1) --> (N) `booking_dates` — Isang booking, maraming dates (e.g., 3-night stay = 3 rows)
- `bookings` (1) --> (N) `guest_reviews` — Isang booking, pwedeng may review
- `bookings` (1) --> (N) `payment_proofs` — Isang booking, pwedeng may multiple payment proofs (half payment + balance)

**Reviews:**
- `guest_reviews` (1) --> (N) `review_photos` — Isang review, maraming photos

### ER Diagram (Text-Based):

```
+------------------+
|      users       |
| PK: id (UUID)    |
| auth_id, email   |
| full_name, role  |
+--------+---------+
         |
         | 1:N                    1:N                 1:N
         +---------------+------------------+-----------------+
         |               |                  |                 |
         v               v                  v                 v
+----------------+ +----------------+ +-----------------+ +---------------------+
|   bookings     | | guest_reviews  | | gallery_images  | | maintenance_settings|
| PK: id         | | PK: id (UUID)  | | PK: id          | | PK: id              |
| FK: user_id    | | FK: user_id    | | FK: uploaded_by  | | FK: updated_by      |
| status, amount | | FK: booking_id | | public_url       | | is_active, message  |
+-------+--------+ +-------+--------+ +-----------------+ +---------------------+
        |                   |
        | 1:N               | 1:N
        +----------+        |
        |          |        v
        v          v   +----------------+
+-------------+ +------------------+   | review_photos  |
|booking_dates| | payment_proofs   |   | PK: id (UUID)  |
| PK: id      | | PK: id           |   | FK: review_id  |
| FK:booking_id| | FK: booking_id  |   | photo_url      |
| date, status| | proof_image_url  |   +----------------+
+-------------+ | amount, status   |
                +------------------+
```

### Additional Database Objects:
- **View:** `availability_calendar` — shows date and availability status
- **RPC Function:** `get_maintenance_status()` — returns maintenance mode status
- **RPC Function:** `update_maintenance_status()` — updates maintenance settings

### Key Terms:
- **One-to-Many (1:N)** = isang record sa parent table, maraming related records sa child table
- **Foreign Key (FK)** = column na nagre-reference sa primary key ng ibang table
- **Primary Key (PK)** = unique identifier ng bawat row
- **Cardinality** = the number relationship between tables (1:1, 1:N, N:N)

---

## Question 8: "Paano niyo hina-handle yung scalability ng system niyo?"

### Answer:
Sa current state po ng system namin, ang Kampo Ibayo Resort ay may **15-guest maximum capacity** per booking, so hindi pa po ganun kalaki yung volume ng data. Pero nag-design po kami ng system na ready for scaling:

**Database Level:**
- Gamit po namin ang **Supabase (PostgreSQL)** which is cloud-hosted — meaning pwede siyang mag-scale vertically (bigger server) o horizontally (read replicas) without changing our code
- Yung **Row-Level Security** namin ensures efficient querying kasi nafi-filter na sa database level
- May **database views** kami like `availability_calendar` para ma-optimize ang frequent queries
- May **RPC functions** para sa server-side computation na mas efficient kaysa multiple API calls

**Application Level:**
- Gamit namin ang **Next.js** with server-side rendering at API routes — naka-deploy sa **Vercel** na may automatic scaling
- Yung **Vercel** po ay serverless — automatic mag-scale up kapag maraming users, at mag-scale down kapag konti
- Separate po yung file storage namin sa **Supabase Storage** — hindi namin dini-store yung images sa database mismo

**Code Level:**
- Yung API routes namin ay **stateless** — walang server-side session na kailangang i-maintain, JWT lang
- May **pagination** at **filtering** sa admin dashboard para hindi lahat ng data nilo-load nang sabay-sabay

### Key Terms:
- **Vertical Scaling** = bigger/more powerful server
- **Horizontal Scaling** = more servers/replicas
- **Serverless** = automatic scaling based on demand (Vercel)
- **Stateless API** = walang stored session sa server, mas madaling i-scale
- **Cloud-hosted** = Supabase handles infrastructure, hindi kami nag-manage ng server

---

## Question 9: "Paano yung backup at recovery plan niyo kung ma-corrupt o mawala yung data?"

### Answer:
Since naka-host po kami sa **Supabase**, may built-in backup features po siya:

**Automatic Backups:**
- Ang Supabase po ay may **daily automatic backups** ng PostgreSQL database
- Depende sa plan, may **Point-in-Time Recovery (PITR)** — meaning pwede i-restore yung database sa any specific point in time

**Application-Level Protection:**
- Yung system namin po ay may **soft delete** implementation — halimbawa sa users table, may `deleted_at` column. Hindi agad na-de-delete permanently yung data, nima-mark lang as deleted, so pwede pa i-recover
- Sa bookings, kahit i-cancel, nire-retain pa rin yung record with `cancelled_at` timestamp — may audit trail po kami

**File Storage:**
- Ang gallery images at payment proofs ay naka-store sa **Supabase Storage**, which is separate from the database — so kahit may problema sa database, safe pa rin yung files
- Supabase Storage is backed by cloud infrastructure with redundancy

**Code & Version Control:**
- Ang source code namin ay naka-**Git** at naka-push sa remote repository — so kahit ma-corrupt yung local files, may backup po sa cloud
- Naka-deploy po kami sa **Vercel** na may automatic deployment history — pwede mag-rollback sa previous versions

### Key Terms:
- **PITR (Point-in-Time Recovery)** = restore database sa specific na oras
- **Soft Delete** = mark as deleted instead of permanent deletion
- **Audit Trail** = record ng lahat ng changes para sa accountability
- **Redundancy** = multiple copies ng data para kung mawala isa, may backup pa

---

## Question 10: "Bakit Next.js ang pinili niyo as framework? Bakit hindi pure React o ibang framework?"

### Answer:
Pinili po namin ang **Next.js** over pure React o ibang frameworks dahil sa mga sumusunod na advantages:

**1. Full-Stack Capability:**
- Ang Next.js po ay may built-in **API Routes** — hindi na namin kailangan ng separate backend server (like Express.js). Yung frontend at backend namin, iisang codebase lang. Dito namin nilagay yung mga API endpoints para sa bookings, payments, email, at SMS.

**2. Server-Side Rendering (SSR) at Static Generation:**
- Para sa SEO at performance, ang mga pages namin ay pwedeng mag-render sa server — mas mabilis mag-load at mas ma-index ng search engines like Google. Important ito kasi resort booking system kami — gusto namin lumabas sa search results.

**3. File-Based Routing:**
- Sa Next.js, yung folder structure mo ay yung routes mo na — halimbawa `app/admin/bookings/page.tsx` ay automatic na nagiging `/admin/bookings` route. Hindi na namin kailangan mag-configure ng separate router.

**4. Built-in Optimizations:**
- Automatic code splitting — yung user, yung page lang na binibisita niya ang nilo-load, hindi yung buong app
- Image optimization — automatic resizing at lazy loading ng images
- May **Vercel Analytics** at **Speed Insights** na built-in para ma-monitor yung performance

**5. TypeScript Support:**
- Out-of-the-box TypeScript support — na-help kami na ma-catch ang bugs during development, hindi pa lang sa production

**Bakit hindi ibang frameworks:**
- **Pure React (CRA)** — walang built-in routing, walang API routes, walang SSR. Kailangan ng separate backend.
- **Vue/Nuxt** — valid din, pero mas malaki ang React ecosystem at community support, at mas marami kaming experience sa React
- **Laravel/PHP** — traditional server-rendered, walang real-time capabilities na kasing dali i-implement

### Key Terms:
- **SSR (Server-Side Rendering)** = server ang nag-re-render ng HTML, mas mabilis at SEO-friendly
- **API Routes** = backend endpoints na built-in sa Next.js, walang need ng separate server
- **File-Based Routing** = folder structure = URL routes
- **Code Splitting** = automatic loading ng needed code lang per page

---

## BONUS: Quick Cheat Sheet for Common Follow-Up Questions

### "Anong version ng Next.js?"
> Next.js 16.0.7 with React 19.1.0 and TypeScript 5

### "Pano niyo dine-deploy?"
> Vercel — automatic deployment kapag nag-push sa Git. Serverless, may automatic scaling.

### "Anong payment gateway?"
> PayMongo — supports GCash, credit/debit cards. Plus manual payment proof upload with OCR verification using Tesseract.js.

### "May testing ba kayo?"
> May SMS test page at email test endpoints for integration testing.

### "Ano yung OCR sa system niyo?"
> Tesseract.js — optical character recognition. Ginagamit namin para i-scan yung payment proof images at automatic na ma-extract yung reference number at amount para i-verify.

### "Ilan yung API endpoints niyo?"
> 30+ API routes — 14 admin, 7 user, 7 email, 4 SMS, at 1 booking auto-complete.

### "Paano yung state management?"
> React Context API + custom hooks. AuthContext para sa user session, tapos custom hooks like useAdminBookingStats, useAdminNotifications, useRoleAccess, etc. Walang external state library like Redux — Context API is sufficient for our use case.

### "Bakit walang middleware.ts?"
> Auth validation namin is per-route sa API handlers gamit yung serverAuth.ts utility functions (validateAuth, validateAdminAuth, etc.) — mas granular ang control kaysa single middleware file.

---

## Table Summary: Lahat ng Tables at Purpose

| Table | Purpose | Key Columns |
|---|---|---|
| `users` | User accounts at roles | id, auth_id, email, role, is_super_admin |
| `bookings` | Reservation records | id, user_id, check_in/out, status, payment_status |
| `booking_dates` | Individual dates per booking | id, booking_id, date, status |
| `guest_reviews` | Guest feedback at ratings | id, user_id, booking_id, rating, review_text |
| `review_photos` | Photos attached to reviews | id, review_id, photo_url |
| `payment_proofs` | Uploaded payment screenshots | id, booking_id, proof_image_url, status |
| `gallery_images` | Resort photo gallery | id, uploaded_by, public_url, category |
| `maintenance_settings` | System maintenance mode | id, is_active, message, updated_by |

---

## PART 2: TRICKY / "BUTAS" QUESTIONS (Mga Madalas i-Follow Up ng Panel)

---

## Question 11: "Paano niyo prinoprevent yung double booking? Pano kung dalawang users sabay nag-book ng same date?"

### Answer:
May **multiple layers of protection** po kami para ma-prevent ang double booking:

**1. Availability Check (Frontend):**
Sa booking page, before mag-submit yung user, nag-qu-query muna kami sa `booking_dates` table at `bookings` table para i-check kung available pa yung selected dates. Kung may existing confirmed o pending booking na, hindi na ma-se-select yung date sa calendar — **disabled na siya sa UI**.

**2. Server-Side Validation (API):**
Kahit ma-bypass yung frontend check, sa API route namin before mag-INSERT sa database, nag-qu-query ulit kami kung may existing booking na sa mga dates na yun. Kung meron, magre-return ng error at hindi itu-tuloy yung booking.

**3. Database Level:**
Yung `booking_dates` table namin ay may `date` at `status` columns — nag-se-serve as record ng lahat ng booked dates. Kapag nag-query kami for availability, dito kami nag-che-check.

**4. Max Capacity:**
May 15-guest maximum capacity ang resort — so chi-ne-check din namin kung hindi pa lagpas sa limit yung total guests para sa date na yun.

Kung sakaling dalawang users ang nag-submit at the **exact same millisecond**, yung unang nag-INSERT sa database ang mananalo, at yung pangalawa ay mag-fa-fail sa server-side validation check.

### Key Terms:
- **Race Condition** = dalawang process nag-compete sa same resource at same time
- **Optimistic Locking** = check before write, reject if conflict
- **Database Constraint** = rule sa database level na nagpe-prevent ng invalid data

---

## Question 12: "Ano yung difference ng Authentication at Authorization?"

### Answer:
Dalawang magkaibang concept po yan na pareho naming ini-implement:

**Authentication (AuthN)** = "Sino ka?" — Pag-ve-verify ng identity ng user.
- Sa system namin: pag nag-login yung user gamit email at password, ive-verify ng Supabase Auth kung tama yung credentials niya. Kapag valid, bibigyan siya ng **JWT token** — yun ang proof na authenticated na siya.

**Authorization (AuthZ)** = "Ano yung pwede mong gawin?" — Pag-che-check kung may permission ka ba sa specific action.
- Sa system namin: kahit naka-login ka na (authenticated), chi-ne-check pa rin namin kung **admin ka ba** before ka ma-access ng admin endpoints. Yun yung `validateAdminAuth()` function namin — hindi enough na naka-login ka, kailangan tama pa yung **role** mo.

**Example sa system namin:**
```
User nag-login (Authentication) --> May JWT token na siya
    |
User nag-access ng /admin/bookings (Authorization check)
    |
validateAdminAuth() --> Check role: "admin" or "staff"?
    |
Kung "user" lang --> 403 Forbidden (Authenticated pero NOT Authorized)
Kung "admin"     --> 200 OK, ma-access niya yung page
```

### Key Terms:
- **Authentication (AuthN)** = identity verification (sino ka?)
- **Authorization (AuthZ)** = permission check (ano pwede mo gawin?)
- **401 Unauthorized** = hindi authenticated (walang valid identity)
- **403 Forbidden** = authenticated pero walang permission

---

## Question 13: "Ano ang difference ng Hashing at Encryption?"

### Answer:
Madalas po na ini-interchange yung dalawang terms na to, pero **magkaiba po sila**:

**Hashing (One-Way):**
- Hindi na ma-reverse — kapag na-hash, wala nang paraan para i-convert back sa original
- Ginagamit para sa **passwords** — kaya bcrypt ang gamit namin
- Parehas ang output kung parehas ang input (deterministic)
- Example: `"MyPassword123"` → `"$2b$10$xKz8G..."` (hindi na mabalik sa original)

**Encryption (Two-Way):**
- **May reverse** — pwedeng i-decrypt pabalik sa original gamit ang key
- Ginagamit para sa **data in transit** — kaya TLS/HTTPS ang gamit namin sa API calls
- Kailangan ng **key** para ma-encrypt at ma-decrypt
- Example: HTTPS encrypts yung data habang nag-ta-travel sa internet, tapos dine-decrypt sa kabilang dulo

**Sa system namin:**
| Method | Type | Where Used |
|---|---|---|
| **bcrypt** | Hashing (one-way) | Passwords — hindi na kailangang i-reverse |
| **TLS/HTTPS (AES-256)** | Encryption (two-way) | Data in transit — kailangan ma-read sa kabilang dulo |
| **RS256 (JWT)** | Digital Signature | Token signing — para ma-verify kung legit ang token |

### Key Terms:
- **Hashing** = one-way, irreversible, para sa passwords
- **Encryption** = two-way, reversible with key, para sa data in transit
- **Digital Signature** = verification ng authenticity (hindi encryption, hindi hashing)

---

## Question 14: "Paano niyo prinoprotektahan yung system niyo sa SQL Injection?"

### Answer:
Ang **SQL Injection** po ay isang attack kung saan yung attacker ay nag-i-insert ng malicious SQL code sa input fields para manipulahin yung database — halimbawa mag-delete ng data o mag-access ng unauthorized information.

Sa system namin, **protected po kami** dahil sa dalawang reasons:

**1. Supabase Client SDK (Parameterized Queries):**
Hindi po kami gumagamit ng raw SQL strings sa code namin. Gumagamit kami ng Supabase JS Client na may method chaining:
```
supabase.from('bookings').select('*').eq('user_id', userId)
```
Ito po ay automatic na **parameterized** — meaning yung user input ay hindi direktang ini-inject sa SQL query. Ang Supabase client ang nagha-handle ng proper escaping at sanitization.

**2. Row-Level Security (RLS):**
Kahit sakaling may ma-bypass na query, ang RLS sa database level ang magpo-protect — ang user ay makaka-access lang ng rows na authorized sa kanya.

**3. Input Validation:**
Sa API routes namin, nag-va-validate kami ng input before mag-query — halimbawa, chi-ne-check namin kung valid UUID ang user_id, valid date format, valid number ang guests, etc.

### Key Terms:
- **SQL Injection** = inserting malicious SQL through user inputs
- **Parameterized Queries** = separating SQL logic from user data (automatic sa Supabase client)
- **Input Validation** = checking if user input is valid before processing
- **Escaping/Sanitization** = converting special characters para hindi ma-interpret as SQL

---

## Question 15: "Paano niyo hina-handle yung file uploads? Secure ba?"

### Answer:
May dalawang type ng file upload po sa system namin — **gallery images** (admin) at **payment proofs** (users). Pareho silang naka-store sa **Supabase Storage**, hindi sa database mismo.

**Security Measures:**

**1. Separate Storage Buckets:**
- `gallery-images` bucket — para sa resort photos, admin lang ang nag-a-upload
- `payment-proofs` bucket — para sa payment screenshots ng users

**2. Auth Required:**
Hindi ka makapag-upload kung hindi ka authenticated — kailangan ng valid JWT token before ma-process yung upload.

**3. Server-Side Validation:**
Bago i-accept yung file, chi-ne-check namin yung file type at file size sa API level.

**4. No Direct Database Storage:**
Hindi namin sini-store yung actual image files sa database — ang naka-store lang sa tables namin ay yung **URL/path** ng file. Ang actual file ay nasa Supabase Storage (cloud object storage). Ito ay best practice kasi:
- Mas mabilis ang database queries (walang malaking blob data)
- Mas efficient ang storage (cloud storage is cheaper than database storage)
- Supabase Storage has its own access policies

**5. OCR Verification:**
Para sa payment proofs, ginagamit namin ang **Tesseract.js (OCR)** para automatic na i-scan yung image at i-extract yung reference number at amount — para ma-verify kung legit yung payment.

### Key Terms:
- **Object Storage** = cloud file storage (Supabase Storage), separate from database
- **Storage Bucket** = container/folder for files with its own access policies
- **OCR (Optical Character Recognition)** = extracting text from images
- **Blob** = Binary Large Object, raw file data

---

## Question 16: "Ano yung limitations ng system niyo? Ano yung hindi niya kaya?"

### Answer:
Honest po kami na may mga limitations ang system namin:

**1. Single Property Only:**
Ang system ay designed para sa **Kampo Ibayo Resort lang** — hindi siya multi-tenant. Kung gusto i-apply sa ibang resort, kailangan ng separate deployment at configuration.

**2. No Real-Time Chat:**
Walang live chat between admin at guest. Ang communication ay through **email at SMS notifications** lang. May chatbot pero FAQ-based lang siya, hindi live support.

**3. No Offline Mode:**
Kailangan ng internet connection para gumana yung system — walang offline fallback o caching para sa poor connectivity areas.

**4. Payment Verification:**
Yung manual payment proof upload ay nire-rely sa **admin manual review** at OCR — pero ang OCR ay hindi 100% accurate sa lahat ng image quality at format. Minsan kailangan pa rin ng manual checking ng admin.

**5. Single Calendar:**
Isang booking lang per date range — walang support para sa multiple rooms o units. Since camping resort naman siya with 15-guest max capacity, ito ay sufficient, pero hindi scalable kung mag-expand ang resort.

**6. No Multi-Language Support:**
English at Tagalog lang — walang internationalization (i18n) para sa ibang languages.

**Panel Tip:** Huwag matakot mag-admit ng limitations — mas impressive sa panel kung alam mo yung weaknesses ng system mo at may idea ka kung paano i-improve in the future.

---

## Question 17: "Kung bibigyan kayo ng more time, ano yung i-improve o idadagdag niyo?"

### Answer:
Kung bibigyan po kami ng more time, ito yung mga priority improvements namin:

**1. Real-Time Notifications (WebSockets):**
Gagamitin namin yung **Supabase Realtime** feature para mag-push ng live updates — halimbawa, kapag na-confirm ng admin yung booking, automatic na mag-update yung page ng user without refreshing.

**2. Multi-Room/Unit Support:**
I-expand yung system para mag-support ng multiple accommodation types — tents, cabins, glamping — each with their own capacity at pricing.

**3. Automated Payment Verification:**
I-improve yung OCR at mag-add ng direct **PayMongo webhook integration** para automatic na mag-update yung payment status without manual admin intervention.

**4. Progressive Web App (PWA):**
Gawing installable yung website sa phone at mag-add ng basic offline capabilities — para accessible kahit mahina ang internet sa resort area.

**5. Comprehensive Testing:**
Mag-add ng **unit tests** at **integration tests** using Jest at React Testing Library para ma-ensure yung code quality at ma-prevent ang regression bugs.

**6. Analytics Dashboard Improvements:**
Mas detailed reporting — revenue forecasts, seasonal trends, guest demographics, at occupancy rate tracking.

---

## Question 18: "Ano yung ACID properties at sinusupport ba ng database niyo?"

### Answer:
Ang **ACID** po ay set of properties na nagga-guarantee ng reliable database transactions. Since PostgreSQL ang database namin, **fully ACID-compliant** po siya.

**A — Atomicity:**
Kapag may transaction, **lahat o wala** — kung may nag-fail na isang operation, iro-rollback lahat. Halimbawa, kapag nag-create ng booking, kailangan mag-INSERT sa `bookings` AND `booking_dates` — kung mag-fail yung pangalawa, hindi rin itu-tuloy yung una.

**C — Consistency:**
Ang database ay laging nasa **valid state** — hindi pwedeng mag-violate ng constraints like foreign keys. Hindi ka makapag-INSERT ng booking na may `user_id` na wala sa `users` table.

**I — Isolation:**
Kapag dalawang transactions ang sabay na nangyayari, hindi sila mag-i-interfere sa isa't isa. Kung dalawang users ang sabay nag-book, hindi sila makaka-apekto sa data ng isa't isa.

**D — Durability:**
Kapag na-commit na yung transaction, **permanent na** — kahit mag-crash yung server, naka-save na yung data. Hindi mawawala.

### Key Terms:
- **ACID** = Atomicity, Consistency, Isolation, Durability
- **Transaction** = group of database operations na treated as one unit
- **Rollback** = undo lahat ng changes kung may nag-fail
- **Constraint** = rule sa database (foreign key, unique, not null)

---

## Question 19: "Paano niyo hina-handle yung error handling sa system niyo? Pano kung may nag-crash?"

### Answer:
May multiple levels po ng error handling sa system namin:

**1. API Level (Try-Catch):**
Lahat po ng API routes namin ay naka-wrap sa **try-catch blocks** — kung may unexpected error, hindi mag-cra-crash yung buong server. Magre-return lang siya ng proper error response:
- `400 Bad Request` — mali yung input ng user
- `401 Unauthorized` — hindi authenticated
- `403 Forbidden` — walang permission
- `500 Internal Server Error` — unexpected server error

**2. Frontend Error Handling:**
Sa frontend, may **toast notification system** kami — kapag may nag-fail na operation (failed booking, failed upload), nagpapakita ng user-friendly error message instead of blank screen o cryptic error.

**3. Validation Before Processing:**
Before mag-process ng kahit anong operation, nag-va-validate muna kami:
- Valid ba yung JWT token?
- May permission ba yung user?
- Valid ba yung input data (dates, amounts, etc.)?
- Available pa ba yung dates?

**4. Timeout Protection:**
May **30-second timeout** po kami sa email operations — para kung mag-hang yung SMTP connection, hindi mag-ha-hang yung buong request indefinitely.

**5. Graceful Degradation:**
Kung mag-fail yung SMS sending (halimbawa down yung SMSGate), hindi mag-fa-fail yung buong booking process — ang booking ay magpu-push through, yung notification lang ang hindi ma-se-send.

### Key Terms:
- **Try-Catch** = error handling mechanism na nagca-catch ng exceptions
- **HTTP Status Codes** = standard error codes (400, 401, 403, 500)
- **Graceful Degradation** = system continues working kahit may parts na nag-fail
- **Timeout** = maximum time limit para sa isang operation

---

## Question 20: "Compliant ba kayo sa Data Privacy Act of 2012 (Republic Act 10173)?"

### Answer:
Opo, nag-e-effort po kami na ma-comply sa **Data Privacy Act of 2012**. Ito po yung mga measures namin:

**1. Data Collection — Minimal at Necessary Only:**
Ang kino-collect lang namin ay yung **necessary information** para sa booking — full name, email, phone number. Hindi kami nangongolekta ng unnecessary personal data.

**2. Data Protection:**
- Passwords ay **hashed with bcrypt** — kahit kami hindi nakakakita ng actual passwords
- Lahat ng data in transit ay **encrypted via TLS/HTTPS**
- **Row-Level Security** sa database — users can only access their own data
- **Role-based access control** — admin lang ang makaka-access ng user data

**3. Right to Erasure (Right to be Forgotten):**
May **account deletion** feature ang system namin. Kapag nag-delete ng account ang user:
- Ang personal info niya ay ina-anonymize — ang `guest_name` sa bookings nagiging "Deleted User"
- Ang `deleted_at` timestamp ay nire-record
- Hindi completely dine-delete yung booking records para sa business audit trail, pero **anonymized na** — hindi na ma-trace back sa specific person

**4. Consent:**
May **terms of service** at **privacy-related pages** kami sa legal section ng website (`/legal/terms`, `/legal/cancellation`, `/legal/house-rules`) — ina-acknowledge ng user before mag-proceed.

**5. Secure Storage:**
- Data naka-store sa **Supabase cloud servers** with enterprise-grade security
- Files (payment proofs, gallery) naka-separate sa **Supabase Storage** with access policies
- Environment variables at secrets hindi naka-expose sa frontend — server-side lang

### Key Terms:
- **RA 10173** = Data Privacy Act of 2012 (Philippine law)
- **Right to Erasure** = right ng user na i-delete yung data niya
- **Data Anonymization** = removing personally identifiable info while keeping the record
- **Data Minimization** = collecting only what's necessary

---

## Question 21: "Bakit walang ORM (like Prisma) sa system niyo? Hindi ba mas maganda kung meron?"

### Answer:
Conscious decision po namin na hindi gumamit ng traditional ORM like Prisma or Drizzle. Ito po yung reasons:

**1. Supabase Client is Already an Abstraction:**
Ang Supabase JS Client ay may sariling query builder na similar sa ORM:
```
supabase.from('bookings').select('*').eq('user_id', userId).order('created_at')
```
Ito ay readable, type-safe (may auto-generated TypeScript types kami sa `database.types.ts`), at sufficient para sa needs namin.

**2. Less Complexity:**
Ang Prisma ay may sariling schema file, migration system, at generated client — additional layer of complexity. Since Supabase na ang nag-ma-manage ng schema namin sa dashboard, redundant na mag-add ng Prisma on top.

**3. Direct Supabase Features:**
Kung gumamit kami ng Prisma, hindi namin directly magagamit yung Supabase-specific features like:
- Row-Level Security policies
- Supabase Storage integration
- Supabase Auth integration
- Real-time subscriptions
- RPC functions

**4. Auto-Generated Types:**
May `database.types.ts` file kami na **auto-generated from Supabase** — so may type safety kami without needing Prisma's type generation.

**Kung kailan mas maganda ang ORM:**
- Kung self-hosted PostgreSQL (walang Supabase)
- Kung complex migrations ang kailangan
- Kung multiple database providers ang sinusupport

### Key Terms:
- **ORM (Object-Relational Mapping)** = tool that maps database tables to code objects
- **Query Builder** = tool for constructing database queries programmatically
- **Type Safety** = compile-time checking of data types to prevent bugs
- **Migration** = versioned changes to database schema

---

## Question 22: "Paano yung session expiration? Ano mangyayari pag nag-expire yung token?"

### Answer:
Ang session management namin ay through **JWT tokens** na handled ng Supabase Auth:

**Token Lifecycle:**
1. User nag-login → Supabase generates **access token** (short-lived, ~1 hour) at **refresh token** (long-lived)
2. Yung access token ang ginagamit sa every API request
3. Kapag malapit nang mag-expire yung access token, automatic na ginagamit ng Supabase client yung **refresh token** para kumuha ng bagong access token — **walang interruption sa user**

**Kapag Nag-Expire ang Refresh Token:**
- Automatic na magli-log out yung user
- Iri-redirect siya sa login page
- Kailangan niyang mag-login ulit

**Sa Code Namin:**
Sa `AuthContext.tsx`, nag-li-listen kami sa **auth state changes** gamit ang `supabase.auth.onAuthStateChange()` — kapag nag-expire o nag-sign out, automatic na nag-u-update yung UI at na-cle-clear yung user state.

**Sa API Routes:**
Kapag nag-call ng API with expired token, yung `validateAuth()` function namin ay magre-return ng **401 Unauthorized** — hindi makakapag-proceed yung request.

### Key Terms:
- **Access Token** = short-lived JWT para sa API requests (~1 hour)
- **Refresh Token** = long-lived token para ma-renew yung access token
- **Token Rotation** = automatic renewal ng tokens before expiry
- **Auth State Listener** = function that detects login/logout/expiry events

---

## Question 23: "Ano ang advantages ng Serverless deployment niyo sa Vercel?"

### Answer:
Ang system namin ay naka-deploy sa **Vercel** as a **serverless** application. Ito po yung advantages:

**1. Automatic Scaling:**
Walang server na kailangan i-manage — ang Vercel ay automatic mag-scale up kapag maraming users at mag-scale down kapag konti. Hindi kami nag-wo-worry sa server capacity.

**2. Zero Server Maintenance:**
Hindi namin kailangan mag-manage ng Linux server, mag-install ng updates, o mag-configure ng nginx/Apache. Ang Vercel ang nagha-handle ng lahat ng infrastructure.

**3. Global CDN:**
Ang static assets (images, CSS, JS) ay distributed sa **Content Delivery Network** ng Vercel worldwide — mas mabilis mag-load kung saan man ang user.

**4. Automatic HTTPS:**
Free SSL certificate at automatic HTTPS — encrypted lahat ng connections without additional configuration.

**5. Preview Deployments:**
Every git push ay may sariling preview URL — pwede i-test before i-deploy sa production.

**6. Cost Efficient:**
Pay-per-use model — bayad lang kami sa actual usage. Para sa resort booking system na hindi 24/7 high-traffic, mas mura ito kaysa dedicated server.

**Limitations:**
- **Cold Starts** — kung matagal walang request, yung unang request ay medyo mabagal kasi kailangan mag-initialize yung serverless function
- **Execution Time Limit** — may maximum execution time (default 10 seconds sa free plan) — kaya may 30-second timeout kami sa email operations

### Key Terms:
- **Serverless** = cloud-managed compute, walang physical/virtual server na imi-manage
- **CDN (Content Delivery Network)** = distributed network for faster content delivery
- **Cold Start** = initial delay kapag first request after idle period
- **SSL/TLS Certificate** = enables HTTPS encrypted connections

---

## Question 24: "Paano kung na-hack yung Supabase account niyo? Ano yung disaster recovery plan?"

### Answer:
Ito po yung worst-case scenario preparations namin:

**Prevention:**
- Ang **Supabase Service Role Key** ay nasa server-side environment variables lang — hindi naka-expose sa frontend code
- Ang **Anon Key** na naka-expose sa frontend ay limited lang ang access dahil sa RLS policies
- Lahat ng API keys ay nasa `.env.local` na naka-`.gitignore` — hindi nako-commit sa Git repository

**Kung Ma-Compromise ang Account:**

**Step 1: Immediate Response**
- Rotate/regenerate lahat ng API keys sa Supabase dashboard
- Update yung environment variables sa Vercel deployment
- I-revoke lahat ng existing user sessions (force logout all)

**Step 2: Assessment**
- I-review ang Supabase audit logs para malaman kung anong data ang na-access
- I-check kung may unauthorized changes sa database

**Step 3: Recovery**
- I-restore ang database from Supabase **automatic daily backups**
- Kung may **Point-in-Time Recovery**, i-restore sa timestamp before yung breach
- Notify affected users kung may data na na-compromise

**Step 4: Post-Incident**
- Enable **two-factor authentication** sa Supabase dashboard
- I-review at i-strengthen yung RLS policies
- Mag-add ng additional monitoring at alerting

### Key Terms:
- **Key Rotation** = replacing compromised keys with new ones
- **Audit Logs** = records of who accessed what and when
- **Incident Response** = planned steps for handling security breaches
- **Point-in-Time Recovery (PITR)** = restore database to exact moment before breach

---

## Question 25: "Bakit PostgreSQL ang ginamit niyo at hindi MySQL? Ano yung difference nila?"

### Answer:
Pareho po silang **relational databases** at pareho silang gumagamit ng SQL, pero may key differences po sila:

**Bakit PostgreSQL over MySQL:**

**1. Row-Level Security (RLS):**
Ang pinaka-malaking reason po — ang PostgreSQL ay may built-in na **Row-Level Security** na naka-enforce directly sa database level. Ibig sabihin, pwede naming i-set na ang user ay makaka-access lang ng sarili niyang data — sa database level mismo, hindi lang sa code. Ang MySQL ay **walang native RLS** — kailangan mo i-implement sa application code mo lahat ng data filtering, which is mas prone to bugs.

**2. Supabase Requirement:**
Ang Supabase, yung BaaS platform namin, ay **PostgreSQL lang ang sinusupport**. Pinili namin ang Supabase dahil sa built-in authentication, storage, at real-time features niya. So automatic na PostgreSQL ang database namin.

**3. Advanced Data Types:**
Ang PostgreSQL ay may support para sa **JSON/JSONB data type**, **UUID**, at **array columns** — na ginagamit namin sa system. Halimbawa, yung `id` ng users namin ay UUID, at may JSON responses sa RPC functions namin. Ang MySQL ay may limited JSON support lang compared sa PostgreSQL.

**4. ACID Compliance:**
Both naman po sila ay ACID-compliant, pero ang PostgreSQL ay mas **strictly compliant** — mas reliable siya sa complex transactions at concurrent operations.

**5. Standards Compliance:**
Ang PostgreSQL ay mas closely follows yung **SQL standard** — meaning yung queries mo ay mas portable at predictable. Ang MySQL ay may sariling deviations from standard SQL.

### Side-by-Side Comparison:

| Feature | PostgreSQL (Gamit namin) | MySQL |
|---|---|---|
| **Row-Level Security** | Built-in, native support | Wala — manual implementation sa code |
| **JSON Support** | Full JSONB with indexing | Basic JSON lang, limited querying |
| **UUID Type** | Native `uuid` type | Kailangan ng workaround (CHAR(36) or BINARY(16)) |
| **Supabase Support** | Fully supported | Hindi supported |
| **ACID Compliance** | Strict, all storage engines | Depende sa storage engine (InnoDB lang) |
| **Concurrency** | MVCC (Multi-Version Concurrency Control) | Locking-based (mas mabagal sa heavy reads) |
| **Open Source License** | PostgreSQL License (fully open) | GPL + may commercial (Oracle-owned) |
| **Complex Queries** | Mas mabilis sa complex JOINs at subqueries | Mas mabilis sa simple read-heavy queries |
| **RPC Functions** | Full support (ginagamit namin) | Stored procedures (limited) |
| **Extensions** | Rich extension ecosystem | Limited |

### Kailan Mas Okay ang MySQL:
- Simple, read-heavy applications (blogs, CMS)
- Legacy systems na naka-MySQL na
- Kung kailangan ng simpler setup at administration
- WordPress, Joomla, at ibang PHP-based systems

### Kailan Mas Okay ang PostgreSQL (Tulad ng sa amin):
- Complex data relationships
- Kailangan ng RLS para sa security
- Gumagamit ng Supabase o similar platforms
- Kailangan ng advanced features (JSON, UUID, RPC functions)
- Applications na may concurrent users at complex transactions

### Defense-Ready One-Liner:
> "Pinili po namin ang PostgreSQL over MySQL primarily dahil sa **Row-Level Security** na critical sa security ng system namin, sa **native JSON at UUID support** na ginagamit namin sa data types, at dahil **Supabase — yung BaaS platform namin — ay PostgreSQL lang ang sinusupport**."

### Key Terms:
- **PostgreSQL** = advanced open-source relational database, object-relational
- **MySQL** = popular open-source relational database, owned by Oracle
- **RLS (Row-Level Security)** = database-level per-row access control (PostgreSQL only)
- **JSONB** = binary JSON format sa PostgreSQL, indexable at queryable
- **MVCC (Multi-Version Concurrency Control)** = PostgreSQL's way of handling concurrent access without locking
- **UUID (Universally Unique Identifier)** = 128-bit unique ID format (e.g., `550e8400-e29b-41d4-a716-446655440000`)

---

*Good luck sa defense! Kaya niyo yan! Pag may tanong pa, balik lang!*
