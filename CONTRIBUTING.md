# Contributing to CareBridge AI

Thank you for your interest in contributing to CareBridge AI! This document outlines guidelines and steps to help you get started with contributing to both the patient portal and the clinical predictive AI models.

## 🚀 Code of Conduct
Please match our commitment to providing an inclusive, safe, and respectful environment for everyone. Keep communication supportive and client-focused.

## 📂 Repository Structure
- `/src/` - React & TypeScript client application source code.
  - `/src/views/` - Main views (Patient Dashboard, CHW Dashboard, Recovery Triage, Referrals).
  - `/src/components/` - Shared UI elements (Navigation, Onboarding, Chatbot).
  - `/src/lib/` - Service integrations (Firebase, Google Gen AI SDK).
- `/temp-epl-care-ai/` - Machine learning workspace containing the Jupyter training notebook, data assets, and the deployed API application.
- `requirements.txt` - Python backend package specifications.
- `package.json` - Node.js frontend package and script declarations.

## 💻 Setup & Development Workflow

### Frontend (React/Vite)
1. Install dependencies:
   ```bash
   npm install
   ```
2. Run development server:
   ```bash
   npm run dev
   ```
3. Run linting checks:
   ```bash
   npm run lint
   ```

### Backend / ML Model API
1. Install Python packages:
   ```bash
   pip install -r requirements.txt
   ```
2. Start Flask/FastAPI server:
   ```bash
   python temp-epl-care-ai/flask_app.py
   ```

## 📝 Coding Standards
- **TypeScript**: Ensure strict type definitions. Avoid using `any` unless absolutely necessary for external mock components.
- **Tailwind CSS**: Use structured and accessible color palettes. Avoid hardcoded contrasts that violate accessibility rules.
- **Git Commit Messages**: Keep messages clear, imperative, and structured. E.g., `feat: integrate predictive risk API in health worker console` or `fix: handle non-blocking local symptom checkout`.

## 🧪 Testing and Verification
Before creating a pull request:
- Run `npm run lint` to compile-check files.
- Test both patient login and clinical triage paths locally.
- Ensure all API fallback handlers are fully tested for offline scenario compatibility.
