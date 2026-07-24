import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ChatResult } from "@/shared/types/chat";
import type {
  SellerOrderTab,
  SellerProductSort,
  SellerProductTab,
  SellerWorkspaceTab,
} from "../types";
import { AnalysisReport } from "./AnalysisReport";
import { OrderList } from "./OrderList";
import { ProductList } from "./ProductList";
import { ProductDiffCard } from "./ProductDiffCard";

interface SellerWorkspaceProps {
  tab: SellerWorkspaceTab;
  onTabChange: (tab: SellerWorkspaceTab) => void;
  /** AI 결과(diff) — 있고 showResults가 true면 목록 대신 결과를 보여준다 */
  results: ChatResult[];
  showResults: boolean;
  isStreaming: boolean;
  /** 분석 리포트 본문(analysis+replace) — 있으면 결과 영역에 리포트를 표시 */
  analysisReport: string | null;
  /** 분석 스트림 진행 중 — 리포트 확정 전 스켈레톤 표시(lane:analysis) */
  analysisLoading: boolean;
  onBackToList: () => void;
  onConfirmDraft: (draftId: string) => void;
  onCancelDraft: (draftId: string) => void;
}

const WORKSPACE_TABS: { key: SellerWorkspaceTab; label: string }[] = [
  { key: "orders", label: "주문 관리" },
  { key: "products", label: "상품 관리" },
];

/**
 * 채팅 화면 우측 작업 영역 — 주문/상품 목록(조회) + AI 결과(diff) 패널.
 * 상단(탭·필터)은 고정, 목록만 스크롤된다. 대상 선택은 채팅 자연어로 한다.
 */
export function SellerWorkspace({
  tab,
  onTabChange,
  results,
  showResults,
  isStreaming,
  analysisReport,
  analysisLoading,
  onBackToList,
  onConfirmDraft,
  onCancelDraft,
}: SellerWorkspaceProps) {
  // 목록 필터·페이지는 워크스페이스 로컬 상태(URL과 분리 — 채팅 화면은 딥링크 대상이 아님)
  const [orderTab, setOrderTab] = useState<SellerOrderTab>("ALL");
  const [orderPage, setOrderPage] = useState(0);
  const [productTab, setProductTab] = useState<SellerProductTab>("ALL");
  const [productSort, setProductSort] = useState<SellerProductSort>("latest");
  const [productPage, setProductPage] = useState(0);

  const draftResults = results.filter((r) => r.kind === "draft");

  return (
    // 우측 콘텐츠 영역 — 별도 헤더 바 없이, 로컬 내비(세그먼트)를 콘텐츠 상단에 얹는다.
    // min-w-0: 내부 표가 넓어도 이 컬럼 폭을 고정(가로 스크롤은 표 래퍼가 처리)
    <div className="min-h-0 min-w-0 flex-1 overflow-y-auto bg-muted/30">
      {/* 로컬 내비 — sticky + 반투명 배경, 하드 구분선 대신 스크롤 시 콘텐츠가 아래로 흐름.
          모바일에선 상단 3-탭(AI채팅/주문/상품)이 구획 전환을 담당하므로 세그먼트는 데스크탑만.
          단 결과 보기의 "목록으로" 복귀는 모바일에서도 필요해 항상 노출한다. */}
      {showResults ? (
        <div className="sticky top-0 z-10 flex items-center bg-muted/30 px-4 pb-2 pt-4 backdrop-blur sm:px-6">
          <button
            type="button"
            onClick={onBackToList}
            className="flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:scale-95"
          >
            <ArrowLeft className="size-4" />
            목록으로
          </button>
        </div>
      ) : (
        <div className="sticky top-0 z-10 hidden items-center bg-muted/30 px-4 pb-2 pt-4 backdrop-blur sm:px-6 lg:flex">
          <div className="inline-flex h-9 items-center gap-0.5 rounded-full bg-muted p-0.5">
            {WORKSPACE_TABS.map((t) => {
              const active = t.key === tab;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => onTabChange(t.key)}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex h-8 items-center whitespace-nowrap rounded-full px-3.5 text-sm transition-colors",
                    active
                      ? "bg-background font-semibold text-foreground shadow-sm"
                      : "font-medium text-muted-foreground hover:text-foreground",
                  )}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 목록 또는 AI 결과. 모바일은 세그먼트가 없으니 top 여백을 직접 준다 */}
      <div className="px-4 pb-6 pt-4 sm:px-6 lg:pt-2">
        {showResults ? (
          <div className="flex flex-col gap-6">
            {/* 분석 리포트(analysis+replace) — 스트림 중엔 스켈레톤, 확정되면 본문 */}
            {(analysisLoading || analysisReport) && (
              <div className="animate-in duration-300 fade-in slide-in-from-bottom-2">
                <AnalysisReport
                  report={analysisReport}
                  loading={analysisLoading}
                />
              </div>
            )}
            {draftResults.map((r, i) =>
              r.kind === "draft" ? (
                <div
                  key={r.draft.draftId ?? i}
                  className="animate-in duration-300 fade-in slide-in-from-bottom-2"
                >
                  <ProductDiffCard
                    draft={r.draft}
                    settled={r.settled}
                    onConfirm={onConfirmDraft}
                    onCancel={onCancelDraft}
                    disabled={isStreaming}
                  />
                </div>
              ) : null,
            )}
          </div>
        ) : tab === "orders" ? (
          <OrderList
            tab={orderTab}
            page={orderPage}
            onTabChange={(t) => {
              setOrderTab(t);
              setOrderPage(0);
            }}
            onPageChange={setOrderPage}
          />
        ) : (
          <ProductList
            tab={productTab}
            sort={productSort}
            page={productPage}
            onTabChange={(t) => {
              setProductTab(t);
              setProductPage(0);
            }}
            onSortChange={(s) => {
              setProductSort(s);
              setProductPage(0);
            }}
            onPageChange={setProductPage}
          />
        )}
      </div>
    </div>
  );
}
