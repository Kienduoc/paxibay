import { redirect } from "next/navigation";

/**
 * /create/auto?prompt=... — AI picks template based on prompt.
 * MVP: simple keyword detection. Phase 2: call LLM to classify.
 */
export default async function CreateAutoPage({
  searchParams,
}: {
  searchParams: Promise<{ prompt?: string }>;
}) {
  const { prompt } = await searchParams;
  const text = (prompt ?? "").toLowerCase();

  // Naive heuristic — replace with LLM classification later
  let template = "app-intro";
  if (text.includes("review") || text.includes("sách") || text.includes("đánh giá")) {
    template = "review";
  } else if (text.includes("quảng cáo") || text.includes("bán") || text.includes("ads")) {
    template = "product-ad";
  } else if (text.includes("báo cáo") || text.includes("kpi") || text.includes("doanh thu")) {
    template = "report";
  } else if (text.includes("tin") || text.includes("news") || text.includes("sự kiện")) {
    template = "news";
  } else if (text.includes("hướng dẫn") || text.includes("tutorial") || text.includes("cách")) {
    template = "tutorial";
  }

  redirect(`/create/${template}?prompt=${encodeURIComponent(prompt ?? "")}`);
}
