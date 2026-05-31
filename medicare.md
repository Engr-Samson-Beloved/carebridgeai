## Action Points and Implementation Plan

### 1) Simplify the patient landing page
**Agreement:** Keep the patient experience simple, especially on desktop, and reduce clutter in the main layout.

**Action points for developer**
- Review the current patient home page and identify items that can be moved out of the main view.
- Move secondary items like **WhatsApp community** into a side/control area.
- Keep the most important actions visible: recovery test, appointment reminders, daily symptom log, and support access.
- Ensure the mobile version remains clean and easy to scan.

**Example/use case from the call**
- Okeya said the page should not feel confusing.
- Olabanji suggested making WhatsApp community a control-center item instead of a main card.

**Implementation notes**
- Use a card-based layout on desktop with fewer primary cards.
- Put less-used items in a sidebar or secondary menu.
- Keep the same structure on mobile only if it remains lightweight.

---

### 2) Add appointment tracking and reminder flow
**Agreement:** Patients should be able to set recurring antenatal appointments and receive reminders.

**Action points for developer**
- Add an appointment tracking component on patient home.
- Allow users to set a recurring schedule, for example:
  - Every Thursday antenatal visit
  - Every 2 weeks follow-up
- Generate reminder notifications based on the next scheduled date.
- Include optional reminder text such as medication, water, food, and preparation tips.

**Example/use case from the call**
- Okeya gave the example of a woman whose antenatal date is every Thursday.
- If today is Wednesday, the app should remind her that the appointment is tomorrow.

**Implementation notes**
- Support both one-time and recurring schedules.
- Add a simple reminder template engine:
  - “Don’t forget your appointment tomorrow.”
  - “Your next antenatal visit is next Thursday.”
- If possible, trigger push notifications or in-app alerts.

---



### 4) Build daily symptom logging on “How is your heart doing today?”
**Agreement:** Add a lightweight daily symptom reflection that is not as heavy as a full recovery test.

**Action points for developer**
- Turn the “How is your heart doing today?” area into a daily symptom entry point.
- Add a plus/add button that opens a quick symptom log form.
- Allow free-text input so users can describe symptoms in their own words.
- Allow AI-suggested symptom tags, but do not depend on them only.

**Example/use case from the call**
- Okeya suggested that the patient could say things like:
  - “I’m not feeling very fine today.”
  - “My head wants to remove.”
- She also said the AI may not always suggest the exact symptom.

**Implementation notes**
- Use a quick modal or bottom sheet for symptom logging.
- Fields can include:
  - text description
  - emoji/mood selector
  - optional symptom tags
- Save the entry to the patient timeline and health-worker view.

---

### 5) Improve recovery test and triage wording
**Agreement:** The current recovery test questions need stronger and more clinically appropriate wording.

**Action points for developer**
- Review the existing symptom questions and labels.
- Replace vague or weak symptom wording with clearer clinical terms.
- Keep the recovery test and pregnancy triage flow distinct but connected.
- Make sure the final result still routes the user to the correct next step.

**Example/use case from the call**
- Okeya said some options like pain/discomfort and bleeding do not feel strong enough clinically.
- She planned to ask a colleague on Monday for better phrasing.

**Implementation notes**
- Separate the assessment into clear sections:
  - symptoms
  - gestational age
  - risk factors
  - follow-up result
- After submission, call the AI/API and return a risk state like low, follow-up likely, or high risk.
- Use clearer labels and help text.

---

### 6) Add health-worker dashboard and manual patient entry
**Agreement:** Health workers should be able to view flagged patients and manually add patient data during field visits.

**Action points for developer**
- Create a health-worker dashboard.
- Show patients who need follow-up or are high-risk.
- Add a manual input flow for health workers to log patient information.
- Allow them to record symptoms on behalf of patients.
- Include a way to search or suggest nearby available health workers/clinics if needed.

**Example/use case from the call**
- Okeya explained that rural women may not have phones.
- Health workers visiting them should be able to input data into the app for them.

**Implementation notes**
- Health-worker account should have different permissions from patient account.
- Provide a simple visit form with:
  - patient details
  - symptoms
  - notes
  - follow-up action
- Make sure manually added entries are linked to the correct patient record.

---

### 7) Add support clinic and care resources
**Agreement:** The support section should include care-oriented resources, not just emergency actions.

**Action points for developer**
- Expand the support clinic area.
- Add options for:
  - nearest clinic
  - counselor/therapist suggestions
  - WhatsApp support
  - emergency SOS dispatch
- Keep support tools easy to access from patient home.

**Example/use case from the call**
- Okeya suggested locating nearby counselors or therapists.
- She also proposed WhatsApp support in addition to emergency help.

**Implementation notes**
- Use a grouped support module.
- Keep emergency buttons visible but not overwhelming.
- If location is available, use it to recommend nearby services.

---

### 8) Handle privacy and patient data visibility
**Agreement:** Patient data should be visible only in the appropriate patient context and protected properly.

**Action points for developer**
- Review who can access patient assessment data.
- Restrict patient records to the relevant patient and authorized health workers.
- Make sure data entered for one patient does not appear globally.
- Add clear access rules for manually added patients.

**Example/use case from the call**
- Okeya raised concern that everybody should not be able to see every patient’s data.
- Olabanji clarified that the current prototype shows shared data only for demo purposes.

**Implementation notes**
- Apply role-based access control.
- Separate patient, health-worker, and admin views.
- Log access where needed.

---

## Suggested Priority Order
1. Simplify patient home UI
2. Add gestational age input
3. Build daily symptom logging
4. Improve recovery test wording and flow
5. Add appointment reminders
6. Build health-worker dashboard and manual entry
7. Expand support clinic resources
8. Tighten privacy and access control

## Short Developer Checklist
- [ ] Simplify desktop and mobile layout
- [ ] Move WhatsApp community to control area
- [ ] Add appointment reminder module
- [ ] Add pregnancy week input
- [ ] Add daily symptom log with free text
- [ ] Refine recovery test wording
- [ ] Separate triage and recovery flow
- [ ] Build health-worker dashboard
- [ ] Enable manual patient logging
- [ ] Add clinic/support resources
- [ ] Implement role-based data access

If you want, I can turn this into:
- a **developer task list**,
- a **product roadmap**, or
- a **technical implementation spec**.