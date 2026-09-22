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
      "Content-Type, Authorization",

    "Access-Control-Max-Age":
      "86400"
  };
}


// =========================
// JSON 응답
// =========================

function jsonResponse(
  data,
  status,
  corsHeaders
) {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        "Content-Type":
          "application/json",
        ...corsHeaders
      }
    }
  );
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


// =========================
// 택배사 이름 → 택배넷 코드
// =========================

function getTaekbaeCarrierCode(
  carrier
) {

  const map = {

    "CJ대한통운":
      "cj",

    "한진택배":
      "hanjin",

    "롯데택배":
      "lotte",

    "우체국택배":
      "epost",

    "로젠택배":
      "logen",

    "CU 편의점택배":
      "cu",

    "GS25 편의점택배":
      "gs25"

  };

  return map[carrier] || null;
}


// =========================
// 택배넷 배송조회
// =========================

async function getTrackingInfo(
  carrier,
  trackingNumber,
  apiKey
) {

  if (!apiKey) {

    throw new Error(
      "TAEKBAENET_API_KEY가 설정되지 않았습니다."
    );

  }


  const normalizedNumber =
    String(trackingNumber || "")
      .replace(/-/g, "")
      .trim()
      .toUpperCase();


  if (!normalizedNumber) {

    throw new Error(
      "운송장번호가 없습니다."
    );

  }


  const carrierCode =
    getTaekbaeCarrierCode(
      carrier
    );


  const trackingUrl =
    new URL(
      "https://taekbae.net/v1/tracking/" +
      encodeURIComponent(
        normalizedNumber
      )
    );


  // 택배사가 확인되어 있으면 직접 지정
  if (carrierCode) {

    trackingUrl.searchParams.set(
      "carrier",
      carrierCode
    );

  }


  // 주문조회에는 최신 이벤트만 필요
  trackingUrl.searchParams.set(
    "events",
    "latest"
  );


  const response =
    await fetch(
      trackingUrl.toString(),
      {
        method: "GET",

        headers: {
          "Authorization":
            "Bearer " + apiKey,

          "Accept":
            "application/json"
        }
      }
    );


  const result =
    await response.json();


  if (!response.ok) {

    const error =
      new Error(
        result.title ||
        "배송정보를 가져오지 못했습니다."
      );

    error.status =
      response.status;

    error.code =
      result.code || "";

    error.requestId =
      result.request_id || "";

    throw error;

  }


  return result;
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

          return jsonResponse(
            {
              ok: false,
              message:
                "관리자 비밀번호가 설정되지 않았습니다."
            },
            500,
            corsHeaders
          );

        }


        if (
          password !==
          env.ADMIN_PASSWORD
        ) {

          return jsonResponse(
            {
              ok: false,
              message:
                "관리자 비밀번호가 올바르지 않습니다."
            },
            401,
            corsHeaders
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

        return jsonResponse(
          {
            ok: false,
            message:
              "관리자 로그인 중 오류가 발생했습니다."
          },
          500,
          corsHeaders
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

      return jsonResponse(
        {
          ok: true,

          secretConfigured:
            !!env.TOSS_SECRET_KEY,

          taekbaeConfigured:
            !!env.TAEKBAENET_API_KEY
        },
        200,
        corsHeaders
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

          return jsonResponse(
            {
              ok: false,
              message:
                "결제 승인 정보가 없습니다."
            },
            400,
            corsHeaders
          );

        }


        const secretKey =
          env.TOSS_SECRET_KEY;


        if (!secretKey) {

          return jsonResponse(
            {
              ok: false,
              message:
                "Toss Secret Key가 설정되지 않았습니다."
            },
            500,
            corsHeaders
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


          return jsonResponse(
            {
              ok: false,
              message:
                tossResult.message ||
                "결제 승인에 실패했습니다."
            },
            tossResponse.status,
            corsHeaders
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


        return jsonResponse(
          {
            ok: true,
            payment:
              tossResult
          },
          200,
          corsHeaders
        );


      } catch (error) {

        console.error(
          "Toss 결제 승인 오류:",
          error
        );


        return jsonResponse(
          {
            ok: false,
            message:
              "결제 승인 처리 중 오류가 발생했습니다."
          },
          500,
          corsHeaders
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

          return jsonResponse(
            {
              ok: false,
              message:
                "필수 주문 정보가 없습니다."
            },
            400,
            corsHeaders
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


        return jsonResponse(
          {
            ok: true,
            message:
              "주문이 접수되었습니다.",
            orderId
          },
          200,
          corsHeaders
        );


      } catch (error) {

        console.error(
          "D1 주문 저장 오류:",
          error
        );


        return jsonResponse(
          {
            ok: false,
            message:
              "주문 저장 중 오류가 발생했습니다."
          },
          500,
          corsHeaders
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

          return jsonResponse(
            {
              ok: false,
              message:
                "주문번호와 전화번호를 입력해주세요."
            },
            400,
            corsHeaders
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

          return jsonResponse(
            {
              ok: false,
              message:
                "주문 정보를 찾을 수 없습니다."
            },
            404,
            corsHeaders
          );

        }


        return jsonResponse(
          {
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
          },
          200,
          corsHeaders
        );


      } catch (error) {

        console.error(
          "주문 조회 오류:",
          error
        );


        return jsonResponse(
          {
            ok: false,
            message:
              "주문 조회 중 오류가 발생했습니다."
          },
          500,
          corsHeaders
        );

      }

    }


    // =========================
    // 실시간 배송조회
    // =========================

    if (
      url.pathname ===
      "/api/orders/tracking" &&
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

          return jsonResponse(
            {
              ok: false,
              message:
                "주문번호와 전화번호를 입력해주세요."
            },
            400,
            corsHeaders
          );

        }


        const order =
          await env.DB
            .prepare(`
              SELECT
                order_id,
                customer_name,
                phone,
                carrier,
                tracking_number,
                delivery_status
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


        if (!order) {

          return jsonResponse(
            {
              ok: false,
              message:
                "주문 정보를 찾을 수 없습니다."
            },
            404,
            corsHeaders
          );

        }


        if (
          !order.carrier ||
          !order.tracking_number
        ) {

          return jsonResponse(
            {
              ok: true,

              trackingRegistered:
                false,

              deliveryStatus:
                order.delivery_status ||
                "상품준비중"
            },
            200,
            corsHeaders
          );

        }


        if (
          !env.TAEKBAENET_API_KEY
        ) {

          return jsonResponse(
            {
              ok: false,
              message:
                "배송조회 API가 설정되지 않았습니다."
            },
            500,
            corsHeaders
          );

        }


        let tracking;

        try {

          tracking =
            await getTrackingInfo(
              order.carrier,
              order.tracking_number,
              env.TAEKBAENET_API_KEY
            );

        } catch (trackingError) {

          console.error(
            "택배넷 배송조회 오류:",
            trackingError
          );


          if (
            trackingError.status === 404
          ) {

            return jsonResponse(
              {
                ok: true,

                trackingRegistered:
                  true,

                trackingAvailable:
                  false,

                deliveryStatus:
                  "운송장 정보 확인 중",

                message:
                  "아직 택배사에 운송장 정보가 등록되지 않았습니다."
              },
              200,
              corsHeaders
            );

          }


          if (
            trackingError.status === 503
          ) {

            return jsonResponse(
              {
                ok: true,

                trackingRegistered:
                  true,

                trackingAvailable:
                  false,

                deliveryStatus:
                  order.delivery_status ||
                  "배송정보 확인 중",

                message:
                  "택배사 시스템에서 잠시 배송정보를 불러오지 못했습니다."
              },
              200,
              corsHeaders
            );

          }


          return jsonResponse(
            {
              ok: false,

              message:
                "배송정보를 불러오지 못했습니다."
            },
            502,
            corsHeaders
          );

        }


        const deliveryStatus =
          tracking.status &&
          tracking.status.label
            ? tracking.status.label
            : (
                order.delivery_status ||
                "확인 불가"
              );


        const statusCode =
          tracking.status &&
          tracking.status.code
            ? tracking.status.code
            : "unknown";


        const isFinal =
          !!(
            tracking.status &&
            tracking.status.is_final
          );


        const lastEvent =
          Array.isArray(
            tracking.events
          ) &&
          tracking.events.length > 0
            ? tracking.events[
                tracking.events.length - 1
              ]
            : null;


        // 최신 배송상태를 D1에도 저장
        await env.DB
          .prepare(`
            UPDATE orders
            SET delivery_status = ?
            WHERE order_id = ?
          `)
          .bind(
            deliveryStatus,
            orderId
          )
          .run();


        return jsonResponse(
          {
            ok: true,

            trackingRegistered:
              true,

            trackingAvailable:
              true,

            deliveryStatus:
              deliveryStatus,

            statusCode:
              statusCode,

            isFinal:
              isFinal,

            carrier:
              tracking.carrier
                ? tracking.carrier.name
                : order.carrier,

            trackingNumber:
              tracking.tracking_number ||
              order.tracking_number,

            lastEventAt:
              tracking.last_event_at ||
              tracking.last_event_at_raw ||
              null,

            lastEvent:
              lastEvent
                ? {
                    statusText:
                      lastEvent.status_text ||
                      "",

                    location:
                      lastEvent.location ||
                      "",

                    occurredAt:
                      lastEvent.occurred_at ||
                      lastEvent.occurred_at_raw ||
                      null
                  }
                : null,

            asOf:
              tracking.as_of ||
              null
          },
          200,
          corsHeaders
        );


      } catch (error) {

        console.error(
          "실시간 배송조회 오류:",
          error
        );


        return jsonResponse(
          {
            ok: false,
            message:
              "실시간 배송조회 중 오류가 발생했습니다."
          },
          500,
          corsHeaders
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

        return jsonResponse(
          {
            ok: false,
            message:
              "관리자 인증이 필요합니다."
          },
          401,
          corsHeaders
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


        return jsonResponse(
          {
            ok: false,
            message:
              "주문 목록을 불러오지 못했습니다."
          },
          500,
          corsHeaders
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

        return jsonResponse(
          {
            ok: false,
            message:
              "관리자 인증이 필요합니다."
          },
          401,
          corsHeaders
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

          return jsonResponse(
            {
              ok: false,
              message:
                "주문번호, 택배사, 송장번호가 필요합니다."
            },
            400,
            corsHeaders
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

          return jsonResponse(
            {
              ok: false,
              message:
                "해당 주문을 찾을 수 없습니다."
            },
            404,
            corsHeaders
          );

        }


        return jsonResponse(
          {
            ok: true,
            message:
              "배송정보가 저장되었습니다."
          },
          200,
          corsHeaders
        );


      } catch (error) {

        console.error(
          "배송정보 저장 오류:",
          error
        );


        return jsonResponse(
          {
            ok: false,
            message:
              "배송정보 저장 중 오류가 발생했습니다."
          },
          500,
          corsHeaders
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
