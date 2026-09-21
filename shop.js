// ==========================================
// 永夢 HYEONMONG SHOP
// shop.js
// ==========================================

const TOSS_CLIENT_KEY =
  "test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm";


// ==========================================
// 상품
// ==========================================

const products = [
  {
    id: 1,
    name: "流浪 핑크 라이터",
    category: "HYEONMONG / LIGHTER",
    price: 5000,
    image:
      "AED2C668-95D1-4688-B695-084FE096312A.jpeg",
    description:
      "핑크 컬러의 라이터에 영몽의 감성을 담았습니다."
  }
];


// ==========================================
// 장바구니
// ==========================================

let cart = [];

let selectedProductId = null;


// ==========================================
// 상품 표시
// ==========================================

function renderProducts() {

  const productGrid =
    document.getElementById("product-grid");

  if (!productGrid) {
    console.error("product-grid를 찾을 수 없습니다.");
    return;
  }

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

        <div class="product-category">
          ${product.category}
        </div>

        <h3>
          ${product.name}
        </h3>

        <div class="product-price">
          ${product.price.toLocaleString()}원
        </div>

      </div>

    `;

    card.addEventListener(
      "click",
      function () {
        openDetail(product.id);
      }
    );

    productGrid.appendChild(card);

  });

}


// ==========================================
// 상품 상세
// ==========================================

function openDetail(productId) {

  const product =
    products.find(
      item => item.id === productId
    );

  const modal =
    document.getElementById(
      "detail-modal"
    );

  if (!product || !modal) return;


  selectedProductId = productId;


  const image =
    document.getElementById(
      "detail-img"
    );

  const title =
    document.getElementById(
      "detail-title"
    );

  const price =
    document.getElementById(
      "detail-price"
    );

  const desc =
    document.getElementById(
      "detail-desc"
    );


  if (image) {
    image.src = product.image;
    image.alt = product.name;
  }

  if (title) {
    title.textContent = product.name;
  }

  if (price) {
    price.textContent =
      `${product.price.toLocaleString()}원`;
  }

  if (desc) {
    desc.textContent =
      product.description;
  }


  modal.classList.add("active");

  document.body.style.overflow =
    "hidden";

}


// ==========================================
// 상품 상세 닫기
// ==========================================

const closeDetail =
  document.getElementById(
    "close-detail"
  );

if (closeDetail) {

  closeDetail.addEventListener(
    "click",
    function () {

      const modal =
        document.getElementById(
          "detail-modal"
        );

      if (modal) {
        modal.classList.remove(
          "active"
        );
      }

      document.body.style.overflow =
        "";

    }
  );

}


// ==========================================
// 장바구니 추가
// ==========================================

const addToCart =
  document.getElementById(
    "add-to-cart-btn"
  );

if (addToCart) {

  addToCart.addEventListener(
    "click",
    function () {

      if (
        selectedProductId === null
      ) {
        return;
      }


      const product =
        products.find(
          item =>
            item.id ===
            selectedProductId
        );

      if (!product) return;


      const existing =
        cart.find(
          item =>
            item.id ===
            product.id
        );


      if (existing) {

        existing.quantity += 1;

      } else {

        cart.push({

          id: product.id,

          name: product.name,

          price: product.price,

          quantity: 1

        });

      }


      updateCart();


      const detailModal =
        document.getElementById(
          "detail-modal"
        );

      if (detailModal) {

        detailModal.classList.remove(
          "active"
        );

      }


      openCart();

    }
  );

}


// ==========================================
// 장바구니 표시
// ==========================================

function renderCart() {

  const cartBox =
    document.getElementById(
      "cart-items"
    );

  if (!cartBox) return;


  if (cart.length === 0) {

    cartBox.innerHTML = `

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

    return;
  }


  cartBox.innerHTML =
    cart.map(item => `

      <div class="cart-item">

        <div class="cart-item-info">

          <h4>
            ${item.name}
          </h4>

          <p>
            ${(item.price * item.quantity)
              .toLocaleString()}원
          </p>

        </div>


        <div class="cart-item-qty">

          <button
            type="button"
            onclick="
              changeQuantity(${item.id}, -1)
            "
          >
            −
          </button>


          <span>
            ${item.quantity}
          </span>


          <button
            type="button"
            onclick="
              changeQuantity(${item.id}, 1)
            "
          >
            +
          </button>

        </div>

      </div>

    `).join("");

}


// ==========================================
// 수량 변경
// ==========================================

function changeQuantity(
  productId,
  amount
) {

  const item =
    cart.find(
      product =>
        product.id === productId
    );

  if (!item) return;


  item.quantity += amount;


  if (item.quantity <= 0) {

    cart =
      cart.filter(
        product =>
          product.id !== productId
      );

  }


  updateCart();

}


window.changeQuantity =
  changeQuantity;


// ==========================================
// 장바구니 업데이트
// ==========================================

