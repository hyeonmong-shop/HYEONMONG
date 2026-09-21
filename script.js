// ==============================
// 영몽(永夢) 상품 데이터
// ==============================

const products = [
  {
    id: 1,
    name: "流浪 핑크 라이터",
    price: 5000,
    image: "AED2C668-95D1-4688-B695-084FE096312A.jpeg",
    desc: "동양적인 무드와 몽환적인 핑크빛을 담은 영몽(永夢)의 시그니처 流浪 라이터입니다."
  }
];


// ==============================
// 장바구니
// ==============================

let cart =
  JSON.parse(localStorage.getItem("hyeonmong_cart")) || [];

let currentSelectedProduct = null;


// ==============================
// DOM
// ==============================

const productGrid =
  document.getElementById("product-grid");

const detailModal =
  document.getElementById("detail-modal");

const cartModal =
  document.getElementById("cart-modal");

const orderModal =
  document.getElementById("order-modal");


const openCartBtn =
  document.getElementById("open-cart");

const closeDetailBtn =
  document.getElementById("close-detail");

const closeCartBtn =
  document.getElementById("close-cart");

const closeOrderBtn =
  document.getElementById("close-order");


const detailImg =
  document.getElementById("detail-img");

const detailTitle =
  document.getElementById("detail-title");

const detailPrice =
  document.getElementById("detail-price");

const detailDesc =
  document.getElementById("detail-desc");

const addToCartBtn =
  document.getElementById("add-to-cart-btn");


const cartItemsContainer =
  document.getElementById("cart-items");

const cartTotalPriceEl =
  document.getElementById("cart-total-price");

const cartCountEl =
  document.getElementById("cart-count");

const checkoutBtn =
  document.getElementById("checkout-btn");


const orderTotalEl =
  document.getElementById("order-total");

const paymentBtn =
  document.getElementById("payment-btn");


// ==============================
// 상품 표시
// ==============================

