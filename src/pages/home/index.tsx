import { AppHeader } from "@/shared/ui/AppHeader";
import { Hero } from "./components/Hero";
import { CategoryGrid } from "./components/CategoryGrid";
import { PopularProducts } from "./components/PopularProducts";
import { HowItWorks } from "./components/HowItWorks";
import { HomeFooter } from "./components/HomeFooter";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <main>
        <Hero />
        <CategoryGrid />
        <PopularProducts />
        <HowItWorks />
      </main>
      <HomeFooter />
    </div>
  );
}
