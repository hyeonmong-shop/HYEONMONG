// ==============================
// 영몽(永夢) 상품 데이터
// ==============================

const products = [
  {
    id: 1,
    name: "流浪 핑크 라이터",
    price: 5000,
    image: image: "AED2C668-95D1-4688-B695-084FE096312A.jpeg",
    desc: "동양적인 무드와 몽환적인 핑크빛을 담은 영몽(永夢)의 시그니처 流浪 라이터입니다."
  }
];


// ==============================
// 장바구니
// ==============================

let cart = JSON.parse(localStorage.getItem("hyeonmong_cart")) || [];
let currentSelectedProduct = null;


// ==============================
// DOM 요소
// ==============================

const productGrid = document.getElementById("product-grid");

const detailModal = document.getElementById("detail-modal");
const cartModal = document.getElementById("cart-modal");

const openCartBtn = document.getElementById("open-cart");
const closeDetailBtn = document.getElementById("close-detail");
const closeCartBtn = document.getElementById("close-cart");

const detailImg = document.getElementById("detail-img");
const detailTitle = document.getElementById("detail-title");
const detailPrice = document.getElementById("detail-price");
const detailDesc = document.getElementById("detail-desc");
const addToCartBtn = document.getElementById("add-to-cart-btn");

const cartItemsContainer = document.getElementById("cart-items");
const cartTotalPriceEl = document.getElementById("cart-total-price");
const cartCountEl = document.getElementById("cart-count");
const checkoutBtn = document.getElementById("checkout-btn");


// ==============================
// 상품 목록
// ==============================

function renderProducts() {
  productGrid.innerHTML = "";

  products.forEach(product => {

    const card = document.createElement("div");
    card.className = "product-card";

    card.innerHTML = `
      <div class="product-image">
        <img src="${product.image}" alt="${product.name}">
      </div>

      <div class="product-info">
        <div class="product-category">永夢 OBJECT</div>
        <h3>${product.name}</h3>
        <p class="product-price">${product.price.toLocaleString()}원</p>
      </div>
    `;

    card.addEventListener("click", () => {
      openDetailModal(product);
    });

    productGrid.appendChild(card);
  });
}


// ==============================
// 상품 상세 모달
// ==============================

function openDetailModal(product) {

  currentSelectedProduct = product;

  detailImg.src = product.image;
  detailImg.alt = product.name;

  detailTitle.innerText = product.name;
  detailPrice.innerText = `${product.price.toLocaleString()}원`;
  detailDesc.innerText = product.desc;

  detailModal.classList.add("active");

  document.body.style.overflow = "hidden";
}


// ==============================
// 장바구니에 담기
// ==============================

addToCartBtn.addEventListener("click", () => {

  if (!currentSelectedProduct) return;

  const existing = cart.find(
    item => item.id === currentSelectedProduct.id
  );

  if (existing) {

    existing.quantity += 1;

  } else {

    cart.push({
      ...currentSelectedProduct,
      quantity: 1
    });

  }

  saveCart();

  detailModal.classList.remove("active");
  document.body.style.overflow = "";

  alert("장바구니에 상품을 담았습니다.");
});


// ==============================
// 장바구니 저장
// ==============================

function saveCart() {

  localStorage.setItem(
    "hyeonmong_cart",
    JSON.stringify(cart)
  );

  updateCartUI();
}


// ==============================
// 장바구니 화면 업데이트
// ==============================

function updateCartUI() {

  // 총 상품 수
  const totalCount = cart.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  cartCountEl.innerText = totalCount;


  // 장바구니 초기화
  cartItemsContainer.innerHTML = "";

  let total = 0;


  // 장바구니가 비어있을 때
  if (cart.length === 0) {

    cartItemsContainer.innerHTML = `
      <p style="
        text-align:center;
        color:#8c7b83;
        padding:30px 0;
      ">
        장바구니가 비어 있습니다.
      </p>
    `;

  } else {

    // 상품 출력
    cart.forEach(item => {

      total += item.price * item.quantity;

      const div = document.createElement("div");

      div.className = "cart-item";

      div.innerHTML = `
        <div class="cart-item-info">
          <h4>${item.name}</h4>
          <p>${item.price.toLocaleString()}원</p>
        </div>

        <div class="cart-item-qty">

          <button
            type="button"
            onclick="changeQty(${item.id}, -1)"
          >
            −
          </button>

          <span>${item.quantity}</span>

          <button
            type="button"
            onclick="changeQty(${item.id}, 1)"
          >
            +
          </button>

          <button
            type="button"
            onclick="removeItem(${item.id})"
            aria-label="상품 삭제"
          >
            ×
          </button>

        </div>
      `;

      cartItemsContainer.appendChild(div);
    });
  }


  // 총 금액
  cartTotalPriceEl.innerText =
    `${total.toLocaleString()}원`;
}


// ==============================
// 수량 변경
// ==============================

window.changeQty = function(id, delta) {

  const item = cart.find(
    item => item.id === id
  );

  if (!item) return;

  item.quantity += delta;


  if (item.quantity <= 0) {

    cart = cart.filter(
      item => item.id !== id
    );
  }


  saveCart();
};


// ==============================
// 상품 삭제
// ==============================

window.removeItem = function(id) {

  cart = cart.filter(
    item => item.id !== id
  );

  saveCart();
};


// ==============================
// 장바구니 열기
// ==============================

openCartBtn.addEventListener("click", () => {

  updateCartUI();

  cartModal.classList.add("active");

  document.body.style.overflow = "hidden";
});


// ==============================
// 장바구니 닫기
// ==============================

closeCartBtn.addEventListener("click", () => {

  cartModal.classList.remove("active");

  document.body.style.overflow = "";
});


// ==============================
// 상품 상세 닫기
// ==============================

closeDetailBtn.addEventListener("click", () => {

  detailModal.classList.remove("active");

  document.body.style.overflow = "";
});


// ==============================
// 모달 바깥 클릭하면 닫기
// ==============================

detailModal.addEventListener("click", event => {

  if (event.target === detailModal) {

    detailModal.classList.remove("active");

    document.body.style.overflow = "";
  }
});


cartModal.addEventListener("click", event => {

  if (event.target === cartModal) {

    cartModal.classList.remove("active");

    document.body.style.overflow = "";
  }
});


// ==============================
// 주문하기
// ==============================

checkoutBtn.addEventListener("click", () => {

  if (cart.length === 0) {

    alert("장바구니가 비어 있습니다.");

    return;
  }

  alert(
    "주문 기능은 현재 준비 중입니다."
  );
});


// ==============================
// 페이지 처음 열었을 때
// ==============================

renderProducts();
updateCartUI();
