/** Card block types for rich chat messages (product, blog, tip) */

export type ProductCardBlock = {
  type: "product";
  id?: string;
  title: string;
  price?: string;
  imageUrl?: string;
  productUrl?: string;
  description?: string;
};

export type BlogCardBlock = {
  type: "blog";
  id?: string;
  title: string;
  excerpt?: string;
  imageUrl?: string;
  url?: string;
  date?: string;
};

export type TipCardBlock = {
  type: "tip";
  id?: string;
  title: string;
  body?: string;
  icon?: string;
  url?: string;
};

export type ChatCardBlock = ProductCardBlock | BlogCardBlock | TipCardBlock;
