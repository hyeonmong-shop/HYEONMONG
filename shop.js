// ==============================
// 永夢 HYEONMONG SHOP
// shop.js
// ==============================

const TOSS_CLIENT_KEY = "test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm";

// ==============================
// 상품 정보
// ==============================

const products = [
  {
    id: 1,
    name: "永夢 라이터",
    category: "LIGHTER",
    price: 6000,
    image: "AED2C668-95D1-4688-B695-084FE096312A.jpeg",
    description:
      "永夢(영몽) — 영원한 꿈. 몽환적인 분위기를 담은 디자인 라이터입니다."
  }
];

// ==============================
// 장바구니
// ==============================

let cart = [];
let selectedProductId = null;

// ==============================
// DOM
// ==============================

const productGrid = document.getElementById("product-grid");

const detailModal = document.getElementById("detail-modal");
const detailImage = document.getElementById("detail-image");
const detailCategory = document.getElementById("detail-category");
const detailName = document.getElementById("detail-name");
const detailPrice = document.getElementById("detail-price");
const detailDesc = document.getElementById("detail-desc");
const addCartBtn = document.getElementById("add-cart-btn");
const closeDetailBtn = document.getElementById("close-detail");

const cartModal = document.getElementById("cart-modal");
const cartItems = document.getElementById("cart-items");
const cartCount = document.getElementById("cart-count");
const cartTotal = document.getElementById("cart-total");
const cartBtn = document.getElementById("cart-btn");
const closeCartBtn = document.getElementById("close-cart");
const checkoutBtn = document.getElementById("checkout-btn");

const orderModal = document.getElementById("order-modal");
const closeOrderBtn = document.getElementById("close-order");
const paymentBtn = document.getElementById("payment-btn");
const orderTotal = document.getElementById("order-total");

// ==============================
// 상품 출력
// ==============================

function renderProducts() {
  if (!productGrid) return;

  productGrid.innerHTML = "";

  products.forEach(product => {
    const card = document.createElement("article");
    card.className = "product-card";

    card.innerHTML = `
      <button
        class="product-image"
        type="button"
        aria-label="${product.name}"
      >
        <img
          src="${product.image}"
          alt="${product.name}"
        >
      </button>

      <div class="product-info">
        <div class="product-category">
          ${product.category}
        </div>

        <h3>${product.name}</h3>

        <div class="product-price">
          ${product.price.toLocaleString()}원
        </div>
      </div>
    `;

    card.addEventListener("click", () => {
      openDetail(product.id);
    });

    productGrid.appendChild(card);
  });
}

// ==============================
// 상품 상세
// ==============================

function openDetail(productId) {
  const product = products.find(item => item.id === productId);

  if (!product || !detailModal) return;

  selectedProductId = productId;

  if (detailImage) {
    detailImage.src = product.image;
    detailImage.alt = product.name;
  }

  if (detailCategory) {
    detailCategory.textContent = product.category;
  }

  if (detailName) {
    detailName.textContent = product.name;
  }

  if (detailPrice) {
    detailPrice.textContent =
      `${product.price.toLocaleString()}원`;
  }

  if (detailDesc) {
    detailDesc.textContent = product.description;
  }

  detailModal.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeDetail() {
  if (!detailModal) return;

  detailModal.classList.remove("active");
  document.body.style.overflow = "";
}

if (closeDetailBtn) {
  closeDetailBtn.addEventListener("click", closeDetail);
}

// ==============================
// 장바구니 추가
// ==============================

function addToCart(productId) {
  const product = products.find(item => item.id === productId);

  if (!product) return;

  const existingItem = cart.find(
    item => item.id === productId
  );

  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push({
      id: product.id,
      name: product.name,
      price: product.price,
      quantity: 1
    });
  }

  updateCart();
}

// 상세페이지 → 장바구니

if (addCartBtn) {
  addCartBtn.addEventListener("click", () => {
    if (selectedProductId === null) return;

    addToCart(selectedProductId);

    closeDetail();
    openCart();
  });
}

// ==============================
// 장바구니 수량 변경
// ==============================

function changeQuantity(productId, amount) {
  const item = cart.find(
    product => product.id === productId
  );

  if (!item) return;

  item.quantity += amount;

  if (item.quantity <= 0) {
    cart = cart.filter(
      product => product.id !== productId
    );
  }

  updateCart();
}

// HTML의 onclick에서 사용할 수 있도록 등록
window.changeQuantity = changeQuantity;

// ==============================
// 장바구니 출력
// ==============================

function renderCart() {
  if (!cartItems) return;

  if (cart.length === 0) {
    cartItems.innerHTML = `
      <p
        style="
          text-align:center;
          padding:40px 0;
          color:#8d7e83;
        "
      >
        장바구니가 비어 있습니다.
      </p>
    `;

    if (checkoutBtn) {
      checkoutBtn.disabled = true;
    }

    return;
  }

  if (checkoutBtn) {
    checkoutBtn.disabled = false;
  }

  cartItems.innerHTML = cart
    .map(item => {
      const itemTotal =
        item.price * item.quantity;

      return `
        <div class="cart-item">

          <div class="cart-item-info">
            <h4>${item.name}</h4>

            <p>
              ${itemTotal.toLocaleString()}원
            </p>
          </div>

          <div class="cart-item-qty">

            <button
              type="button"
              onclick="changeQuantity(${item.id}, -1)"
            >
              −
            </button>

            <span>
              ${item.quantity}
            </span>

            <button
              type="button"
              onclick="changeQuantity(${item.id}, 1)"
            >
              +
            </button>

          </div>

        </div>
      `;
    })
    .join("");
}

