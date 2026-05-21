"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";
import { LayoutDashboard, Package, ShoppingCart, Wrench, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { OsTable } from "@/components/dashboard/os-table";
import { fetchDashboardData } from "@/actions/dashboard-actions";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [stats, setStats] = useState({ total: 0, emReparo: 0, faturamento: 0 });
  const { data: session } = useSession();
  const router = useRouter();
  
  const shopId = (session?.user as any)?.shopId;

  useEffect(() => {
    if (shopId) {
      fetchDashboardData(shopId).then(setStats);
    }
  }, [shopId]);

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 flex">
      {/* Sidebar Fixo */}
      <aside className="w-64 border-r border-zinc-900 p-6 space-y-8">
        <h1 className="text-xl font-bold tracking-tight">RepairFlow</h1>
        <nav className="space-y-2">
          {[
            { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
            { id: "os", label: "Ordens de Serviço", icon: Wrench },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl font-medium transition-all ${
                activeTab === item.id ? "bg-zinc-900 text-white" : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <item.icon size={18} /> {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* Conteúdo Principal */}
      <main className="flex-1 p-8">
        <header className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold capitalize">{activeTab}</h2>
          {activeTab === "os" && (
            <Button onClick={() => router.push("/painel/nova-os")} className="bg-blue-600 hover:bg-blue-700 rounded-xl">
              <Plus className="mr-2" size={16} /> Nova OS
            </Button>
          )}
        </header>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          {activeTab === "dashboard" && (
            <div className="grid grid-cols-3 gap-6">
              <Card className="bg-zinc-950 border-zinc-900 p-6">
                <p className="text-zinc-500 text-sm">Total de OS</p>
                <h3 className="text-3xl font-bold mt-2">{stats.total}</h3>
              </Card>
              <Card className="bg-zinc-950 border-zinc-900 p-6">
                <p className="text-zinc-500 text-sm">Em Reparo</p>
                <h3 className="text-3xl font-bold mt-2">{stats.emReparo}</h3>
              </Card>
              <Card className="bg-zinc-950 border-zinc-900 p-6">
                <p className="text-zinc-500 text-sm">Faturamento</p>
                <h3 className="text-3xl font-bold mt-2">R$ {stats.faturamento.toFixed(2)}</h3>
              </Card>
            </div>
          )}

          {activeTab === "os" && shopId ? (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 text-zinc-600" size={18} />
                <input 
                  placeholder="Buscar cliente ou aparelho..." 
                  className="w-full bg-zinc-950 border border-zinc-900 rounded-xl p-3 pl-10 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <OsTable shopId={shopId} />
            </div>
          ) : activeTab === "os" && (
             <div className="text-center p-20 text-zinc-600">Aguardando dados da loja...</div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
