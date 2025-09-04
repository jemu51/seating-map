import type { Metadata } from "next"
import { GeistSans } from "geist/font/sans"
import { GeistMono } from "geist/font/mono"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

export const metadata: Metadata = {
  title: {
    default: "Concert Seat Booking Platform - Interactive Seating Map & Ticket Selection",
    template: "%s | Concert Seat Booking Platform",
  },
  description:
    "Book concert tickets with our interactive seating map platform. Real-time seat availability, adjacent seat finder, and seamless ticket selection experience for concerts and live events.",
  keywords: [
    "concert tickets",
    "seat booking",
    "interactive seating map",
    "concert venue",
    "ticket selection",
    "live events",
    "concert seating",
    "venue booking",
    "real-time availability",
    "adjacent seats",
    "concert platform",
    "ticket booking system",
  ],
  authors: [{ name: "Concert Seat Booking Platform" }],
  creator: "Concert Seat Booking Platform",
  publisher: "Concert Seat Booking Platform",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://concert-seat-booking.com"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://concert-seat-booking.com",
    title: "Concert Seat Booking Platform - Interactive Seating Map & Ticket Selection",
    description:
      "Book concert tickets with our interactive seating map platform. Real-time seat availability, adjacent seat finder, and seamless ticket selection experience for concerts and live events.",
    siteName: "Concert Seat Booking Platform",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Concert Seat Booking Platform - Interactive Seating Map",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Concert Seat Booking Platform - Interactive Seating Map & Ticket Selection",
    description:
      "Book concert tickets with our interactive seating map platform. Real-time seat availability and seamless ticket selection experience.",
    images: ["/twitter-image.jpg"],
    creator: "@concertbooking",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
    yandex: "your-yandex-verification-code",
    yahoo: "your-yahoo-verification-code",
  },
  category: "entertainment",
  classification: "Concert Ticket Booking Platform",
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "Concert Seat Booking",
    "application-name": "Concert Seat Booking Platform",
    "msapplication-TileColor": "#000000",
    "theme-color": "#000000",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/site.webmanifest" />
        <link rel="canonical" href="https://concert-seat-booking.com" />

        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "Concert Seat Booking Platform",
              description:
                "Interactive seating map platform for booking concert tickets with real-time availability and seat selection features.",
              url: "https://concert-seat-booking.com",
              applicationCategory: "EntertainmentApplication",
              operatingSystem: "Web Browser",
              offers: {
                "@type": "Offer",
                category: "Concert Tickets",
                description: "Concert ticket booking and seat selection services",
              },
              featureList: [
                "Interactive Seating Map",
                "Real-time Seat Availability",
                "Adjacent Seat Finder",
                "Mobile Responsive Design",
                "Accessibility Features",
                "Live Updates via WebSocket",
              ],
              browserRequirements: "Requires JavaScript. Requires HTML5.",
              screenshot: "https://concert-seat-booking.com/screenshot.jpg",
            }),
          }}
        />

        {/* Additional SEO Meta Tags */}
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <meta name="theme-color" content="#000000" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Concert Seat Booking" />
        <meta name="application-name" content="Concert Seat Booking Platform" />
        <meta name="msapplication-TileColor" content="#000000" />
        <meta name="msapplication-config" content="/browserconfig.xml" />

        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={`font-sans ${GeistSans.variable} ${GeistMono.variable}`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
