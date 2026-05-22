"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Rocket, BarChart3, Users, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  name: z.string().min(3, "O nome precisa ter pelo menos 3 letras"),
  shopName: z.string().min(3, "Digite o nome da assistência"),
  email: z.string().email("Digite um e-mail válido"),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
});

type FormValues = z.infer<typeof formSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    setApiError(null);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Erro ao criar conta.");
      }

      // ✅ Após cadastro vai direto para escolher o plano
      router.push("/planos");

    } catch (error: any) {
      setApiError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-[#050505] overflow-hidden selection:bg-zinc-800 selection:text-white">
      
      {/* LADO ESQUERDO: FORMULÁRIO */}
      <div className="relative z-20 flex w-full flex-col justify-center px-6 sm:px-12 lg:w-[45%] xl:px-24 bg-[#050505] shadow-[20px_0_50px_rgba(0,0,0,0.7)]">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_left,rgba(255,255,255,0.02),transparent_50%)] pointer-events-none"></div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }} className="mx-auto w-full max-w-[400px] space-y-8 relative z-10">
          
          <div className="space-y-3 text-center lg:text-left flex flex-col items-center lg:items-start">
            <div className="inline-flex items-center rounded-full border border-zinc-800/80 bg-zinc-900/50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-blue-400 mb-2">
              Comece agora
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-zinc-100">Crie sua conta</h1>
          </div>

          {apiError && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-sm font-semibold text-red-400">
              {apiError}
            </div>
          )}
          
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 gap-5 pt-2">
            
            <div className="space-y-2 group">
              <Label className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Nome Completo</Label>
              <Input {...register("name")} placeholder="Ex: João Silva" className="bg-zinc-900/80 border-zinc-700 focus-visible:border-zinc-400 h-12 rounded-xl text-zinc-100" />
              {errors.name && <p className="text-xs font-semibold text-red-400 mt-1">{errors.name.message}</p>}
            </div>

            <div className="space-y-2 group">
              <Label className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Nome da Assistência</Label>
              <Input {...register("shopName")} placeholder="Ex: TechFix Pro" className="bg-zinc-900/80 border-zinc-700 focus-visible:border-zinc-400 h-12 rounded-xl text-zinc-100" />
              {errors.shopName && <p className="text-xs font-semibold text-red-400 mt-1">{errors.shopName.message}</p>}
            </div>

            <div className="space-y-2 group">
              <Label className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Email Profissional</Label>
              <Input type="email" {...register("email")} placeholder="contato@empresa.com" className="bg-zinc-900/80 border-zinc-700 focus-visible:border-zinc-400 h-12 rounded-xl text-zinc-100" />
              {errors.email && <p className="text-xs font-semibold text-red-400 mt-1">{errors.email.message}</p>}
            </div>

            <div className="space-y-2 group">
              <Label className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Senha de Acesso</Label>
              <Input type="password" {...register("password")} placeholder="••••••••" className="bg-zinc-900/80 border-zinc-700 focus-visible:border-zinc-400 h-12 rounded-xl text-zinc-100" />
              {errors.password && <p className="text-xs font-semibold text-red-400 mt-1">{errors.password.message}</p>}
            </div>
            
            <div className="pt-4 space-y-5">
              <Button type="submit" disabled={isLoading} className="w-full h-12 rounded-xl text-sm font-bold bg-zinc-100 text-zinc-950 hover:bg-white transition-all flex items-center justify-center gap-2">
                {isLoading ? <><Loader2 className="h-5 w-5 animate-spin" /> Criando...</> : "Criar minha Conta"}
              </Button>

              <div className="text-center text-sm font-medium text-zinc-500">
                Já possui uma conta? <Link href="/login" className="text-zinc-300 font-bold hover:text-white transition-colors">Fazer Login</Link>
              </div>
            </div>
          </form>

        </motion.div>
      </div>

      {/* LADO DIREITO */}
      <div className="hidden lg:flex relative w-[55%] flex-col justify-center items-center bg-[#09090b] border-l border-zinc-900 overflow-hidden px-12">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
        <div className="absolute top-[10%] left-[10%] w-[400px] h-[400px] rounded-full bg-blue-600/10 blur-[100px]"></div>

        <div className="relative z-10 w-full max-w-[520px] space-y-12">
          <h2 className="text-4xl font-bold text-zinc-100 leading-tight">
            Transforme sua assistência em uma <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-violet-500">operação de elite.</span>
          </h2>

          <div className="grid gap-6">
            <div className="flex items-start gap-4 p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400"><Rocket className="h-6 w-6" /></div><div><h4 className="text-lg font-bold text-zinc-200">Setup em 60 segundos</h4><p className="text-sm text-zinc-500">Cadastre sua logo e informações uma única vez.</p></div></div>
            <div className="flex items-start gap-4 p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400"><BarChart3 className="h-6 w-6" /></div><div><h4 className="text-lg font-bold text-zinc-200">Visibilidade Real de Lucro</h4><p className="text-sm text-zinc-500">Saiba exatamente quanto está ganhando.</p></div></div>
            <div className="flex items-start gap-4 p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"><Users className="h-6 w-6" /></div><div><h4 className="text-lg font-bold text-zinc-200">Fidelização de Clientes</h4><p className="text-sm text-zinc-500">Envie recibos com design profissional.</p></div></div>
          </div>
        </div>
      </div>
    </div>
  );
}
