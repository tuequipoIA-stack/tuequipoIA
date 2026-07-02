// Helper de cliente para hablar con /api/chat (que a su vez pega a Anthropic).
export async function askClaude({ system, messages, max_tokens }) {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ system, messages, max_tokens }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.error || "Error llamando a la IA");
  }
  const textBlocks = (data.content || []).filter((b) => b.type === "text").map((b) => b.text);
  return textBlocks.join("\n").trim();
}
