"use client";

import { useEffect, useState } from "react";
import { getOsList } from "@/actions/os-actions";

export function OsTable({ shopId }: { shopId: string }) {
  const [osList, setOsList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        console.log("Buscando OS para o shopId:", shopId);
        const data = await getOsList(shopId);
        console.log("Dados recebidos do banco:", data);
        setOsList(data || []);
      } catch (err) {
        console.error("Erro ao buscar OS:", err);
      } finally {
        setLoading(false);
      }
    }
    if (shopId) load();
  }, [shopId]);

  if (loading) return <div className="p-4 text-zinc-500">Carregando ordens...</div>;
  if (osList.length === 0) return <div className="p-10 border border-dashed border-zinc-800 rounded-2xl text-center text-zinc-500">Nenhuma OS encontrada para esta loja.</div>;

  return (
    <div className="overflow-x-auto border border-zinc-900 rounded-2xl bg-zinc-950">
      <table className="w-full text-left">
        {/* ... (resto da sua tabela) ... */}
      </table>
    </div>
  );
}