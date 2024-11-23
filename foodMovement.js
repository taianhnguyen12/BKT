import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Tạo renderer, scene và camera
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('canvas-container').appendChild(renderer.domElement);

const scene = new THREE.Scene();

// Tạo nhiều camera
const cameras = [];

const camera1 = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera1.position.set(0, 5, 10); // Góc nhìn trên cao
cameras.push(camera1);

const camera2 = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera2.position.set(0, 1, 5); // Góc nhìn bình thường
cameras.push(camera2);

const camera3 = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera3.position.set(-5, 5, 5); // Góc nhìn từ bên trái
cameras.push(camera3);

// Chọn camera hiện tại
let currentCamera = camera1;

// Ánh sáng
const pointLight = new THREE.PointLight(0xffffff, 1, 100);
pointLight.position.set(10, 10, 10);
scene.add(pointLight);

const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.5);
scene.add(hemisphereLight);

// Load mô hình
const loader = new GLTFLoader();
let model, ruotGIAMesh;
let wasteMeshes = [];

// Hàm tạo chất thải
function createWaste(count) {
  for (let i = 0; i < count; i++) {
    const wasteGeometry = new THREE.SphereGeometry(0.3, 16, 16); // Kích thước chất thải
    const wasteMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 }); // Màu nâu
    const wasteMesh = new THREE.Mesh(wasteGeometry, wasteMaterial);
    scene.add(wasteMesh);
    wasteMeshes.push(wasteMesh); // Lưu chất thải vào mảng
  }
}

// Di chuyển chất thải qua toàn bộ ruột già
function moveWasteThroughColon() {
  if (!ruotGIAMesh || wasteMeshes.length === 0) return;

  const path = new THREE.CurvePath();

  // Các điểm đại diện cho đường cong ruột già (đặt gần đúng, điều chỉnh theo mô hình thực tế)
  const points = [
    new THREE.Vector3(2, 2, 0),   // Điểm đầu ruột già
    new THREE.Vector3(2.5, 1.8, 0.5),
    new THREE.Vector3(2, 1.5, 1),
    new THREE.Vector3(1.5, 1, 0.5),
    new THREE.Vector3(1, 0.5, 0),
    new THREE.Vector3(0, 0, -0.5), // Điểm cuối ruột già
  ];

  const curve = new THREE.CatmullRomCurve3(points, false); // Đường cong ruột già
  path.add(curve);

  // Hiển thị đường cong (debug)
  const curveGeometry = new THREE.TubeGeometry(curve, 50, 0.05, 8, false);
  const curveMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  const curveMesh = new THREE.Mesh(curveGeometry, curveMaterial);
  scene.add(curveMesh);

  const speed = 0.005; // Tốc độ di chuyển

  wasteMeshes.forEach((wasteMesh, index) => {
    let t = index * 0.1; // Vị trí ban đầu của mỗi chất thải

    const animateWaste = () => {
      t += speed;
      if (t > 1) t = 0; // Khi đến cuối, quay lại đầu

      // Lấy vị trí và hướng từ đường cong
      const position = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t).normalize();

      // Cập nhật vị trí và xoay chất thải
      wasteMesh.position.copy(position);
      wasteMesh.lookAt(position.clone().add(tangent));

      requestAnimationFrame(animateWaste);
    };

    animateWaste();
  });
}

// Load mô hình ruột và thiết lập
loader.load(
  '/people1.glb',
  (gltf) => {
    model = gltf.scene;

    model.traverse((child) => {
      if (child.isMesh) {
        if (child.name === 'ruot_GIA') {
          ruotGIAMesh = child;

          // Làm ruột già trong suốt
          ruotGIAMesh.material = new THREE.MeshStandardMaterial({
            color: 0xffd700, // Màu vàng nhạt
            transparent: true,
            opacity: 0.3, // Độ trong suốt
            depthWrite: false, // Cho phép hiển thị vật thể bên trong
          });
        }
      }
    });

    if (!ruotGIAMesh) {
      console.error('Ruột già không tìm thấy trong mô hình!');
      return;
    }

    model.scale.set(1, 1, 1);
    scene.add(model);

    // Tạo chất thải và bắt đầu chuyển động
    createWaste(5); // Tạo 5 chất thải
    moveWasteThroughColon(); // Bắt đầu di chuyển chất thải
  },
  undefined,
  (error) => {
    console.error('Lỗi khi tải mô hình:', error);
  }
);

// OrbitControls
const controls = new OrbitControls(camera1, renderer.domElement);
controls.enableDamping = true;

// Hàm thay đổi camera
function switchCamera() {
  // Lựa chọn camera tiếp theo trong mảng cameras
  const currentIndex = cameras.indexOf(currentCamera);
  const nextIndex = (currentIndex + 1) % cameras.length;
  currentCamera = cameras[nextIndex];

  // Cập nhật controls với camera mới
  controls.object = currentCamera;
}

// Thêm sự kiện chuyển đổi camera
window.addEventListener('keydown', (event) => {
  if (event.key === 'c') { // Nhấn 'C' để chuyển camera
    switchCamera();
  }
});

// Vòng lặp render
function animate() {
  controls.update();
  renderer.render(scene, currentCamera);
  requestAnimationFrame(animate);
}

animate();
