cat > client/tailwind.config.ts << 'EOF'
import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
EOF