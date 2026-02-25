export default function AppFooter() {
  return (
    <footer className="mt-auto pt-12 pb-6 px-4">
      <div className="border-t border-white/[0.06] pt-6">
        <div className="flex items-center justify-center gap-3">
          <div className="h-px w-12 bg-gradient-to-r from-transparent to-blue-400/40" />
          <div className="text-center">
            <p className="text-sm font-medium text-white/50">
              Conçu & développé par{' '}
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent font-semibold">
                Libasse MBOUP
              </span>
            </p>
            <p className="text-xs text-white/30 mt-1">
              AI Engineer &middot; Data Scientist
            </p>
          </div>
          <div className="h-px w-12 bg-gradient-to-l from-transparent to-blue-400/40" />
        </div>
      </div>
    </footer>
  );
}
