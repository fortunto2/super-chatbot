export default function GalleryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-[calc(100vh-60px)]">
      {children}
    </div>
  );
} 