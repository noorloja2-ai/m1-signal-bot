export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === "GET" && (url.pathname === "/" || url.pathname === "/health")) {
      return Response.json({
        ok: true,
        service: "AZ CandleScanner gateway",
        status: "ready"
      });
    }

    return Response.json(
      { ok: false, error: "Not found" },
      { status: 404 }
    );
  }
};
