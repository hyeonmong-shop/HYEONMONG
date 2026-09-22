function getCorsHeaders(request) {
  const origin = request.headers.get("Origin");

  const allowedOrigins = [
    "https://hyoeunan240-bot.github.io"
  ];

  return {
    "Access-Control-Allow-Origin":
      allowedOrigins.includes(origin)
        ? origin
        : "https://hyoeunan240-bot.github.io",

    "Access-Control-Allow-Methods":
      "POST, OPTIONS",

    "Access-Control-Allow-Headers":
      "Content-Type",

    "Access-Control-Max-Age":
      "86400"
  };
}


export default {
  async fetch(request, env) {

    const url =
      new URL(request.url);

    const corsHeaders =
      getCorsHeaders(request);


    // ==============================
    // CORS 사전 요청
    // ==============================

    if (request.method === "OPTIONS") {

      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });

    }


    // ==============================
    // Toss 결제 승인
    // ==============================

    if (
      url.pathname === "/api/payments/confirm" &&
      request.method === "POST"
    ) {

      try {

        const data =
          await request.json();

        const {
          paymentKey,
          orderId,
          amount
        } = data;


        // 필수값 확인
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


        // ==============================
        // Toss Secret Key
        // ==============================

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


        // ==============================
        // Toss 결제 승인 요청
        // ==============================

        const auth =
          btoa(secretKey + ":");


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

              body: JSON.stringify({
                paymentKey,
                orderId,
                amount:
                  Number(amount)
              })
            }
          );


        const tossResult =
          await tossResponse.json();


        // ==============================
        // Toss 승인 실패
        // ==============================

        if (!tossResponse.ok) {

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


        // ==============================
        // 결제 성공 → D1 상태 변경
        // ==============================

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


        // ==============================
        // 성공
        // ==============================

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


    // ==============================
    // 주문 접수
    // ==============================

    if (
      url.pathname === "/api/orders" &&
      request.method === "POST"
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


        // 필수값 확인
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


        // ==============================
        // D1 주문 저장
        // ==============================

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
              created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `)
          .bind(
            orderId,
            name,
            phone,
            address,
            JSON.stringify(items),
            Number(amount),
            "PENDING",
            new Date().toISOString()
          )
          .run();


        // ==============================
        // 성공
        // ==============================

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


    // ==============================
    // 기본 응답
    // ==============================

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