function renderProducts() {

  productGrid.innerHTML = "";

  products.forEach(product => {

    const card =
      document.createElement("article");

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

        <h3>
          ${product.name}
        </h3>

        <p class="product-price">
          ${product.price.toLocaleString()}원
        </p>

      </div>
    `;


    const imageButton =
      card.querySelector(".product-image");


    imageButton.addEventListener(
      "click",
      () => {
        openDetailModal(product);
      }
    );


    card.addEventListener(
      "click",
      event => {

        if (
          event.target.closest(".product-image")
        ) {
          return;
        }

        openDetailModal(product);
      }
    );


    productGrid.appendChild(card);

  });
}


// ==============================
// 상품 상세 열기
// ==============================

function openDetailModal(product) {

  currentSelectedProduct = product;

  detailImg.src = product.image;

  detailImg.alt = product.name;

  detailTitle.innerText =
    product.name;

  detailPrice.innerText =
    `${product.price.toLocaleString()}원`;

  detailDesc.innerText =
    product.desc;

  detailModal.classList.add("active");

  document.body.style.overflow = "hidden";
}


// ==============================
// 장바구니 담기
// ==============================

addToCartBtn.addEventListener(
  "click",
  () => {

    if (!currentSelectedProduct) {
      return;
    }


    const existing =
      cart.find(
        item =>
          item.id ===
          currentSelectedProduct.id
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

    cartModal.classList.add("active");

    document.body.style.overflow = "hidden";
  }
);


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
// 장바구니 표시
// ==============================

function updateCartUI() {

  const totalCount =
    cart.reduce(
      (sum, item) =>
        sum + item.quantity,
      0
    );


  cartCountEl.innerText =
    totalCount;


  cartItemsContainer.innerHTML = "";


  let total = 0;


  if (cart.length === 0) {

    cartItemsContainer.innerHTML = `
      <p
        style="
          text-align:center;
          color:#8c7b83;
          padding:30px 0;
        "
      >
        장바구니가 비어 있습니다.
      </p>
    `;

  } else {

    cart.forEach(item => {

      total +=
        item.price *
        item.quantity;


      const div =
        document.createElement("div");


      div.className =
        "cart-item";


      div.innerHTML = `
        <div class="cart-item-info">

          <h4>
            ${item.name}
          </h4>

          <p>
            ${item.price.toLocaleString()}원
          </p>

        </div>


        <div class="cart-item-qty">

          <button
            type="button"
            onclick="changeQty(${item.id}, -1)"
          >
            −
          </button>


          <span>
            ${item.quantity}
          </span>


          <button
            type="button"
            onclick="changeQty(${item.id}, 1)"
          >
            +
          </button>


          <button
            type="button"
            onclick="removeItem(${item.id})"
          >
            ×
          </button>

        </div>
      `;


      cartItemsContainer.appendChild(div);

    });
  }


  cartTotalPriceEl.innerText =
    `${total.toLocaleString()}원`;
}


// ==============================
// 수량 변경
// ==============================

window.changeQty =
  function(id, delta) {

    const item =
      cart.find(
        item => item.id === id
      );


    if (!item) {
      return;
    }


    item.quantity += delta;


    if (item.quantity <= 0) {

      cart =
        cart.filter(
          item => item.id !== id
        );

    }


    saveCart();
  };


// ==============================
// 상품 삭제
// ==============================

window.removeItem =
  function(id) {

    cart =
      cart.filter(
        item => item.id !== id
      );


    saveCart();
  };


// ==============================
// 장바구니 열기
// ==============================

openCartBtn.addEventListener(
  "click",
  () => {

    updateCartUI();

    cartModal.classList.add("active");

    document.body.style.overflow = "hidden";
  }
);


// ==============================
// 장바구니 닫기
// ==============================

closeCartBtn.addEventListener(
  "click",
  () => {

    cartModal.classList.remove("active");

    document.body.style.overflow = "";
  }
);


// ==============================
// 상품 상세 닫기
// ==============================

closeDetailBtn.addEventListener(
  "click",
  () => {

    detailModal.classList.remove("active");

    document.body.style.overflow = "";
  }
);


// ==============================
// ⭐ 주문하기
// ==============================

checkoutBtn.addEventListener(
  "click",
  () => {

    // 장바구니가 비어있으면 중단
    if (cart.length === 0) {

      alert("장바구니가 비어 있습니다.");

      return;
    }


    // 총 금액 계산
    const total =
      cart.reduce(
        (sum, item) =>
          sum +
          item.price *
          item.quantity,
        0
      );


    // 주문 화면의 금액 표시
    orderTotalEl.innerText =
      `${total.toLocaleString()}원`;


    // 장바구니 닫기
    cartModal.classList.remove("active");


    // ⭐ 주문 정보 입력창 열기
    orderModal.classList.add("active");


    document.body.style.overflow = "hidden";
  }
);


// ==============================
// 주문 화면 닫기
// ==============================

closeOrderBtn.addEventListener(
  "click",
  () => {

    orderModal.classList.remove("active");

    document.body.style.overflow = "";
  }
);


// ==============================
// 주문 화면 바깥 클릭
// ==============================

orderModal.addEventListener(
  "click",
  event => {

    if (event.target === orderModal) {

      orderModal.classList.remove("active");

      document.body.style.overflow = "";
    }
  }
);


// ==============================
// 상품 상세 바깥 클릭
// ==============================

detailModal.addEventListener(
  "click",
  event => {

    if (event.target === detailModal) {

      detailModal.classList.remove("active");

      document.body.style.overflow = "";
    }
  }
);


// ==============================
// 장바구니 바깥 클릭
// ==============================

cartModal.addEventListener(
  "click",
  event => {

    if (event.target === cartModal) {

      cartModal.classList.remove("active");

      document.body.style.overflow = "";
    }
  }
);


// ==============================
// 결제하기
// ==============================

paymentBtn.addEventListener(
  "click",
  () => {

    const name =
      document.getElementById("order-name")
        .value
        .trim();


    const phone =
      document.getElementById("order-phone")
        .value
        .trim();


    const address =
      document.getElementById("order-address")
        .value
        .trim();


    if (!name) {

      alert("받으실 분 이름을 입력해주세요.");

      return;
    }


    if (!phone) {

      alert("연락처를 입력해주세요.");

      return;
    }


    if (!address) {

      alert("배송지를 입력해주세요.");

      return;
    }


    // 여기까지 입력되면 다음 단계에서
    // 실제 결제 시스템을 연결하면 됩니다.

    alert(
      "주문 정보가 입력되었습니다."
    );

  }
);


// ==============================
// 시작
// ==============================

renderProducts();

updateCartUI();
