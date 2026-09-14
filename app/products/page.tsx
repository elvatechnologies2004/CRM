import { ProductsPageClient } from "@/components/products/products-page-client";
import { productMocks } from "@/lib/mock-products";

export default function ProductsPage() {
  return <ProductsPageClient initialProducts={productMocks} />;
}