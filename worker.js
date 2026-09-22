function getCorsHeaders(request) {
  const origin = request.headers.get("Origin");

  const allowedOrigins = [
    "https://hyoeunan240-bot.github.io"
  ];

  const headers = {
    "Access-Control-Allow-Origin":
      allowedOrigins.includes(origin)
        ? origin
        : "https://hyoeunan240-bot.github.io",

    "Access-Control-Allow-Methods":
      "GET, POST, OPTIONS",

    "Access-Control-Allow-Headers":
      "Content-Type, Authorization",

    "Access-Control-Max-Age":
      "86400"
  };

  return headers;
}


// =========================
// 관리자 인증 토큰 생성
// =========================

async function createAdminToken(secret) {

  const timestamp =
    Date.now().toString();

  const key =
    await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      {
        name: "HMAC",
        hash: "SHA-256"
      },
      false,
      ["sign"]
    );

  const signature =
    await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(timestamp)
    );

  const bytes =
    new Uint8Array(signature);

  const signatureText =
    Array.from(bytes)
      .map(
        b =>
          b.toString(16)
            .padStart(2, "0")
      )
      .join("");

  return (
    timestamp +
    "." +
    signatureText
  );
}


// =========================
// 관리자 인증 토큰 확인
// =========================

async function verifyAdminToken(
  token,
  secret
) {

  if (!token || !secret) {
    return false;
  }

  const parts =
    token.split(".");

  if (parts.length !== 2) {
    return false;
  }

  const timestamp =
    parts[0];

  const signature =
    parts[1];

  const time =
    Number(timestamp);

  if (!Number.isFinite(time)) {
    return false;
  }

  // 관리자 로그인 유효시간 24시간
  if (
    Date.now() - time >
    24 * 60 * 60 * 1000
  ) {
    return false;
  }

  const key =
    await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      {
        name: "HMAC",
        hash: "SHA-256"
      },
      false,
      ["sign"]
    );

  const expected =
    await crypto.subtle.sign(
      "HMAC",
      key,
      new TextEncoder().encode(timestamp)
    );

  const bytes =
    new Uint8Array(expected);

  const expectedSignature =
    Array.from(bytes)
      .map(
        b =>
          b.toString(16)
            .padStart(2, "0")
      )
      .join("");

  return (
    signature ===
    expectedSignature
  );
}


// =========================
// 관리자 인증 확인
// =========================

async function isAdmin(
  request,
  env
) {

  const authorization =
    request.headers.get(
      "Authorization"
    ) || "";

  if (
    !authorization.startsWith(
      "Bearer "
    )
  ) {
    return false;
  }

  const token =
    authorization.slice(7);

  return await verifyAdminToken(
    token,
    env.ADMIN_PASSWORD
  );
}


