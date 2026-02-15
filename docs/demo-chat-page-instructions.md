# ForwardSlash.Chat - Demo /chat Page Instructions for Cursor

We need a public demo chatbot page to show potential customers how the real
product works. This is not a full customer-specific chatbot. It is a fixed demo
so visitors can test the experience instantly.

File path to create or update:  
`app/chat/demo/page.tsx`  
(or `app/chat/[...slug]/page.tsx` if you want to reuse the same chat component)

## Purpose of the demo

- Lives at: https://yourdomain.com/chat/demo (or forwardslash.chat/chat/demo)
- Shows a realistic ChatGPT-style interface branded for a fake business
- Lets visitors type questions and see how the bot answers based on real-ish content
- Builds trust: "See how it feels before buying"
- Used in landing page hero / CTA: "Try the demo ->"

## Demo business (hardcoded for simplicity)

Use this fake business for the demo:

- Business name: Demo Coffee Roasters
- Domain (demo): chat.demo-coffee.com (for now just use /chat/demo)
- Welcome message: "Hi! I'm your friendly coffee assistant. Ask me about beans, brewing, or our latest roast!"
- Primary color: #6B4E3D (warm brown)
- Logo: placeholder coffee cup icon or free image (Unsplash is fine)
- Tone: friendly, enthusiastic, knowledgeable about coffee

## Content to use for answers

Create a small hardcoded knowledge base for the demo (no real crawl needed yet):

```ts
const demoContent = [
  {
    title: "Our Story",
    url: "https://demo-coffee.com/about",
    content: "Demo Coffee Roasters started in 2018 in a small garage in Portland. We source single-origin beans from Ethiopia, Colombia, and Guatemala. We roast in small batches every Tuesday."
  },
  {
    title: "Best Sellers",
    url: "https://demo-coffee.com/shop",
    content: "1. Ethiopian Yirgacheffe - $18/250g - bright, floral, citrus notes\n2. Colombian Supremo - $16/250g - chocolate, caramel sweetness\n3. Guatemala Antigua - $17/250g - balanced, smoky finish"
  },
  {
    title: "Brew Guide",
    url: "https://demo-coffee.com/brew",
    content: "V60: 15g coffee to 250g water, 92C, 2:30 brew time. French Press: 30g to 500g water, 4 minutes steep."
  },
  {
    title: "Latest Blog",
    url: "https://demo-coffee.com/blog/latest",
    content: "Why Light Roasts Are Making a Comeback (Feb 2026) - Light roasts preserve origin flavors... [short excerpt]"
  }
];
```

## How the demo chat should work

When the user types a question:

- Take the user message.
- Do a simple keyword match or send all demoContent summaries to the LLM.
- Prompt the LLM to:
  - Only answer using the provided demo content.
  - Be friendly and on-brand.
  - Use markdown for lists, bold titles, links.
  - Show products/blogs nicely (bullet lists with titles + short descriptions + links).
- If no match: "I don't have info on that yet - ask about our beans, brewing, or latest roast!"

Stream the answer using Vercel AI SDK.

Example questions it should handle well:

- "What beans do you have?"
- "How do I brew with V60?"
- "Show me your best sellers"
- "Tell me about your latest blog"
- "How much is Colombian coffee?"

## Technical requirements

- Use Vercel AI SDK `useChat` hook.
- Route: `/api/chat/demo` (or `/api/chat` with demo flag).
- LLM: Groq (Llama 3.1 70B) or OpenAI GPT-4o-mini.
- UI: shadcn/ui chat components with markdown rendering (react-markdown or similar).
- Branding: apply #6B4E3D accents, logo in top-left or header.
- Full-screen chat layout (no header/footer on demo page).
- Mobile responsive.
- Typing indicator while thinking.

### Nice-to-have touches

- Auto-scroll to bottom.
- Copy button on code blocks or links.
- Quick reply suggestions (chips: "Show products", "Brew guide", "Latest blog").
- Small "Powered by ForwardSlash.Chat" footer (removable later).

## Instructions for Cursor

Build the demo page and API route first.

Create `app/chat/demo/page.tsx`:

- Full-screen chat UI with branding.
- Use `useChat({ api: "/api/chat/demo" })`.

Create `app/api/chat/demo/route.ts`:

- Hardcode `demoContent` array.
- Simple retrieval: send all content summaries to the LLM.
- Use Vercel AI SDK `streamText` or `generateText`.
- Good system prompt (grounded, friendly, formatted).

Make sure markdown renders nicely in chat bubbles (lists, bold, links).

After this demo is live, reuse the same chat component for real customers
(swap content source).
