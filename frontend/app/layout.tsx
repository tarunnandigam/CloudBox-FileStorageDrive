import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { UserProvider } from "@/context/user.context";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CloudBox - Cloud File Storage",
  description:
    "CloudBox is a secure cloud file storage platform with OTP authentication.",
  keywords: [
    "file storage",
    "cloud storage",
    "file sharing",
    "free unlimited storage",
    "unlimited storage",
    "free",
    "unlimited",
    "storage",
    "saidev dhal",
    "saidev dhal projects",
  ],
  icons: {
    icon: [
      {
        media: "(prefers-color-scheme: light)",
        url: "/cloudboxlogo.png",
        href: "/cloudboxlogo.png",
      },
      {
        media: "(prefers-color-scheme: dark)",
        url: "/cloudboxpinklogo.png",
        href: "/cloudboxpinklogo.png",
      },
    ],
  },
  openGraph: {
    title: "Cloudbox - File Storage Service",
    description:
      "Cloudbox is a free & unlimited file storage service that allows you to store and share files with others. Built on the top of telegram. Made with love by Saidev Dhal",
    url: "https://cloud-box.devwtf.in",
    siteName: "Cloudbox",
    images: [
      {
        url: "https://i.imgur.com/WQhg2nq.png",
        width: 1200,
        height: 630,
        alt: "Cloudbox logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    site: "https://cloud-box.devwtf.in/",
    creator: "Saidev Dhal",
    title: "Cloudbox - File Storage Service",
    description:
      "Cloudbox is a free & unlimited file storage service that allows you to store and share files with others. Built on the top of telegram. Made with love by Saidev Dhal",
    images: "https://i.imgur.com/WQhg2nq.png",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} dark bg-black text-white`}>
        <UserProvider>
          {children}
          <Toaster />
        </UserProvider>
      </body>
    </html>
  );
}
