"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { BRAND, TIPOS_NEGOCIO } from "@/lib/constants";
import { useUnidadStorage } from "@/lib/useUnidadStorage";
import { useUnidad } from "@/components/UnidadProvider";
import { money } from "@/lib/helpers";
import { logoUrl } from "@/lib/logo";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import CambiarTarjetaForm from "@/components/perfil/CambiarTarjetaForm";
import PasswordInput from "@/components/PasswordInput";

const ESTADO_LABEL = { trial: "Prueba gratis", active: "Activa", past_due: "Pago vencido", canceled: "Cancelada" };
const ESTADO_COLOR = {
  trial: { bg: "#f0ece2", text: "#6b6759" },
  active: { bg: "#eef7f6", text: "#127a79" },
  past_due: { bg: "#fdf0e6", text: "#b3703f" },
  canceled: { bg: "#fbeceb", text: "#b3453f" },
};

function SuscripcionBlock() {
  const [sub, setSub] = useState(null);
  const [error, setError] = useState("");
  const [mostrarForm, setMostrarForm] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const cargar = () => {
    fetch("/api/mercadopago/subscription")
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setSub(d);
      });
  };

  useEffect(() => { cargar(); }, []);

  if (error) return null;
  if (!sub) {
    return (
      <div className="rounded-xl p-4 mb-5" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
        <p style={{ color: "#8a8578" }} className="text-sm">Cargando suscripción...</p>
      </div>
    );
  }

  const estado = ESTADO_COLOR[sub.subscriptionStatus] || ESTADO_COLOR.trial;
  const diasTrial = sub.trialEndsAt ? Math.max(0, Math.ceil((new Date(sub.trialEndsAt) - new Date()) / 86400000)) : null;

  return (
    <div className="rounded-xl p-4 mb-5" style={{ background: "#ffffff", border: "1px solid #e4dfd3" }}>
      <div className="flex items-center justify-between mb-3">
        <div style={{ color: BRAND.navy }} className="text-sm font-semibold">Suscripción</div>
        <span className="text-xs px-2 py-1 rounded-full font-semibold" style={{ background: estado.bg, color: estado.text }}>
          {ESTADO_LABEL[sub.subscriptionStatus] || sub.subscriptionStatus}
        </span>
      </div>

      <div className="text-xs space-y-1 mb-3" style={{ color: "#4a4740" }}>
        <p><b>Membresía:</b> {money(sub.precio)}/mes</p>
        {sub.subscriptionStatus === "trial" && diasTrial !== null && (
          <p>Te quedan <b>{diasTrial}</b> {diasTrial === 1 ? "día" : "días"} de prueba.</p>
        )}
        {sub.mercadopago?.paymentMethodId && (
          <p><b>Medio de pago:</b> {sub.mercadopago.paymentMethodId}</p>
        )}
        {sub.mercadopago?.nextPaymentDate && (
          <p><b>Próximo cobro:</b> {new Date(sub.mercadopago.nextPaymentDate).toLocaleDateString("es-AR")}</p>
        )}
      </div>

      {mensaje && <p className="text-xs mb-3" style={{ color: "#127a79" }}>{mensaje}</p>}

      {!sub.mercadopago ? (
        <Link href="/suscripcion"
          className="inline-block rounded-lg px-4 py-2 text-sm font-semibold"
          style={{ background: BRAND.teal, color: BRAND.navy }}>
          Activar suscripción
        </Link>
      ) : !mostrarForm ? (
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setMostrarForm(true)}
            className="rounded-lg px-4 py-2 text-sm font-semibold"
            style={{ background: BRAND.navy, color: BRAND.cream }}>
            Cargar tarjeta acá
          </button>
          {sub.mercadopago.initPoint && (
            <a href={sub.mercadopago.initPoint} target="_blank" rel="noopener noreferrer"
              className="rounded-lg px-4 py-2 text-sm font-semibold"
              style={{ background: BRAND.teal, color: BRAND.navy }}>
              Pagar con MercadoPago
            </a>
          )}
        </div>
      ) : (
        <CambiarTarjetaForm
          onCancel={() => setMostrarForm(false)}
          onSuccess={() => {
            setMostrarForm(false);
            setMensaje("Medio de pago actualizado ✓");
            cargar();
            setTimeout(() => setMensaje(""), 3000);
          }}
        />
      )}
      {sub.mercadopago && !mostrarForm && (
        <p style={{ color: "#a89f88" }} className="text-[11px] mt-2">
          "Cargar tarjeta acá" carga una tarjeta sin salir de la app. "Pagar con MercadoPago" te lleva a MercadoPago,
          donde podés elegir tarjeta, dinero en cuenta u otros medios.
        </p>
      )}
    </div>
  );
}

export default function PerfilSection({ business, onBusinessUpdate }) {
  const { saveData } = useUnidadStorage();
  const { unidadId, renombrarUnidad } = useUnidad();
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState(null);
  const [nombre, setNombre] = useState(business?.nombre || "");
  const [rubro, setRubro] = useState(business?.rubro || "");
  const [tipoNegocio, setTipoNegocio] = useState(business?.tipoNegocio || "productos");
  const [guardandoDatos, setGuardandoDatos] = useState(false);
  const [guardadoDatos, setGuardadoDatos] = useState(false);

  // Si cambia la unidad activa (o llega el business recién cargado), sincronizar el formulario.
  useEffect(() => {
    setNombre(business?.nombre || "");
    setRubro(business?.rubro || "");
    setTipoNegocio(business?.tipoNegocio || "productos");
  }, [business, unidadId]);

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
    const actualizado = { ...business, nombre, rubro, tipoNegocio };
    await saveData("negocio-perfil", actualizado);
    if (unidadId) {
      try { await renombrarUnidad(unidadId, { nombre, rubro, tipoNegocio }); } catch (e) { /* no bloquea el guardado principal */ }
    }
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

      {/* Suscripción */}
      <SuscripcionBlock />

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
        <span style={{ color: "#8a8578" }} className="text-xs block mb-1">¿Qué vendés?</span>
        <div className="grid grid-cols-2 gap-2 mb-3">
          {TIPOS_NEGOCIO.map((t) => (
            <button key={t.id} type="button" onClick={() => setTipoNegocio(t.id)}
              className="rounded-lg px-3 py-2 text-sm font-medium"
              style={tipoNegocio === t.id
                ? { background: BRAND.teal, color: BRAND.navy }
                : { background: "#f0ece2", color: "#6b6759" }}>
              {t.label}
            </button>
          ))}
        </div>
        <p style={{ color: "#a89f88" }} className="text-xs mb-3">
          Esto define cómo se arma la sección de Finanzas: {tipoNegocio === "servicios" ? "solo vas a ver costos fijos." : "vas a poder armar el costo de cada producto con sus ingredientes."}
        </p>
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
        <div className="mb-3">
          <PasswordInput dark={false} value={nuevaPassword} onChange={(e) => setNuevaPassword(e.target.value)}
            className="w-full rounded-lg px-3 py-2 pr-11 text-sm outline-none" style={{ border: "1px solid #e4dfd3" }} />
        </div>
        <span style={{ color: "#8a8578" }} className="text-xs block mb-1">Repetí la contraseña</span>
        <div className="mb-3">
          <PasswordInput dark={false} value={confirmarPassword} onChange={(e) => setConfirmarPassword(e.target.value)}
            className="w-full rounded-lg px-3 py-2 pr-11 text-sm outline-none" style={{ border: "1px solid #e4dfd3" }} />
        </div>
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
