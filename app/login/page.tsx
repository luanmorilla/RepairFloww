"use client";

import { useState, Suspense } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { signIn } from "next-auth/react"; // O nosso Segurança VIP
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wrench, TrendingUp, ShieldCheck, Zap, CheckCircle2, Loader2 } from "lucide-react";
import Link from "next/link";

// 1. O Molde de Validação do Login
const loginSchema = z.object({
  email: z.string().email("Digite um e-mail válido"),
  password: z.string().min(1, "A senha é obrigatória"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSuccess = searchParams.get("sucesso");
  
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  // 2. A Mágica de Entrar no Sistema
  const onSubmit = async (data: LoginFormValues) => {
    setIsLoading(true);
    setApiError(null);

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email: data.email,
        password: data.password,
      });

      if (result?.error) {
        // AQUI ESTÁ A MÁGICA: Ele vai imprimir na tela o erro exato que veio lá do route.ts
        setApiError(result.error);
        setIsLoading(false);
      } else {
        router.push("/painel");
      }
    } catch (error) {
      setApiError("Erro de comunicação com o servidor.");
      setIsLoading(false);
    }
  };

  return (
    <div className="relative z-20 flex w-full flex-col justify-center px-6 sm:px-12 lg:w-[45%] xl:px-24 bg-[#050505] shadow-[20px_0_50px_rgba(0,0,0,0.7)]">
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.03),transparent_50%)] pointer-events-none"></div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }} className="mx-auto w-full max-w-[380px] space-y-8 relative z-10">
        <div className="space-y-4 text-center lg:text-left flex flex-col items-center lg:items-start">
          
          {isSuccess && (
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-emerald-400 mb-2 shadow-lg">
              <CheckCircle2 className="h-5 w-5" />
              <p className="text-xs font-bold uppercase tracking-wider">Conta criada com sucesso! Faça login.</p>
            </motion.div>
          )}

          <div className="inline-flex items-center rounded-full border border-zinc-800/80 bg-zinc-900/50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-300 mb-2 shadow-sm">
            <span className="flex h-2 w-2 rounded-full bg-blue-500 mr-2 animate-pulse"></span>
            A ferramenta que todo técnico usa
          </div>

          <motion.div whileHover={{ rotate: 15, scale: 1.05 }} transition={{ type: "spring", stiffness: 300 }} className="flex items-center justify-center h-14 w-14 rounded-2xl bg-zinc-900 border border-zinc-700 shadow-[0_0_15px_rgba(255,255,255,0.08)] mb-2">
            <Wrench className="h-6 w-6 text-zinc-100" />
          </motion.div>
          
          <div className="space-y-1">
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-zinc-100 to-zinc-500">RepairFlow</h1>
            <p className="text-zinc-400 text-sm font-medium">Acesse o centro de comando da sua assistência.</p>
          </div>
        </div>

        {/* MENSAGEM DE ERRO (SENHA INCORRETA OU E-MAIL NÃO ENCONTRADO) */}
        {apiError && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-sm font-semibold text-red-400">
            {apiError}
          </div>
        )}
        
        {/* LIGAMOS O CÉREBRO AQUI: onSubmit={handleSubmit(onSubmit)} */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 pt-2">
          <div className="space-y-2 group">
            <Label htmlFor="email" className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 group-focus-within:text-zinc-200 transition-colors">Email Profissional</Label>
            <Input id="email" type="email" {...register("email")} placeholder="admin@assistencia.com.br" className="bg-zinc-900/80 border-zinc-700 focus-visible:border-zinc-400 focus-visible:ring-1 focus-visible:ring-zinc-400 h-12 rounded-xl text-base px-4 text-zinc-100 transition-all duration-300" />
            {errors.email && <p className="text-xs font-semibold text-red-400 mt-1">{errors.email.message}</p>}
          </div>
          
          <div className="space-y-2 group">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 group-focus-within:text-zinc-200 transition-colors">Senha</Label>
              {/* CORREÇÃO DO LINK DE RECUPERAÇÃO DE SENHA AQUI */}
              <Link href="/recuperar-senha" className="text-xs font-semibold text-zinc-500 hover:text-zinc-300 transition-colors">Esqueceu?</Link>
            </div>
            <Input id="password" type="password" {...register("password")} className="bg-zinc-900/80 border-zinc-700 focus-visible:border-zinc-400 focus-visible:ring-1 focus-visible:ring-zinc-400 h-12 rounded-xl text-base px-4 text-zinc-100 transition-all duration-300" />
            {errors.password && <p className="text-xs font-semibold text-red-400 mt-1">{errors.password.message}</p>}
          </div>
          
          <div className="pt-4 space-y-5">
            <Button type="submit" disabled={isLoading} className="w-full h-12 rounded-xl text-sm font-bold bg-zinc-100 text-zinc-950 hover:bg-white transition-all flex items-center justify-center gap-2">
              {isLoading ? <><Loader2 className="h-5 w-5 animate-spin" /> Entrando...</> : "Acessar Plataforma"}
            </Button>
            <div className="text-center text-sm font-medium text-zinc-500">
              Não tem uma conta? <Link href="/registro" className="text-zinc-300 font-bold hover:text-white hover:underline transition-colors">Registre-se</Link>
            </div>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen w-full bg-[#050505] overflow-hidden selection:bg-zinc-800 selection:text-white">
      <Suspense fallback={<div className="w-full lg:w-[45%] bg-[#050505]"></div>}>
        <LoginForm />
      </Suspense>

      {/* LADO DIREITO */}
      <div className="hidden lg:flex relative w-[55%] flex-col justify-center items-center bg-[#09090b] border-l border-zinc-900 overflow-hidden">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_60%,transparent_100%)]"></div>
        <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.4, 0.6, 0.4] }} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} className="absolute top-[0%] right-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/20 blur-[100px] pointer-events-none"></motion.div>
        <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }} className="absolute bottom-[-10%] left-[0%] w-[600px] h-[600px] rounded-full bg-violet-600/15 blur-[120px] pointer-events-none"></motion.div>

        <div className="relative z-10 flex flex-col gap-6 w-full max-w-[450px]">
          <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }} className="flex items-center gap-5 p-5 rounded-2xl bg-zinc-900/60 border border-zinc-700/50 backdrop-blur-xl shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-500/10 border border-blue-500/30"><TrendingUp className="h-6 w-6 text-blue-400" /></div>
            <div><p className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-1">Faturamento Hoje</p><div className="flex items-end gap-3"><h3 className="text-2xl font-bold text-zinc-100">R$ 4.250,00</h3><span className="text-emerald-400 text-sm font-semibold mb-1">+15%</span></div></div>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.4, ease: [0.16, 1, 0.3, 1] }} className="flex items-center gap-5 p-5 rounded-2xl bg-zinc-900/60 border border-zinc-700/50 backdrop-blur-xl shadow-2xl ml-12">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10 border border-amber-500/30"><Zap className="h-6 w-6 text-amber-400" /></div>
            <div><p className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-1">Ordens Concluídas</p><div className="flex items-end gap-3"><h3 className="text-2xl font-bold text-zinc-100">28 Aparelhos</h3><span className="text-amber-400 text-sm font-semibold mb-1">Tempo Recorde</span></div></div>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.6, ease: [0.16, 1, 0.3, 1] }} className="flex items-center gap-5 p-5 rounded-2xl bg-zinc-900/60 border border-zinc-700/50 backdrop-blur-xl shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/30"><ShieldCheck className="h-6 w-6 text-emerald-400" /></div>
            <div><p className="text-zinc-400 text-xs font-bold uppercase tracking-wider mb-1">Status do Sistema</p><div className="flex items-end gap-3"><h3 className="text-2xl font-bold text-zinc-100">100% Seguro</h3><span className="text-emerald-400 text-sm font-semibold mb-1">Criptografado</span></div></div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
