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

## 🧠 Trained AI Model Integration (PythonAnywhere API)

CareBridge AI integrates a predictive machine learning classifier trained by the Data Science team. Both the **Patient Recovery Portal** (during triage assessment in [Recovery.tsx](file:///c:/web project/carebridgeai/src/views/Recovery.tsx)) and the **Community Health Worker (CHW) Console** (when logging field visits in [CHWDashboard.tsx](file:///c:/web project/carebridgeai/src/views/CHWDashboard.tsx)) connect to this API to determine follow-up compliance risk.

### 🔗 API Endpoint
* **URL**: `https://gharnie.pythonanywhere.com/predict`
* **Method**: `POST`
* **Headers**: `Content-Type: application/json`

### 📤 Request Payload Configuration
The app constructs a clinical/demographic payload (`patientData`) mapping user inputs to the model's standardized feature names:
* **Demographics**: `province`, `county`, `district`, marital status (`pds103`), education level (`pds104`), occupation (`pds106`), and religion (`pds105`).
* **Gestational metrics**: Gestational age (`pds302`) and gestational category (`pds324`).
* **Clinical signs & history**: History of prior miscarriage (`pds303`), presence of fever (`pds310`), presence of complications (`pds402`), and discharge outcome (`pds801`).
* **Mental health indicator**: Derived from self-reported mood scores (`mental_health_risk`).

### 📥 Response Payload Handling
The backend parses the input and returns:
* `prediction`: `1` (likely to complete follow-up) or `0` (unlikely to complete follow-up/default risk).
* `probability`: Float representing prediction confidence.
* `equity_flags`: Highlighted socioeconomic barriers.
* `mental_health_flag` & `mental_health_note`: Flagged emotional distress guidelines.

### 🛡️ Local Rule-Based Fallback
To ensure high availability in areas with spotty network access, a 5-second connection timeout is enforced. If the PythonAnywhere endpoint times out or returns an error, the app transparently falls back to a local rule-based engine to classify risk levels (High, Moderate, Low) and generate mock prediction metadata.

---

## 📂 Project Structure

```bash
carebridgeai/
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

CareBridge enforces strict authorization bounds defined in [firestore.rules](file:///c:/web%20project/carebridgeai/firestore.rules). Access controls require active authentication (`request.auth != null`), securing records under clinical namespaces:

* **`/assessments`**: Authenticated patients can submit screening reports; CHWs can read and update follow-up statuses.
* **`/notifications`**: Direct real-time alerts can only be read and generated by authorized clinical accounts.
* **`/recovery_logs`**: Patients can write and review their individual daily wellness logs.

---

## ⚙️ Configuration & Installation

This repository contains both the frontend React/Vite application and the backend Python Machine Learning workspace. Follow the instructions below to install dependencies, configure environment variables, and run both components locally.

---

### 💻 1. Frontend Web Portal Setup (React / TypeScript)

#### Prerequisites
- **Node.js** (v18.0.0 or higher recommended)
- **npm** (v9.0.0+) or **pnpm** (v8.0.0+)

#### Environment Variables Configuration
1. Create a `.env` file in the root workspace directory (copying from [.env.example](file:///c:/web%20project/carebridgeai/.env.example)):
   ```env
   VITE_GEMINI_API_KEY="your-gemini-api-key-here"
   APP_URL="http://localhost:3000"
   ```
2. Place your Firebase web app configuration inside [firebase-applet-config.json](file:///c:/web%20project/carebridgeai/firebase-applet-config.json) in the project root:
   ```json
   {
     "apiKey": "your-api-key",
     "authDomain": "your-auth-domain",
     "projectId": "your-project-id",
     "storageBucket": "your-storage-bucket",
     "messagingSenderId": "your-sender-id",
     "appId": "your-app-id"
   }
   ```

#### Dependency Installation
Run the following command to download Node packages:
```bash
npm install
```

#### Running Locally
Launch the Vite development server:
```bash
npm run dev
```
The application will boot up at `http://localhost:3000`.

#### Compiling Production Build
Package the React code into an optimized static bundle:
```bash
npm run build
```
The compiled bundle will generate inside the `dist/` directory.

---

### 🐍 2. Backend Predictive AI Model Server (Python / Flask)

#### Prerequisites
- **Python** (v3.10 or higher recommended)
- **pip** (Python package installer)

#### Dependency Installation
Install backend libraries specified in the root [requirements.txt](file:///c:/web%20project/carebridgeai/requirements.txt):
```bash
pip install -r requirements.txt
```

#### Running the Prediction API Locally
Start the Flask model endpoint service:
```bash
python temp-epl-care-ai/flask_app.py
```
This runs a local microservice on `http://127.0.0.1:5000` exposing the `/predict` route. The frontend automatically queries this service to make real-time predictions.

---

## 🔬 3. Documentation for Reproducing ML Results

To retrain the clinical model and reproduce the evaluation metrics (84.70% Accuracy, 93.31% Cross Validation AUC):

### Dataset Sources
The model uses real-world maternal surveys loaded from the `/temp-epl-care-ai/` directory:
- `pds_3.csv`: Post-discharge survey response dataset containing patient demographics, clinical diagnostics, and follow-up metrics.
- `hps_1.csv` & `hfs_2.csv`: Healthcare facility parameters, geographical features, and local facility capacity metrics.

### Retraining & Evaluation Workflow
1. Navigate to the `/temp-epl-care-ai/` workspace directory.
2. Launch a Jupyter Notebook server:
   ```bash
   jupyter notebook
   ```
3. Open and run the Jupyter notebook [epl_analysis.ipynb](file:///c:/web%20project/carebridgeai/temp-epl-care-ai/epl_analysis.ipynb):
   - **Section 1: Data Cleansing & Ingestion**: Merges geography-based facility metrics and resolves outliers.
   - **Section 2: Categorical Feature Encoding**: Standardizes high-cardinality features like region, marital status, and religion.
   - **Section 3: Standard Scaling**: Computes and exports model feature scaling parameters.
   - **Section 4: Classifier Fitting**: Fits a Random Forest Classifier and evaluates performance using cross-validation.
4. Running the final blocks in the notebook will overwrite:
   - `epl_model.pkl` (The trained Random Forest model)
   - `epl_scaler.pkl` (The feature scaler)
   - `feature_columns.pkl` (The expected training feature indices)

---

## 🌍 Multilingual Support Details

The app translates components dynamically based on the user's selected preference in `localStorage` or profile configuration. Language options are defined in [translations.ts](file:///c:/web%20project/carebridgeai/src/translations.ts):

* **English (`en`)**
* **French (`fr`)**
* **Swahili (`sw`)**
* **Yoruba (`yo`)**
* **Hausa (`ha`)**

Users can search for and dynamically activate more languages from the built-in global selector dropdown on the Patient Portal.

---

## 🛡️ Medical Disclaimer
CareBridge AI and its clinical intelligence companion provide post-recovery information and general triage estimates. They do NOT replace professional medical consults. In the event of emergency symptoms, patients are urged to use the **SOS Emergency Escalation** page to navigate immediately to the nearest healthcare facility.
