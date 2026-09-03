import { notFound } from "next/navigation";
import { MOCK_DEALS } from "@/lib/mock-deals";
import { buildDealDetail } from "@/lib/mock-deal-details";
import DealDetailView from "./DealDetailView";

export default async function DealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const deal = MOCK_DEALS.find((d) => d.id === id);

  if (!deal) {
    notFound();
  }

  const detail = buildDealDetail(deal);

  return <DealDetailView deal={detail} />;
}
