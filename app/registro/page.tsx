"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Eye, EyeOff, CheckCircle2, Play } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const formSchema = z.object({
  name: z.string().min(3, "O nome precisa ter pelo menos 3 letras"),
  shopName: z.string().min(3, "Digite o nome da assistência"),
  email: z.string().email("Digite um e-mail válido"),
  cpfCnpj: z.string().min(11, "CPF inválido").max(14, "CPF inválido"),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
});

type FormValues = z.infer<typeof formSchema>;

function VideoDemo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  const handlePlay = () => {
    if (videoRef.current) {
      videoRef.current.play();
      setPlaying(true);
    }
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden bg-zinc-950">
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        playsInline
        onPlay={() => setPlaying(true)}
      >
        <source src="/videos/demo.mp4" type="video/mp4" />
      </video>

      {!playing && (
        <div
          className="absolute inset-0 flex items-center justify-center cursor-pointer bg-black/50"
          onClick={handlePlay}
        >
          <div className="w-16 h-16 rounded-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center transition shadow-lg shadow-blue-600/40">
            <Play className="w-7 h-7 text-white ml-1" fill="white" />
          </div>
        </div>
      )}
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  // Formata o CPF enquanto o usuário digita: 000.000.000-00
  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 11) value = value.slice(0, 11);
    value = value
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    setValue("cpfCnpj", value);
  };

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
      if (!response.ok) throw new Error(result.message || "Erro ao criar conta.");
      setSuccess(true);
      setTimeout(() => router.push("/planos"), 1800);
    } catch (error: any) {
      setApiError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col lg:flex-row">

      {/* ── MOBILE: vídeo em cima ── */}
      <div className="lg:hidden w-full">
        <VideoDemo />
      </div>

      {/* ── ESQUERDA: FORMULÁRIO ── */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 sm:px-12 lg:px-16 py-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm mx-auto space-y-6"
        >
          <div className="space-y-1">
            <p className="text-blue-400 font-bold text-sm">RepairFlow</p>
            <h1 className="text-3xl font-bold text-white">Crie sua conta</h1>
            <p className="text-zinc-500 text-sm">Configure em 60 segundos e comece hoje.</p>
          </div>

          <AnimatePresence>
            {apiError && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-sm font-semibold text-red-400"
              >
                {apiError}
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {success && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-5 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center gap-3"
              >
                <CheckCircle2 className="w-6 h-6 text-green-400 shrink-0" />
                <div>
                  <p className="text-green-400 font-bold text-sm">Conta criada!</p>
                  <p className="text-zinc-500 text-xs">Redirecionando para escolha do plano...</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!success && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Nome Completo</Label>
                <Input
                  {...register("name")}
                  placeholder="Ex: João Silva"
                  className={`bg-zinc-900 border h-12 rounded-xl text-white focus-visible:border-blue-500 transition-colors ${errors.name ? "border-red-500" : "border-zinc-800"}`}
                />
                {errors.name && <p className="text-xs text-red-400">{errors.name.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Nome da Assistência</Label>
                <Input
                  {...register("shopName")}
                  placeholder="Ex: TechFix Pro"
                  className={`bg-zinc-900 border h-12 rounded-xl text-white focus-visible:border-blue-500 transition-colors ${errors.shopName ? "border-red-500" : "border-zinc-800"}`}
                />
                {errors.shopName && <p className="text-xs text-red-400">{errors.shopName.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Email</Label>
                <Input
                  type="email"
                  {...register("email")}
                  placeholder="contato@empresa.com"
                  className={`bg-zinc-900 border h-12 rounded-xl text-white focus-visible:border-blue-500 transition-colors ${errors.email ? "border-red-500" : "border-zinc-800"}`}
                />
                {errors.email && <p className="text-xs text-red-400">{errors.email.message}</p>}
              </div>

              {/* CAMPO CPF — NOVO */}
              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">CPF</Label>
                <Input
                  {...register("cpfCnpj")}
                  onChange={handleCpfChange}
                  placeholder="000.000.000-00"
                  maxLength={14}
                  className={`bg-zinc-900 border h-12 rounded-xl text-white focus-visible:border-blue-500 transition-colors ${errors.cpfCnpj ? "border-red-500" : "border-zinc-800"}`}
                />
                {errors.cpfCnpj && <p className="text-xs text-red-400">{errors.cpfCnpj.message}</p>}
              </div>

              <div className="space-y-1.5">
                <Label className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">Senha</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    {...register("password")}
                    placeholder="Mínimo 6 caracteres"
                    className={`bg-zinc-900 border h-12 rounded-xl text-white focus-visible:border-blue-500 transition-colors pr-12 ${errors.password ? "border-red-500" : "border-zinc-800"}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-400">{errors.password.message}</p>}
              </div>

              <div className="pt-2 space-y-4">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-12 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white transition flex items-center justify-center gap-2"
                >
                  {isLoading
                    ? <><Loader2 className="h-4 w-4 animate-spin" /> Criando...</>
                    : "Criar minha Conta"
                  }
                </Button>

                <p className="text-center text-sm text-zinc-500">
                  Já tem conta?{" "}
                  <Link href="/login" className="text-blue-400 font-semibold hover:text-blue-300 transition">
                    Fazer Login
                  </Link>
                </p>
              </div>
            </form>
          )}
        </motion.div>
      </div>

      {/* ── DIREITA: VÍDEO desktop ── */}
      <div className="hidden lg:flex w-1/2 flex-col justify-center bg-[#050505] p-8">
        <div className="w-full space-y-4">
          <div>
            <h2 className="text-2xl font-bold text-white">
              Gerencie sua assistência com{" "}
              <span className="text-blue-400">profissionalismo.</span>
            </h2>
            <p className="text-zinc-500 text-sm mt-1">
              OS, estoque e precificação inteligente — tudo em um só lugar.
            </p>
          </div>
          <VideoDemo />
        </div>
      </div>

    </div>
  );
}
