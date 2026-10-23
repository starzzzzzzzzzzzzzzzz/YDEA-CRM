import PropostaWizard from "../PropostaWizard";

export default async function NovaPropostaPage({
  searchParams,
}: {
  searchParams: Promise<{ dealId?: string; clienteId?: string; id?: string }>;
}) {
  const { dealId, clienteId, id } = await searchParams;
  return <PropostaWizard dealId={dealId} clienteId={clienteId} propostaId={id} />;
}
