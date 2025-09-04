import Head from "next/head"

interface SEOHeadProps {
  title?: string
  description?: string
  keywords?: string[]
  canonical?: string
  ogImage?: string
  ogType?: string
  twitterCard?: string
  structuredData?: object
  noindex?: boolean
  nofollow?: boolean
}

export function SEOHead({
  title = "Concert Seat Booking Platform - Interactive Seating Map & Ticket Selection",
  description = "Book concert tickets with our interactive seating map platform. Real-time seat availability, adjacent seat finder, and seamless ticket selection experience for concerts and live events.",
  keywords = [
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
  canonical,
  ogImage = "/og-image.jpg",
  ogType = "website",
  twitterCard = "summary_large_image",
  structuredData,
  noindex = false,
  nofollow = false,
}: SEOHeadProps) {
  const fullTitle = title.includes("Concert Seat Booking Platform") ? title : `${title} | Concert Seat Booking Platform`

  const robots = [
    noindex ? "noindex" : "index",
    nofollow ? "nofollow" : "follow",
    "max-snippet:-1",
    "max-image-preview:large",
    "max-video-preview:-1",
  ].join(", ")

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords.join(", ")} />
      <meta name="robots" content={robots} />
      <link rel="canonical" href={canonical || "https://concert-seat-booking.com"} />

      {/* Open Graph Meta Tags */}
      <meta property="og:type" content={ogType} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:url" content={canonical || "https://concert-seat-booking.com"} />
      <meta property="og:site_name" content="Concert Seat Booking Platform" />
      <meta property="og:locale" content="en_US" />

      {/* Twitter Card Meta Tags */}
      <meta name="twitter:card" content={twitterCard} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:creator" content="@concertbooking" />
      <meta name="twitter:site" content="@concertbooking" />

      {/* Additional SEO Meta Tags */}
      <meta name="author" content="Concert Seat Booking Platform" />
      <meta name="publisher" content="Concert Seat Booking Platform" />
      <meta name="copyright" content="Concert Seat Booking Platform" />
      <meta name="language" content="en" />
      <meta name="revisit-after" content="1 days" />
      <meta name="rating" content="general" />
      <meta name="distribution" content="global" />

      {/* Structured Data */}
      {structuredData && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData),
          }}
        />
      )}
    </Head>
  )
}
