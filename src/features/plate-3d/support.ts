import { useEffect, useState } from "react";

/**
 * Verificação barata, para decidir se se mostra a porta para o 3D (o botão, o bloco recolhível):
 * existe a API do WebGL 2 e a poupança de dados está desligada. Não cria contexto nenhum.
 */
export function mightUse3D(): boolean {
  if (typeof window === "undefined" || typeof document === "undefined") return false;
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  if (connection?.saveData) return false;
  return "WebGL2RenderingContext" in window;
}

/**
 * Quando há 3D (sem three: isto vai no JavaScript da página). Sem WebGL 2 (o three só usa o 2),
 * com poupança de dados ligada ou fora do browser, nada de 3D: a página fica como sempre. Cria um
 * contexto de teste (caro, sobretudo com WebGL por software): só mesmo antes de mostrar o prato,
 * nunca ao carregar a página (contava no Total Blocking Time).
 */
export function canUse3D(): boolean {
  if (!mightUse3D()) return false;
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2");
    if (!gl) return false;
    // Liberta já o contexto de teste (os browsers limitam quantos podem estar vivos)
    gl.getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}

/** Espera pelo fim do carregamento e pelo LCP, depois por um momento livre do browser. */
export function whenIdleAfterLcp(callback: () => void, timeoutMs = 4000): () => void {
  let cancelled = false;
  let idleHandle: number | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let observer: PerformanceObserver | undefined;
  let loaded = document.readyState === "complete";
  let lcp = false;

  const idle = () => {
    if (cancelled) return;
    if ("requestIdleCallback" in window) {
      idleHandle = window.requestIdleCallback(() => !cancelled && callback(), { timeout: 2000 });
    } else {
      timer = setTimeout(() => !cancelled && callback(), 200);
    }
  };
  const check = () => {
    if (loaded && lcp) {
      observer?.disconnect();
      clearTimeout(fallback);
      idle();
    }
  };
  const onLoad = () => {
    loaded = true;
    check();
  };
  // Browsers sem LCP (Safari): basta o load; e nunca esperar mais do que timeoutMs pelo LCP
  const fallback = setTimeout(() => {
    lcp = true;
    check();
  }, timeoutMs);
  if (
    typeof PerformanceObserver !== "undefined" &&
    PerformanceObserver.supportedEntryTypes?.includes("largest-contentful-paint")
  ) {
    observer = new PerformanceObserver((list) => {
      if (list.getEntries().length > 0) {
        lcp = true;
        check();
      }
    });
    observer.observe({ type: "largest-contentful-paint", buffered: true });
  } else {
    lcp = true;
  }
  if (!loaded) window.addEventListener("load", onLoad, { once: true });
  check();

  return () => {
    cancelled = true;
    observer?.disconnect();
    clearTimeout(fallback);
    clearTimeout(timer);
    if (idleHandle !== undefined) window.cancelIdleCallback(idleHandle);
    window.removeEventListener("load", onLoad);
  };
}

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

/** prefers-reduced-motion, ao vivo. */
export function useReducedMotion(): boolean {
  // O 3D só existe no cliente (ssr: false): lê-se logo, para nem a primeira peça cair
  const [reduced, setReduced] = useState(
    () => typeof window !== "undefined" && window.matchMedia(REDUCED_MOTION).matches,
  );
  useEffect(() => {
    const query = window.matchMedia(REDUCED_MOTION);
    const update = () => setReduced(query.matches);
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  return reduced;
}
