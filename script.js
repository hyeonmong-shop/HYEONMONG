// ==============================
// 永夢 HYEONMONG SHOP
// ==============================

// 상품
const products = [
  {
    id: 1,
    name: "流浪 핑크 라이터",
    price: 3000,
    image: "AED2C668-95D1-4688-B695-084FE096312A.jpeg",
    desc: "동양적인 무드와 몽환적인 핑크빛을 담은 영몽(永夢)의 시그니처 流浪 라이터입니다."
  }
];
const SHIPPING_FEE = 2000;


// ==============================
// 장바구니
// ==============================

let cart = JSON.parse(
  localStorage.getItem("hyeonmong_cart") || "[]"
);

let selectedProduct = null;


// ==============================
// 요소
// ==============================

const productGrid = document.getElementById("product-grid");

const detailModal = document.getElementById("detail-modal");
const cartModal = document.getElementById("cart-modal");
const orderModal = document.getElementById("order-modal");

const openCartBtn = document.getElementById("open-cart");
const closeDetailBtn = document.getElementById("close-detail");
const closeCartBtn = document.getElementById("close-cart");
const closeOrderBtn = document.getElementById("close-order");

const detailImg = document.getElementById("detail-img");
const detailTitle = document.getElementById("detail-title");
const detailPrice = document.getElementById("detail-price");
const detailDesc = document.getElementById("detail-desc");

const addToCartBtn =
  document.getElementById("add-to-cart-btn");

const cartItems =
  document.getElementById("cart-items");

const cartCount =
  document.getElementById("cart-count");

const cartTotal =
  document.getElementById("cart-total-price");

const checkoutBtn =
  document.getElementById("checkout-btn");

const orderTotal =
  document.getElementById("order-total");

const paymentBtn =
  document.getElementById("payment-btn");


// ==============================
// 상품 표시
// ==============================

function renderProducts() {

  productGrid.innerHTML = "";

  products.forEach(product => {

    const card = document.createElement("article");

    card.className = "product-card";

    card.innerHTML = `
      <button
        class="product-image"
        type="button"
      >
        <img
          src="${product.image}"
          alt="${product.name}"
        >
      </button>

      <div class="product-info">

        <p class="product-category">
          LIGHTER
        </p>

        <h3>${product.name}</h3>

        <p class="product-price">
          ${product.price.toLocaleString()}원
        </p>

      </div>
    `;

    card.querySelector(".product-image").onclick =
      () => openDetail(product);

    card.querySelector(".product-info").onclick =
      () => openDetail(product);

    productGrid.appendChild(card);
  });
}


// ==============================
// 상품 상세
// ==============================

function openDetail(product) {

  selectedProduct = product;

  detailImg.src = product.image;
  detailImg.alt = product.name;

  detailTitle.textContent =
    product.name;

  detailPrice.textContent =
    product.price.toLocaleString() + "원";

  detailDesc.textContent =
    product.desc;

  detailModal.classList.add("active");

  document.body.style.overflow = "hidden";
}


// ==============================
// 장바구니 추가
// ==============================

addToCartBtn.onclick = function () {

  if (!selectedProduct) return;

  const existing = cart.find(
    item => item.id === selectedProduct.id
  );

  if (existing) {

    existing.quantity += 1;

  } else {

    cart.push({
      id: selectedProduct.id,
      name: selectedProduct.name,
      price: selectedProduct.price,
      image: selectedProduct.image,
      quantity: 1
    });
  }

  saveCart();

  detailModal.classList.remove("active");

  cartModal.classList.add("active");

  document.body.style.overflow = "hidden";
};


// ==============================
// 장바구니 저장
// ==============================

function saveCart() {

  localStorage.setItem(
    "hyeonmong_cart",
    JSON.stringify(cart)
  );

  renderCart();
}


// ==============================
// 장바구니 표시
// ==============================

function renderCart() {

  cartItems.innerHTML = "";

  let total = 0;
  let count = 0;

  cart.forEach(item => {

    total += item.price * item.quantity;
    count += item.quantity;

    const row = document.createElement("div");

    row.className = "cart-item";

    row.innerHTML = `
      <div class="cart-item-info">

        <h4>${item.name}</h4>

        <p>
          ${item.price.toLocaleString()}원
        </p>

      </div>

      <div class="cart-item-qty">

        <button
          type="button"
          onclick="changeQuantity(${item.id}, -1)"
        >
          −
        </button>

        <span>${item.quantity}</span>

        <button
          type="button"
          onclick="changeQuantity(${item.id}, 1)"
        >
          +
        </button>

        <button
          type="button"
          onclick="deleteItem(${item.id})"
        >
          ×
        </button>

      </div>
    `;

    cartItems.appendChild(row);
  });

  if (cart.length === 0) {

    cartItems.innerHTML = `
      <p style="
        text-align:center;
        padding:30px 0;
        color:#8d7e83;
      ">
        장바구니가 비어 있습니다.
      </p>
    `;
  }

  cartCount.textContent = count;

  const finalTotal =
  cart.length > 0
    ? total + SHIPPING_FEE
    : 0;


cartTotal.textContent =
  finalTotal.toLocaleString() + "원";
}


