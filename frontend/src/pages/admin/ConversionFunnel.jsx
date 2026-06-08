import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { Eye, FileText, CreditCard, Copy } from "lucide-react";

const STEP_COLORS = {
  visits: "#8b5cf6",
  orders: "#22c55e",
  pix_generated: "#f59e0b",
  pix_copied: "#ec4899",
};

const fmtPct = (num, den) => {
  if (!den || den <= 0) return "0,00%";
  return `${((num / den) * 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%`;
};

function StepRow({ icon: Icon, label, value, color, conversion, lost, lostLabel = "saíram", testid }) {
  return (
    <div
      className="flex items-center gap-3 px-3 py-3 rounded-xl bg-white"
      style={{ border: "1px solid #f3f4f6", borderLeft: `4px solid ${color}` }}
      data-testid={testid}
    >
      <span
        className="flex items-center justify-center rounded-lg shrink-0"
        style={{ width: 36, height: 36, backgroundColor: `${color}1a`, color }}
      >
        <Icon size={16} />
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-semibold leading-tight" style={{ color: "#111827" }}>
          {label}
        </div>
        {conversion !== null && (
          <div className="mt-1 flex items-center gap-2 text-[11px]" style={{ color: "#6b7280" }}>
            <span
              className="px-1.5 py-0.5 rounded font-semibold"
              style={{
                backgroundColor: conversion >= 50 ? "#dcfce7" : "#fef3c7",
                color: conversion >= 50 ? "#15803d" : "#b45309",
              }}
            >
              {conversion.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}% conv.
            </span>
            {lost > 0 && <span>{lost.toLocaleString("pt-BR")} {lostLabel}</span>}
          </div>
        )}
      </div>
      <div className="text-[22px] font-extrabold tabular-nums" style={{ color: "#111827" }}>
        {value.toLocaleString("pt-BR")}
      </div>
    </div>
  );
}

