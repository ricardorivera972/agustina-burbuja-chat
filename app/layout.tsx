import "./globals.css";

export const metadata = {
  title: "Asistente Comercial",
  description: "Demo de asistente comercial virtual",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}