// Expose fallback/placeholder values as we load Lora font directly in app/globals.css
// to bypass Turbopack build errors with next/font/google.
export const lora = {
  className: "font-serif",
  variable: "font-serif",
};

