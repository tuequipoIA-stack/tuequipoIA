"use client";

import { useState } from "react";
import { BRAND } from "@/lib/constants";
import AgentGrid from "@/components/AgentGrid";
import ChatView from "@/components/ChatView";

export default function EquipoSection({ business }) {
  const [agent, setAgent] = useState(null);
  return (
    <div className="h-full">
      {!agent ? (
        <>
          <h2 style={{ color: BRAND.navy }} className="text-xl font-semibold mb-1">Tu equipo</h2>
          <p style={{ color: "#6b6759" }} className="text-sm mb-6">
            Cuatro especialistas que ya conocen tus números, tu visión y tus tareas.
          </p>
          <AgentGrid onPick={setAgent} />
        </>
      ) : (
        <ChatView agent={agent} business={business} onBack={() => setAgent(null)} />
      )}
    </div>
  );
}
