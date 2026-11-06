"use client";

import dynamic from "next/dynamic";
import { Component, type ComponentProps, type ReactNode } from "react";

/**
 * O único caminho para o three: o chunk (three + @react-three/fiber + modelos) só se pede quando
 * este componente monta. Quem o usa decide quando (depois do LCP, de um clique ou ao abrir).
 */
const Plate3D = dynamic(() => import("./plate-3d"), { ssr: false, loading: () => null });

type Plate3DProps = ComponentProps<typeof Plate3D>;

/**
 * Se o 3D falhar (o WebGL não arranca, o chunk não chega), não aparece nada e quem o usa fica a
 * saber (onUnavailable): a página continua como sem 3D.
 */
class Plate3DBoundary extends Component<
  { children: ReactNode; onError?: () => void },
  { failed: boolean }
> {
  override state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  override componentDidCatch() {
    this.props.onError?.();
  }

  override render() {
    return this.state.failed ? null : this.props.children;
  }
}

export function LazyPlate3D(props: Plate3DProps) {
  return (
    <Plate3DBoundary onError={props.onUnavailable}>
      <Plate3D {...props} />
    </Plate3DBoundary>
  );
}
