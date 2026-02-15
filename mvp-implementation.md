# Frank Gay Services - ForwardSlash.Chat MVP Implementation

## Overview

Frank Gay Services will be a test customer for ForwardSlash.Chat MVP. This guide shows how to integrate their content and chatbot into your platform's architecture.

## Architecture (Correct Model)

```
User visits: chat.frankgayservices.com (customer's domain)
    ↓
DNS CNAME: chat.frankgayservices.com → your-app.vercel.app
    ↓
Middleware reads Host header: "chat.frankgayservices.com"
    ↓
Looks up customer: domain:chat.frankgayservices.com → frankgay_001
    ↓
Loads pages array + system prompt
    ↓
Full-page chat interface renders
    ↓
User asks question
    ↓
API finds relevant pages (keyword match or send all)
    ↓
LLM answers using page content
    ↓
Stream response to UI
```

**Key Point:** Customers use their own domain (e.g., `chat.frankgayservices.com`), not a subdomain on `forwardslash.chat`. The only subdomain on your domain is `demo.forwardslash.chat` for your demo.

## Data Storage (Vercel KV / Upstash Redis)

### Key Structure

```typescript
// Customer's domain → Customer ID mapping
"domain:chat.frankgayservices.com" → "frankgay_001"

// Customer metadata
"customer:frankgay_001:meta" → {
  business_name: "Frank Gay Services",
  website_url: "https://frankgayservices.com",
  chat_domain: "chat.frankgayservices.com", // Their custom domain
  primary_color: "#DC2626",
  logo_url: "...",
  contact_info: {...},
  crawled_at: "2025-01-15T10:00:00Z",
  total_pages: 25,
  prepaid_until: "2027-01-15",
  bundle: "2-year"
}

// System prompt (instructions for LLM)
"customer:frankgay_001:prompt" → "You are an AI customer service assistant for Frank Gay Services..."

// Content pages (simple array for MVP - no embeddings)
"customer:frankgay_001:pages" → [
  {
    url: "...",
    title: "...",
    description: "...",
    content: "...",  // Clean markdown
    keywords: ["ac", "repair", ...]
  },
  ...
]

// Chat session (optional, for history)
"session:{sessionId}:messages" → [
  { role: "user", content: "..." },
  { role: "assistant", content: "..." }
]
```

## API Implementation

### Chat Endpoint (`/api/chat`)

```typescript
// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import Groq from 'groq-sdk'; // or OpenAI, Gemini

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

export async function POST(req: NextRequest) {
  try {
    const { message, customerId, sessionId } = await req.json();

    // Load customer data
    const [systemPrompt, pages] = await Promise.all([
      kv.get<string>(`customer:${customerId}:prompt`),
      kv.get<any[]>(`customer:${customerId}:pages`)
    ]);

    if (!systemPrompt || !pages) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    // Simple retrieval - find relevant pages (MVP approach)
    const relevantPages = findRelevantPages(message, pages);
    
    // Build context from relevant pages
    const context = relevantPages
      .map(p => `[${p.title}](${p.url})\n${p.content}`)
      .join('\n\n---\n\n');

    // Call LLM
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile', // or 'mixtral-8x7b-32768'
      messages: [
        {
          role: 'system',
          content: `${systemPrompt}\n\n## Website Content\n\n${context}`
        },
        { role: 'user', content: message }
      ],
      temperature: 0.7,
      max_tokens: 1024,
      stream: true
    });

    // Stream response
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of completion) {
          const text = chunk.choices[0]?.delta?.content || '';
          controller.enqueue(encoder.encode(text));
        }
        controller.close();
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked'
      }
    });

  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json({ error: 'Chat failed' }, { status: 500 });
  }
}

