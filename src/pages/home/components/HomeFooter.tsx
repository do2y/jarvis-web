export function HomeFooter() {
  return (
    <footer className="border-t px-6 py-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row">
        <div className="flex items-center gap-2">
          <span className="flex size-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
            J
          </span>
          <span className="font-semibold text-foreground">Jarvis</span>
          <span className="hidden sm:inline">AI Shopping Agent</span>
        </div>

        <p>© 2026 Jarvis. All rights reserved.</p>

        <nav className="flex items-center gap-4">
          {/* TODO: 각 정책 페이지 라우트 확정 시 연결 */}
          <button type="button" className="hover:text-foreground">
            서비스 소개
          </button>
          <button type="button" className="hover:text-foreground">
            개인정보처리방침
          </button>
          <button type="button" className="hover:text-foreground">
            이용약관
          </button>
        </nav>
      </div>
    </footer>
  );
}
