const esc = (s) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

module.exports = async (req, res) => {
  if (req.method !== "POST") return res.status(405).end();
  if (!process.env.WEBHOOK_SECRET || req.headers["x-webhook-secret"] !== process.env.WEBHOOK_SECRET)

    return res.status(401).end();

  const b = req.body || {};
  if (b.type !== "INSERT") return res.status(200).end();
  const o = b.record || {};
  const items = Array.isArray(o.items) ? o.items : [];
  const total = items.reduce((a, i) => a + i.qty * i.price, 0);
  const time = new Date().toLocaleString("th-TH", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone: "Asia/Bangkok",
  });
  const lines = items.map((i) => `- ${esc(i.name)} × ${i.qty}`).join("\n");

  const text =
    `🍜 <b>มีออเดอร์มาม่าใหม่!</b>\n` +
    `- โต๊ะ: ${esc(o.table_no)}\n` +
    `${lines}\n` +
    `- ราคารวม: ${total} บาท\n` +
    (o.note ? `- หมายเหตุ: ${esc(o.note)}\n` : "") +
    `- เวลา: ${time}`;

  try {
    const r = await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: process.env.TELEGRAM_CHAT_ID,
          text,
          parse_mode: "HTML",
        }),
      }
    );
    return res.status(r.ok ? 200 : 500).end();
  } catch (err) {
    console.error("ส่งแจ้งเตือน Telegram ไม่สำเร็จ:", err);
    return res.status(500).end();
  }
};
