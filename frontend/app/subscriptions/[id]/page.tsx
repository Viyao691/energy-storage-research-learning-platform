import SubscriptionDetail from "./SubscriptionDetail";

export default async function SubscriptionDetailPage({ params, searchParams }: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ run?: string | string[] }>;
}) {
  const route = await params;
  const query = await searchParams;
  const run = Number(query.run);
  return <SubscriptionDetail subscriptionId={Number(route.id)} runId={Number.isInteger(run) && run > 0 ? run : undefined} />;
}
