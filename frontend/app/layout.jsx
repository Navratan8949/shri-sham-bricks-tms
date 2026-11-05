import "./globals.css";
import StoreProvider from "@/src/store/Provider";
import { Toaster } from "sonner";

export const metadata = {
  title: {
    default: "Shri Shyam Bricks | Supply & Fleet P&L",
    template: "%s | Shri Shyam Bricks",
  },
  description: "Simple building material supply register, own-fleet vehicle expenses and vehicle-wise profit and loss management.",
  applicationName: "Shri Shyam Bricks Supply & Fleet",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-screen bg-[#fbf9f6] text-stone-900 antialiased selection:bg-orange-600 selection:text-white">
        <StoreProvider>{children}</StoreProvider>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
