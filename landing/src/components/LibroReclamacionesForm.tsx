"use client";

import { useMemo, useState } from "react";
import { postEcommerceReclamo } from "@/lib/toroApi";

type FormState = {
  nombre: string;
  email: string;
  telefono: string;
  descripcion: string;
};

const emptyState: FormState = {
  nombre: "",
  email: "",
  telefono: "",
  descripcion: "",
};

export default function LibroReclamacionesForm() {
  const [form, setForm] = useState<FormState>(emptyState);
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const disabled = useMemo(() => status === "submitting", [status]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("submitting");
    setErrorMessage(null);

    try {
      await postEcommerceReclamo(form);
      setStatus("success");
      setForm(emptyState);
    } catch (err) {
      setStatus("error");
      setErrorMessage(
        err instanceof Error ? err.message : "No se pudo enviar el reclamo"
      );
    }
  }

  return (
    <section id="reclamaciones" className="py-10">
      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <h2 className="text-2xl font-semibold tracking-tight text-white">
            Libro de reclamaciones
          </h2>
          <p className="mt-2 text-sm leading-6 text-gray-400">
            Tu opinión nos ayuda a mejorar. Envíanos tu reclamación y te
            responderemos lo antes posible.
          </p>
          <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-gray-300">
            <div className="font-medium text-toro-red">Consejo</div>
            <div className="mt-1 leading-6">
              Incluye fecha, detalle del pedido y el problema presentado.
            </div>
          </div>
        </div>

        <div className="lg:col-span-7">
          <form
            onSubmit={onSubmit}
            className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-sm p-6"
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2 text-sm">
                <span className="font-medium text-gray-300">Nombre</span>
                <input
                  required
                  value={form.nombre}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, nombre: e.target.value }))
                  }
                  className="h-11 rounded-xl border border-white/10 bg-white/5 px-4 outline-none ring-toro-red focus:ring-2 text-white placeholder-gray-500"
                  disabled={disabled}
                />
              </label>

              <label className="grid gap-2 text-sm">
                <span className="font-medium text-gray-300">Email</span>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, email: e.target.value }))
                  }
                  className="h-11 rounded-xl border border-white/10 bg-white/5 px-4 outline-none ring-toro-red focus:ring-2 text-white placeholder-gray-500"
                  disabled={disabled}
                />
              </label>

              <label className="grid gap-2 text-sm sm:col-span-2">
                <span className="font-medium text-gray-300">
                  Teléfono (opcional)
                </span>
                <input
                  value={form.telefono}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, telefono: e.target.value }))
                  }
                  className="h-11 rounded-xl border border-white/10 bg-white/5 px-4 outline-none ring-toro-red focus:ring-2 text-white placeholder-gray-500"
                  disabled={disabled}
                />
              </label>

              <label className="grid gap-2 text-sm sm:col-span-2">
                <span className="font-medium text-gray-300">Descripción</span>
                <textarea
                  required
                  value={form.descripcion}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, descripcion: e.target.value }))
                  }
                  className="min-h-32 rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none ring-toro-red focus:ring-2 text-white placeholder-gray-500"
                  disabled={disabled}
                />
              </label>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="submit"
                disabled={disabled}
                className="inline-flex h-11 items-center justify-center rounded-full bg-toro-red px-6 text-sm font-bold uppercase tracking-widest text-white hover:bg-red-700 disabled:opacity-60 transition-colors"
              >
                {status === "submitting" ? "Enviando…" : "Enviar reclamo"}
              </button>

              {status === "success" ? (
                <div className="text-sm font-medium text-green-500">
                  Reclamo enviado correctamente.
                </div>
              ) : null}
              {status === "error" ? (
                <div className="text-sm font-medium text-red-500">
                  {errorMessage ?? "Ocurrió un error al enviar."}
                </div>
              ) : null}
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}

