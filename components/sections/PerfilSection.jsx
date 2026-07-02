"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { BRAND } from "@/lib/constants";
import { loadData, saveData } from "@/lib/storage";
import { logoUrl } from "@/lib/logo";
import { createClient } from "@/lib/supabase/client";

export default function PerfilSection({ business, onBusinessUpdate }) {
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState(null);
  const [nombre, setNombre] = useState(business?.nombre || "");
  const [rubro, setRubro] = useState(business?.rubro || "");
  const [guardandoDatos, setGuardandoDatos] = useState(false);
  const [guardadoDatos, setGuardadoDatos] = useState(false);

  const [logoSrc, setLogoSrc] = useState(null);
  const [subiendoLogo, setSubiendoLogo] = useState(false);
  const [errorLogo, setErrorLogo] = useState("");
  const fileInputRef = useRef(null);

  const [nuevaPassword, setNuevaPassword] = useState("");
  const [confirmarPassword, setConfirmarPassword] = useState("");
  const [cambiandoPassword, setCambiandoPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setEmail(data.user.email);
        setUserId(data.user.id);
        setLogoSrc(logoUrl(data.user.id, business?.logoUpdatedAt));
      }
    });
  }, [business?.logoUpdatedAt]);

  const guardarDatos = async () => {
    setGuardandoDatos(true);
    const actualizado = { ...business, nombre, rubro };
    await saveData("negocio-perfil", actualizado);
    onBusinessUpdate?.(actualizado);
    setGuardandoDatos(false);
    setGuardadoDatos(true);
    setTimeout(() => setGuardadoDatos(false), 1500);
  };

  const subirLogo = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    setErrorLogo("");
    setSubiendoLogo(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.storage
        .from("logos")
        .upload(`${userId}/logo`, file, { upsert: true, contentType: file.type, cacheControl: "3600" });
      if (error) throw error;

      const logoUpdatedAt = Date.now();
      const actualizado = { ...business, nombre, rubro, logoUpdatedAt };
      await saveData("negocio-perfil", actualizado);
      onBusinessUpdate?.(actualizado);
      setLogoSrc(logoUrl(userId, logoUpdatedAt));
    } catch (err) {
      setErrorLogo("No se pudo subir el logo. Probá con otra imagen (JPG o PNG, menos de 2MB).");
    } finally {
      setSubiendoLogo(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const cambiarPassword = async () => {
    setPasswordError("");
    setPasswordMsg("");
    if (nuevaPassword.length < 6) {
      setPasswordError("La contraseña tiene que tener al menos 6 caracteres.");
      return;
    }
    if (nuevaPassword !== confirmarPassword) {
      setPasswordError("Las contraseñas no coinciden.");
      return;
    }
    setCambiandoPassword(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: nuevaPassword });
    setCambiandoPassword(false);
    if (error) {
      setPasswordError(error.message);
      return;
    }
    setPasswordMsg("Contraseña actualizada ✓");
    setNuevaPassword("");
    setConfirmarPassword("");
    setTimeout(() => setPasswordMsg(""), 2000);
  };

  return (
    <div>
      <h2 style={{ color: BRAND.navy }} className="text-xl font-semibold mb-1">Perfil</h2>
      <p style={{ color: "#6b6759" }} className="text-sm mb-6">Tu cuenta, tu negocio y tu logo.</p>

      {/* Cuenta */}
      <div className="rounded-xl p-4 mb-5" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
        <div style={{ color: BRAND.navy }} className="text-sm font-semibold mb-1">Cuenta</div>
        <p style={{ color: "#8a8578" }} className="text-sm">{email || "—"}</p>
      </div>

      {/* Logo */}
      <div className="rounded-xl p-4 mb-5" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
        <div style={{ color: BRAND.navy }} className="text-sm font-semibold mb-3">Logo del negocio</div>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-lg flex items-center justify-center overflow-hidden shrink-0"
            style={{ background: "#f0ece2", border: "1px solid #e4dfd3" }}>
            {logoSrc && (
              <img src={logoSrc} alt="Logo" className="w-full h-full object-contain"
                onError={(e) => { e.currentTarget.style.display = "none"; }} />
            )}
          </div>
          <div>
            <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml"
              onChange={subirLogo} className="hidden" id="logo-input" />
            <label htmlFor="logo-input"
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold cursor-pointer"
              style={{ background: BRAND.teal, color: BRAND.navy }}>
              {subiendoLogo ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
              {subiendoLogo ? "Subiendo..." : "Subir logo"}
            </label>
            <p style={{ color: "#a89f88" }} className="text-xs mt-2">JPG, PNG, WEBP o SVG. Máximo 2MB.</p>
            {errorLogo && <p className="text-xs mt-1" style={{ color: "#b3453f" }}>{errorLogo}</p>}
          </div>
        </div>
      </div>

      {/* Datos del negocio */}
      <div className="rounded-xl p-4 mb-5" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
        <div style={{ color: BRAND.navy }} className="text-sm font-semibold mb-3">Datos del negocio</div>
        <span style={{ color: "#8a8578" }} className="text-xs block mb-1">Nombre</span>
        <input value={nombre} onChange={(e) => setNombre(e.target.value)}
          className="w-full rounded-lg px-3 py-2 text-sm outline-none mb-3" style={{ border: "1px solid #e4dfd3" }} />
        <span style={{ color: "#8a8578" }} className="text-xs block mb-1">Rubro</span>
        <input value={rubro} onChange={(e) => setRubro(e.target.value)}
          className="w-full rounded-lg px-3 py-2 text-sm outline-none mb-3" style={{ border: "1px solid #e4dfd3" }} />
        <button onClick={guardarDatos} disabled={guardandoDatos}
          className="rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50"
          style={{ background: BRAND.teal, color: BRAND.navy }}>
          {guardadoDatos ? "Guardado ✓" : guardandoDatos ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>

      {/* Cambiar contraseña */}
      <div className="rounded-xl p-4" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
        <div style={{ color: BRAND.navy }} className="text-sm font-semibold mb-3">Cambiar contraseña</div>
        <span style={{ color: "#8a8578" }} className="text-xs block mb-1">Nueva contraseña</span>
        <input type="password" value={nuevaPassword} onChange={(e) => setNuevaPassword(e.target.value)}
          className="w-full rounded-lg px-3 py-2 text-sm outline-none mb-3" style={{ border: "1px solid #e4dfd3" }} />
        <span style={{ color: "#8a8578" }} className="text-xs block mb-1">Repetí la contraseña</span>
        <input type="password" value={confirmarPassword} onChange={(e) => setConfirmarPassword(e.target.value)}
          className="w-full rounded-lg px-3 py-2 text-sm outline-none mb-3" style={{ border: "1px solid #e4dfd3" }} />
        {passwordError && <p className="text-xs mb-3" style={{ color: "#b3453f" }}>{passwordError}</p>}
        {passwordMsg && <p className="text-xs mb-3" style={{ color: "#127a79" }}>{passwordMsg}</p>}
        <button onClick={cambiarPassword} disabled={cambiandoPassword || !nuevaPassword}
          className="rounded-lg px-4 py-2 text-sm font-semibold disabled:opacity-50"
          style={{ background: BRAND.navy, color: BRAND.cream }}>
          {cambiandoPassword ? "Actualizando..." : "Actualizar contraseña"}
        </button>
      </div>
    </div>
  );
}
