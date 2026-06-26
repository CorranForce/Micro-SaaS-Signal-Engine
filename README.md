# Micro-SaaS Signal Engine

Discover underserved, high-retention B2B opportunities in legacy industries. Instantly generate full Launch Kits, including Vibe-Coding prompts, database structures, ROI matrices, and cold outreach copy.

## Overview

The **Micro-SaaS Signal Engine** is designed to help entrepreneurs find boring but highly profitable B2B SaaS ideas. Instead of competing in crowded consumer markets, this tool points you towards unglamorous niches (like HVAC, property management, auto repair) where businesses are eager for simple digital solutions that save them time and money.

With the power of AI, this engine acts as a "live social & forum crawler" that spots pain points and converts them into ready-to-execute Launch Kits.

## Features

- **Niche Selection:** Choose from multiple predefined legacy industries or enter your own custom niche (e.g., HVAC, Property Management, Custom Manufacturing).
- **Target Customization:** Specify your technical experience level and target Monthly Recurring Revenue (MRR).
- **Live Terminal Feed:** Simulates a live crawl through forums and subreddits, finding real complaints and inefficiencies.
- **Launch Kit Generation:** Automatically generates complete micro-SaaS blueprints using the Gemini API.
  - **The Core Hook:** Name, tagline, and the core problem solved.
  - **Feature Specs:** Core features with detailed descriptions.
  - **Vibe-Coding Prompts:** Ready-to-use prompts for AI coding assistants.
  - **Database Architecture:** Suggested schema structures for the initial build.
  - **Financial Metrics:** Pricing models and break-even calculations.
  - **Go-to-Market Strategy:** Cold outreach scripts and target customer profiles.
- **Save & Export:** Save ideas locally for future reference or export them directly as a highly polished PDF document.
- **Compact Mode:** A settings toggle to adjust the UI and fit more information on screen.
- **Operator Authentication:** A built-in authentication system with secure API settings management.

## Tech Stack

This project is built using modern web technologies:

- **Framework:** [Next.js 15](https://nextjs.org/) (App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **AI Integration:** [@google/genai](https://github.com/google/genai-js) (Gemini API)
- **PDF Export:** [html2pdf.js](https://ekoopmans.github.io/html2pdf.js/)

## Getting Started

### Prerequisites

Ensure you have Node.js and npm installed.

### Installation

1. Clone the repository:
   ```bash
   git clone <your-repo-url>
   cd ai-studio-applet
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory and configure your Gemini API Key:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open your browser and navigate to `http://localhost:3000` to access the application.

## Usage

1. **Find Ideas:** Start by selecting a niche or typing in a custom one. Set your parameters and click **"INITIATE SIGNAL SWEEP"**.
2. **Review:** Watch the live terminal feed and then review the generated SaaS ideas.
3. **Save:** Save the ideas you like using the bookmark icon on the idea card.
4. **Export:** Export any idea as a PDF for a clean, shareable Launch Kit.
5. **Settings:** Navigate to the API settings tab to configure external API keys (authentication restricted to the operator). Use the Compact Mode toggle to adjust your viewing preference.

## Design Philosophy

The application follows a "Boring B2B SaaS Philosophy", focusing on building simple, efficient, and offline-first solutions. The UI/UX is built to reflect this—clean, technical, and without unnecessary bloat. It features a retro-futuristic dark mode theme, emphasizing data density and actionable insights over flashy consumer designs.

## License

This project is licensed under the MIT License.
