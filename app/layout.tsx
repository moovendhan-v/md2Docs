import "./globals.css";

export const metadata = {
  title: "MD → Docs",
  description: "Convert Markdown to Docs",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
