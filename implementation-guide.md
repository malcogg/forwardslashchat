# Frank Gay Services - ForwardSlash.Chat Implementation Guide

## Overview
This guide provides the technical implementation for integrating Frank Gay Services into your ForwardSlash.Chat multi-tenant chatbot platform.

## Architecture Overview

```
User Message
    ↓
Next.js API Route (/api/chat)
    ↓
Message Classification & Context Retrieval
    ↓
System Prompt + Knowledge Base + User Message
    ↓
Claude API (Anthropic)
    ↓
Response Processing
    ↓
User Interface
```

## Data Storage Strategy

### KV Store Structure (Vercel KV / Upstash Redis)

```typescript
// Company configuration
kv:company:{companyId} → {
  name: string,
  domain: string,
  systemPromptKey: string,
  knowledgeBaseKey: string,
  contactInfo: {...},
  createdAt: timestamp
}

// System prompt
kv:prompt:{companyId} → string (markdown content)

// Knowledge base (structured)
kv:kb:{companyId} → JSON object

// Chat history (optional, for context)
kv:chat:{sessionId}:{messageId} → {
  role: 'user' | 'assistant',
  content: string,
  timestamp: number
}

// Session metadata
kv:session:{sessionId} → {
  companyId: string,
  userId?: string,
  startedAt: number,
  lastActivity: number
}
```

### PostgreSQL Schema (for more complex queries)

```sql
-- Companies table
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  domain VARCHAR(255) UNIQUE NOT NULL,
  website_url TEXT,
  crawl_status VARCHAR(50) DEFAULT 'pending',
  crawl_completed_at TIMESTAMP,
  system_prompt TEXT,
  knowledge_base JSONB,
  contact_info JSONB,
  stripe_customer_id VARCHAR(255),
  subscription_status VARCHAR(50) DEFAULT 'trial',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Chat sessions
CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  visitor_id VARCHAR(255),
  started_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP,
  message_count INTEGER DEFAULT 0,
  metadata JSONB
);

-- Chat messages
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES chat_sessions(id),
  role VARCHAR(20) NOT NULL,
  content TEXT NOT NULL,
  tokens_used INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB
);

-- Crawled content (optional, if storing raw pages)
CREATE TABLE crawled_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  url TEXT NOT NULL,
  title TEXT,
  content TEXT,
  markdown_content TEXT,
  metadata JSONB,
  crawled_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(company_id, url)
);

-- Indexes
CREATE INDEX idx_companies_domain ON companies(domain);
CREATE INDEX idx_chat_sessions_company ON chat_sessions(company_id);
CREATE INDEX idx_chat_messages_session ON chat_messages(session_id);
CREATE INDEX idx_crawled_pages_company ON crawled_pages(company_id);
```

## API Implementation

### Chat API Route (`/api/chat`)

```typescript
// app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { kv } from '@vercel/kv';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function POST(req: NextRequest) {
  try {
    const { 
      message, 
      companyId, 
      sessionId,
      conversationHistory = [] 
    } = await req.json();

    // Validate input
    if (!message || !companyId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Fetch company data
    const [systemPrompt, knowledgeBase, companyInfo] = await Promise.all([
      kv.get(`kv:prompt:${companyId}`),
      kv.get(`kv:kb:${companyId}`),
      kv.get(`kv:company:${companyId}`)
    ]);

    if (!systemPrompt || !companyInfo) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      );
    }

    // Check for emergency keywords
    const isEmergency = detectEmergency(message, knowledgeBase);

    // Build messages array
    const messages = [
      ...conversationHistory.slice(-10), // Last 10 messages for context
      { role: 'user', content: message }
    ];

    // Call Claude API
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: buildSystemPrompt(systemPrompt, knowledgeBase, isEmergency),
      messages: messages as any,
    });

    const assistantMessage = response.content[0].text;

    // Store message in KV (optional)
    if (sessionId) {
      await storeMessage(sessionId, 'user', message);
      await storeMessage(sessionId, 'assistant', assistantMessage);
    }

    // Track usage (for billing)
    await trackUsage(companyId, response.usage);

    return NextResponse.json({
      message: assistantMessage,
      sessionId: sessionId || generateSessionId(),
      isEmergency,
      usage: response.usage
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper functions
function buildSystemPrompt(
  basePrompt: string, 
  knowledgeBase: any,
  isEmergency: boolean
): string {
  let prompt = basePrompt;
  
  if (isEmergency) {
    prompt = `🚨 EMERGENCY SITUATION DETECTED 🚨
The user may be experiencing an urgent issue. Prioritize immediate contact information and safety.

