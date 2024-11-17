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
camera.position.set(0, 1, 5); // Đặt vị trí camera

// Ánh sáng
const pointLight = new THREE.PointLight(0xffffff, 1, 100);
pointLight.position.set(10, 10, 10);
scene.add(pointLight);

const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.5);
scene.add(hemisphereLight);

// Load mô hình
const loader = new GLTFLoader();
let model;
let ruotNonMesh, ruotGIAMesh; // Biến để lưu đối tượng ruot_non và ruot_GIA

// Thông tin về các bộ phận
const partDescriptions = {
  ruot_non: 'Ruột non là nơi hấp thụ chất dinh dưỡng chính của cơ thể.',
  ruot_GIA: 'Ruột già là nơi hấp thụ nước và tạo chất thải.',
  da_day: 'Dạ dày là nơi chứa và tiêu hóa thức ăn.',
  gan: 'Gan là cơ quan quan trọng trong việc giải độc và chuyển hóa.',
  thuc_quan: 'Thực quản vận chuyển thức ăn từ miệng đến dạ dày.',
  ong_tho: 'truyền thức ăn xuống',
  tuy_tang: 'vừa có chức năng ngoại tiết (tiết ra dịch tụy đổ vào ruột giúp tiêu hóa thức ăn) vừa có chức năng nội tiết (như tiết insulin đổ vào máu có tác dụng điều hòa đường huyết...).',
};

// Thông tin về màu sắc của các bộ phận
const partColors = {
  ruot_non: 0xF4A300, // Màu ruột non (ví dụ màu vàng)
  ruot_GIA: 0x8B4513,  // Màu ruột già (ví dụ màu nâu)
  da_day: 0xD2691E,    // Màu dạ dày (màu cam)
  gan: 0xA52A2A,       // Màu gan (màu nâu đỏ)
  thuc_quan: 0xFFD700,  // Màu thực quản (màu vàng)
};

// Hàm hiển thị ghi chú
function showInfo(partName, event) {
  const description = partDescriptions[partName];
  const infoBox = document.getElementById('info-box');
  if (description) {
    infoBox.style.display = 'block';
    infoBox.style.left = `${event.clientX}px`;
    infoBox.style.top = `${event.clientY}px`;
    infoBox.innerHTML = `<strong>${partName}</strong>: ${description}`;
  } else {
    infoBox.style.display = 'none';
  }
}

loader.load(
  '/people1.glb', // Đường dẫn mô hình GLTF
  (gltf) => {
    model = gltf.scene;

    // Duyệt qua các đối tượng con để tìm các bộ phận
    model.traverse((child) => {
      if (child.isMesh) {
        // Áp dụng màu sắc cho từng bộ phận
        const partName = child.name;
        if (partColors[partName]) {
          child.material = new THREE.MeshStandardMaterial({ color: partColors[partName] });
        }

        // Kiểm tra và lưu vị trí gốc của các đối tượng
        if (child.name === 'ruot_non') {
          ruotNonMesh = child;
          ruotNonMesh.geometry.attributes.position.originalPosition =
            ruotNonMesh.geometry.attributes.position.array.slice();
        }
        if (child.name === 'ruot_GIA') {
          ruotGIAMesh = child;
          ruotGIAMesh.geometry.attributes.position.originalPosition =
            ruotGIAMesh.geometry.attributes.position.array.slice();
        }
      }
    });

    model.scale.set(1, 1, 1); // Tùy chỉnh kích thước
    scene.add(model);
  },
  undefined,
  (error) => {
    console.error('Lỗi khi tải mô hình:', error);
  }
);

// OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

// Raycaster và sự kiện click
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener('click', (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);

  if (model) {
    const intersects = raycaster.intersectObject(model, true);
    if (intersects.length > 0) {
      const clickedPart = intersects[0].object;
      const partName = clickedPart.name || 'Không xác định';
      showInfo(partName, event);
    }
  }
});

// Ẩn info-box khi di chuột ra ngoài
window.addEventListener('mousemove', () => {
  const infoBox = document.getElementById('info-box');
  infoBox.style.display = 'none';
});

// Xử lý khi thay đổi kích thước
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Hàm biến dạng cho ruột
function deformMesh(mesh, time, speed, amplitude) {
  if (!mesh) return;

  const position = mesh.geometry.attributes.position;
  const originalPosition = position.originalPosition;
  const count = position.count;

  for (let i = 0; i < count; i++) {
    const x = originalPosition[i * 3]; // Giá trị x gốc
    const y = originalPosition[i * 3 + 1]; // Giá trị y gốc
    const z = originalPosition[i * 3 + 2]; // Giá trị z gốc

    // Hàm sóng sin cho biến dạng
    const offset = Math.sin(time * speed + y * 5) * amplitude; // Tăng giảm giá trị y
    position.array[i * 3 + 1] = y + offset; // Biến dạng trên trục y
  }

  position.needsUpdate = true; // Đánh dấu cần cập nhật
}

// Vòng lặp render
function animate(time) {
  time *= 0.001; // Chuyển đổi thời gian sang giây

  if (ruotNonMesh) {
    deformMesh(ruotNonMesh, time, 2.0, 0.1); // Co bóp nhanh với biên độ nhỏ
  }
  if (ruotGIAMesh) {
    deformMesh(ruotGIAMesh, time, 1.0, 0.15); // Co bóp chậm với biên độ lớn hơn
  }

  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}
animate();
