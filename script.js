const products = [
  {id:1, name:"永夢 LIGHTER 01", price:15000, image:""},
  {id:2, name:"永夢 LIGHTER 02", price:15000, image:""},
  {id:3, name:"永夢 LIGHTER 03", price:15000, image:""},
  {id:4, name:"永夢 LIGHTER 04", price:15000, image:""}
];

let cart = JSON.parse(localStorage.getItem("hyeonmong-cart") || "[]");

const won = n => n.toLocaleString("ko-KR") + "원";

function renderProducts(){
  const box=document.getElementById("products");
  document.getElementById("productCount").textContent = `${products.length} ITEMS`;
  box.innerHTML=products.map(p=>`
    <article class="product-card" onclick="addToCart(${p.id})">
      <div class="product-image">
        ${p.image ? `<img src="${p.image}" alt="${p.name}">` : `<span class="placeholder">永夢</span>`}
      </div>
      <div class="product-info">
        <p class="product-name">${p.name}</p>
        <p class="product-price">${won(p.price)}</p>
      </div>
    </article>
  `).join("");
}

function addToCart(id){
  const found=cart.find(x=>x.id===id);
  if(found) found.qty++;
  else cart.push({id,qty:1});
  saveCart();
  document.getElementById("cart").scrollIntoView({behavior:"smooth"});
}

function removeFromCart(id){
  cart=cart.filter(x=>x.id!==id);
  saveCart();
}

function saveCart(){
  localStorage.setItem("hyeonmong-cart",JSON.stringify(cart));
  renderCart();
}

function renderCart(){
  const box=document.getElementById("cartItems");
  let total=0,count=0;
  if(!cart.length) box.innerHTML='<p class="notice">장바구니가 비어 있습니다.</p>';
  else box.innerHTML=cart.map(item=>{
    const p=products.find(x=>x.id===item.id);
    total+=p.price*item.qty; count+=item.qty;
    return `<div class="cart-row"><span>${p.name} × ${item.qty}</span><span>${won(p.price*item.qty)} <button onclick="removeFromCart(${p.id})">삭제</button></span></div>`;
  }).join("");
  document.getElementById("cartTotal").textContent=won(total);
  document.getElementById("cartCount").textContent=count;
}

document.getElementById("orderButton").addEventListener("click",()=>{
  if(!cart.length) return alert("장바구니가 비어 있습니다.");
  alert("주문 기능은 다음 단계에서 연결할 수 있습니다.");
});

renderProducts();
renderCart();