${prompt}`;
  }

  // Inject relevant KB sections
  prompt += `\n\n## Available Knowledge\n${JSON.stringify(knowledgeBase, null, 2)}`;
  
  return prompt;
}

function detectEmergency(message: string, kb: any): boolean {
  const emergencyKeywords = kb?.emergency_keywords || [];
  const lowerMessage = message.toLowerCase();
  
  return emergencyKeywords.some((keyword: string) => 
    lowerMessage.includes(keyword.toLowerCase())
  );
}

async function storeMessage(
  sessionId: string, 
  role: string, 
  content: string
) {
  const messageId = crypto.randomUUID();
  await kv.set(
    `kv:chat:${sessionId}:${messageId}`,
    { role, content, timestamp: Date.now() },
    { ex: 86400 * 7 } // 7 days TTL
  );
}

function generateSessionId(): string {
  return `session_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
}

async function trackUsage(companyId: string, usage: any) {
  const key = `usage:${companyId}:${new Date().toISOString().split('T')[0]}`;
  await kv.incrby(`${key}:input_tokens`, usage.input_tokens);
  await kv.incrby(`${key}:output_tokens`, usage.output_tokens);
}
```

### Company Setup API Route (`/api/companies/setup`)

```typescript
// app/api/companies/setup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import FirecrawlApp from '@mendable/firecrawl-js';

const firecrawl = new FirecrawlApp({
  apiKey: process.env.FIRECRAWL_API_KEY!
});

export async function POST(req: NextRequest) {
  try {
    const { 
      companyName,
      websiteUrl,
      contactEmail,
      contactPhone 
    } = await req.json();

    // Generate company ID
    const companyId = crypto.randomUUID();
    
    // Start crawl (async)
    const crawlJob = await firecrawl.crawlUrl(websiteUrl, {
      limit: 50,
      scrapeOptions: {
        formats: ['markdown', 'html']
      }
    });

    // Store initial company data
    await kv.set(`kv:company:${companyId}`, {
      name: companyName,
      domain: new URL(websiteUrl).hostname,
      website: websiteUrl,
      contactInfo: {
        email: contactEmail,
        phone: contactPhone
      },
      crawlJobId: crawlJob.id,
      crawlStatus: 'processing',
      createdAt: Date.now()
    });

    return NextResponse.json({
      companyId,
      crawlJobId: crawlJob.id,
      status: 'processing'
    });

  } catch (error) {
    console.error('Setup error:', error);
    return NextResponse.json(
      { error: 'Setup failed' },
      { status: 500 }
    );
  }
}
```

### Crawl Processing Webhook (`/api/webhooks/firecrawl`)

```typescript
// app/api/webhooks/firecrawl/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export async function POST(req: NextRequest) {
  try {
    const { jobId, status, data } = await req.json();

    if (status !== 'completed') {
      return NextResponse.json({ received: true });
    }

    // Find company by crawl job ID
    const companies = await kv.keys('kv:company:*');
    let companyId: string | null = null;
    
    for (const key of companies) {
      const company = await kv.get(key);
      if (company?.crawlJobId === jobId) {
        companyId = key.split(':')[2];
        break;
      }
    }

    if (!companyId) {
      console.error('Company not found for job:', jobId);
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Process crawled data
    const pages = data.data || [];
    const combinedContent = pages
      .map((page: any) => page.markdown || page.content)
      .join('\n\n---\n\n');

    // Generate knowledge base using Claude
    const knowledgeBase = await generateKnowledgeBase(combinedContent);
    
    // Generate system prompt
    const systemPrompt = await generateSystemPrompt(knowledgeBase);

    // Store results
    await kv.set(`kv:kb:${companyId}`, knowledgeBase);
    await kv.set(`kv:prompt:${companyId}`, systemPrompt);
    
    // Update company status
    const company = await kv.get(`kv:company:${companyId}`);
    await kv.set(`kv:company:${companyId}`, {
      ...company,
      crawlStatus: 'completed',
      crawlCompletedAt: Date.now()
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Processing failed' },
      { status: 500 }
    );
  }
}

async function generateKnowledgeBase(content: string) {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: `You are a data extraction expert. Extract structured information from the provided website content to create a knowledge base for a customer service chatbot.

Extract:
1. Company overview (name, founded, location, values)
2. Services offered (with descriptions)
3. Contact information
4. FAQs
5. Pricing info (if available)
6. Service areas
7. Emergency procedures

Output as valid JSON with clear structure.`,
    messages: [{
      role: 'user',
      content: `Extract structured knowledge base from this content:\n\n${content.slice(0, 100000)}`
    }]
  });

  const jsonMatch = response.content[0].text.match(/\{[\s\S]*\}/);
  return jsonMatch ? JSON.parse(jsonMatch[0]) : {};
}

async function generateSystemPrompt(knowledgeBase: any): Promise<string> {
  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    system: `You are a prompt engineering expert. Create a comprehensive system prompt for a customer service chatbot based on the provided knowledge base.

The prompt should define:
1. Role and purpose
2. Tone and communication style
3. What the bot can and cannot do
4. How to handle emergencies
5. Key information to always include
6. Response templates

Make it clear, actionable, and specific.`,
    messages: [{
      role: 'user',
      content: `Create system prompt for this company:\n\n${JSON.stringify(knowledgeBase, null, 2)}`
    }]
  });

  return response.content[0].text;
}
```

## Frontend Chat Widget

### React Component

```typescript
// components/ChatWidget.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, X, MessageCircle } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatWidgetProps {
  companyId: string;
  position?: 'bottom-right' | 'bottom-left';
  primaryColor?: string;
}

export function ChatWidget({ 
  companyId, 
  position = 'bottom-right',
  primaryColor = '#3B82F6' 
}: ChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
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
          companyId,
          sessionId,
          conversationHistory: messages
        })
      });

      const data = await response.json();
      
      if (!sessionId) {
        setSessionId(data.sessionId);
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: data.message
      };
      
      setMessages(prev => [...prev, assistantMessage]);

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

  const positionClass = position === 'bottom-right' 
    ? 'bottom-4 right-4' 
    : 'bottom-4 left-4';

  return (
    <div className={`fixed ${positionClass} z-50`}>
      {/* Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{ backgroundColor: primaryColor }}
          className="rounded-full p-4 shadow-lg hover:scale-110 transition-transform"
        >
          <MessageCircle className="w-6 h-6 text-white" />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="bg-white rounded-lg shadow-2xl w-[380px] h-[600px] flex flex-col">
          {/* Header */}
          <div 
            style={{ backgroundColor: primaryColor }}
            className="p-4 rounded-t-lg flex justify-between items-center"
          >
            <h3 className="text-white font-semibold">Chat with us</h3>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-white/20 rounded p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 mt-8">
                <p>👋 Hi! How can I help you today?</p>
              </div>
            )}
            
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    msg.role === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg p-3">
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

          {/* Input */}
          <div className="p-4 border-t">
            <div className="flex space-x-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type your message..."
                className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              />
              <button
                onClick={sendMessage}
                disabled={isLoading || !input.trim()}
                style={{ backgroundColor: primaryColor }}
                className="rounded-lg px-4 py-2 text-white disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
```

### Embed Script (for customers)

```html
<!-- Embed in customer website -->
<script>
  (function() {
    const script = document.createElement('script');
    script.src = 'https://forwardslash.chat/widget.js';
    script.dataset.companyId = 'YOUR_COMPANY_ID';
    script.dataset.primaryColor = '#3B82F6';
    script.dataset.position = 'bottom-right';
    document.body.appendChild(script);
  })();
</script>
```

## Environment Variables

```bash
# .env.local
ANTHROPIC_API_KEY=sk-ant-xxx
FIRECRAWL_API_KEY=fc-xxx
KV_URL=redis://xxx
KV_REST_API_URL=https://xxx
KV_REST_API_TOKEN=xxx
DATABASE_URL=postgresql://xxx
STRIPE_SECRET_KEY=sk_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
NEXT_PUBLIC_APP_URL=https://forwardslash.chat
```

## Deployment Checklist

- [ ] Set up Vercel KV or Upstash Redis
- [ ] Configure Anthropic API key
- [ ] Set up Firecrawl account and webhook
- [ ] Configure Stripe for payments
- [ ] Set up PostgreSQL (Vercel Postgres or Neon)
- [ ] Deploy Next.js app to Vercel
- [ ] Test chat widget embed
- [ ] Monitor API usage and costs
- [ ] Set up error tracking (Sentry)
- [ ] Configure rate limiting

## Cost Optimization

1. **Token Management**
   - Limit conversation history to last 10 messages
   - Compress knowledge base for system prompt
   - Use Claude Haiku for simple queries (future)

2. **Caching**
   - Cache system prompts (change rarely)
   - Cache knowledge base lookups
   - Use Redis for session data

3. **Rate Limiting**
   - Limit messages per session
   - Implement cooldown periods
   - Track usage per company

## Monitoring

```typescript
// Track key metrics
- Messages per day
- Average response time
- Token usage per company
- Error rates
- Customer satisfaction (optional feedback)
```

## Next Steps

1. Implement Frank Gay Services as first test customer
2. Test with real scenarios from sample-conversations.md
3. Refine system prompt based on response quality
4. Add analytics dashboard for customers
5. Build customer self-service portal
6. Expand to multiple companies
