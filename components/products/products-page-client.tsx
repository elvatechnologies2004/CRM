"use client";

import { useEffect, useMemo, useState } from "react";

import { Plus, ChevronDown } from "lucide-react";
import { PenLine } from "lucide-react";

import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

import { Skeleton } from "@/components/ui/skeleton";
import { Toast } from "@/components/crm/toast";
import { ModuleHeader } from "@/components/crm/module-header";
import { StatGrid } from "@/components/crm/stat-grid";
import { PanelCard } from "@/components/crm/panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusBadge } from "@/components/crm/status-badges";
import { productTypes, productStatusLabel } from "@/lib/mock-products";
import { uid } from "@/lib/activity-local";
import type { CrmProduct, ProductType } from "@/lib/types";

interface ProductsPageClientProps {
  initialProducts: CrmProduct[];
}

function ProductsSkeleton() {
  return (
    <div className="space-y-4">
      <div>
        <Skeleton className="h-7 w-32" />
        <Skeleton className="mt-2 h-4 w-64" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        {[1, 2, 3, 4, 5].map((n) => (
          <Skeleton key={n} className="h-[76px]" />
        ))}
      </div>
      <Skeleton className="h-[280px]" />
    </div>
  );
}

function ProductCard({ product, onEdit, onDelete }: { product: CrmProduct; onEdit: (product: CrmProduct) => void; onDelete: (id: string) => void }) {
  const typeLabel = product.type === "Product" ? "Product" : product.type === "Service" ? "Service" : "Subscription";
  return (
    <PanelCard className="p-4">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <p className="font-medium text-ink truncate">{product.name}</p>
          <StatusBadge status={product.status} />
        </div>
        <p className="text-xs text-muted-foreground">{product.sku}</p>
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-primary">{typeLabel}</span>
          <Badge variant="outline" className="text-[10px]">{productStatusLabel(product.status)}</Badge>
        </div>
        <p className="text-xl font-semibold tabular-nums text-ink">${product.unitPrice.toLocaleString()}</p>
        <Button
          size="icon-sm"
          variant="ghost"
          title="Edit"
          aria-label="Edit product"
          onClick={() => onEdit(product)}
        >
          <PenLine className="h-3.5 w-3.5" />
        </Button>
        <Button
          size="icon-sm"
          variant="destructive"
          title="Delete"
          aria-label="Delete product"
          onClick={() => onDelete(product.id)}
        >
          <span className="text-danger">×</span>
        </Button>
      </div>
    </PanelCard>
  );
}

interface AddProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (product: CrmProduct) => void;
}

function AddProductDialog({ open, onOpenChange, onSubmit }: AddProductDialogProps) {
  const [form, setForm] = useState<Omit<CrmProduct, "id" | "currency" | "taxRate" | "createdAt">>({
    name: "",
    sku: "",
    type: "Product" as ProductType,
    unitPrice: 0,
    category: "",
    status: "Active",
  });
  const [error, setError] = useState<string | null>(null);
  const [prevOpen, setPrevOpen] = useState(open);

  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setForm({
        name: "",
        sku: "",
        type: "Product" as ProductType,
        unitPrice: 0,
        category: "",
        status: "Active",
      });
      setError(null);
    }
  }

  const update = (patch: Partial<Omit<CrmProduct, "id" | "currency" | "taxRate" | "createdAt">>) =>
    setForm((prev) => ({ ...prev, ...patch }));

  const handleSubmit = () => {
    if (!form.name.trim()) {
      setError("Product name is required.");
      return;
    }
    if (!form.sku.trim()) {
      setError("SKU is required.");
      return;
    }
    setError(null);
    onSubmit({
      id: uid("pr"),
      name: form.name.trim(),
      sku: form.sku.trim(),
      type: form.type,
      unitPrice: Number(form.unitPrice) || 0,
      category: form.category,
      status: form.status,
      currency: "PKR",
      taxRate: 0,
      createdAt: new Date().toISOString(),
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{open ? "Add Product" : "Edit Product"}</DialogTitle>
          <DialogDescription>Add a new product or service to the catalog.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="product-name">Name <span className="text-danger">*</span></Label>
            <Input
              id="product-name"
              value={form.name}
              onChange={(event) => update({ name: event.target.value })}
              placeholder="Enterprise Automation Suite"
              autoFocus
            />
            {error && <p className="text-xs text-danger">{error}</p>}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="product-sku">SKU <span className="text-danger">*</span></Label>
              <Input
                id="product-sku"
                value={form.sku}
                onChange={(event) => update({ sku: event.target.value })}
                placeholder="ENT-AUTO-001"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select
                value={form.type}
                onValueChange={(value) => update({ type: value as ProductType })}
              >
                <SelectTrigger aria-label="Product type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {productTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="product-unit-price">Unit Price</Label>
              <Input
                id="product-unit-price"
                type="number"
                min={0}
                value={form.unitPrice}
                onChange={(event) => update({ unitPrice: Number(event.target.value) })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Input
                id="product-category"
                value={form.category}
                onChange={(event) => update({ category: event.target.value })}
                placeholder="Software / Implementation / Support"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Status</Label>
            <div className="flex items-center rounded-md border border-input bg-card px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50">
              <span className="select-none text-foreground">{form.status}</span>
              <ChevronDown className="ml-2 h-4 w-4 opacity-50" aria-hidden />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit}>
            {open ? "Add Product" : "Save Product"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

interface ProductsPageClientProps {
  initialProducts: CrmProduct[];
}

function ProductsPageClient({ initialProducts }: ProductsPageClientProps) {
  const [products, setProducts] = useState(initialProducts);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<CrmProduct | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => setLoading(false), 450);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      setProducts(initialProducts);
    }, 0);
    return () => window.clearTimeout(id);
  }, [initialProducts]);

  const filtered = useMemo(() => {
    let result = [...products];
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.sku?.toLowerCase().includes(q) ?? false) ||
          (p.category?.toLowerCase().includes(q) ?? false)
      );
    }
    return result.sort((a, b) => a.name.localeCompare(b.name));
  }, [products, query]);

  const handleDelete = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    setToast("Product deleted");
  };

  const handleAdd = (product: CrmProduct) => {
    setProducts((prev) => [product, ...prev]);
    setToast("Product added");
    setOpenDialog(false);
  };

  const handleEdit = (product: CrmProduct) => {
    setEditingProduct(product);
    setOpenDialog(true);
  };

  if (loading) return <ProductsSkeleton />;

  return (
    <div className="space-y-4">
      <ModuleHeader
        title="Products & Services"
        subtitle="Catalog of products, subscriptions and one-off services."
        actions={[
          { label: "Add Product", onClick: () => setOpenDialog(true), icon: <Plus /> },
        ]}
      />

      <StatGrid
        stats={[
          { label: "Active", value: products.filter((p) => p.status === "Active").length, tone: "success" },
          { label: "Total", value: products.length, tone: "info" },
        ]}
      />

      <PanelCard className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Input
            className="h-9 max-w-[280px]"
            placeholder="Search products..."
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((product) => <ProductCard key={product.id} product={product} onEdit={handleEdit} onDelete={handleDelete} />)}
          {filtered.length === 0 && (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No products match your filters.
            </p>
          )}
        </div>
      </PanelCard>

      <AddProductDialog
        open={openDialog}
        onOpenChange={setOpenDialog}
        onSubmit={(product) => editingProduct ? handleEdit(product) : handleAdd(product)}
      />

      <Toast message={toast} />
    </div>
  );
}

export { ProductsPageClient };