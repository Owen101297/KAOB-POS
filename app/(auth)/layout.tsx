export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-900 antialiased selection:bg-slate-800 selection:text-white">
      {children}
    </div>
  );
}
