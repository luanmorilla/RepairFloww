"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wrench, ArrowLeft, Send, CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";

export default function RecoverPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const handleRecover = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setApiError(null);
    
    try {
      const response = await fetch("/api/auth/recover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao tentar recuperar senha.");
      }

      setIsSent(true);
    } catch (error: any) {
      setApiError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050505] p-4 selection:bg-zinc-800 selection:text-white">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none"></div>

      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="w-full max-w-[420px] relative z-10">
        <div className="bg-zinc-950/80 border border-zinc-800/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl">
          
          <div className="mb-8 flex justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-700 shadow-[0_0_15px_rgba(255,255,255,0.05)]">
              <Wrench className="h-6 w-6 text-zinc-100" />
            </div>
          </div>

          {!isSent ? (
            <>
              <div className="text-center space-y-2 mb-6">
                <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">Recuperar Senha</h1>
                <p className="text-sm text-zinc-400">Digite o e-mail cadastrado e enviaremos um link de recuperação.</p>
              </div>

              {apiError && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-sm font-semibold text-red-400 text-center">
                  {apiError}
                </div>
              )}

              <form onSubmit={handleRecover} className="space-y-5">
                <div className="space-y-2 group">
                  <Label className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Email Profissional</Label>
                  <Input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@assistencia.com.br" 
                    required 
                    className="bg-zinc-900/50 border-zinc-800 focus-visible:border-zinc-500 h-12 rounded-xl text-zinc-100" 
                  />
                </div>
                
                <Button type="submit" disabled={isLoading} className="w-full h-12 rounded-xl font-bold bg-zinc-100 text-zinc-950 hover:bg-white transition-all flex items-center justify-center gap-2">
                  {isLoading ? <><Loader2 className="h-4 w-4 animate-spin"/> Buscando...</> : <><Send className="h-4 w-4" /> Enviar Link</>}
                </Button>
              </form>
            </>
          ) : (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-4 py-4">
              <div className="flex justify-center mb-4"><CheckCircle2 className="h-16 w-16 text-emerald-500" /></div>
              <h2 className="text-xl font-bold text-zinc-100">E-mail Enviado!</h2>
              <p className="text-sm text-zinc-400 leading-relaxed">Enviamos um e-mail para <strong>{email}</strong>. Verifique sua caixa de entrada e a pasta de spam.</p>
            </motion.div>
          )}

          <div className="mt-8 text-center">
            <Link href="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-500 hover:text-zinc-300 transition-colors">
              <ArrowLeft className="h-4 w-4" /> Voltar para o Login
            </Link>
          </div>

        </div>
      </motion.div>
    </div>
  );
}
