export default {
  async fetch(request, env) {
    return new Response(
      JSON.stringify({
        ok: true,
        message: "HYEONMONG Worker is connected",
        database: !!env.DB
      }),
      {
        headers: {
          "Content-Type": "application/json"
        }
      }
    );
  }
};