// Simple keyword-based retrieval (no embeddings for MVP)
function findRelevantPages(query: string, pages: any[]): any[] {
  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\s+/).filter(w => w.length > 2);

  // Score each page
  const scored = pages.map(page => {
    let score = 0;
    
    // Check keywords array
    if (page.keywords) {
      page.keywords.forEach((kw: string) => {
        if (queryWords.some(qw => kw.includes(qw) || qw.includes(kw))) {
          score += 3;
        }
      });
    }
    
    // Check title
    if (queryWords.some(qw => page.title.toLowerCase().includes(qw))) {
      score += 2;
    }
    
    // Check description/content
    if (queryWords.some(qw => page.description?.toLowerCase().includes(qw))) {
      score += 1;
    }

    return { page, score };
  });

  // Return top 5 pages, or all if query is general
  const sorted = scored.sort((a, b) => b.score - a.score);
  
  // If no good matches, return all pages (for general queries)
  if (sorted[0].score === 0) {
    return pages.slice(0, 10); // First 10 pages
  }
  
  return sorted.slice(0, 5).map(s => s.page);
}
```

### Middleware (Domain-Based Routing)

```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  
  // Skip middleware for:
  // - Main forwardslash.chat domain
  // - Demo site (demo.forwardslash.chat)
  // - localhost/dev
  // - API routes
  // - Static assets
  if (
    hostname === 'forwardslash.chat' ||
    hostname === 'www.forwardslash.chat' ||
    hostname === 'demo.forwardslash.chat' ||
    hostname.includes('localhost') ||
    request.nextUrl.pathname.startsWith('/api') ||
    request.nextUrl.pathname.startsWith('/_next')
  ) {
    return NextResponse.next();
  }

  // For any other domain (customer's custom domain like chat.frankgayservices.com)
  // Pass the hostname to the chat route
  const url = request.nextUrl.clone();
  
  // Store hostname in header for chat page to use
  const response = NextResponse.rewrite(new URL('/chat', request.url));
  response.headers.set('x-customer-domain', hostname);
  
  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

### Chat Page (Full-Page Interface)

```typescript
// app/chat/page.tsx
import { kv } from '@vercel/kv';
import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import { ChatInterface } from '@/components/ChatInterface';

export default async function ChatPage() {
  // Get customer domain from middleware header
  const headersList = headers();
  const customerDomain = headersList.get('x-customer-domain');
  
  if (!customerDomain) {
    notFound();
  }

  // Look up customer by their domain
  const customerId = await kv.get<string>(`domain:${customerDomain}`);
  
  if (!customerId) {
    notFound();
  }

  const meta = await kv.get<any>(`customer:${customerId}:meta`);

  return (
    <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <ChatInterface 
        customerId={customerId}
        businessName={meta.business_name}
        primaryColor={meta.primary_color}
        logoUrl={meta.logo_url}
        contactInfo={meta.contact_info}
      />
    </div>
  );
}
```

### Chat Interface Component

```typescript
// components/ChatInterface.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Phone, Mail, Menu } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function ChatInterface({ 
  customerId, 
  businessName,
  primaryColor,
  logoUrl,
  contactInfo
}: any) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `👋 Welcome to ${businessName}! How can I help you today?`
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          customerId,
          conversationHistory: messages.slice(-10)
        })
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          assistantContent += chunk;
          
          // Update last message in real-time
          setMessages(prev => {
            const newMessages = [...prev];
            if (newMessages[newMessages.length - 1]?.role === 'assistant') {
              newMessages[newMessages.length - 1].content = assistantContent;
            } else {
              newMessages.push({ role: 'assistant', content: assistantContent });
            }
            return newMessages;
          });
        }
      }

    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col max-w-4xl mx-auto">
      {/* Header */}
      <header className="px-6 py-4 bg-white shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {logoUrl && <img src={logoUrl} alt="Logo" className="h-10" />}
            <div>
              <h1 className="text-xl font-bold">{businessName}</h1>
              <p className="text-sm text-gray-500">AI Assistant</p>
            </div>
          </div>
          <button
            onClick={() => setShowContact(!showContact)}
            className="p-2 hover:bg-gray-100 rounded"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {showContact && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold mb-2">Contact</h3>
            <div className="space-y-2 text-sm">
              {contactInfo.phone && (
                <a href={`tel:${contactInfo.phone}`} className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  {contactInfo.phone}
                </a>
              )}
              {contactInfo.email && (
                <a href={`mailto:${contactInfo.email}`} className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {contactInfo.email}
                </a>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-6 bg-white">
        <div className="space-y-4 max-w-3xl mx-auto">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user' ? 'text-white' : 'bg-gray-100'
                }`}
                style={msg.role === 'user' ? { backgroundColor: primaryColor } : {}}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-2xl px-4 py-3">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="px-6 py-4 bg-white border-t">
        <div className="max-w-3xl mx-auto flex gap-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type your message..."
            className="flex-1 border rounded-2xl px-4 py-3 focus:outline-none focus:ring-2"
            disabled={isLoading}
          />
          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            style={{ backgroundColor: primaryColor }}
            className="rounded-2xl px-6 py-3 text-white disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
```

## Admin Tool - Create Customer

```typescript
// app/admin/new-customer/page.tsx (protected route)
'use client';

import { useState } from 'react';

