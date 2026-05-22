"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Zap, Shield } from "lucide-react";

export default function PlanosPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();

  async function handleCheckout(priceId: string, tipo: string) {
    setLoading(tipo);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceId }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch {
      alert("Erro ao iniciar pagamento. Tente novamente.");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-6">
      <div className="max-w-3xl w-full space-y-8">
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-bold">Escolha seu plano</h1>
          <p className="text-zinc-400">Acesso completo ao RepairFlow. Cancele quando quiser.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Mensal */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 space-y-5 hover:border-blue-500/50 transition">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-semibold">Mensal</h2>
            </div>
            <div>
              <span className="text-4xl font-bold">R$ 19,90</span>
              <span className="text-zinc-500 text-sm"> /mês</span>
            </div>
            <ul className="space-y-2 text-sm text-zinc-400">
              {["Ordens de serviço ilimitadas","Controle de estoque","Precificação inteligente","Venda rápida","Suporte via WhatsApp"].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-400 shrink-0" />{item}
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleCheckout(process.env.NEXT_PUBLIC_STRIPE_PRICE_MENSAL!, "mensal")}
              disabled={!!loading}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 font-semibold transition flex items-center justify-center gap-2"
            >
              {loading === "mensal" ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Assinar Mensal
            </button>
          </div>

          {/* Trimestral */}
          <div className="bg-zinc-950 border border-blue-500/40 rounded-2xl p-6 space-y-5 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">MAIS ESCOLHIDO</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-semibold">Trimestral</h2>
            </div>
            <div>
              <span className="text-4xl font-bold">R$ 34,90</span>
              <span className="text-zinc-500 text-sm"> /3 meses</span>
              <p className="text-green-400 text-xs mt-1">Economia de 40% vs mensal</p>
            </div>
            <ul className="space-y-2 text-sm text-zinc-400">
              {["Tudo do plano mensal","3 meses de acesso garantido","Prioridade no suporte","Atualizações antecipadas","Economia de R$ 24,80"].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-blue-400 shrink-0" />{item}
                </li>
              ))}
            </ul>
            <button
              onClick={() => handleCheckout(process.env.NEXT_PUBLIC_STRIPE_PRICE_TRIMESTRAL!, "trimestral")}
              disabled={!!loading}
              className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 font-semibold transition flex items-center justify-center gap-2"
            >
              {loading === "trimestral" ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Assinar Trimestral
            </button>
          </div>
        </div>

        <p className="text-center text-zinc-600 text-xs">
          Pagamento seguro via Stripe · Cancele quando quiser
        </p>
      </div>
    </div>
  );
}