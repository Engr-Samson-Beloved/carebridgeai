Executive Summary
CareBridge AI is a mobile-first healthcare coordination platform for pregnancy-loss care in Africa. It features 5 main screens (Home, RiskAssessment, Clinics, Recovery, Analytics) accessed via a persistent bottom tab bar on mobile (best for ≤5 top-level sections
) and a sticky sidebar on desktop. The UI uses a consistent design system with design tokens (colors, typography, spacing) to ensure visual harmony
. For example, define core colors (#0F4C81, #2EC4B6, #FF6B6B, etc.) and font scales in a Tailwind config. Accessibility is paramount: use large tap targets (min. 24×24 px
, ideally ≈44×44 px) and high-contrast text (≥4.5:1 ratio
). Provide ARIA labels, focus indicators, and support a “Reduced Motion” preference so that Framer-Motion animations can fallback to simple opacity fades
. Interaction cues are subtle (smooth fades, gentle scale on hover) to keep the UX low-friction.

The app supports multiple input/output channels: built-in voice input (via Web Speech) and multilingual text for English/French/Swahili/Yoruba/Hausa (using Next.js i18n). There are placeholders for WhatsApp/SMS alerts (for follow-ups or emergency notifications) without full bot complexity. High-risk findings trigger an Emergency Escalation UI (red alert banner, one-tap “Call Ambulance” or “Notify Clinic” actions). All AI outputs must be explainable (e.g. “High risk due to severe bleeding and prior miscarriage”). The data contracts for AI responses and clinic objects are defined below.

Tech Stack & Deliverables: Next.js + TypeScript, TailwindCSS, Framer Motion, Supabase, deployed on Vercel. Deliver mobile-responsive screens, Storybook components, basic Cypress E2E tests, and performance optimization (Lighthouse ≥90). See YAML prompt below for detailed guidance.

yaml
Copy
project: CareBridge AI
purpose: "AI-driven pregnancy-loss care coordination for underserved African communities"
target_users: 
  - "Pregnant/postpartum women"
  - "Community health workers and nurses"
pages:
  Home:
    title: "Welcome & Quick Access"
    description: "Greeting, Start Assessment CTA, emergency button, symptom quick-checks, clinic preview"
    components: ["HeroCard", "SymptomChips", "NearestClinicCard", "RecoveryTeaser"]
  RiskAI:
    title: "Pregnancy Risk Assessment"
    description: "Multi-step form (week, symptoms, history); shows RiskResult with AI reasoning"
    components: ["MultiStepForm", "RiskResultCard"]
  Clinics:
    title: "Smart Referrals"
    description: "Filterable list and map of AI-ranked clinics (distance, cost, capability, emergency-ready)"
    components: ["FilterBar", "ClinicCard", "ClinicMap"]
  Recovery:
    title: "Recovery Support"
    description: "Post-loss check-in: emotional tracker, symptom updates, journaling, resource links"
    components: ["CheckInForm", "MoodSlider", "RecoveryAccordion", "ResourceList"]
  Analytics:
    title: "Health Intelligence Dashboard"
    description: "Charts and metrics for usage patterns, risk stats, referral times (for stakeholders)"
    components: ["MetricCard", "BarChart", "LineChart", "MapChart"]
navigation:
  mobile: 
    style: "Fixed bottom tab bar with 5 tabs (Home, Risk, Clinics, Recovery, Analytics)【4†L150-L154】; icons + text labels; glassmorphism background"
    behavior: "Active tab highlighted; support swipe gesture between tabs"
  desktop:
    style: "Sticky left sidebar; compact icons with labels; include profile & an urgent-help button"
    behavior: "Highlight current section; collapsible on small viewports"
design_tokens:
  colors:
    primary: "#0F4C81"    # Deep blue for trust
    secondary: "#2EC4B6"  # Teal for calm highlights
    accent: "#FF6B6B"     # Coral red for alerts/critical
    background: "#F8FAFC"
    text: "#1E293B"
  typography:
    font_family: ["Inter", "sans-serif"]
    headings: ["2rem","1.5rem","1.25rem"] 
    body: ["1rem","0.875rem"]
  spacing:
    xs: "0.5rem"
    sm: "1rem"
    md: "2rem"
    lg: "4rem"
