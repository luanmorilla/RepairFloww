"use client";

import { useEffect, useRef, useState } from "react";
import { signOut } from "next-auth/react";
import { getShopSettings, updateShopSettings } from "@/actions/shop-actions";
import {
  Settings,
  LogOut,
  Store,
  Phone,
  ShieldCheck,
  ImagePlus,
  Save,
  Loader2,
  X,
  CheckCircle2,
} from "lucide-react";
import Image from "next/image";

export default function ConfiguracoesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [warranty, setWarranty] = useState(90);
  const [logo, setLogo] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [removeLogo, setRemoveLogo] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    getShopSettings()
      .then((shop) => {
        setName(shop.name ?? "");
        setPhone(shop.phone ?? "");
        setWarranty(shop.standardWarranty ?? 90);
        setLogo(shop.logo ?? null);
        setLogoPreview(shop.logo ?? null);
      })
      .catch(() => setError("Erro ao carregar configurações."))
      .finally(() => setLoading(false));
  }, []);

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError("A imagem deve ter no máximo 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setLogoPreview(base64);
      setLogo(base64);
      setRemoveLogo(false);
    };
    reader.readAsDataURL(file);
  }

  function handleRemoveLogo() {
    setLogoPreview(null);
    setLogo(null);
    setRemoveLogo(true);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSave() {
    if (!name.trim()) {
      setError("O nome da loja é obrigatório.");
      return;
    }
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      await updateShopSettings({
        name: name.trim(),
        phone: phone.trim(),
        standardWarranty: Number(warranty),
        logo: removeLogo ? null : logo,
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch {
      setError("Erro ao salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin text-blue-500 w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <Settings className="w-6 h-6 text-blue-500" />
        <h1 className="text-2xl font-bold text-white">Configurações</h1>
      </div>

      {/* Card de configurações da loja */}
      <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-6 space-y-6">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Store className="w-5 h-5 text-blue-400" />
          Dados da Assistência
        </h2>

        {/* Logo Upload */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-white/5 border border-white/10 flex items-center justify-center">
            {logoPreview ? (
              <>
                <Image
                  src={logoPreview}
                  alt="Logo"
                  fill
                  className="object-contain p-1"
                />
                <button
                  onClick={handleRemoveLogo}
                  className="absolute top-1 right-1 bg-red-500/80 hover:bg-red-600 rounded-full p-0.5 transition"
                  title="Remover logo"
                >
                  <X className="w-3 h-3 text-white" />
                </button>
              </>
            ) : (
              <ImagePlus className="w-8 h-8 text-white/30" />
            )}
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-sm text-blue-400 hover:text-blue-300 transition flex items-center gap-1"
          >
            <ImagePlus className="w-4 h-4" />
            {logoPreview ? "Trocar logo" : "Upar logo"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleLogoChange}
          />
          <p className="text-xs text-white/30">PNG, JPG ou SVG · máx. 2MB</p>
        </div>

        {/* Nome da loja */}
        <div className="space-y-1.5">
          <label className="text-sm text-white/60 flex items-center gap-1.5">
            <Store className="w-4 h-4" /> Nome da Loja
          </label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: TechFix Assistência"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-blue-500 transition"
          />
        </div>

        {/* WhatsApp */}
        <div className="space-y-1.5">
          <label className="text-sm text-white/60 flex items-center gap-1.5">
            <Phone className="w-4 h-4" /> WhatsApp
          </label>
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(11) 99999-9999"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder-white/30 focus:outline-none focus:border-blue-500 transition"
          />
        </div>

        {/* Garantia padrão */}
        <div className="space-y-1.5">
          <label className="text-sm text-white/60 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" /> Tempo de Garantia Padrão
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={1}
              max={730}
              value={warranty}
              onChange={(e) => setWarranty(Number(e.target.value))}
              className="w-28 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition text-center"
            />
            <span className="text-white/50 text-sm">dias</span>
            <div className="flex gap-2 ml-auto">
              {[30, 60, 90, 180].map((d) => (
                <button
                  key={d}
                  onClick={() => setWarranty(d)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                    warranty === d
                      ? "bg-blue-600 text-white"
                      : "bg-white/5 text-white/50 hover:bg-white/10"
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Feedback */}
        {error && (
          <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
            {error}
          </p>
        )}
        {success && (
          <p className="text-green-400 text-sm bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-2.5 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> Configurações salvas com sucesso!
          </p>
        )}

        {/* Botão salvar */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl py-3 flex items-center justify-center gap-2 transition"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? "Salvando..." : "Salvar Configurações"}
        </button>
      </div>

      {/* Card de conta */}
      <div className="bg-[#1a1a2e] border border-white/10 rounded-2xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <LogOut className="w-5 h-5 text-red-400" />
          Conta
        </h2>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/40 text-red-400 font-semibold rounded-xl py-3 flex items-center justify-center gap-2 transition"
        >
          <LogOut className="w-4 h-4" />
          Sair da conta
        </button>
      </div>
    </div>
  );
}
