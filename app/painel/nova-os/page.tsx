"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createServiceOrderWithPricing } from "@/actions/create-os";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function NewOSPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const data = {
      customer: { name: formData.get("name"), phone: formData.get("phone") },
      device: { brand: formData.get("brand"), model: formData.get("model") },
      defect: formData.get("defect"),
      partCost: Number(formData.get("partCost")),
      isApple: formData.get("isApple") === "true",
      // A mão de obra será calculada automaticamente na Action!
    };

    try {
      // Substitua pelo seu ID de shop real ou lógica de sessão
      await createServiceOrderWithPricing(data, "loja-teste-123");
      router.push("/painel");
    } catch (err) {
      alert("Erro ao criar OS!");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#050505] p-8 text-white">
      <div className="max-w-2xl mx-auto bg-zinc-950 p-8 rounded-2xl border border-zinc-900">
        <h1 className="text-2xl font-bold mb-6">Nova Ordem de Serviço</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <Input name="name" placeholder="Nome do Cliente" className="bg-zinc-900" required />
            <Input name="phone" placeholder="WhatsApp" className="bg-zinc-900" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input name="brand" placeholder="Marca" className="bg-zinc-900" required />
            <Input name="model" placeholder="Modelo" className="bg-zinc-900" required />
          </div>
          <select name="isApple" className="w-full bg-zinc-900 p-2 rounded border border-zinc-800">
            <option value="false">Outros</option>
            <option value="true">iPhone (Apple)</option>
          </select>
          <Input name="partCost" type="number" placeholder="Custo da Peça (R$)" className="bg-zinc-900" required />
          <Textarea name="defect" placeholder="Descrição do defeito..." className="bg-zinc-900 h-32" required />
          
          <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700">
            {loading ? "Calculando orçamento..." : "Criar Ordem (Preço Automático)"}
          </Button>
        </form>
      </div>
    </div>
  );
}
