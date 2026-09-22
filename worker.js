const corsHeaders = {
  "Access-Control-Allow-Origin": "https://hyoeunan240-bot.github.io",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type"
};

export default {
  async fetch(request, env) {

    const url = new URL(request.url);

    // CORS 사전 요청 처리
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: corsHeaders
      });
    }


    // 주문 접수
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
              message: "필수 주문 정보가 없습니다."
            }),
            {
              status: 400,
              headers: {
                "Content-Type": "application/json",
                ...corsHeaders
              }
            }
          );
        }


        // D1에 주문 저장
        await env.DB.prepare(`
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


        return new Response(
          JSON.stringify({
            ok: true,
            message: "주문이 접수되었습니다.",
            orderId
          }),
          {
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders
            }
          }
        );


      } catch (error) {

        return new Response(
          JSON.stringify({
            ok: false,
            message: "주문 저장 중 오류가 발생했습니다.",
            error: error.message
          }),
          {
            status: 500,
            headers: {
              "Content-Type": "application/json",
              ...corsHeaders
            }
          }
        );
      }
    }


    // 기본 Worker 응답
    return new Response(
      JSON.stringify({
        ok: true,
        message: "HYEONMONG Worker is connected",
        database: !!env.DB
      }),
      {
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders
        }
      }
    );
  }
};
