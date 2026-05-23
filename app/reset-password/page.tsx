"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wrench, Lock, Loader2, CheckCircle2, Eye, EyeOff } from "lucide-react";
import Link from "next/link";

function ResetForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) return setError("As senhas não coincidem.");
    if (password.length < 6) return setError("Mínimo 6 caracteres.");
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setIsDone(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!token) return (
    <div className="text-center text-red-400">Link inválido. Solicite um novo.</div>
  );

  return (
    <div className="bg-zinc-950/80 border border-zinc-800/80 backdrop-blur-xl p-8 rounded-3xl shadow-2xl">
      <div className="mb-8 flex justify-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-900 border border-zinc-700">
          <Wrench className="h-6 w-6 text-zinc-100" />
        </div>
      </div>

      {!isDone ? (
        <>
          <div className="text-center space-y-2 mb-6">
            <h1 className="text-2xl font-bold text-zinc-100">Nova Senha</h1>
            <p className="text-sm text-zinc-400">Escolha uma senha forte para sua conta.</p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-400 text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Nova Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <Input
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                  className="pl-10 pr-10 bg-zinc-900/50 border-zinc-800 focus-visible:border-zinc-500 h-12 rounded-xl text-zinc-100"
                />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500">
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Confirmar Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                <Input
                  type={show ? "text" : "password"}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repita a senha"
                  required
                  className="pl-10 bg-zinc-900/50 border-zinc-800 focus-visible:border-zinc-500 h-12 rounded-xl text-zinc-100"
                />
              </div>
            </div>

            <Button type="submit" disabled={isLoading} className="w-full h-12 rounded-xl font-bold bg-zinc-100 text-zinc-950 hover:bg-white">
              {isLoading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Salvando...</> : "Salvar Nova Senha"}
            </Button>
          </form>
        </>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center space-y-4 py-4">
          <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto" />
          <h2 className="text-xl font-bold text-zinc-100">Senha redefinida!</h2>
          <p className="text-sm text-zinc-400">Redirecionando para o login...</p>
        </motion.div>
      )}

      <div className="mt-8 text-center">
        <Link href="/login" className="text-sm font-semibold text-zinc-500 hover:text-zinc-300 transition-colors">
          Voltar para o Login
        </Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050505] p-4">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }} className="w-full max-w-[420px] relative z-10">
        <Suspense fallback={<div className="text-zinc-400 text-center">Carregando...</div>}>
          <ResetForm />
        </Suspense>
      </motion.div>
    </div>
  );
}