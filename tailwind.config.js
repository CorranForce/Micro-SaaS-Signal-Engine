/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "ms-bg": "#0a0c10",
        "ms-card": "#121620",
        "ms-card-light": "#1a1f2c",
        "ms-green": "#00f076",
        "ms-green-dark": "#053a20",
        "ms-yellow": "#ffb300",
        "ms-text": "#f3f4f6",
        "ms-text-muted": "#9ca3af",
        "ms-border": "#1f2937",
        "ms-border-active": "#374151"
      },
      fontFamily: {
        ms: ["Courier New", "monospace"],
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
