// Load mô hình
const loader = new GLTFLoader();
let model;
loader.load(
  '/people1.glb', // Đường dẫn tương đối
  (gltf) => {
    model = gltf.scene;

    // Duyệt qua các đối tượng con
    model.traverse((child) => {
      if (child.isMesh) {
        // Kiểm tra tên và đổi màu cho đối tượng cụ thể
        if (child.name === 'ruot_GIA') {
          child.material = new THREE.MeshStandardMaterial({ color: 0x00ff00 }); // Màu xanh lá cây
        }

        // Đặt tên mặc định nếu không có
        if (!child.name) {
          child.name = 'Unnamed Part';
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
