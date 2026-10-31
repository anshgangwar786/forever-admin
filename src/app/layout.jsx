import "./globals.css";
import "react-toastify/dist/ReactToastify.css";
import { AdminAuthProvider } from "../context/AdminAuthContext";
import { ThemeProvider } from "../context/ThemeContext";

export const metadata = {
  title: "Vellora — Atelier Mission Control",
  description: "Flagship luxury digital storefront and administrative control room",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-canvas dark:bg-[#12100E] text-ink dark:text-[#FAF8F5] font-sans antialiased selection:bg-ink selection:text-canvas">
        <ThemeProvider>
          <AdminAuthProvider>{children}</AdminAuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
