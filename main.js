import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { ARButton } from 'three/examples/jsm/webxr/ARButton.js';
import { TextureLoader } from 'three';

// Tạo renderer, scene và camera
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('canvas-container').appendChild(renderer.domElement);

// Kích hoạt WebXR (VR và AR)
renderer.xr.enabled = true;
document.body.appendChild(VRButton.createButton(renderer));
document.body.appendChild(ARButton.createButton(renderer));

const scene = new THREE.Scene();

// Tạo camera
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 1, 5); // Đặt vị trí camera

// Ánh sáng khuếch tán (Ambient Light)
const ambientLight = new THREE.AmbientLight(0x404040, 1); // Màu sáng nhẹ và cường độ sáng
scene.add(ambientLight);

// Ánh sáng điểm (Point Light)
const pointLight = new THREE.PointLight(0xffffff, 1, 100); // Cường độ sáng: 1, khoảng cách ánh sáng: 100
pointLight.position.set(10, 10, 10); // Vị trí ánh sáng
scene.add(pointLight);

// Ánh sáng khuếch tán (Directional Light)
const directionalLight = new THREE.DirectionalLight(0xffffff, 1); // Cường độ ánh sáng mạnh
directionalLight.position.set(5, 10, 5); // Vị trí nguồn ánh sáng
directionalLight.target.position.set(0, 0, 0); // Đảm bảo ánh sáng chiếu về phía trung tâm của scene
scene.add(directionalLight);
scene.add(directionalLight.target); // Ánh sáng chiếu vào đối tượng

// Ánh sáng phản xạ (Spot Light)
const spotLight = new THREE.SpotLight(0xffffff, 1, 50, Math.PI / 6, 0.5, 2);
spotLight.position.set(0, 10, 0);
spotLight.target.position.set(0, 0, 0); // Nhắm vào trung tâm cảnh
scene.add(spotLight);
scene.add(spotLight.target);

// Ánh sáng môi trường kết hợp với ánh sáng phản xạ tạo sự chi tiết hơn
const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.5); // Đảm bảo môi trường có ánh sáng mềm mại
scene.add(hemisphereLight);

// Tải kết cấu (Texture)
const textureLoader = new TextureLoader();
const texture = textureLoader.load('./public/ps.jpg');  // Đảm bảo rằng bạn có đường dẫn đúng cho texture

// Load mô hình
const loader = new GLTFLoader();
let model;
let ruotNonMesh, ruotGIAMesh, foodMesh, ongThoMesh; // Biến để lưu các đối tượng

// Thông tin về các bộ phận
const partDescriptions = {
  ruot_non: 'Ruột non là nơi hấp thụ chất dinh dưỡng chính của cơ thể.',
  ruot_GIA: 'Ruột già là nơi hấp thụ nước và tạo chất thải.',
  da_day: 'Dạ dày là nơi chứa và tiêu hóa thức ăn.',
  gan: 'Gan là cơ quan quan trọng trong việc giải độc và chuyển hóa.',
  thuc_quan: 'Thực quản vận chuyển thức ăn từ miệng đến dạ dày.',
  ong_tho: 'Truyền thức ăn xuống.',
  tuy_tang: 'Tuyến tụy có chức năng tiết dịch tiêu hóa và insulin.',
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

// Load mô hình con người
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

        // Sử dụng texture cho một bộ phận nếu có
        if (partName === 'ruot_non') {
          child.material.map = texture; // Áp dụng texture cho ruột non
        }

        // Lưu đối tượng "ong_tho" để thức ăn có thể đi vào
        if (child.name === 'ong_tho') {
          ongThoMesh = child;  // Lưu đối tượng "ống thở"
        }

        // Kiểm tra và lưu vị trí gốc của các đối tượng
        if (child.name === 'ruot_non') {
          ruotNonMesh = child;
        }
        if (child.name === 'ruot_GIA') {
          ruotGIAMesh = child;
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

// Load mô hình thức ăn
let food;
loader.load('/untitled.glb', (gltf) => {
  food = gltf.scene;
  food.scale.set(0.1, 0.1, 0.1);  // Thay đổi kích thước thức ăn
  food.position.set(0, 3, 5);  // Vị trí ban đầu của thức ăn (vị trí cao hơn để nó rơi xuống)
  scene.add(food);
}, undefined, (error) => {
  console.error('Lỗi khi tải mô hình thức ăn:', error);
});

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

// Hàm di chuyển thức ăn vào ống thở
function moveFoodToEsophagus() {
  if (!food || !ongThoMesh) return;

  const speed = 0.03; // Tốc độ di chuyển

  // Đặt mục tiêu di chuyển vào vị trí của ống thở
  const targetPosition = ongThoMesh.position.clone();
  targetPosition.y += 0.5; // Điều chỉnh sao cho thức ăn đi vào đúng ống thở

  // Tính toán sự chuyển động dọc theo trục y
  if (food.position.y > targetPosition.y) {
    food.position.y -= speed; // Di chuyển thức ăn xuống
  } else {
    food.position.y = targetPosition.y; // Dừng lại khi đã vào trong ống thở
  }
}

// Vòng lặp render
function animate() {
  moveFoodToEsophagus(); // Di chuyển thức ăn vào ống thở
  controls.update();

  renderer.setAnimationLoop(() => {
    renderer.render(scene, camera);
  });
}
animate();
