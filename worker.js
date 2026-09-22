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
      "GET, POST, OPTIONS",

    "Access-Control-Allow-Headers":
      "Content-Type",

    "Access-Control-Max-Age":
      "86400"
  };
}


export default {
  async fetch(request, env) {

    const url = new URL(request.url);

    const corsHeaders =
      getCorsHeaders(request);


    // CORS
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders
      });
    }


    // =========================
    // Secret Key 확인
    // =========================

    if (
      url.pathname === "/api/secret-status" &&
      request.method === "GET"
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
    // 주문번호 + 전화번호
    // =========================

    if (
      url.pathname === "/api/orders/lookup" &&
      request.method === "POST"
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
    // 배송정보 등록
    // 관리자용
    // =========================

    if (
      url.pathname === "/api/orders/shipping" &&
      request.method === "POST"
    ) {

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