export default function NewCustomer() {
  const [url, setUrl] = useState('');
  const [chatDomain, setChatDomain] = useState('');
  const [status, setStatus] = useState('');

  const createCustomer = async () => {
    setStatus('Processing...');
    
    const response = await fetch('/api/admin/create-customer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, chatDomain })
    });

    const data = await response.json();
    setStatus(data.success ? 'Done! Tell customer to add CNAME' : 'Failed');
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Create New Customer</h1>
      
      <div className="space-y-4">
        <div>
          <label className="block font-medium mb-2">Website URL</label>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full border rounded px-4 py-2"
            placeholder="https://frankgayservices.com"
          />
        </div>

        <div>
          <label className="block font-medium mb-2">Chat Domain (their subdomain)</label>
          <input
            value={chatDomain}
            onChange={(e) => setChatDomain(e.target.value)}
            className="w-full border rounded px-4 py-2"
            placeholder="chat.frankgayservices.com"
          />
          <p className="text-sm text-gray-500 mt-1">
            Customer will add: CNAME chat → your-app.vercel.app
          </p>
        </div>

        <button
          onClick={createCustomer}
          className="bg-blue-600 text-white px-6 py-2 rounded"
        >
          Create Customer
        </button>

        {status && <p className="text-sm">{status}</p>}
      </div>
    </div>
  );
}
```

## Seed Script for Frank Gay Services

```typescript
// scripts/seed-frankgay.ts
import { kv } from '@vercel/kv';
import systemPrompt from '../forwardslash-chat/system-prompt.md';
import contentPages from '../forwardslash-chat/content-pages.json';

async function seedFrankGay() {
  const customerId = 'frankgay_001';
  const chatDomain = 'chat.frankgayservices.com'; // Their custom domain

  // 1. Domain mapping
  await kv.set(`domain:${chatDomain}`, customerId);

  // 2. Customer metadata
  await kv.set(`customer:${customerId}:meta`, {
    ...contentPages,
    chat_domain: chatDomain
  });

  // 3. System prompt
  await kv.set(`customer:${customerId}:prompt`, systemPrompt);

  // 4. Content pages
  await kv.set(`customer:${customerId}:pages`, contentPages.pages);

  console.log('✅ Frank Gay Services seeded successfully');
  console.log(`🔗 Chat URL: https://${chatDomain}`);
  console.log(`📋 DNS: Add CNAME record for "chat" pointing to your-app.vercel.app`);
}

seedFrankGay();
```

## Testing Frank Gay Services

### Test Queries

1. **General Info**
   - "What services do you offer?"
   - "Are you available 24/7?"
   - "What areas do you serve?"

2. **AC Issues**
   - "My AC isn't cooling"
   - "How often should I get AC maintenance?"
   - "What are signs I need AC repair?"

3. **Emergency**
   - "My basement is flooding!"
   - "I smell gas"

4. **Pricing**
   - "How much does AC installation cost?"

5. **DIY Questions**
   - "Can I use Drano for my clog?"
   - "Can I install a generator myself?"

### Expected Behaviors

- Always includes phone number (407) 512-8102 in responses
- For emergencies, tells user to call immediately
- Never quotes specific prices, directs to call
- Warns against Drano and DIY generator installation
- Mentions 24/7 availability for emergencies
- Recommends professional help for complex issues

## Production Checklist

- [ ] Seed Frank Gay data to KV
- [ ] Customer adds DNS CNAME: `chat.frankgayservices.com` → `your-app.vercel.app`
- [ ] Add custom domain in Vercel: `chat.frankgayservices.com`
- [ ] Verify SSL certificate provisioned
- [ ] Test domain routing: `https://chat.frankgayservices.com`
- [ ] Verify LLM responses match system prompt tone
- [ ] Test emergency detection
- [ ] Confirm contact info appears consistently
- [ ] Test on mobile (responsive design)
- [ ] Monitor token usage/costs

## DNS Setup (Customer Instructions)

**For Frank Gay Services:**

1. Log into your DNS provider (GoDaddy, Cloudflare, etc.)
2. Add a CNAME record:
   - **Type:** CNAME
   - **Name:** chat (or your chosen subdomain like `ai`, `support`, `assistant`)
   - **Value:** `your-app.vercel.app` (we'll provide this)
   - **TTL:** 3600 (or automatic)
3. Save changes
4. Wait 5-30 minutes for DNS propagation
5. Your chatbot will be live at `https://chat.frankgayservices.com`

**Vercel Setup (Your Side):**

1. In Vercel project settings → Domains
2. Add `chat.frankgayservices.com`
3. Vercel will automatically provision SSL
4. Verify domain is working

## Cost Estimates (Per Month)

**Assuming 1000 messages/month:**
- Groq (llama-3.3-70b): ~$5-10
- Vercel KV storage: $0-5
- Vercel hosting: $20 (Pro plan)

**Total:** ~$25-35/month for 1000 messages