accessibility:
  contrast: "WCAG AA (≥4.5:1 for normal text)【13†L42-L49】"
  target_size: "≥24×24 CSSpx interactive targets (≈44px touch area)【10†L53-L60】"
  reduced_motion: "Respect user’s OS setting (use Framer Motion’s useReducedMotion)【16†L125-L134】"
  labels: "Every icon/button has ARIA-label; textual alternatives for images"
  keyboard: "Full keyboard nav (tab order, focus) and focus-visible outlines"
interactions:
  animations: 
    - "Page and modal transitions: subtle fade-ins/slides"
    - "Buttons/cards: gentle scale/raise on hover"
    - "Use Framer Motion’s MotionConfig(reducedMotion='user')【16†L147-L152】"
  gestures: "Include 'swipe to go back' on RiskAI multi-step (optional)"
voice_multilingual:
  speech_input: "Microphone icon triggers speech-to-text for form fields"
  speech_output: "Use Web Speech API to read summary/explanation if opted"
  languages: ["en","fr","sw","yo","ha"]
  translation: "All UI strings and AI outputs internationalized (Next.js i18n routing)"
  CHW_mode: "Toggle for simpler UI (multi-patient entry) for community health workers"
integration:
  whatsapp: 
    enabled: true 
    note: "Optional opt-in; send template messages (follow-ups, reminders)"
  sms: 
    enabled: true 
    note: "Fallback for no-internet: SMS prompt with summary & code"
  emergency: 
    actions: 
      - "Call ambulance (phone link)"
      - "Notify clinic (API POST with user details)"
    notification: "Show toast/toast-confirm after action"
data_contracts:
  AIResponse:
    riskLevel: "enum(Low,Medium,High)"
    confidence: "float (0-1)"
    explanation: "string (e.g. 'Bleeding + Fever → High Risk')"
    recommendedAction: "string"
  Clinic:
    id: "string"
    name: "string"
    latitude: "number"
    longitude: "number"
    distanceKm: "number"
    rating: "number (1–5)"
    costLevel: "enum(low,medium,high)"
    emergencyReady: "boolean"
    specialties: "string[] (e.g. 'Maternal')"
api_endpoints:
  - path: "/api/assess"
    method: "POST"
    req: "{symptoms[], vitals{bp,pulse,...}, history{miscarriages,...}}"
    res: "AIResponse (see schema above)"
  - path: "/api/clinics"
    method: "GET"
    params: "nearby=true/false, urgent=true/false"
    res: "Clinic[]"
  - path: "/api/recovery/checkin"
    method: "POST"
    req: "{checkinFields}"
    res: "{status:'ok'}"
  - path: "/api/languages"
    method: "GET"
    res: "['en','fr','sw','yo','ha']"
testing:
  unit: "Jest + React Testing Library for components"
  integration: "Cypress for key flows (assessment submission, referral selection)"
  performance: "Lighthouse target 90+ on mobile"
deploy:
  platform: "Vercel"
  frameworks: 
    - "Next.js (App Router)"
    - "TailwindCSS"
    - "TypeScript"
  env: 
    - "SUPABASE_URL/KEY"
  commands: 
    - "npm run build && npm start"
deliverables:
  - "Responsive UI screens (mobile & desktop designs)"
  - "Reusable components in Storybook"
  - "Localization support and voice input demonstration"
  - "API contract docs & sample calls"
  - "Basic end-to-end test scripts"
Component Props
Component	Prop	Type	Description
NavTabs	items	Array<{icon, label}>	Tab definitions (icon name + label text)
activeIndex	number	Currently selected tab index
onSelect	(index) ⇒ void	Callback when a tab is tapped
HeroCard	title	string	Main heading text
subtitle	string	Supporting text below heading
ctaText	string	Button text (e.g. "Start Assessment")
onCTA	() ⇒ void	CTA button click handler
SymptomForm	fields	array	Form fields schema (type, label, options)
onSubmit	(data) ⇒ void	Called with form data
ClinicCard	clinic	object	Clinic data (see API schema)
onNavigate	(clinic) ⇒ void	Called when “Get Directions” is tapped
RecoveryAccordion	sections	Array<{title, content}>	List of collapsible Q&A sections
openSections	array	Which sections are open by default
MetricCard	label	string	Metric name (e.g. “High-Risk Cases”)
value	number/string	Metric value
icon	ReactNode	Optional icon
BarChart	data	array of numbers	Data points for bar chart
labels	array of strings	X-axis labels
colorScheme	string	Color palette key