function CenterMetric({ label, num, den }) {
  const pct = den > 0 ? (num / den) * 100 : 0;
  return (
    <div className="flex flex-col items-center justify-center text-center">
      <div
        className="font-extrabold"
        style={{
          fontSize: 36,
          lineHeight: 1,
          background: "linear-gradient(90deg, #7c3aed 0%, #ec4899 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
        }}
      >
        {pct.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%
      </div>
      <div className="mt-2 text-[10px] uppercase tracking-widest font-semibold" style={{ color: "#9ca3af", letterSpacing: "0.15em" }}>
        {label}
      </div>
      <div className="mt-1 text-[12px]" style={{ color: "#6b7280" }}>
        {num.toLocaleString("pt-BR")} de {den.toLocaleString("pt-BR")} converteram
      </div>
    </div>
  );
}

export default function ConversionFunnel({ stats }) {
  const visits = stats?.total_visits || 0;
  const orders = stats?.total_orders || 0;
  const pixGen = stats?.pix_generated_count || 0;
  const pixCop = stats?.pix_copied_count || 0;

  // Donut slices = users at each terminal step (so the slices add up to total visits)
  const onlyVisited = Math.max(0, visits - orders);
  const orderedNoPix = Math.max(0, orders - pixGen);
  const pixNotCopied = Math.max(0, pixGen - pixCop);
  const copied = pixCop;

  const data = [
    { name: "Apenas acessos", value: onlyVisited, color: STEP_COLORS.visits },
    { name: "Pedido sem PIX", value: orderedNoPix, color: STEP_COLORS.orders },
    { name: "PIX gerado, não copiado", value: pixNotCopied, color: STEP_COLORS.pix_generated },
    { name: "PIX copiado", value: copied, color: STEP_COLORS.pix_copied },
  ].filter((d) => d.value > 0);

  // Step conversions
  const convOrders = visits > 0 ? (orders / visits) * 100 : 0;
  const convPixGen = orders > 0 ? (pixGen / orders) * 100 : 0;
  const convCop = pixGen > 0 ? (pixCop / pixGen) * 100 : 0;
  const convGeneral = visits > 0 ? (pixCop / visits) * 100 : 0;

  return (
    <div
      className="bg-white rounded-2xl p-6"
      style={{ border: "1px solid #f3f4f6" }}
      data-testid="conversion-funnel"
    >
      <div className="mb-5">
        <h2 className="font-bold text-[18px]" style={{ color: "#111827" }}>
          Funil de conversão
        </h2>
        <p className="mt-1 text-[13px]" style={{ color: "#6b7280" }}>
          Distribuição das etapas — passe o mouse sobre cada fatia
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
        {/* Donut chart with central conversion metric */}
        <div className="relative" style={{ height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data.length ? data : [{ name: "Sem dados", value: 1, color: "#e5e7eb" }]}
                cx="50%"
                cy="50%"
                innerRadius={80}
                outerRadius={120}
                paddingAngle={data.length > 1 ? 3 : 0}
                dataKey="value"
                stroke="#fff"
                strokeWidth={2}
              >
                {(data.length ? data : [{ color: "#e5e7eb" }]).map((entry, idx) => (
                  <Cell key={idx} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#111827",
                  border: "none",
                  borderRadius: 8,
                  color: "#fff",
                  fontSize: 12,
                  padding: "8px 12px",
                }}
                formatter={(value, name) => [`${value.toLocaleString("pt-BR")} usuários`, name]}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <CenterMetric label="Pedido → PIX copiado" num={pixCop} den={orders} />
          </div>
        </div>

        {/* Step cards */}
        <div className="space-y-2.5">
          <StepRow
            testid="funnel-step-visits"
            icon={Eye}
            label="Acessos ao site"
            value={visits}
            color={STEP_COLORS.visits}
            conversion={null}
          />
          <StepRow
            testid="funnel-step-orders"
            icon={FileText}
            label="Pedidos criados"
            value={orders}
            color={STEP_COLORS.orders}
            conversion={convOrders}
            lost={onlyVisited}
          />
          <StepRow
            testid="funnel-step-pix-generated"
            icon={CreditCard}
            label="PIX gerado"
            value={pixGen}
            color={STEP_COLORS.pix_generated}
            conversion={convPixGen}
            lost={orderedNoPix}
          />
          <StepRow
            testid="funnel-step-pix-copied"
            icon={Copy}
            label="PIX copiado"
            value={pixCop}
            color={STEP_COLORS.pix_copied}
            conversion={convCop}
            lost={pixNotCopied}
          />
        </div>
      </div>

      {/* Bottom KPI strip */}
      <div className="mt-5 grid grid-cols-3 rounded-xl overflow-hidden" style={{ backgroundColor: "#faf5ff" }}>
        <div className="px-4 py-3 text-center" data-testid="kpi-orders-to-pix">
          <div className="font-extrabold text-[20px]" style={{ color: "#7c3aed" }}>
            {convPixGen.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%
          </div>
          <div className="mt-1 text-[10px] uppercase tracking-widest font-semibold" style={{ color: "#7c3aed", letterSpacing: "0.12em" }}>
            Pedido → PIX
          </div>
        </div>
        <div className="px-4 py-3 text-center" style={{ borderLeft: "1px solid #e9d5ff", borderRight: "1px solid #e9d5ff" }} data-testid="kpi-pix-to-copied">
          <div className="font-extrabold text-[20px]" style={{ color: "#7c3aed" }}>
            {convCop.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%
          </div>
          <div className="mt-1 text-[10px] uppercase tracking-widest font-semibold" style={{ color: "#7c3aed", letterSpacing: "0.12em" }}>
            PIX → Copiado
          </div>
        </div>
        <div className="px-4 py-3 text-center" data-testid="kpi-general">
          <div className="font-extrabold text-[20px]" style={{ color: "#7c3aed" }}>
            {convGeneral.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%
          </div>
          <div className="mt-1 text-[10px] uppercase tracking-widest font-semibold" style={{ color: "#7c3aed", letterSpacing: "0.12em" }}>
            Geral
          </div>
        </div>
      </div>
    </div>
  );
}
