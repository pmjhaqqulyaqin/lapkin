/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
      extend: {
          colors: {
              "background": "#f8f9fa",
              "surface": "#f8f9fa",
              "inverse-surface": "#2e3132",
              "secondary-fixed-dim": "#78dc77",
              "secondary": "#006e1c",
              "primary": "#00222c",
              "primary-fixed-dim": "#9ecee1",
              "surface-container-lowest": "#ffffff",
              "primary-container": "#003847",
              "surface-dim": "#d9dadb",
              "error-container": "#ffdad6",
              "on-error": "#ffffff",
              "on-secondary-container": "#00731e",
              "secondary-fixed": "#94f990",
              "outline": "#737780",
              "surface-container-low": "#f3f4f5",
              "secondary-container": "#91f78e",
              "on-primary": "#ffffff",
              "on-primary-container": "#73a2b5",
              "on-error-container": "#93000a",
              "surface-bright": "#f8f9fa",
              "surface-variant": "#e1e3e4",
              "on-secondary": "#ffffff",
              "tertiary-container": "#592300",
              "on-tertiary-fixed": "#341100",
              "surface-tint": "#356476",
              "surface-container-high": "#e7e8e9",
              "primary-fixed": "#baeafe",
              "on-primary-fixed-variant": "#194d5d",
              "on-secondary-fixed": "#002204",
              "surface-container": "#edeeef",
              "outline-variant": "#c3c6d1",
              "tertiary": "#381300",
              "tertiary-fixed": "#ffdbca",
              "surface-container-highest": "#e1e3e4",
              "on-tertiary-fixed-variant": "#723610",
              "on-surface": "#191c1d",
              "inverse-on-surface": "#f0f1f2",
              "on-primary-fixed": "#001f28",
              "tertiary-fixed-dim": "#ffb690",
              "on-tertiary": "#ffffff",
              "error": "#ba1a1a",
              "on-background": "#191c1d",
              "on-surface-variant": "#43474f",
              "on-tertiary-container": "#d8885c",
              "inverse-primary": "#9ecee1",
              "on-secondary-fixed-variant": "#005313"
          },
          borderRadius: {
              "DEFAULT": "0.125rem",
              "lg": "0.5rem",
              "xl": "0.75rem",
              "full": "9999px"
          },
          fontFamily: {
              "headline": ["Manrope", "sans-serif"],
              "body": ["Inter", "sans-serif"],
              "label": ["Inter", "sans-serif"]
          },
          animation: {
              "slide-up": "slide-up 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards",
              "fade-in": "fade-in 0.4s ease-out forwards"
          },
          keyframes: {
              "slide-up": {
                  "0%": { opacity: 0, transform: "translateY(20px)" },
                  "100%": { opacity: 1, transform: "translateY(0)" }
              },
              "fade-in": {
                  "0%": { opacity: 0 },
                  "100%": { opacity: 1 }
              }
          }
      },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/container-queries')
  ],
}