API Schemas
AI Risk Response (JSON)

Field	Type	Description
riskLevel	string	"Low" |"Medium" |"High"
confidence	number	Probability (0–1) of the risk assessment
explanation	string	e.g. “Severe bleeding + fever”
recommendedAction	string	Clinical advice (e.g. “Visit clinic now”)

Clinic Object (JSON)

Field	Type	Description
id	string	Unique clinic identifier
name	string	Clinic name
latitude	number	GPS latitude
longitude	number	GPS longitude
distanceKm	number	Distance from user in kilometers
rating	number	Maternal care rating (1–5 stars)
costLevel	string	"low"|"medium"|"high" cost category
emergencyReady	boolean	Whether 24/7 emergency service is available
specialties	string[]	e.g. ["EPU"] (Emergency Pregnancy Unit)

Visual Assets & Icons
Use authentic imagery (photos of local clinics, mothers, healthcare staff). For example:

Figure: Example asset – an African healthcare professional using a tablet. Use similar culturally-relevant photos to humanize the UI.

Iconography should be simple and semantic (e.g. a stethoscope icon for Clinics, a pulse icon for Risk). Always pair icons with text labels for clarity and accessibility.

Accessibility Highlights
Tap Targets: Ensure all buttons/links are at least 24×24 CSS pixels (ideally ~44px)
. Provide generous padding so icons have a large hit area.
Contrast: Text and controls must meet WCAG 2.2 AA contrast (≥4.5:1 for normal text)
.
Reduced Motion: Respect OS-level “reduce motion”. Use Framer Motion’s useReducedMotion hook to switch to fade transitions if needed
.
Screen Readers: Use semantic HTML and ARIA labels. All images should have descriptive alt text (except decorative).
Languages: Add lang attribute per locale. All static text and dynamic messages must be localizable.
Interactions & Animations
Subtle Transitions: e.g. page cards slide or fade in, but avoid jarring motion.
Hover/Active States: Buttons gently elevate or change color on hover to indicate interactivity.
Loading States: Use spinners or skeletons during AI responses.
Framer Motion: Wrap animations in <MotionConfig reducedMotion="user">
 so that users preferring no motion see minimal effects.
Multi-Channel Integration
Voice Input: Provide a microphone button on forms (using Web Speech API).
Multilingual: Show a language selector in the header (store choice in context/local storage). Use Next.js i18n routing or libraries (e.g. react-intl).
WhatsApp/SMS (Placeholder): After assessment, allow user to “opt in” for SMS/WhatsApp updates. (Implement as a no-op or mock for MVP.)
CHW Mode: If a “health worker mode” is enabled, show a simple list interface to scan multiple patients sequentially.
Emergency Escalation UI
On the RiskAI or Clinics page, if High Risk is detected, display a prominent red banner: “Immediate care needed!” with actions. For example:

Primary CTA: “Call Ambulance” (native tel: link)
Secondary CTA: “Notify Clinic” (simulate API POST to /api/emergency with user info)
Show an alert icon and use the accent color (#FF6B6B). Confirm the action with a toast message.

Testing & Performance
Write Storybook stories for key components (forms, cards, charts).
Achieve at least 90 in Lighthouse (mobile) by optimizing images, minifying CSS, and server-side rendering.
Use Cypress to automate: Home → Assessment → High-risk → Show referrals.
Mock API data in tests to validate flows end-to-end.
Build & Deploy
Framework: Next.js (App Router), Tailwind CSS, TypeScript.
Deployment: Vercel (auto-deploy on push).
Commands: npm run build && npm run start.
Env: Configure SUPABASE creds (for mock user data) and any translation files.
Development Note: Treat this as healthcare infrastructure, not just an app. Prioritize empathy, clarity, and robustness. Use the tables above as the schema contract, and ensure every feature ties back to improving timely, accessible maternal care in the target context.