// ==============================
// 장바구니 전체 업데이트
// ==============================

function updateCart() {
  const count = cart.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  const total = cart.reduce(
    (sum, item) =>
      sum + item.price * item.quantity,
    0
  );

  if (cartCount) {
    cartCount.textContent = count;
  }

  if (cartTotal) {
    cartTotal.textContent =
      `${total.toLocaleString()}원`;
  }

  renderCart();
}

// ==============================
// 장바구니 열기 / 닫기
// ==============================

function openCart() {
  if (!cartModal) return;

  updateCart();

  cartModal.classList.add("active");
  document.body.style.overflow = "hidden";
}

function closeCart() {
  if (!cartModal) return;

  cartModal.classList.remove("active");
  document.body.style.overflow = "";
}

if (cartBtn) {
  cartBtn.addEventListener("click", openCart);
}

if (closeCartBtn) {
  closeCartBtn.addEventListener("click", closeCart);
}

// ==============================
// 주문서 열기
// ==============================

function openOrder() {
  if (!orderModal) return;

  if (cart.length === 0) {
    alert("장바구니가 비어 있습니다.");
    return;
  }

  const total = cart.reduce(
    (sum, item) =>
      sum + item.price * item.quantity,
    0
  );

  if (orderTotal) {
    orderTotal.textContent =
      `${total.toLocaleString()}원`;
  }

  orderModal.classList.add("active");
  document.body.style.overflow = "hidden";
}

if (checkoutBtn) {
  checkoutBtn.addEventListener(
    "click",
    openOrder
  );
}

// ==============================
// 주문서 닫기
// ==============================

function closeOrder() {
  if (!orderModal) return;

  orderModal.classList.remove("active");
  document.body.style.overflow = "";
}

if (closeOrderBtn) {
  closeOrderBtn.addEventListener(
    "click",
    closeOrder
  );
}

// ==============================
// Toss Payments 결제
// ==============================

if (paymentBtn) {
  paymentBtn.addEventListener(
    "click",
    async () => {

      try {

        // 장바구니 확인
        if (cart.length === 0) {
          alert("장바구니가 비어 있습니다.");
          return;
        }

        // 주문자 정보
        const nameInput =
          document.getElementById("order-name");

        const phoneInput =
          document.getElementById("order-phone");

        const addressInput =
          document.getElementById("order-address");

        const name =
          nameInput
            ? nameInput.value.trim()
            : "";

        const phone =
          phoneInput
            ? phoneInput.value.trim()
            : "";

        const address =
          addressInput
            ? addressInput.value.trim()
            : "";

        // 이름
        if (!name) {
          alert("이름을 입력해주세요.");

          if (nameInput) {
            nameInput.focus();
          }

          return;
        }

        // 연락처
        if (!phone) {
          alert("연락처를 입력해주세요.");

          if (phoneInput) {
            phoneInput.focus();
          }

          return;
        }

        // 배송지
        if (!address) {
          alert("배송지를 입력해주세요.");

          if (addressInput) {
            addressInput.focus();
          }

          return;
        }

        // Toss SDK 확인
        if (
          typeof TossPayments !==
          "function"
        ) {
          alert(
            "결제 모듈을 불러오지 못했습니다.\n" +
            "페이지를 새로고침한 뒤 다시 시도해주세요."
          );

          return;
        }

        // 총 결제금액
        const total = cart.reduce(
          (sum, item) =>
            sum + item.price * item.quantity,
          0
        );

        // 주문번호
        const orderId =
          "HYEONMONG_" +
          crypto
            .randomUUID()
            .replace(/-/g, "")
            .slice(0, 32);

        // 고객키
        const customerKey =
          "HYEONMONG_" +
          crypto
            .randomUUID()
            .replace(/-/g, "")
            .slice(0, 32);

        // Toss Payments
        const tossPayments =
          TossPayments(
            TOSS_CLIENT_KEY
          );

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
            `${cart[0].name} 외 ${cart.length - 1}건`;
        }

        // 결제창 호출
        await payment.requestPayment({

          method: "CARD",

          amount: {
            currency: "KRW",
            value: total
          },

          orderId: orderId,

          orderName: orderName,

          customerName: name,

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
          "결제창을 여는 중 문제가 발생했습니다.\n\n" +
          (
            error?.message ||
            "알 수 없는 오류"
          )
        );
      }
    }
  );
}

// ==============================
// 모달 바깥 클릭
// ==============================

[detailModal, cartModal, orderModal]
  .forEach(modal => {

    if (!modal) return;

    modal.addEventListener(
      "click",
      event => {

        if (
          event.target !== modal
        ) {
          return;
        }

        modal.classList.remove(
          "active"
        );

        document.body.style.overflow =
          "";
      }
    );
  });

// ==============================
// 시작
// ==============================

renderProducts();
updateCart();
