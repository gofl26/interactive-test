import {
  ArcRotateCamera,
  Color4,
  Engine,
  HemisphericLight,
  Mesh,
  MeshBuilder,
  PointsCloudSystem,
  Scene,
  SceneLoader,
  Vector3,
  VertexBuffer,
} from "@babylonjs/core";
import "@babylonjs/loaders";
import { useEffect, useRef } from "react";

type Nullable<T> = T | null;
type IndicesArray = number[] | Int32Array | Uint32Array | Uint16Array;
type FloatArray = number[] | Float32Array;

export default function CreateScene() {
  const reactCanvas = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<Engine | null>(null);
  const sceneRef = useRef<Scene | null>(null);

  const hsvToRgb = (h: number, s: number, v: number): [number, number, number] => {
    const c = v * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = v - c;
    let r = 0,
      g = 0,
      b = 0;

    if (h < 60) [r, g, b] = [c, x, 0];
    else if (h < 120) [r, g, b] = [x, c, 0];
    else if (h < 180) [r, g, b] = [0, c, x];
    else if (h < 240) [r, g, b] = [0, x, c];
    else if (h < 300) [r, g, b] = [x, 0, c];
    else [r, g, b] = [c, 0, x];

    return [r + m, g + m, b + m];
  };
  const getMeshPoints = (
    pointsArr: Vector3[],
    positions: Nullable<FloatArray>,
    indices: Nullable<IndicesArray>,
    pointCount: number,
    reScale?: boolean
  ) => {
    if (!indices || !positions || indices.length < 3) return;

    const triCount = Math.floor(indices.length / 3);
    for (let i = 0; i < pointCount; i++) {
      const faceId = Math.floor(Math.random() * triCount);
      const i0 = indices[faceId * 3];
      const i1 = indices[faceId * 3 + 1];
      const i2 = indices[faceId * 3 + 2];

      // index validation
      if (
        i0 === undefined ||
        i1 === undefined ||
        i2 === undefined ||
        i0 * 3 + 2 >= positions.length ||
        i1 * 3 + 2 >= positions.length ||
        i2 * 3 + 2 >= positions.length
      ) {
        console.warn("Invalid triangle at faceId", faceId);
        continue;
      }

      const v1 = Vector3.FromArray(positions, i0 * 3);
      const v2 = Vector3.FromArray(positions, i1 * 3);
      const v3 = Vector3.FromArray(positions, i2 * 3);

      let u = Math.random();
      let v = Math.random();
      if (u + v > 1) {
        u = 1 - u;
        v = 1 - v;
      }
      if (reScale) {
        const point = v1
          .scale(1 - u - v)
          .add(v2.scale(u))
          .add(v3.scale(v))
          .scaleInPlace(0.1);
        pointsArr.push(point);
      } else {
        const point = v1
          .scale(1 - u - v)
          .add(v2.scale(u))
          .add(v3.scale(v));
        pointsArr.push(point);
      }
    }
  };
  const onRender = (scene: Scene) => {
    if (scene === undefined) return;
  };
  const onSceneReady = async (engine: Engine, scene: Scene) => {
    const canvas = scene.getEngine().getRenderingCanvas();
    const camera = new ArcRotateCamera(
      "camera",
      Math.PI / 2,
      Math.PI / 2.5,
      10,
      new Vector3(0, 0, 0),
      scene
    );
    camera.attachControl(canvas, true);
    camera.inertia = 0.5;
    camera.panningSensibility = 10000;

    camera.wheelPrecision = 10;
    camera.attachControl(canvas, true, true);

    new HemisphericLight("light", new Vector3(0, 1, 0), scene);

    const pointCount = 10000;
    const pointCloud = new PointsCloudSystem("pcs", 1, scene);

    const spherePoints: Vector3[] = [];
    const torusKnotPoints: Vector3[] = [];
    const tubePoints: Vector3[] = [];
    const capsulePoints: Vector3[] = [];
    const planePoints: Vector3[] = [];

    const sphere = MeshBuilder.CreateSphere("sphere", { diameter: 10 }, scene);
    sphere.setEnabled(false);

    const positions_sphere = sphere.getVerticesData(VertexBuffer.PositionKind);
    const indices_sphere = sphere.getIndices();

    const torusKnot = MeshBuilder.CreateTorusKnot(
      "torusKnot",
      {
        radius: 1,
        tube: 0.1,
        radialSegments: 256,
        tubularSegments: 64,
        p: 2,
        q: 3,
      },
      scene
    );
    torusKnot.setEnabled(false);

    const positions_torusKnot = torusKnot.getVerticesData(VertexBuffer.PositionKind);
    const indices_torusKnot = torusKnot.getIndices();

    const tube = MeshBuilder.CreateTube(
      "tube",
      {
        path: [new Vector3(0, -5, 0), new Vector3(0, 5, 0)],
        radius: 1,
        tessellation: 16,
        updatable: false,
      },
      scene
    );
    tube.setEnabled(false);
    const positions_tube = tube.getVerticesData(VertexBuffer.PositionKind);
    const indices_tube = tube.getIndices();

    const capsule = MeshBuilder.CreateCapsule(
      "capsule",
      {
        height: 10, // 전체 높이
        radius: 2, // 반지름 (원기둥 + 반구의 공통)
        tessellation: 16, // 둘레 방향 분할 수 (둥글기)
        subdivisions: 2, // 반구의 분할 수 (상/하)
      },
      scene
    );
    capsule.setEnabled(false);
    const positions_capsule = capsule.getVerticesData(VertexBuffer.PositionKind);
    const indices_capsule = capsule.getIndices();

    const plane = MeshBuilder.CreatePlane(
      "plane",
      {
        size: 10, // 정사각형일 경우
        sideOrientation: Mesh.DOUBLESIDE, // 양면 렌더링
      },
      scene
    );
    const positions_plane = plane.getVerticesData(VertexBuffer.PositionKind);
    const indices_plane = plane.getIndices();
    plane.setEnabled(false);

    const eiffelPoints: Vector3[] = [];
    SceneLoader.ImportMeshAsync("", "/src/public/", "free__la_tour_eiffel.glb", scene).then(
      ({ meshes }) => {
        // const meshList = meshes.filter((m) => m instanceof Mesh);
        meshes.forEach((m) => m.setEnabled(false));
        const mesh = meshes.find((m) => m instanceof Mesh && m.getTotalVertices() > 0) as Mesh;
        mesh.setEnabled(false);

        const positions = mesh.getVerticesData(VertexBuffer.PositionKind)!;
        const indices = mesh.getIndices()!;
        getMeshPoints(eiffelPoints, positions, indices, pointCount, true);

        // 이제 PCS에 characterPoints 사용 가능
      }
    );

    const rabbitPoints: Vector3[] = [];
    SceneLoader.ImportMeshAsync("", "/src/public/", "rabbit_low_poly.glb", scene).then(
      ({ meshes }) => {
        // const meshList = meshes.filter((m) => m instanceof Mesh);
        meshes.forEach((m) => m.setEnabled(false));
        const mesh = meshes.find((m) => m instanceof Mesh && m.getTotalVertices() > 0) as Mesh;
        console.info("🚀 mesh:", mesh);
        mesh.setEnabled(false);

        const positions = mesh.getVerticesData(VertexBuffer.PositionKind)!;
        const indices = mesh.getIndices()!;
        getMeshPoints(rabbitPoints, positions, indices, pointCount);

        // 이제 PCS에 characterPoints 사용 가능
      }
    );

    getMeshPoints(spherePoints, positions_sphere, indices_sphere, pointCount);
    getMeshPoints(torusKnotPoints, positions_torusKnot, indices_torusKnot, pointCount);
    getMeshPoints(tubePoints, positions_tube, indices_tube, pointCount);
    getMeshPoints(capsulePoints, positions_capsule, indices_capsule, pointCount);
    getMeshPoints(planePoints, positions_plane, indices_plane, pointCount);

    pointCloud.addPoints(
      pointCount,
      function (particle: { position: Vector3; color: Color4 }, i: number) {
        particle.position = spherePoints[i];
        particle.color = new Color4(Math.random(), Math.random(), 1, 1);
      }
    );

    const shapePointsList = [
      spherePoints,
      torusKnotPoints,
      // tubePoints,
      // capsulePoints,
      // planePoints,
      eiffelPoints,
      rabbitPoints,
    ];
    let currentShapeIndex = 0;
    const morphDuration = 10; // 5초마다 다음 단계로

    let time = 0;
    pointCloud.buildMeshAsync().then(function () {
      scene.registerBeforeRender(function () {
        time += scene.getEngine().getDeltaTime() / 1000;

        let rawFactor = time / morphDuration;
        if (rawFactor > 1) {
          time = 0;
          rawFactor = 0;
          currentShapeIndex = (currentShapeIndex + 1) % shapePointsList.length;
        }
        const morphFactor = (1 - Math.cos(rawFactor * Math.PI)) / 2;
        const hue = (time * 30) % 360; // 시간에 따라 천천히 색상 변화
        const [r, g, b] = hsvToRgb(hue, 0.6, 1); // 부드럽고 채도가 너무 튀지 않게

        if (!pointCloud || !pointCloud.mesh) return;
        pointCloud.mesh.rotation.y += 0.001;

        const fromPoints = shapePointsList[currentShapeIndex];
        const toPoints = shapePointsList[(currentShapeIndex + 1) % shapePointsList.length];

        pointCloud.updateParticle = function (particle) {
          const i = particle.idx;
          const from = fromPoints[i];
          const to = toPoints[i];
          particle.position = Vector3.Lerp(from, to, morphFactor);
          particle.position.y += Math.sin(particle.position.x) * 0.1;

          particle.color = new Color4(r, g, b, 1);

          return particle;
        };

        pointCloud.setParticles();
      });
    });
  };
  useEffect(() => {
    const { current: canvas } = reactCanvas;
    if (!canvas) return;
    const engine = new Engine(canvas);

    engineRef.current = engine;

    const scene = new Scene(engine);
    scene.clearColor = new Color4(0, 0, 0, 1);
    sceneRef.current = scene;

    if (scene.isReady()) {
      onSceneReady(engine, scene);
    } else {
      scene.onReadyObservable.addOnce((scene) => onSceneReady(engine, scene));
    }
    engine.runRenderLoop(() => {
      if (typeof onRender === "function") onRender(scene);
      scene.render();
    });

    const resize = () => {
      scene.getEngine().resize();
    };

    if (window) {
      window.addEventListener("resize", resize);
    }
    return () => {
      scene.getEngine().dispose();

      if (window) {
        window.removeEventListener("resize", resize);
      }
    };
  }, []);
  return (
    <div className="relative h-screen w-screen bg-[#303035]">
      <canvas ref={reactCanvas} className="absolute top-0 right-0 h-full w-full" />
    </div>
  );
}
