export default function BlackButton({
  children,
  onClick,
  className,
}: {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <button
      className={`cursor-pointer bg-black hover:bg-zinc-800 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 font-semibold transition-all ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
