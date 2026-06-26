import { Outfit } from "next/font/google";
import ToastProvider from "@/components/ToastProvider";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-outfit",
});

export const metadata = {
  title: "Pathlab Authentication System",
  description: "Next.js 15, Prisma, MySQL, Firebase, JWT Auth System",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${outfit.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-blue-600 selection:text-white">
        <ToastProvider />
        <div className="flex-1 flex flex-col">{children}</div>
      </body>
    </html>
  );
}
