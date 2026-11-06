import { Box3, Group, Mesh, TextureLoader, Vector3, type Material, type Object3D } from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

/** Altura máxima de um modelo, em raios da pegada (uma garrafa não fica uma torre no prato). */
const MAX_HEIGHT = 1.8;

/**
 * Os modelos dos alimentos (.glb), cada um descarregado uma vez por prato. Ficam normalizados: a
 * pegada tem raio 1, a base em y = 0 e o centro na origem, para a cena só ter de os pôr no sítio e
 * escalar pelo raio da peça. `dispose()` liberta geometrias, materiais e texturas ao sair.
 */
export class ModelLibrary {
  private readonly loader = new GLTFLoader();
  private readonly cache = new Map<string, Promise<Object3D>>();
  private readonly loaded = new Set<Object3D>();
  private disposed = false;

  constructor() {
    // No Chrome, o GLTFLoader lê as texturas com fetch(blob:), que a CSP (connect-src 'self') não
    // deixa; com o TextureLoader vão por <img> (img-src já aceita blob:), como no Safari.
    this.loader.register((parser) => {
      parser.textureLoader = new TextureLoader(parser.options.manager);
      return { name: "pp_image_textures" };
    });
  }

  load(url: string): Promise<Object3D> {
    let promise = this.cache.get(url);
    if (!promise) {
      promise = this.loader.loadAsync(url).then((gltf) => {
        const model = normalize(gltf.scene);
        if (this.disposed) disposeObject(model);
        else this.loaded.add(model);
        return model;
      });
      this.cache.set(url, promise);
    }
    return promise;
  }

  dispose(): void {
    this.disposed = true;
    for (const model of this.loaded) disposeObject(model);
    this.loaded.clear();
    this.cache.clear();
  }
}

function normalize(scene: Object3D): Object3D {
  const box = new Box3().setFromObject(scene);
  const size = box.getSize(new Vector3());
  const center = box.getCenter(new Vector3());
  const footprint = Math.max(size.x, size.z) / 2 || 1;
  let scale = 1 / footprint;
  if (size.y * scale > MAX_HEIGHT) scale = MAX_HEIGHT / size.y;
  scene.position.set(-center.x, -box.min.y, -center.z);
  const wrapper = new Group();
  wrapper.add(scene);
  wrapper.scale.setScalar(scale);
  return wrapper;
}

/** Liberta o que está na GPU (geometria, materiais e as texturas de cada material). */
export function disposeObject(root: Object3D): void {
  root.traverse((node) => {
    if (!(node instanceof Mesh)) return;
    node.geometry.dispose();
    const materials: Material[] = Array.isArray(node.material) ? node.material : [node.material];
    for (const material of materials) {
      for (const value of Object.values(material)) {
        if (value && typeof value === "object" && "isTexture" in value) {
          (value as { dispose: () => void }).dispose();
        }
      }
      material.dispose();
    }
  });
}
