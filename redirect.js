// redirect.js

// Tạo nút cho việc chuyển hướng
const introButton = document.createElement('button');
introButton.innerText = 'Giới thiệu bản thân';
introButton.style.position = 'absolute';
introButton.style.top = '10px';      // Đặt vị trí cách cạnh trên 10px
introButton.style.right = '10px';    // Đặt vị trí cách cạnh phải 10px
introButton.style.padding = '10px 20px';
introButton.style.fontSize = '16px';
introButton.style.cursor = 'pointer';
introButton.style.zIndex = '1000';   // Đảm bảo nút luôn hiển thị trên các phần tử khác

// Gắn nút vào body của trang HTML
document.body.appendChild(introButton);

// Thêm sự kiện click để chuyển hướng đến trang giới thiệu
introButton.addEventListener('click', () => {
  window.location.href = 'about.html'; // Thay đổi 'about.html' thành đường dẫn trang của bạn
});
