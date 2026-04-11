/**
 * Slash-style shortcuts for customer chat (Telegram-like /about, /pricing).
 * Expansion runs server-side in POST /api/chat so behavior cannot be bypassed from the client.
 */

const PROMPTS: Record<string, string> = {
  about:
    "Give a concise overview of this company: who they are, what they do, and their main value proposition. Use only the provided website content. If something is missing, say so briefly.",
  pricing:
    "Summarize pricing, plans, packages, or how to buy from this business using only the website content. If pricing is not listed, say so and suggest how to get a quote or contact them.",
  blog:
    "Summarize blog, news, or articles: what topics they cover and where to find them, using only the website content. If there is no blog section, say so.",
  contact:
    "How can someone contact this company? List phone, email, address, contact forms, or support channels mentioned on the site. Use only the provided content.",
  help:
    "Briefly explain what kinds of questions you can answer about this business based on the website content (e.g. services, products, hours, location). Keep it short.",
  products:
    "Summarize main products or services offered, using only the website content. If unclear, say what you can infer and what to ask next.",
};

/** Commands we advertise in the UI (subset of PROMPTS keys). */
export const SLASH_COMMAND_CHIPS: { command: string; label: string }[] = [
  { command: "about", label: "/about" },
  { command: "pricing", label: "/pricing" },
  { command: "blog", label: "/blog" },
  { command: "contact", label: "/contact" },
  { command: "products", label: "/products" },
  { command: "help", label: "/help" },
];

/**
 * If input is `/command` or `/command extra text`, return the expanded instruction for the LLM.
 * Unknown commands return `null` so the raw message is sent to the model.
 */
export function expandSlashCommand(input: string): string | null {
  const t = input.trim();
  if (!t.startsWith("/")) return null;
  const rest = t.slice(1).trim();
  if (!rest) return null;
  const firstToken = rest.split(/\s+/)[0]?.toLowerCase();
  if (!firstToken) return null;
  const base = PROMPTS[firstToken];
  if (!base) return null;
  const afterCmd = rest.slice(firstToken.length).trim();
  if (afterCmd) {
    return `${base}\n\nVisitor also added: ${afterCmd.slice(0, 500)}`;
  }
  return base;
}
