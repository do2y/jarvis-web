import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useNavigate, useSearchParams, Navigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ImagePlus, X } from "lucide-react";
import type { ProductCard } from "@/shared/types/chat";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { reviewSchema, type ReviewValues } from "./reviewSchema";
import { useCreateReview } from "./useCreateReview";
import { StarRatingInput } from "./components/StarRatingInput";

export default function ReviewWritePage() {
  const [params] = useSearchParams();
  const orderId = params.get("orderId");
  const productId = Number(params.get("productId"));
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // 상품 정보는 진입 시 시딩된 상세 캐시에서 읽는다(주문 카드 → setQueryData).
  const product = queryClient.getQueryData<Partial<ProductCard>>([
    "products",
    productId,
  ]);

  // 사진은 목: 파일명만 유지(백엔드 업로드 API 붙을 때 실제 전송).
  const [photos, setPhotos] = useState<string[]>([]);

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ReviewValues>({
    resolver: zodResolver(reviewSchema),
    defaultValues: { rating: 0, content: "" },
  });

  const { mutate, isPending, errorMessage } = useCreateReview();

  // 필수 파라미터 없이 직접 진입 → 주문 내역으로
  if (!orderId || !Number.isFinite(productId)) {
    return <Navigate to="/mypage/orders" replace />;
  }

  const onSubmit = (values: ReviewValues) => {
    mutate(
      { orderId, productId, ...values },
      { onSuccess: () => navigate("/mypage/orders", { replace: true }) },
    );
  };

  return (
    <div>
      <h2 className="text-lg font-bold">후기 작성</h2>

      {/* 대상 상품 요약 — 시딩 캐시 있으면 표시 */}
      {product && (
        <div className="mt-5 flex gap-4 rounded-xl border bg-background p-4">
          <img
            src={product.imageUrl}
            alt=""
            className="size-16 shrink-0 rounded-xl bg-muted object-cover"
          />
          <div className="flex min-w-0 flex-col justify-center gap-1">
            <p className="text-xs text-muted-foreground">{product.brandName}</p>
            <p className="truncate text-sm font-medium">{product.name}</p>
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mt-6 flex flex-col gap-7"
        noValidate
      >
        {/* 별점 */}
        <div className="flex flex-col gap-2">
          <Label>별점</Label>
          <Controller
            control={control}
            name="rating"
            render={({ field }) => (
              <StarRatingInput value={field.value} onChange={field.onChange} />
            )}
          />
          {errors.rating && (
            <p className="text-sm text-destructive">{errors.rating.message}</p>
          )}
        </div>

        {/* 내용 */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="review-content">후기 내용</Label>
          <textarea
            id="review-content"
            rows={6}
            placeholder="상품은 어떠셨나요? 사이즈, 소재, 배송 등 솔직한 후기를 남겨주세요."
            aria-invalid={!!errors.content}
            className={cn(
              "w-full resize-none rounded-xl border border-input bg-transparent px-3.5 py-3 text-sm outline-none transition-colors",
              "placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
              "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
            )}
            {...register("content")}
          />
          {errors.content && (
            <p className="text-sm text-destructive">{errors.content.message}</p>
          )}
        </div>

        {/* 사진 첨부 (목: 파일명만 유지) */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="review-photos">사진 첨부 (선택)</Label>
          <div className="flex flex-wrap gap-2">
            {photos.map((name) => (
              <span
                key={name}
                className="inline-flex h-9 items-center gap-1 rounded-full bg-muted px-3 text-xs text-muted-foreground"
              >
                <span className="max-w-32 truncate">{name}</span>
                <button
                  type="button"
                  aria-label={`${name} 제거`}
                  onClick={() =>
                    setPhotos((prev) => prev.filter((n) => n !== name))
                  }
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              </span>
            ))}
            <label
              htmlFor="review-photos"
              className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted"
            >
              <ImagePlus className="size-4" />
              사진 추가
            </label>
            <input
              id="review-photos"
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                const names = Array.from(e.target.files ?? []).map((f) => f.name);
                setPhotos((prev) => [...prev, ...names]);
                e.target.value = ""; // 같은 파일 재선택 허용
              }}
            />
          </div>
        </div>

        {errorMessage && (
          <p className="text-sm text-destructive" role="alert">
            {errorMessage}
          </p>
        )}

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(-1)}
            className="h-12 flex-1 rounded-full"
          >
            취소
          </Button>
          <Button
            type="submit"
            disabled={isPending}
            className="h-12 flex-1 rounded-full"
          >
            {isPending ? "등록 중…" : "후기 등록"}
          </Button>
        </div>
      </form>
    </div>
  );
}
