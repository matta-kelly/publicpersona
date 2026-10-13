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
      <body className="flex min-h-screen flex-col">
        <Providers>
          <Nav />
          <main className="column flex-1 py-10">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
