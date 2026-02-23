import { NextResponse } from "next/server";
import { db } from "@/db";
import { customerProducts, customerBlogPosts, customers } from "@/db/schema";
import { eq, asc } from "drizzle-orm";
import type { ChatCardBlock, ProductCardBlock, BlogCardBlock } from "@/components/chat/chat-types";

/**
 * POST /api/chat/extract-blocks
 * Body: { customerId: string, messageContent: string }
 * Returns product + blog card blocks for the customer (for rich chat UI).
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { customerId, messageContent } = body as {
      customerId?: string;
      messageContent?: string;
    };

    if (!customerId || typeof messageContent !== "string") {
      return NextResponse.json(
        { error: "customerId and messageContent required" },
        { status: 400 }
      );
    }

    if (!db) {
      return NextResponse.json({ blocks: [] });
    }

    const [customer] = await db.select().from(customers).where(eq(customers.id, customerId));
    if (!customer) {
      return NextResponse.json({ blocks: [] });
    }

    const products = await db
      .select()
      .from(customerProducts)
      .where(eq(customerProducts.customerId, customerId))
      .orderBy(asc(customerProducts.sortOrder), asc(customerProducts.createdAt))
      .limit(5);

    const posts = await db
      .select()
      .from(customerBlogPosts)
      .where(eq(customerBlogPosts.customerId, customerId))
      .orderBy(asc(customerBlogPosts.sortOrder), asc(customerBlogPosts.createdAt))
      .limit(5);

    const blocks: ChatCardBlock[] = [];

    for (const p of products) {
      blocks.push({
        type: "product",
        id: p.id,
        title: p.title,
        price: p.price ?? undefined,
        imageUrl: p.imageUrl ?? undefined,
        productUrl: p.productUrl ?? undefined,
        description: p.description ?? undefined,
      } satisfies ProductCardBlock);
    }

    for (const b of posts) {
      blocks.push({
        type: "blog",
        id: b.id,
        title: b.title,
        excerpt: b.excerpt ?? undefined,
        imageUrl: b.imageUrl ?? undefined,
        url: b.url ?? undefined,
        date: b.date ?? undefined,
      } satisfies BlogCardBlock);
    }

    return NextResponse.json({ blocks });
  } catch (e) {
    console.error("[extract-blocks]", e);
    return NextResponse.json({ blocks: [] });
  }
}