function updateCart() {

  const count =
    cart.reduce(
      (sum, item) =>
        sum + item.quantity,
      0
    );


  const total =
    cart.reduce(
      (sum, item) =>
        sum +
        item.price *
        item.quantity,
      0
    );


  const countElement =
    document.getElementById(
      "cart-count"
    );

  const totalElement =
    document.getElementById(
      "cart-total-price"
    );


  if (countElement) {

    countElement.textContent =
      count;

  }


  if (totalElement) {

    totalElement.textContent =
      `${total.toLocaleString()}원`;

  }


  renderCart();

}


// ==========================================
// 장바구니 열기
// ==========================================

function openCart() {

  const modal =
    document.getElementById(
      "cart-modal"
    );

  if (!modal) return;


  updateCart();


  modal.classList.add("active");

  document.body.style.overflow =
    "hidden";

}


// ==========================================
// 장바구니 닫기
// ==========================================

const openCartButton =
  document.getElementById(
    "open-cart"
  );

if (openCartButton) {

  openCartButton.addEventListener(
    "click",
    openCart
  );

}


const closeCart =
  document.getElementById(
    "close-cart"
  );

if (closeCart) {

  closeCart.addEventListener(
    "click",
    function () {

      const modal =
        document.getElementById(
          "cart-modal"
        );

      if (modal) {

        modal.classList.remove(
          "active"
        );

      }

      document.body.style.overflow =
        "";

    }
  );

}


// ==========================================
// 주문하기
// ==========================================

const checkoutButton =
  document.getElementById(
    "checkout-btn"
  );

if (checkoutButton) {

  checkoutButton.addEventListener(
    "click",
    function () {

      if (cart.length === 0) {

        alert(
          "장바구니가 비어 있습니다."
        );

        return;
      }


      const total =
        cart.reduce(
          (sum, item) =>
            sum +
            item.price *
            item.quantity,
          0
        );


      const orderTotal =
        document.getElementById(
          "order-total"
        );


      if (orderTotal) {

        orderTotal.textContent =
          `${total.toLocaleString()}원`;

      }


      const cartModal =
        document.getElementById(
          "cart-modal"
        );


      if (cartModal) {

        cartModal.classList.remove(
          "active"
        );

      }


      const orderModal =
        document.getElementById(
          "order-modal"
        );


      if (orderModal) {

        orderModal.classList.add(
          "active"
        );

      }

    }
  );

}


// ==========================================
// 주문창 닫기
// ==========================================

const closeOrder =
  document.getElementById(
    "close-order"
  );

if (closeOrder) {

  closeOrder.addEventListener(
    "click",
    function () {

      const modal =
        document.getElementById(
          "order-modal"
        );

      if (modal) {

        modal.classList.remove(
          "active"
        );

      }

      document.body.style.overflow =
        "";

    }
  );

}


// ==========================================
// Toss Payments
// ==========================================

const paymentButton =
  document.getElementById(
    "payment-btn"
  );


if (paymentButton) {

  paymentButton.addEventListener(
    "click",
    async function () {

      try {

        if (cart.length === 0) {

          alert(
            "장바구니가 비어 있습니다."
          );

          return;
        }


        const nameInput =
          document.getElementById(
            "order-name"
          );


        const phoneInput =
          document.getElementById(
            "order-phone"
          );


        const addressInput =
          document.getElementById(
            "order-address"
          );


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


        if (!name) {

          alert(
            "이름을 입력해주세요."
          );

          nameInput?.focus();

          return;
        }


        if (!phone) {

          alert(
            "연락처를 입력해주세요."
          );

          phoneInput?.focus();

          return;
        }


        if (!address) {

          alert(
            "배송지를 입력해주세요."
          );

          addressInput?.focus();

          return;
        }


        if (
          typeof TossPayments !==
          "function"
        ) {

          alert(
            "결제 모듈을 불러오지 못했습니다."
          );

          return;
        }


        const total =
          cart.reduce(
            (sum, item) =>
              sum +
              item.price *
              item.quantity,
            0
          );


        const orderId =
          "HYEONMONG_" +
          crypto
            .randomUUID()
            .replace(
              /-/g,
              ""
            )
            .slice(0, 32);


        const customerKey =
          "HYEONMONG_" +
          crypto
            .randomUUID()
            .replace(
              /-/g,
              ""
            )
            .slice(0, 32);


        const tossPayments =
          TossPayments(
            TOSS_CLIENT_KEY
          );


        const payment =
          tossPayments.payment({
            customerKey:
              customerKey
          });


        const orderName =
          cart.length === 1
            ? cart[0].name
            : `${cart[0].name} 외 ${
                cart.length - 1
              }건`;


        await payment.requestPayment({

          method: "CARD",

          amount: {

            currency: "KRW",

            value: total

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


// ==========================================
// 모달 바깥 클릭
// ==========================================

[
  "detail-modal",
  "cart-modal",
  "order-modal"
].forEach(id => {

  const modal =
    document.getElementById(id);

  if (!modal) return;


  modal.addEventListener(
    "click",
    function (event) {

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


// ==========================================
// 시작
// ==========================================

renderProducts();

updateCart();
