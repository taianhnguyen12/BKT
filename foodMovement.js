import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { FXAAShader } from 'three/examples/jsm/shaders/FXAAShader.js';

// Tạo renderer, scene, và camera
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 5, 10);

// Ánh sáng
const pointLight = new THREE.PointLight(0xffffff, 1, 100);
pointLight.position.set(10, 10, 10);
scene.add(pointLight);

const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.5);
scene.add(hemisphereLight);

// Loaders
const loader = new GLTFLoader();
let ruotGIAMesh;
let wasteMesh;
const foodMeshes = [];

// Hiệu ứng (EffectComposer)
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const outlinePass = new OutlinePass(
  new THREE.Vector2(window.innerWidth, window.innerHeight),
  scene,
  camera
);
outlinePass.edgeStrength = 3.0;
outlinePass.edgeGlow = 0.5;
outlinePass.edgeThickness = 1.0;
outlinePass.visibleEdgeColor.set('#ffffff');
outlinePass.hiddenEdgeColor.set('#000000');
composer.addPass(outlinePass);

const fxaaPass = new ShaderPass(FXAAShader);
fxaaPass.uniforms['resolution'].value.set(
  1 / window.innerWidth,
  1 / window.innerHeight
);
composer.addPass(fxaaPass);

// Load mô hình và hiển thị riêng ruột già
loader.load(
  '/people1.glb',
  (gltf) => {
    const model = gltf.scene;

    model.traverse((child) => {
      if (child.isMesh && child.name === 'ruot_GIA') {
        ruotGIAMesh = child;

        // Làm ruột già trong suốt
        ruotGIAMesh.material = new THREE.MeshStandardMaterial({
          color: 0xffd700,
          transparent: true,
          opacity: 0.3,
          depthWrite: false,
        });

        scene.add(ruotGIAMesh);
        outlinePass.selectedObjects = [ruotGIAMesh];
      }
    });

    if (!ruotGIAMesh) {
      console.error('Không tìm thấy ruột già trong mô hình!');
      return;
    }

    createFoodModels(10); // Tạo 10 phân tử thức ăn
    moveFoodAlongSpiral(); // Bắt đầu di chuyển thức ăn theo đường xoắn ốc
    createWaste(); // Tạo chất thải
    animateWaste(); // Di chuyển chất thải trong ruột già
  },
  undefined,
  (error) => console.error('Lỗi khi tải mô hình:', error)
);

// Tạo thức ăn dưới dạng mô hình GLB
function createFoodModels(count) {
  for (let i = 0; i < count; i++) {
    loader.load(
      '/untitled.glb', // Đường dẫn đến tệp GLB của phân tử thức ăn
      (gltf) => {
        const foodModel = gltf.scene;

        // Đặt vị trí ngẫu nhiên cho phân tử thức ăn trong khu vực của ruột già
        const boundingBox = new THREE.Box3().setFromObject(ruotGIAMesh);
        const size = boundingBox.getSize(new THREE.Vector3());
        const min = boundingBox.min;

        foodModel.position.set(
          THREE.MathUtils.randFloat(min.x, min.x + size.x),
          THREE.MathUtils.randFloat(min.y, min.y + size.y),
          THREE.MathUtils.randFloat(min.z, min.z + size.z)
        );

        scene.add(foodModel);
        foodMeshes.push(foodModel);
      },
      undefined,
      (error) => console.error('Lỗi khi tải mô hình phân tử thức ăn:', error)
    );
  }
}

// Tạo chất thải (một hình cầu)
function createWaste() {
  const wasteGeometry = new THREE.SphereGeometry(0.2, 16, 16); // Đường kính 0.2 cho chất thải
  const wasteMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 }); // Màu nâu cho chất thải
  wasteMesh = new THREE.Mesh(wasteGeometry, wasteMaterial);

  // Đặt vị trí ban đầu của chất thải
  const boundingBox = new THREE.Box3().setFromObject(ruotGIAMesh);
  const size = boundingBox.getSize(new THREE.Vector3());
  const min = boundingBox.min;

  wasteMesh.position.set(min.x, min.y, min.z);
  scene.add(wasteMesh);
}

// Di chuyển thức ăn theo đường xoắn ốc trong không gian 3D
function moveFoodAlongSpiral() {
  const speed = 0.05;
  const radius = 2; // Bán kính của đường xoắn ốc
  const height = 10; // Chiều cao của ống ruột già

  let angles = foodMeshes.map(() => Math.random() * Math.PI * 2); // Khởi tạo góc ngẫu nhiên cho mỗi phân tử

  function animate() {
    if (!ruotGIAMesh) return;

    foodMeshes.forEach((foodMesh, index) => {
      // Tính toán vị trí mới theo đường xoắn ốc
      angles[index] += speed; // Cập nhật góc theo tốc độ

      // Đảm bảo góc không vượt quá 2π (1 vòng quay)
      if (angles[index] > Math.PI * 2) {
        angles[index] -= Math.PI * 2;
      }

      const x = radius * Math.cos(angles[index]);  // Tính toán vị trí x theo góc
      const y = (index * speed) % height;  // Di chuyển theo chiều cao của ống
      const z = radius * Math.sin(angles[index]);  // Tính toán vị trí z theo góc

      foodMesh.position.set(x, y, z); // Cập nhật vị trí mới của thức ăn
    });

    requestAnimationFrame(animate);
  }

  animate();
}

// Di chuyển chất thải trong ruột già
function animateWaste() {
  const speed = 0.02;
  let direction = new THREE.Vector3(0, 0, -1); // Chất thải di chuyển theo trục Z

  function animate() {
    if (!ruotGIAMesh || !wasteMesh) return;

    const boundingBox = new THREE.Box3().setFromObject(ruotGIAMesh);
    const newPosition = wasteMesh.position.clone().addScaledVector(direction, speed);

    // Kiểm tra xem chất thải có ra khỏi khu vực ruột già không
    if (!boundingBox.containsPoint(newPosition)) {
      // Nếu ra ngoài khu vực, chất thải quay lại vị trí ban đầu
      wasteMesh.position.set(boundingBox.min.x, boundingBox.min.y, boundingBox.min.z);
    } else {
      wasteMesh.position.copy(newPosition);
    }

    requestAnimationFrame(animate);
  }

  animate();
}

// OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Vòng lặp render
function animate() {
  controls.update();
  composer.render();
  requestAnimationFrame(animate);
}

animate();

// Xử lý sự kiện nhấn nút
const startButton = document.getElementById('startButton');
const psImage = document.getElementById('psImage');

startButton.addEventListener('click', () => {
  // Hiển thị hình ảnh khi nhấn nút
  psImage.style.display = 'block';

  // Bắt đầu di chuyển thức ăn
  moveFoodAlongSpiral();
  animateWaste();
});
