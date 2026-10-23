import PropostaView from "../PropostaView";

export default async function PropostaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PropostaView id={id} />;
}
