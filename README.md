# CareBridge AI: Maternal & Reproductive Health Intelligence

CareBridge AI is a state-of-the-art, compassionate, and culturally sensitive maternal health platform designed specifically for Sub-Saharan Africa. The platform addresses post-pregnancy loss, miscarriage, early pregnancy complications, and cardiovascular recovery through an integrated, intelligent, and role-based ecosystem.

---

## 🌟 Core Highlights

CareBridge AI bridges the gap between rural and urban clinical access by offering two specialized portals:

1. **Patient Recovery Portal**: A supportive, multilingual personal portal that helps recovering mothers log symptoms, track recovery parameters (hydration, nutrition, medication), receive appointment alerts, and interact with an empathetic AI companion.
2. **Community Health Worker (CHW) Console**: An action-oriented dashboard for clinical teams and rural field workers that maps risk factors, flags high-risk patients, uses predictive modeling to flag follow-up defaults, and supports offline-first manual record entries during field visits.

---

## 🚀 Key Features

### 1. AI-Powered Pregnancy Risk Triage
* **Confidential Symptom Screening**: Allows patients to quickly report clinical parameters, including gestational age, pain severity, fever/chills, bleeding frequency, and prior miscarriage history.
* **Empathetic Explanations**: Uses Gemini 2.5 Flash to automatically interpret risk data and present calming, emotionally safe explanations of why a certain risk category (High, Medium, Low) was assigned, along with immediate clinical next steps.

### 2. Supportive Patient Portal
* **Recovery Checklist**: Visual vitals tracker for daily hydration (water glass counter), nutrition (meal tracking), and medicine logs, complete with an interactive streak counter.
* **Daily Mood Reflection**: Fast emotional checkout with emojis (Grieving, Stressed, Recovering, Supported, Hopeful). Mood entries automatically prompt Gemini AI to generate culturally contextual, compassionate support responses.
* **Multi-day Appointment Reminders**: Track weekly (e.g., Thursday Antenatal Visits) or one-time clinical checks. The app calculates date diffs to trigger status tags (`TODAY`, `TOMORROW`, `Upcoming`) and custom prep notes.
* **Voice Guide Toggle**: An integrated voice guidance mode designed for accessibility in lower-literacy scenarios.

### 3. Community Health Worker (CHW) Console
* **Real-time Emergency Feed**: Live alerts stream into the console as soon as high-risk triage screenings are submitted.
* **Predictive Follow-up Completion**: A built-in AI classifier evaluates the probability that a patient will complete their post-discharge follow-up. This helps CHWs identify and prioritize vulnerable cases (marked as *Unlikely to Complete*).
* **Directive Action Plans**: Identifies specific care gaps (e.g., missing partner involvement in counseling, lack of contraceptive guides) and outlines clear follow-up tasks.
* **Offline-First Field Registry**: Designed for remote areas. CHWs can log manual assessments and record details for rural patients without mobile access or internet connection. Records save to local storage and sync to Firebase Firestore automatically when connection is restored.
* **Clinical Analytics**: Population charts built with Recharts show the risk distribution breakdown and symptom frequency (e.g., bleeding, pelvic pain, anemia) across registered patients.

### 4. Interactive CareBridge AI Companion
* **Pidgin & Slang Understanding**: The AI companion parses local Sub-Saharan African slang, Pidgin expressions, and code-switching (e.g., *"body dey do me somehow"*, *"my head want to remove"*, *"moto no dey to go to hospital"*), mapping them to clinical tags.
* **Direct App Action Execution**: The chatbot can trigger on-screen state modifications directly when the patient reports activities (e.g., *"I just drank 2 glasses of water"* logs water, *"Assign me to Sister Amina"* updates the health worker details, or *"I want to check my symptoms"* redirects to the Assessment screen).

---

## 🛠️ Tech Stack & Architecture

CareBridge AI uses a modern, high-performance web development stack:

* **Frontend Framework**: [React 19](https://react.dev/) with [Vite](https://vitejs.dev/) for high-speed builds and hot module replacement.
* **Type System**: [TypeScript](https://www.typescriptlang.org/) for robust static analysis and secure state shapes.
* **Styling & Animations**: [Tailwind CSS v4](https://tailwindcss.com/) for streamlined layouts, combined with [Motion (Framer Motion)](https://motion.dev/) for micro-interactions and transitions.
* **AI Engine**: `@google/genai` (Google Gen AI SDK) communicating directly with `gemini-2.5-flash` with dynamic fallback models (`gemini-flash-latest`, `gemini-2.0-flash`) to ensure high availability.
* **Database & Auth**: [Firebase v12](https://firebase.google.com/) Firestore for scalable real-time sync, coupled with Firebase Auth (anonymous validation flow).
* **Data Visualization**: [Recharts](https://recharts.org/) for responsive vector analytics.
* **Icons**: [Lucide React](https://lucide.dev/) for clinical iconography.

---

## 📂 Project Structure

```bash
medicare/
├── .env.example                # Template configuration for API credentials
├── components.json             # Shadcn configuration
├── firestore.rules             # Firestore security rules and constraints
├── index.html                  # Core HTML structure
├── package.json                # Project dependencies and script commands
├── vite.config.ts              # Vite configuration (custom aliases, Tailwind, etc.)
└── src/
    ├── App.tsx                 # App layout, global auth listener, and main view controller
    ├── index.css               # Design tokens, custom variables, and base styles
    ├── main.tsx                # Entry point
    ├── translations.ts         # Multilingual translation dictionaries (EN, FR, SW, YO, HA)
    ├── types.ts                # App-wide TypeScript interfaces and schemas
    ├── components/
    │   ├── Chatbot.tsx         # CareBridge AI Chat Companion with Pidgin support
    │   ├── Navigation.tsx      # Sidebar, bottom tabs, and header components
    │   └── OnboardingTour.tsx  # Walkthrough guide overlay for new users
    ├── lib/
    │   ├── firebase.ts         # Firebase initialization and credentials mapping
    │   └── gemini.ts           # Gemini prompt engines, schema enforcement, and fallback logic
    └── views/
        ├── Assessment.tsx      # Detailed prenatal risk screening assessment
        ├── CHWDashboard.tsx    # Health worker console, analytics, and field-logging registry
        ├── Dashboard.tsx       # Core clinical dashboards
        ├── Landing.tsx         # User-facing onboarding screen and portal switchboard
        ├── Login.tsx           # Role-based user credentials gate
        ├── Recovery.tsx        # Post-loss recovery and cardiovascular tracker
        └── Referrals.tsx       # Care options, clinics directory, and counseling resources
```

---

## 🔒 Firestore Security Rules

CareBridge enforces strict authorization bounds defined in [firestore.rules](file:///c:/web%20project/medicare/firestore.rules). Access controls require active authentication (`request.auth != null`), securing records under clinical namespaces:

* **`/assessments`**: Authenticated patients can submit screening reports; CHWs can read and update follow-up statuses.
* **`/notifications`**: Direct real-time alerts can only be read and generated by authorized clinical accounts.
* **`/recovery_logs`**: Patients can write and review their individual daily wellness logs.

---

## ⚙️ Configuration & Installation

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org/) (v18+ recommended) and npm/pnpm installed.

### 2. Environment Variables Setup
Create a `.env` file in the root directory and define the following variables (see [.env.example](file:///c:/web%20project/medicare/.env.example)):

```env
# Google Gemini API Key (Get one from Google AI Studio)
VITE_GEMINI_API_KEY="your-gemini-api-key"

# Application hosting URL (optional)
APP_URL="http://localhost:3000"
```

### 3. Install Dependencies
Run the installation command in your terminal:
```bash
npm install
# or if using pnpm
pnpm install
```

### 4. Running the Development Server
Launch the local development environment:
```bash
npm run dev
```
The server will boot up and be accessible locally at `http://localhost:3000`.

### 5. Compiling for Production
To package the app for production deployment:
```bash
npm run build
```
The optimized bundle will be created inside the `dist/` directory.

---

## 🌍 Multilingual Support Details

The app translates components dynamically based on the user's selected preference in `localStorage` or profile configuration. Language options are defined in [translations.ts](file:///c:/web%20project/medicare/src/translations.ts):

* **English (`en`)**
* **French (`fr`)**
* **Swahili (`sw`)**
* **Yoruba (`yo`)**
* **Hausa (`ha`)**

Users can search for and dynamically activate more languages from the built-in global selector dropdown on the Patient Portal.

---

## 🛡️ Medical Disclaimer
CareBridge AI and its clinical intelligence companion provide post-recovery information and general triage estimates. They do NOT replace professional medical consults. In the event of emergency symptoms, patients are urged to use the **SOS Emergency Escalation** page to navigate immediately to the nearest healthcare facility.
