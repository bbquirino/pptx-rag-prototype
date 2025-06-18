// app/layout.tsx

export const metadata = {
  title: 'Alberta RAG Prototype',
  description: 'Economic Research Assistant',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
