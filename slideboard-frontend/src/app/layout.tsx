// Since we have a root layout in [locale], we don't need a complex one here.
// However, Next.js requires a root layout in app/
// The middleware should handle redirection to /[locale]

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
