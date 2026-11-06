/**
 * A vista do prato (sem three: os componentes da página importam isto sem trazer o chunk do 3D).
 */
export interface PlateView {
  /** Rotação do prato em torno do eixo vertical (radianos). */
  yaw: number;
  /** Inclinação extra da câmara (radianos; 0 = a vista de origem). */
  pitch: number;
}

export const DEFAULT_VIEW: PlateView = { yaw: 0, pitch: 0 };