export default {

  async fetch(
    request,
    env
  ) {

    const url =
      new URL(request.url);

    const corsHeaders =
      getCorsHeaders(request);


    // =========================
    // CORS
    // =========================

    if (
      request.method ===
      "OPTIONS"
    ) {

      return new Response(
        null,
        {
          status: 204,
          headers:
            corsHeaders
        }
      );
    }


    // =========================
    // 관리자 로그인
    // =========================

    if (
      url.pathname ===
      "/api/admin/login" &&
      request.method ===
      "POST"
    ) {

      try {

        const data =
          await request.json();

        const password =
          data.password || "";

        if (
          !env.ADMIN_PASSWORD
        ) {

          return new Response(
            JSON.stringify({
              ok: false,
              message:
                "관리자 비밀번호가 설정되지 않았습니다."
            }),
            {
              status: 500,
              headers: {
                "Content-Type":
                  "application/json",
                ...corsHeaders
              }
            }
          );
        }


        if (
          password !==
          env.ADMIN_PASSWORD
        ) {

          return new Response(
            JSON.stringify({
              ok: false,
              message:
                "관리자 비밀번호가 올바르지 않습니다."
            }),
            {
              status: 401,
              headers: {
                "Content-Type":
                  "application/json",
                ...corsHeaders
              }
            }
          );
        }


        const token =
          await createAdminToken(
            env.ADMIN_PASSWORD
          );


        return new Response(
          JSON.stringify({
            ok: true,
            token: token
          }),
          {
            status: 200,
            headers: {
              "Content-Type":
                "application/json",
              ...corsHeaders,
              "Cache-Control":
                "no-store"
            }
          }
        );


      } catch (error) {

        console.error(
          "관리자 로그인 오류:",
          error
        );

        return new Response(
          JSON.stringify({
            ok: false,
            message:
              "관리자 로그인 중 오류가 발생했습니다."
          }),
          {
            status: 500,
            headers: {
              "Content-Type":
                "application/json",
              ...corsHeaders
            }
          }
        );
      }
    }


    // =========================
    // Secret Key 확인
    // =========================

    if (
      url.pathname ===
      "/api/secret-status" &&
      request.method ===
      "GET"
    ) {

      return new Response(
        JSON.stringify({
          ok: true,
          secretConfigured:
            !!env.TOSS_SECRET_KEY
        }),
        {
          status: 200,
          headers: {
            "Content-Type":
              "application/json",
            ...corsHeaders
          }
        }
      );
    }


    // =========================
    // Toss 결제 승인
    // =========================

    if (
      url.pathname ===
      "/api/payments/confirm" &&
      request.method ===
      "POST"
    ) {

      try {

        const data =
          await request.json();

        const {
          paymentKey,
          orderId,
          amount
        } = data;


        if (
          !paymentKey ||
          !orderId ||
          !amount
        ) {

          return new Response(
            JSON.stringify({
              ok: false,
              message:
                "결제 승인 정보가 없습니다."
            }),
            {
              status: 400,
              headers: {
                "Content-Type":
                  "application/json",
                ...corsHeaders
              }
            }
          );
        }


        const secretKey =
          env.TOSS_SECRET_KEY;


        if (!secretKey) {

          return new Response(
            JSON.stringify({
              ok: false,
              message:
                "Toss Secret Key가 설정되지 않았습니다."
            }),
            {
              status: 500,
              headers: {
                "Content-Type":
                  "application/json",
                ...corsHeaders
              }
            }
          );
        }


        const auth =
          btoa(
            secretKey + ":"
          );


        const tossResponse =
          await fetch(
            "https://api.tosspayments.com/v1/payments/confirm",
            {
              method: "POST",

              headers: {
                "Authorization":
                  "Basic " + auth,

                "Content-Type":
                  "application/json"
              },

              body:
                JSON.stringify({
                  paymentKey,
                  orderId,
                  amount:
                    Number(amount)
                })
            }
          );


        const tossResult =
          await tossResponse.json();


        if (
          !tossResponse.ok
        ) {

          console.error(
            "Toss 결제 승인 실패:",
            tossResult
          );


          return new Response(
            JSON.stringify({
              ok: false,
              message:
                tossResult.message ||
                "결제 승인에 실패했습니다."
            }),
            {
              status:
                tossResponse.status,

              headers: {
                "Content-Type":
                  "application/json",
                ...corsHeaders
              }
            }
          );
        }


        await env.DB
          .prepare(`
            UPDATE orders
            SET status = 'PAID'
            WHERE order_id = ?
              AND amount = ?
          `)
          .bind(
            orderId,
            Number(amount)
          )
          .run();


        return new Response(
          JSON.stringify({
            ok: true,
            payment:
              tossResult
          }),
          {
            status: 200,

            headers: {
              "Content-Type":
                "application/json",
              ...corsHeaders
            }
          }
        );


      } catch (error) {

        console.error(
          "Toss 결제 승인 오류:",
          error
        );


        return new Response(
          JSON.stringify({
            ok: false,
            message:
              "결제 승인 처리 중 오류가 발생했습니다."
          }),
          {
            status: 500,

            headers: {
              "Content-Type":
                "application/json",
              ...corsHeaders
            }
          }
        );
      }
    }


    // =========================
    // 주문 생성
    // =========================

    if (
      url.pathname ===
      "/api/orders" &&
      request.method ===
      "POST"
    ) {

      try {

        const data =
          await request.json();


        const {
          orderId,
          name,
          phone,
          address,
          items,
          amount
        } = data;


        if (
          !orderId ||
          !name ||
          !phone ||
          !address ||
          !items ||
          !amount
        ) {

          return new Response(
            JSON.stringify({
              ok: false,
              message:
                "필수 주문 정보가 없습니다."
            }),
            {
              status: 400,

              headers: {
                "Content-Type":
                  "application/json",
                ...corsHeaders
              }
            }
          );
        }


        await env.DB
          .prepare(`
            INSERT INTO orders (
              order_id,
              customer_name,
              phone,
              address,
              items_json,
              amount,
              status,
              delivery_status,
              created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `)
          .bind(
            orderId,
            name,
            phone,
            address,
            JSON.stringify(items),
            Number(amount),
            "PENDING",
            "상품준비중",
            new Date().toISOString()
          )
          .run();


        return new Response(
          JSON.stringify({
            ok: true,
            message:
              "주문이 접수되었습니다.",
            orderId
          }),
          {
            status: 200,

            headers: {
              "Content-Type":
                "application/json",
              ...corsHeaders
            }
          }
        );


      } catch (error) {

        console.error(
          "D1 주문 저장 오류:",
          error
        );


        return new Response(
          JSON.stringify({
            ok: false,
            message:
              "주문 저장 중 오류가 발생했습니다."
          }),
          {
            status: 500,

            headers: {
              "Content-Type":
                "application/json",
              ...corsHeaders
            }
          }
        );
      }
    }


    // =========================
    // 고객 주문 조회
    // =========================

    if (
      url.pathname ===
      "/api/orders/lookup" &&
      request.method ===
      "POST"
    ) {

      try {

        const data =
          await request.json();


        const {
          orderId,
          phone
        } = data;


        if (
          !orderId ||
          !phone
        ) {

          return new Response(
            JSON.stringify({
              ok: false,
              message:
                "주문번호와 전화번호를 입력해주세요."
            }),
            {
              status: 400,

              headers: {
                "Content-Type":
                  "application/json",
                ...corsHeaders
              }
            }
          );
        }


        const result =
          await env.DB
            .prepare(`
              SELECT
                order_id,
                customer_name,
                items_json,
                amount,
                status,
                carrier,
                tracking_number,
                delivery_status,
                created_at
              FROM orders
              WHERE order_id = ?
                AND phone = ?
              LIMIT 1
            `)
            .bind(
              orderId,
              phone
            )
            .first();


        if (!result) {

          return new Response(
            JSON.stringify({
              ok: false,
              message:
                "주문 정보를 찾을 수 없습니다."
            }),
            {
              status: 404,

              headers: {
                "Content-Type":
                  "application/json",
                ...corsHeaders
              }
            }
          );
        }


        return new Response(
          JSON.stringify({
            ok: true,

            order: {

              orderId:
                result.order_id,

              customerName:
                result.customer_name,

              items:
                JSON.parse(
                  result.items_json
                ),

              amount:
                result.amount,

              status:
                result.status,

              carrier:
                result.carrier,

              trackingNumber:
                result.tracking_number,

              deliveryStatus:
                result.delivery_status,

              createdAt:
                result.created_at
            }
          }),
          {
            status: 200,

            headers: {
              "Content-Type":
                "application/json",
              ...corsHeaders
            }
          }
        );


      } catch (error) {

        console.error(
          "주문 조회 오류:",
          error
        );


        return new Response(
          JSON.stringify({
            ok: false,
            message:
              "주문 조회 중 오류가 발생했습니다."
          }),
          {
            status: 500,

            headers: {
              "Content-Type":
                "application/json",
              ...corsHeaders
            }
          }
        );
      }
    }


    // =========================
    // 관리자 주문 목록
    // =========================

    if (
      url.pathname ===
      "/api/admin/orders" &&
      request.method ===
      "GET"
    ) {

      const authenticated =
        await isAdmin(
          request,
          env
        );

      if (!authenticated) {

        return new Response(
          JSON.stringify({
            ok: false,
            message:
              "관리자 인증이 필요합니다."
          }),
          {
            status: 401,
            headers: {
              "Content-Type":
                "application/json",
              ...corsHeaders
            }
          }
        );
      }


      try {

        const result =
          await env.DB
            .prepare(`
              SELECT
                id,
                order_id,
                customer_name,
                phone,
                address,
                items_json,
                amount,
                status,
                carrier,
                tracking_number,
                delivery_status,
                created_at
              FROM orders
              ORDER BY id DESC
            `)
            .all();


        const orders =
          (result.results || [])
            .map(
              order => ({
                id:
                  order.id,

                orderId:
                  order.order_id,

                customerName:
                  order.customer_name,

                phone:
                  order.phone,

                address:
                  order.address,

                items:
                  JSON.parse(
                    order.items_json
                  ),

                amount:
                  order.amount,

                status:
                  order.status,

                carrier:
                  order.carrier,

                trackingNumber:
                  order.tracking_number,

                deliveryStatus:
                  order.delivery_status,

                createdAt:
                  order.created_at
              })
            );


        return new Response(
          JSON.stringify({
            ok: true,
            orders
          }),
          {
            status: 200,
            headers: {
              "Content-Type":
                "application/json",
              ...corsHeaders,
              "Cache-Control":
                "no-store"
            }
          }
        );


      } catch (error) {

        console.error(
          "관리자 주문 조회 오류:",
          error
        );


        return new Response(
          JSON.stringify({
            ok: false,
            message:
              "주문 목록을 불러오지 못했습니다."
          }),
          {
            status: 500,
            headers: {
              "Content-Type":
                "application/json",
              ...corsHeaders
            }
          }
        );
      }
    }


    // =========================
    // 배송정보 등록
    // 관리자 전용
    // =========================

    if (
      url.pathname ===
      "/api/orders/shipping" &&
      request.method ===
      "POST"
    ) {


      const authenticated =
        await isAdmin(
          request,
          env
        );


      if (!authenticated) {

        return new Response(
          JSON.stringify({
            ok: false,
            message:
              "관리자 인증이 필요합니다."
          }),
          {
            status: 401,
            headers: {
              "Content-Type":
                "application/json",
              ...corsHeaders
            }
          }
        );
      }


      try {

        const data =
          await request.json();


        const {
          orderId,
          carrier,
          trackingNumber,
          deliveryStatus
        } = data;


        if (
          !orderId ||
          !carrier ||
          !trackingNumber
        ) {

          return new Response(
            JSON.stringify({
              ok: false,
              message:
                "주문번호, 택배사, 송장번호가 필요합니다."
            }),
            {
              status: 400,

              headers: {
                "Content-Type":
                  "application/json",
                ...corsHeaders
              }
            }
          );
        }


        const updateResult =
          await env.DB
            .prepare(`
              UPDATE orders
              SET
                carrier = ?,
                tracking_number = ?,
                delivery_status = ?
              WHERE order_id = ?
            `)
            .bind(
              carrier,
              trackingNumber,
              deliveryStatus ||
                "상품준비중",
              orderId
            )
            .run();


        if (
          !updateResult.meta ||
          updateResult.meta.changes === 0
        ) {

          return new Response(
            JSON.stringify({
              ok: false,
              message:
                "해당 주문을 찾을 수 없습니다."
            }),
            {
              status: 404,

              headers: {
                "Content-Type":
                  "application/json",
                ...corsHeaders
              }
            }
          );
        }


        return new Response(
          JSON.stringify({
            ok: true,
            message:
              "배송정보가 저장되었습니다."
          }),
          {
            status: 200,

            headers: {
              "Content-Type":
                "application/json",
              ...corsHeaders
            }
          }
        );


      } catch (error) {

        console.error(
          "배송정보 저장 오류:",
          error
        );


        return new Response(
          JSON.stringify({
            ok: false,
            message:
              "배송정보 저장 중 오류가 발생했습니다."
          }),
          {
            status: 500,

            headers: {
              "Content-Type":
                "application/json",
              ...corsHeaders
            }
          }
        );
      }
    }


    // =========================
    // 기본 응답
    // =========================

    return new Response(
      JSON.stringify({
        ok: true,
        message:
          "HYEONMONG Worker is connected",
        database:
          !!env.DB
      }),
      {
        status: 200,

        headers: {
          "Content-Type":
            "application/json",
          ...corsHeaders
        }
      }
    );

  }
};
