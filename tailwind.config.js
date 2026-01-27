/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: "#3A6CF4",
                secondary: "#111827",
                accent: "#22C55E",
            }
        },
    },
    plugins: [],
}
