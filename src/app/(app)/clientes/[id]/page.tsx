import { notFound } from "next/navigation";
import { fetchCliente } from "@/lib/firebase/clientes";
import ClienteDetail from "./ClienteDetail";

export default async function ClienteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cliente = await fetchCliente(id);

  if (!cliente) {
    notFound();
  }

  return <ClienteDetail cliente={cliente} />;
}
