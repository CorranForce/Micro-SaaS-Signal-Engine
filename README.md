<div align="center">
  <img width="1200" height="475" alt="Micro-SaaS Signal Engine Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />

  # 🚀 Micro-SaaS Signal Engine
  
  **Discover, Validate, and Prepare to Launch Highly Profitable, Boring B2B Micro-SaaS Solutions in Legacy Industries.**
  
  [![Next.js](https://img.shields.io/badge/Framework-Next.js%2016-black?style=flat-square&logo=next.js)](https://nextjs.org/)
  [![Google GenAI SDK](https://img.shields.io/badge/AI-Google%20GenAI-green?style=flat-square)](https://ai.google.dev/)
  [![Firebase](https://img.shields.io/badge/Database-Firebase%20Firestore-orange?style=flat-square&logo=firebase)](https://firebase.google.com/)
  [![Tailwind CSS v4](https://img.shields.io/badge/Styling-Tailwind%20CSS%20v4-blue?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
</div>

---

## 📖 About the App

The **Micro-SaaS Signal Engine** is an AI-powered B2B opportunity discovery and strategic validation launchpad. Modern SaaS is saturated, yet millions of real-world legacy businesses (contractors, local logistics, physical retailers) operate daily on spreadsheet workarounds and highly fragmented single-user workflows. 

This application scours raw validation signals, crafts comprehensive B2B micro-SaaS value propositions, verifies market demand via live sifting, provides a complete implementation runway, and automates high-yield Launch Kits delivered directly to your inbox.

---

## 🔥 Key Capabilities & Features

### 1. 🎯 B2B Micro-SaaS Sifter
* Search and auto-discover high-opportunity niches inside legacy spaces.
* Analyzes industry-specific friction, tedious manual tasks, and sub-optimal point solutions.

### 2. 🤖 AI Validation Briefing
* Deep architectural validation leveraging the server-side **Google Gemini SDK** (`gemini-3.5-flash`).
* Evaluates "Go / No-Go" market validation scores, strategic friction points, key competitors, and immediate expansion potential.

### 3. 🔍 Live Target Sifting Log
* Crawls and aggregates critical active complaints and feature queries directly from **Reddit**, **YouTube video walkthroughs**, and industry forums.
* Displays a detailed live sifting log containing practical user frustration points, manual spreadsheet workarounds, and existing software gaps.

### 4. 📦 Complete Launch Kit Panel
* **Lovable.dev Starter Prompt**: Instantly copyable, full-fidelity instructions to bootstrap code implementation in minutes.
* **4-Week Build Roadmap**: Granular, structured step-by-step engineering timeline.
* **Pricing Tier Strategy**: Model configurations designed to maximize initial B2B sign-ups and operations.
* **ROI and MRR Estimates**: Practical MRR estimations, operational margins, scaling paths, and clear break-even months.
* **High-Impact Sales Script**: Tele-sales, cold-outreach, or elevator pitches targeted at solving the owner's precise bottleneck.

### 5. 📧 Email Dispatch System
* Native **Resend API** integration to bundle and transmit your full Launch Kit, AI Validation logs, and Live Sifting Brief straight to your email.
* Background-triggered micro-sends: When the engine finishes generating your reports, it can auto-fire them directly to your logged-in profile email.

### 6. 💾 Firebase & Supabase Persistence
* Secure Firestore collections saving your research pipelines and custom portfolios.
* Seamless offline state handling and continuous user session states using Firebase Security Rules.

---

## 🛠️ Technology Stack

* **Front-end / App Core**: Next.js 16 (App Router, App-level API Routes, Server Components)
* **Design & Styling**: Tailwind CSS v4 (Pure utility layer, CSS PostCSS plugin integration, custom modular aesthetics)
* **State & Transitions**: React Hooks, dynamic state handling, Framer Motion for sleek entrance rhythm
* **AI Model Pipeline**: `@google/genai` TypeScript SDK (utilizing `gemini-3.5-flash`)
* **Persistence & auth**: Firebase Auth, Firestore DB, with full backward-compatibility fallback mechanisms.

---

## 🚀 Setting Up Locally

Follow these quick instructions to run the Micro-SaaS Signal Engine on your local machine:

### Prerequisites
* **Node.js** (v18 or higher recommended)
* **npm** or **yarn**

### 1. Clone & Enter Directory
```bash
git clone <your-repository-url>
cd <your-repository-folder>
```

### 2. Install Project Dependencies
```bash
npm install
```

### 3. Setup Local Environment Variables
Create a `.env.local` file in the root directory:
```env
# Gemini API Key for Server-Side AI Validation and Signal Research
GEMINI_API_KEY=your_gemini_api_key_here

# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_firebase_app_id

# Email Integration (Optional)
RESEND_API_KEY=your_resend_api_key_here
```

### 4. Fire Up the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to explore the Micro-SaaS Signal Engine.

---

## 🏁 Deployment

### Production Compilation
Before deploying your application, run a production build test to ensure clean TS compiling and optimal asset bundling:
```bash
npm run build
```

This applet runs seamlessly on containerized hosting frameworks such as **Google Cloud Run**, **Vercel**, or **Amplify**, fully compatible with serverless execution models.

---

## 📄 License & Permissions
Refer to the `metadata.json` for precise visual sandbox frameworks, permissions, and required scope parameters. Prepared dynamically for high-fidelity engineering in Google AI Studio. 

*Harness real signals. Build real tools. Launch micro-SaaS now.*
