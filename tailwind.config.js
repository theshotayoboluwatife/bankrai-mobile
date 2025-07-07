/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}",
    "./screens/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./navigation/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Light mode colors
        primary: '#000000',
        secondary: '#333333',
        background: '#FFFFFF',
        surface: '#F5F5F5',
        error: '#FF0000',
        'text-primary': '#000000',
        'text-secondary': '#333333',
        // Dark mode colors
        'dark-primary': '#FFFFFF',
        'dark-secondary': '#CCCCCC',
        'dark-background': '#121212',
        'dark-surface': '#1E1E1E',
        'dark-error': '#FF4444',
        'dark-text-primary': '#FFFFFF',
        'dark-text-secondary': '#CCCCCC',
      },
      fontFamily: {
        regular: ['System'],
        medium: ['System'],
        bold: ['System'],
      },
    },
  },
  plugins: [],
};
