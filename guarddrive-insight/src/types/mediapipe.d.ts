/**
 * Ambient type declarations for @mediapipe/face_mesh
 * (The package ships its own types but they may not always resolve
 *  correctly in strict Vite/TSConfig setups.)
 */
declare module '@mediapipe/face_mesh' {
  export interface NormalizedLandmark {
    x: number;
    y: number;
    z: number;
    visibility?: number;
  }

  export type NormalizedLandmarkList = NormalizedLandmark[];

  export interface Results {
    image: HTMLCanvasElement | HTMLImageElement | HTMLVideoElement;
    multiFaceLandmarks: NormalizedLandmarkList[];
  }

  export interface FaceMeshOptions {
    maxNumFaces?: number;
    refineLandmarks?: boolean;
    minDetectionConfidence?: number;
    minTrackingConfidence?: number;
  }

  export interface FaceMeshConfig {
    locateFile?: (path: string, prefix?: string) => string;
  }

  export class FaceMesh {
    constructor(config?: FaceMeshConfig);
    setOptions(options: FaceMeshOptions): void;
    onResults(callback: (results: Results) => void): void;
    initialize(): Promise<void>;
    send(inputs: { image: HTMLVideoElement | HTMLImageElement | HTMLCanvasElement }): Promise<void>;
    close(): void;
  }

  // Landmark connection lists
  export const FACEMESH_TESSELATION: [number, number][];
  export const FACEMESH_RIGHT_EYE:   [number, number][];
  export const FACEMESH_LEFT_EYE:    [number, number][];
  export const FACEMESH_FACE_OVAL:   [number, number][];
  export const FACEMESH_LIPS:        [number, number][];
}
