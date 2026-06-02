// Serverless function — runs on Vercel's servers, NOT in the browser.
// This is where your Anthropic API key lives (kept secret as an Environment Variable).
// The phone app calls THIS, and this calls Claude. That's why it isn't blocked.

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "ANTHROPIC_API_KEY is not set. Add it in your Vercel project's Environment Variables, then redeploy." });
    return;
  }

  try {
    const { prompt } = req.body || {};
    if (!prompt) {
      res.status(400).json({ error: "Missing prompt" });
      return;
    }

    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        // Haiku is fast and very cheap — great for nutrition lookups.
        // For more accuracy you can change this to "claude-sonnet-4-6".
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await r.json();
    if (!r.ok) {
      res.status(r.status).json({ error: data?.error?.message || "Anthropic API error" });
      return;
    }
    res.status(200).json(data);
  } catch (e) {
    res.status(500).json({ error: String(e && e.message ? e.message : e) });
  }
}