// ==============================
// 수량 변경
// ==============================

window.changeQuantity = function (id, amount) {

  const item = cart.find(
    item => item.id === id
  );

  if (!item) return;

  item.quantity += amount;

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

window.deleteItem = function (id) {

  cart = cart.filter(
    item => item.id !== id
  );

  saveCart();
};


// ==============================
// 장바구니 열기
// ==============================

openCartBtn.onclick = function () {

  renderCart();

  cartModal.classList.add("active");

  document.body.style.overflow = "hidden";
};


// ==============================
// 장바구니 닫기
// ==============================

closeCartBtn.onclick = function () {

  cartModal.classList.remove("active");

  document.body.style.overflow = "";
};


// ==============================
// 상품 상세 닫기
// ==============================

closeDetailBtn.onclick = function () {

  detailModal.classList.remove("active");

  document.body.style.overflow = "";
};


// ==============================
// 주문하기
// ==============================

checkoutBtn.onclick = function () {

  if (cart.length === 0) {

    alert("장바구니가 비어 있습니다.");

    return;
  }

  let total = 0;

  cart.forEach(item => {

    total += item.price * item.quantity;
  });

  const finalTotal =
  total + SHIPPING_FEE;

orderTotal.textContent =
  finalTotal.toLocaleString() + "원";

  cartModal.classList.remove("active");

  orderModal.classList.add("active");

  document.body.style.overflow = "hidden";
};


// ==============================
// 주문창 닫기
// ==============================

closeOrderBtn.onclick = function () {

  orderModal.classList.remove("active");

  document.body.style.overflow = "";
};


// ==============================
// Toss Payments 결제
// ==============================

paymentBtn.onclick = async function () {

  try {

    const name =
      document.getElementById("order-name").value.trim();

    const phone =
      document.getElementById("order-phone").value.trim();

    const address =
      document.getElementById("order-address").value.trim();


    // 이름 확인
    if (!name) {

      alert("이름을 입력해주세요.");

      return;
    }


    // 연락처 확인
    if (!phone) {

      alert("연락처를 입력해주세요.");

      return;
    }


    // 배송지 확인
    if (!address) {

      alert("배송지를 입력해주세요.");

      return;
    }


    // 장바구니 확인
    if (cart.length === 0) {

      alert("장바구니가 비어 있습니다.");

      return;
    }


    // 총 금액
    let total = 0;

    cart.forEach(item => {

      total +=
        item.price * item.quantity;

    });


    // Toss SDK 확인
    if (
      typeof TossPayments !==
      "function"
    ) {

      alert(
        "결제 모듈을 불러오지 못했습니다.\n" +
        "페이지를 새로고침한 후 다시 시도해주세요."
      );

      return;
    }


    // 테스트용 클라이언트 키
    const clientKey =
      "test_ck_GjLJoQ1aVZKppNdYAdedrw6KYe2R";


    // 주문번호
    const orderId =
      "HYEONMONG_" +
      crypto
        .randomUUID()
        .replace(/-/g, "")
        .slice(0, 32);


    // 고객 키
    const customerKey =
      "HYEONMONG_" +
      crypto
        .randomUUID()
        .replace(/-/g, "")
        .slice(0, 32);


    // Toss Payments 생성
    const tossPayments =
      TossPayments(clientKey);


    // 결제 객체
    const payment =
      tossPayments.payment({
        customerKey:
          customerKey
      });


    // 주문명
    let orderName;

    if (cart.length === 1) {

      orderName =
        cart[0].name;

    } else {

      orderName =
        cart[0].name +
        " 외 " +
        (cart.length - 1) +
        "건";

    }


    // 결제창 열기
    await payment.requestPayment({

      method: "CARD",

      amount: {

        currency: "KRW",

        value: total + SHIPPING_FEE

      },

      orderId:
        orderId,

      orderName:
        orderName,

      customerName:
        name,

      customerMobilePhone:
        phone.replace(
          /[^0-9]/g,
          ""
        ),

      successUrl:
        window.location.origin +
        "/HYEONMONG/success.html",

      failUrl:
        window.location.origin +
        "/HYEONMONG/fail.html"

    });

  } catch (error) {

    console.error(
      "Toss Payments Error:",
      error
    );


    alert(
      "결제창을 열 수 없습니다.\n\n" +
      (
        error?.message ||
        "알 수 없는 오류"
      )
    );

  }

};


// ==============================
// 모달 바깥 클릭
// ==============================

detailModal.onclick = function (event) {

  if (event.target === detailModal) {

    detailModal.classList.remove("active");

    document.body.style.overflow = "";
  }
};


cartModal.onclick = function (event) {

  if (event.target === cartModal) {

    cartModal.classList.remove("active");

    document.body.style.overflow = "";
  }
};


orderModal.onclick = function (event) {

  if (event.target === orderModal) {

    orderModal.classList.remove("active");

    document.body.style.overflow = "";
  }
};


// ==============================
// 시작
// ==============================

renderProducts();
renderCart();
