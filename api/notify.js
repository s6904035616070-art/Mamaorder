module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).end();
  if (req.headers["x-webhook-secret"] !== process.env.WEBHOOK_SECRET)
    return res.status(401).end();
  const b = req.body || {};
  if (b.type !== "INSERT") return res.status(200).end();
  const o = b.record || {};
  const items = Array.isArray(o.items) ? o.items : [];
  const total = items.reduce((a, i) => a + i.qty * i.price, 0);
  const lines = items.map((i) => `• ${i.name} × ${i.qty}`).join("\n");
  const text =
    `🛎️ ออเดอร์ใหม่ โต๊ะ ${o.table_no}\n${lines}\nรวม ${total} บาท` +
    (o.note ? `\nหมายเหตุ: ${o.note}` : "");
  const r = await fetch(
    `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: process.env.TELEGRAM_CHAT_ID, text }),
    }
  );
  return res.status(r.ok ? 200 : 500).end();
};
