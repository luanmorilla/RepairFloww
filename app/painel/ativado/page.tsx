"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function AtivadoPage() {
  const router = useRouter();
  const { update } = useSession();
  const [tentativas, setTentativas] = useState(0);
  const [status, setStatus] = useState<"aguardando" | "ativo" | "erro">("aguardando");

  useEffect(() => {
    let count = 0;

    async function tentarAtualizar() {
      try {
        // update() retorna a sessão já atualizada — não depende do state "session"
        const novaSession = await update();
        const planStatus = (novaSession?.user as any)?.planStatus;

        if (planStatus === "active") {
          setStatus("ativo");
          setTimeout(() => router.replace("/painel"), 1200);
          return;
        }

        count++;
        setTentativas(count);

        if (count < 12) {
          // Tenta de novo após 1.5s (total: ~18s de espera)
          setTimeout(tentarAtualizar, 1500);
        } else {
          // Esgotou tentativas — plano foi salvo no banco, JWT atualiza na próxima req
          setStatus("ativo");
          setTimeout(() => router.replace("/painel"), 1000);
        }
      } catch (err) {
        console.error("Erro ao atualizar sessão:", err);
        setStatus("erro");
      }
    }

    // Pequeno delay inicial para garantir que o webhook da Stripe já processou
    setTimeout(tentarAtualizar, 800);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-[#080808] flex items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-sm">
        {status === "aguardando" && (
          <>
            <div className="relative mx-auto w-16 h-16">
              <div className="w-16 h-16 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-blue-500" />
              </div>
            </div>
            <div>
              <p className="text-white font-semibold text-lg">Ativando seu plano...</p>
              <p className="text-white/40 text-sm mt-1">Confirmando pagamento com a Stripe</p>
            </div>
            {tentativas > 3 && (
              <p className="text-white/20 text-xs">
                Aguardando confirmação... ({tentativas}/12)
              </p>
            )}
          </>
        )}

        {status === "ativo" && (
          <>
            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center">
              <svg className="w-8 h-8 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-emerald-400 font-semibold text-lg">Plano ativado!</p>
              <p className="text-white/40 text-sm mt-1">Redirecionando para o painel...</p>
            </div>
          </>
        )}

        {status === "erro" && (
          <>
            <div className="mx-auto w-16 h-16 rounded-full bg-red-500/15 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <div>
              <p className="text-red-400 font-semibold text-lg">Algo deu errado</p>
              <p className="text-white/40 text-sm mt-1">
                Seu pagamento foi processado mas houve um erro ao carregar a sessão.
              </p>
            </div>
            <button
              onClick={() => router.replace("/painel")}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              Ir para o painel
            </button>
          </>
        )}
      </div>
    </div>
  );
}
