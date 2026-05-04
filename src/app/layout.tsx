import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import Providers from "@/components/Providers";

export const metadata: Metadata = {
  title: "Matthew Kelly",
  description: "Personal site, blog, and project notes.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen flex flex-col">
        <Providers>
          <Nav />
          <main className="flex-1 mx-auto w-full max-w-3xl px-6 py-10">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
