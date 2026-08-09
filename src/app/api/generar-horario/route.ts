import { requireRol } from "@/lib/auth";
import { generate } from "@/lib/scheduler";
import { GeneracionCanceladaError, type EventoGeneracion } from "@/lib/scheduler/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  await requireRol("coordinador", "administrador");

  let body: { periodoId?: string; grupoId?: string; sedeId?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Cuerpo de la solicitud inválido." }, { status: 400 });
  }

  const periodoId = body.periodoId?.trim();
  if (!periodoId) {
    return Response.json({ error: "Selecciona un período académico." }, { status: 400 });
  }

  const criterio = {
    grupoId: body.grupoId || undefined,
    sedeId: body.sedeId || undefined,
  };

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let cerrado = false;
      const send = (evento: EventoGeneracion) => {
        if (cerrado || request.signal.aborted) return;
        try {
          controller.enqueue(encoder.encode(`${JSON.stringify(evento)}\n`));
        } catch {
          cerrado = true;
        }
      };

      const onAbort = () => {
        // El cliente cerró la conexión; el motor comprueba signal y deja de trabajar.
      };
      request.signal.addEventListener("abort", onAbort);

      try {
        const resultado = await generate(
          periodoId,
          null,
          criterio,
          (progreso) => {
            send({ tipo: "progreso", progreso });
          },
          request.signal,
        );
        send({ tipo: "resultado", resultado });
      } catch (error) {
        if (error instanceof GeneracionCanceladaError || request.signal.aborted) {
          send({ tipo: "cancelado" });
        } else {
          send({
            tipo: "error",
            mensaje: error instanceof Error ? error.message : "Error desconocido al generar el horario.",
          });
        }
      } finally {
        request.signal.removeEventListener("abort", onAbort);
        if (!cerrado) {
          try {
            controller.close();
          } catch {
            // ya cerrado
          }
          cerrado = true;
        }
      }
    },
    cancel() {
      // AbortController del Request se dispara al cancelar el body del cliente.
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
