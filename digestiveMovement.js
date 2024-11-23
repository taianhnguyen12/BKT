import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Tạo renderer, scene và camera
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('canvas-container').appendChild(renderer.domElement);

const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 5, 10); // Đặt vị trí camera

// Ánh sáng
const pointLight = new THREE.PointLight(0xffffff, 1, 100);
pointLight.position.set(10, 10, 10);
scene.add(pointLight);

const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.5);
scene.add(hemisphereLight);

// Load mô hình
const loader = new GLTFLoader();
let model, foodMeshes = [];
let ruotNonMesh;

// Hàm tạo thức ăn
function createFood(count) {
  for (let i = 0; i < count; i++) {
    const foodGeometry = new THREE.SphereGeometry(0.4, 32, 32); // Tạo thức ăn lớn hơn
    const foodMaterial = new THREE.MeshStandardMaterial({ color: 0xff4500 });
    const foodMesh = new THREE.Mesh(foodGeometry, foodMaterial);
    scene.add(foodMesh);
    foodMeshes.push(foodMesh); // Lưu vào mảng thức ăn
  }
}

// Di chuyển thức ăn qua toàn bộ ruột non
function moveFoodThroughIntestine() {
  if (!ruotNonMesh || foodMeshes.length === 0) return;

  const path = new THREE.CurvePath();

  // Tạo các điểm đại diện cho toàn bộ ruột non (từ đầu đến cuối)
  const points = [
    new THREE.Vector3(0, 5, 0),  // Điểm trên cùng (bắt đầu từ dạ dày)
    new THREE.Vector3(1, 4.5, 1),
    new THREE.Vector3(0, 4, 2),
    new THREE.Vector3(-1, 3.5, 1),
    new THREE.Vector3(0, 3, 0),
    new THREE.Vector3(1, 2.5, -1),
    new THREE.Vector3(0, 2, -2),
    new THREE.Vector3(-1, 1.5, -1),
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(0, 0, 0),  // Điểm dưới cùng (kết thúc ruột non)
  ];

  // Tạo đường cong từ các điểm
  const curve = new THREE.CatmullRomCurve3(points, false); // Không khép kín
  path.add(curve);

  // Hiển thị đường cong (debug)
  const curveGeometry = new THREE.TubeGeometry(curve, 100, 0.05, 8, false);
  const curveMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
  const curveMesh = new THREE.Mesh(curveGeometry, curveMaterial);
  scene.add(curveMesh);

  const speed = 0.002; // Tốc độ di chuyển

  foodMeshes.forEach((foodMesh, index) => {
    let t = index * 0.1; // Các thức ăn cách đều nhau trên đường cong

    const animateFood = () => {
      t += speed;
      if (t > 1) t = 0; // Khi đến cuối, quay lại đầu

      // Lấy vị trí và hướng từ đường cong
      const position = curve.getPointAt(t);
      const tangent = curve.getTangentAt(t).normalize();

      // Cập nhật vị trí và xoay thức ăn
      foodMesh.position.copy(position);
      foodMesh.lookAt(position.clone().add(tangent));

      requestAnimationFrame(animateFood);
    };

    animateFood();
  });
}

// Load mô hình và thiết lập ruột non trong suốt
loader.load(
  '/people1.glb',
  (gltf) => {
    model = gltf.scene;

    model.traverse((child) => {
      if (child.isMesh) {
        if (child.name === 'ruot_non') {
          ruotNonMesh = child; // Lưu lại ruột non

          // Làm ruột non trong suốt
          ruotNonMesh.material = new THREE.MeshStandardMaterial({
            color: 0x00ff00, // Màu xanh lá nhạt để dễ quan sát
            transparent: true,
            opacity: 0.3, // Độ trong suốt
            depthWrite: false, // Cho phép hiển thị vật thể bên trong
          });
        }
      }
    });

    if (!ruotNonMesh) {
      console.error('Ruột non không tìm thấy trong mô hình!');
      return;
    }

    model.scale.set(1, 1, 1);
    scene.add(model);

    // Tạo thức ăn lớn và bắt đầu chuyển động
    createFood(10); // Tạo 10 thức ăn lớn
    moveFoodThroughIntestine(); // Kích hoạt chuyển động thức ăn
  },
  undefined,
  (error) => {
    console.error('Lỗi khi tải mô hình:', error);
  }
);

// OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Vòng lặp render
function animate() {
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();
