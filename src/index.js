const JSON_HEADERS = {
  "content-type": "application/json; charset=UTF-8",
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET, POST, OPTIONS",
  "access-control-allow-headers": "Content-Type, Authorization"
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: JSON_HEADERS
  });
}

function numberInRange(value, name) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0 || number > 100) {
    throw new Error(`${name} must be a number from 0 to 100`);
  }
  return number;
}

function analyseMarket(input) {
  const trendStrength = numberInRange(input.trendStrength, "trendStrength");
  const momentum = numberInRange(input.momentum, "momentum");
  const volatility = numberInRange(input.volatility, "volatility");
  const candleMovement = numberInRange(input.candleMovement, "candleMovement");
  const directionalAgreement = numberInRange(
    input.directionalAgreement,
    "directionalAgreement"
  );

  const sideways = Boolean(input.sideways);
  const unstable = Boolean(input.unstable);
  const reasons = [];

  if (sideways) reasons.push("Sideways market");
  if (unstable) reasons.push("Unstable movement");
  if (candleMovement < 25) reasons.push("Market not moving");
  if (volatility < 20) reasons.push("Volatility too low");
  if (volatility > 88) reasons.push("Volatility too high");
  if (trendStrength < 30) reasons.push("Weak trend");
  if (momentum < 30) reasons.push("Weak momentum");
  if (directionalAgreement < 45) reasons.push("Conflicting direction");

  let status;
  let suitable;
  let guidance;

  if (
    sideways ||
    unstable ||
    candleMovement < 25 ||
    volatility < 20 ||
    volatility > 88 ||
    directionalAgreement < 45
  ) {
    status = "POOR";
    suitable = false;
    guidance = "WAIT / DO NOT TRADE";
  } else {
    const quality =
      trendStrength * 0.28 +
      momentum * 0.24 +
      candleMovement * 0.2 +
      directionalAgreement * 0.28;

    if (
      quality >= 85 &&
      trendStrength >= 80 &&
      momentum >= 75 &&
      directionalAgreement >= 85 &&
      volatility >= 35 &&
      volatility <= 75
    ) {
      status = "VERY STRONG";
      suitable = true;
      guidance = "CONDITIONS VERY STRONG — WAIT FOR BUY/SELL CONFIRMATION";
      reasons.push("Strong agreement across all market checks");
    } else if (
      quality >= 70 &&
      trendStrength >= 60 &&
      momentum >= 55 &&
      directionalAgreement >= 70 &&
      volatility >= 28 &&
      volatility <= 82
    ) {
      status = "BEST";
      suitable = true;
      guidance = "TRADING CONDITIONS SUITABLE — WAIT FOR BUY/SELL CONFIRMATION";
      reasons.push("Trend, momentum and direction agree");
    } else if (quality >= 52 && directionalAgreement >= 55) {
      status = "GOOD";
      suitable = true;
      guidance = "TRADE WITH CAUTION — STRONG CONFIRMATION REQUIRED";
      reasons.push("Acceptable market movement");
    } else {
      status = "POOR";
      suitable = false;
      guidance = "WAIT / DO NOT TRADE";
      reasons.push("Market checks are not sufficiently aligned");
    }
  }

  return {
    status,
    suitable,
    guidance,
    reasons,
    disclaimer: "Market quality only. This is not a guaranteed winning signal."
  };
}

export default {
  async fetch(request) {
    const url = new URL(request.url);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: JSON_HEADERS });
    }

    if (
      request.method === "GET" &&
      (url.pathname === "/" || url.pathname === "/health")
    ) {
      return json({
        ok: true,
        service: "AZ CandleScanner gateway",
        status: "ready",
        marketCondition: ["VERY STRONG", "BEST", "GOOD", "POOR"]
      });
    }

    if (request.method === "POST" && url.pathname === "/market-condition") {
      try {
        const input = await request.json();
        return json({ ok: true, ...analyseMarket(input) });
      } catch (error) {
        return json(
          { ok: false, error: error instanceof Error ? error.message : "Invalid request" },
          400
        );
      }
    }

    return json({ ok: false, error: "Not found" }, 404);
  }
};
