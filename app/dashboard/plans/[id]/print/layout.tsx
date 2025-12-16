export default function PrintLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Minimal layout that doesn't include dashboard navigation
  // This prevents theme styles from interfering with print
  return <>{children}</>;
}
