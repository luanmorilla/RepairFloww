"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Zap, Shield, Lock } from "lucide-react";
import { motion } from "framer-motion";

export default function PlanosPage() {
  const [loading, setLoading] = useState<string | null>(null);
  const router = useRouter();

  async function handleCheckout(tipo: string) {
    setLoading(tipo);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo }), 
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error || "Erro ao iniciar pagamento.");
      }
    } catch {
      alert("Erro ao iniciar pagamento. Tente novamente.");
    } finally {
      setLoading(null);
    }
  }

  const featuresPadrao = [
    "Ordens de serviço ilimitadas",
    "Controle de estoque completo",
    "Precificação inteligente",
    "Módulo de Venda Rápida",
    "Consulta de IMEI integrada",
    "Suporte prioritário"
  ];

  return (
    <div className="min-h-screen bg-[#060608] text-zinc-200 font-sans flex flex-col items-center selection:bg-emerald-500/30 relative overflow-hidden">
      
      {/* BACKGROUND */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-emerald-500/10 blur-[120px] pointer-events-none rounded-full" />

      {/* Header */}
      <motion.header 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-5xl mx-auto px-6 py-8 flex justify-between items-center relative z-10"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <div className="w-4 h-4 bg-emerald-500 rounded-sm shadow-[0_0_10px_rgba(16,185,129,0.3)]" />
          </div>
          <span className="text-zinc-100 font-semibold text-lg tracking-tight">
            RepairFlow
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs font-medium text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Conta criada
        </div>
      </motion.header>

      <main className="flex-1 w-full max-w-4xl mx-auto px-6 pt-8 pb-24 flex flex-col items-center relative z-10">
        
        {/* Títulos */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-center max-w-2xl mx-auto mb-16 space-y-4"
        >
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-400">
            Escolha seu plano
          </h1>
          <p className="text-zinc-400 text-sm md:text-base leading-relaxed font-light">
            Libere o acesso completo ao RepairFlow e profissionalize a gestão da sua assistência técnica hoje mesmo.
          </p>
        </motion.div>

        {/* Grid de Planos */}
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
          }}
          className="grid md:grid-cols-2 gap-6 lg:gap-8 w-full items-stretch"
        >
          
          {/* PLANO MENSAL */}
          <motion.div 
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
            className="group relative h-full"
          >
            <div className="relative bg-[#0a0a0e] border border-white/5 rounded-2xl p-8 flex flex-col h-full transform group-hover:-translate-y-1 transition-all duration-300">
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-4 h-4 text-zinc-500" />
                  <h3 className="text-lg font-medium text-zinc-300">Mensal</h3>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white tracking-tight">R$ 19,90</span>
                  <span className="text-zinc-500 text-sm">/mês</span>
                </div>
              </div>

              <ul className="flex-1 space-y-4 mb-8">
                {featuresPadrao.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm text-zinc-400">
                    <Check className="w-4 h-4 text-zinc-600 shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleCheckout("mensal")}
                disabled={!!loading}
                className="w-full py-3.5 rounded-xl bg-transparent border border-white/10 hover:border-white/30 hover:bg-white/5 text-zinc-300 disabled:opacity-50 font-medium transition-all duration-300 flex items-center justify-center gap-2 text-sm"
              >
                {loading === "mensal" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Assinar Plano Mensal"}
              </button>
            </div>
          </motion.div>

          {/* PLANO TRIMESTRAL */}
          <motion.div 
            variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
            className="group relative h-full"
          >
            <div className="absolute -inset-0.5 bg-gradient-to-b from-emerald-500 to-emerald-800 rounded-2xl blur opacity-20" />
            <div className="relative bg-[#0c0c11] border border-emerald-500/30 rounded-2xl p-8 flex flex-col h-full transform group-hover:-translate-y-1 transition-all duration-300 overflow-hidden">
              <div className="absolute top-0 right-6 transform -translate-y-1/2">
                <span className="bg-emerald-500 text-[#050505] text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                  Mais Escolhido
                </span>
              </div>

              <div className="mb-8 mt-2">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <h3 className="text-lg font-medium text-emerald-50">Trimestral</h3>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white tracking-tight">R$ 34,90</span>
                  <span className="text-zinc-500 text-sm">/ 3 meses</span>
                </div>
                <div className="inline-flex mt-3 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-md">
                  <p className="text-emerald-400 text-xs font-medium tracking-wide">
                    Economia de 40% (R$ 24,80)
                  </p>
                </div>
              </div>

              <ul className="flex-1 space-y-4 mb-8">
                {featuresPadrao.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-3 text-sm text-zinc-200">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleCheckout("trimestral")}
                disabled={!!loading}
                className="w-full py-3.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 disabled:opacity-50 font-bold transition-all duration-300 flex items-center justify-center gap-2 text-sm shadow-[0_0_20px_rgba(16,185,129,0.3)]"
              >
                {loading === "trimestral" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Assinar Plano Trimestral"}
              </button>
            </div>
          </motion.div>
        </motion.div>

        {/* Rodapé */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="mt-14 text-center space-y-2"
        >
          <div className="flex items-center justify-center gap-2 text-zinc-500 text-xs font-medium">
            <Lock className="w-3.5 h-3.5" /> 
            Pagamento seguro via Stripe
          </div>
          <p className="text-zinc-600 text-xs">Cancele a qualquer momento.</p>
        </motion.div>

      </main>
    </div>
  );
}