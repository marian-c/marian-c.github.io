import typography from '@tailwindcss/typography';
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/classnames.ts"
  ],
  theme: {
    extend: {
      colors: {
        "pane-background": "#f0f0f0",
        "button-background": "#e1e1e1",
        "button-background-hover": "#c4e1ff",
        "button-border": "#7a7a7a",
        "button-border-hover": "#2883da",
        "button-border-focus": "#2883da",

      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
    },
  },
  plugins: [typography],
};
export default config;
