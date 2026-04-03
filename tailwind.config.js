/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
            },
            borderRadius: {
                'sm':   '6px',
                DEFAULT:'8px',
                'md':   '8px',
                'lg':   '10px',   // badges, tags
                'xl':   '12px',   // buttons, inputs, nav items
                '2xl':  '16px',   // cards, modals, dropdowns
                'full': '9999px',
            },
            colors: {
                primary: "#B8860B",
                "primary-light": "#FEF9C3",
                secondary: "#111827",
                accent: "#DAA520",
                "task-pending": {
                    bg: "#FFF1F2",
                    fg: "#E11D48",
                },
                "task-working": {
                    bg: "#FFFBEB",
                    fg: "#D97706",
                },
                "task-done": {
                    bg: "#ECFDF5",
                    fg: "#059669",
                },
                "task-submitted": {
                    bg: "#FEF3C7",
                    fg: "#B45309",
                },
                "task-locked": {
                    bg: "#F9FAFB",
                    fg: "#94A3B8",
                },
            }
        },
    },
    plugins: [],
}
