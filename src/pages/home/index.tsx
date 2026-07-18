import { AppHeader } from "@/shared/ui/AppHeader";
import { Hero } from "./components/Hero";
import { CategoryGrid } from "./components/CategoryGrid";
import { PopularProducts } from "./components/PopularProducts";
import { RecommendedProducts } from "./components/RecommendedProducts";
import { HowItWorks } from "./components/HowItWorks";
import { HomeFooter } from "./components/HomeFooter";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main>
        <Hero />
        <CategoryGrid />
        {/* 개인화 추천은 로그인 시에만 렌더(게스트는 null) → 인기 상품보다 위 */}
        <RecommendedProducts />
        <PopularProducts />
        <HowItWorks />
      </main>
      <HomeFooter />
    </div>
  );
}
