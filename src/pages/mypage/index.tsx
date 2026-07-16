import { Navigate, Route, Routes } from "react-router-dom";
import { AppHeader } from "@/shared/ui/AppHeader";
import { ProfileHeader } from "./components/ProfileHeader";
import { MyPageNav } from "./components/MyPageNav";
import OrdersPage from "./OrdersPage";
import OrderDetailPage from "./OrderDetailPage";
import ClaimsPage from "./ClaimsPage";
import ReviewWritePage from "./ReviewWritePage";
import RecentProductsPage from "./RecentProductsPage";
import WishlistPage from "./WishlistPage";
import AddressesPage from "./AddressesPage";
import InquiriesPage from "./InquiriesPage";

export default function MyPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <AppHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-8 sm:px-6 sm:pb-28 sm:pt-12">
        <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
          <div className="flex flex-col gap-3 lg:w-56 lg:shrink-0">
            <ProfileHeader />
            <MyPageNav />
          </div>
          <div className="min-w-0 flex-1">
            <Routes>
              <Route index element={<Navigate to="orders" replace />} />
              <Route path="orders" element={<OrdersPage />} />
              <Route path="orders/:orderId" element={<OrderDetailPage />} />
              <Route path="reviews/new" element={<ReviewWritePage />} />
              <Route path="claims" element={<ClaimsPage />} />
              <Route path="recent" element={<RecentProductsPage />} />
              <Route path="wishlist" element={<WishlistPage />} />
              <Route path="addresses" element={<AddressesPage />} />
              <Route path="inquiries" element={<InquiriesPage />} />
              <Route path="*" element={<Navigate to="orders" replace />} />
            </Routes>
          </div>
        </div>
      </main>
    </div>
  );
}
