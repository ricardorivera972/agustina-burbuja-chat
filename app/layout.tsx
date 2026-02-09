export const metadata = {
  title: "Lisa Web",
  description: "Asistente comercial Lisa",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body style={{ margin: 0, padding: 0, fontFamily: "Arial" }}>
        {children}
      </body>
    </html>
  );
}


