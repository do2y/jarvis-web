import { useLocation, useNavigate } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { LoginForm } from "./components/LoginForm";
import { SignupForm } from "./components/SignupForm";

type AuthTab = "login" | "signup";

export default function AuthPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // 경로(/login·/signup)로 초기 탭 결정, 탭 전환 시 URL도 동기화(뒤로가기·공유 대응)
  const tab: AuthTab = location.pathname === "/signup" ? "signup" : "login";
  const setTab = (next: string) => {
    const path = next === "signup" ? "/signup" : "/login";
    if (path !== location.pathname) {
      navigate({ pathname: path, search: location.search });
    }
  };

  return (
    <div className="min-h-screen bg-muted/40">
      <header className="flex h-16 items-center gap-2 border-b bg-background px-4 sm:px-6">
        <span className="flex size-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
          J
        </span>
        <span className="text-lg font-bold">Jarvis</span>
      </header>

      <main className="flex min-h-[calc(100vh-4rem)] items-start justify-center px-4 pt-24 pb-10 sm:items-center sm:pt-12 sm:pb-24">
        <div className="w-full max-w-md rounded-2xl bg-background p-6 shadow-sm sm:p-8">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="h-18 w-full">
              <TabsTrigger value="login">로그인</TabsTrigger>
              <TabsTrigger value="signup">회원가입</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="pt-8">
              <LoginForm onSwitchToSignup={() => setTab("signup")} />
            </TabsContent>

            <TabsContent value="signup" className="pt-8">
              <SignupForm onSwitchToLogin={() => setTab("login")} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
