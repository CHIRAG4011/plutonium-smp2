import { useState, useEffect, useMemo } from "react";
import { useGetStoreItems } from "@workspace/api-client-react";
import { useCart } from "@/lib/cart";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  ShoppingCart, Check, DollarSign, Search, Package, Sword, Key, Sparkles,
  Zap, Box, Leaf, Shield, SlidersHorizontal, X, Star,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Link } from "wouter";

const BUILTIN_CATEGORIES = [
  { value: "all",         label: "All Items",   icon: Package },
  { value: "ranks",       label: "Ranks",       icon: Sword },
  { value: "crate_keys",  label: "Crate Keys",  icon: Key },
  { value: "cosmetics",   label: "Cosmetics",   icon: Sparkles },
  { value: "coins",       label: "Coins",       icon: DollarSign },
  { value: "boosts",      label: "Boosts",      icon: Zap },
  { value: "bundles",     label: "Bundles",     icon: Box },
  { value: "seasonal",    label: "Seasonal",    icon: Leaf },
  { value: "permissions", label: "Permissions", icon: Shield },
];

function authFetch(path: string) {
  return fetch(`${window.location.origin}/api${path}`);
}

export default function Store() {
  const [category, setCategory] = useState<string>("all");
  const [search, setSearch] = useState<string>("");
  const [debouncedSearch, setDebouncedSearch] = useState<string>("");
  const [currency, setCurrency] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("featured");
  const [customCats, setCustomCats] = useState<any[]>([]);
  const { count } = useCart();
  const { user } = useAuth();
  const { addItem } = useCart();
  const { toast } = useToast();

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    authFetch("/admin/store-categories")
      .then(r => r.ok ? r.json() : [])
      .then(data => setCustomCats(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const allCategories = useMemo(() => [
    ...BUILTIN_CATEGORIES,
    ...customCats.filter(c => c.isActive).map(c => ({
      value: c.value,
      label: c.name,
      icon: Package,
    })),
  ], [customCats]);

  const params: any = {};
  if (category !== "all") params.category = category;
  if (debouncedSearch.trim()) params.search = debouncedSearch.trim();

  const { data: rawItems, isLoading } = useGetStoreItems(
    Object.keys(params).length ? params : undefined
  );

  const items = useMemo(() => {
    if (!rawItems) return [];
    let filtered = rawItems.filter(item => {
      if (currency === "usd") return item.currency === "usd";
      if (currency === "owo") return item.currency === "owo";
      return true;
    });
    switch (sortBy) {
      case "price_asc":  return [...filtered].sort((a, b) => a.price - b.price);
      case "price_desc": return [...filtered].sort((a, b) => b.price - a.price);
      case "newest":     return [...filtered].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      case "name":       return [...filtered].sort((a, b) => a.name.localeCompare(b.name));
      case "featured":
      default:           return [...filtered].sort((a, b) => {
        if (a.isFeatured === b.isFeatured) return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
        return a.isFeatured ? -1 : 1;
      });
    }
  }, [rawItems, currency, sortBy]);

  const hasFilters = search || currency !== "all" || sortBy !== "featured";

  const handleAddToCart = (item: any, e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ title: "Login required", description: "Please log in to add items to your cart.", variant: "destructive" });
      return;
    }
    addItem(item);
    toast({ title: "Added to cart!", description: `${item.name} has been added to your cart.` });
  };

  const clearFilters = () => {
    setSearch("");
    setCurrency("all");
    setSortBy("featured");
    setCategory("all");
  };

  return (
    <div className="min-h-screen pb-24">
      <div className="relative py-20 border-b border-border/50 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={`${import.meta.env.BASE_URL}images/store-bg.png`}
            alt="Store Background"
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 text-center">
          <h1 className="font-display text-5xl md:text-6xl font-black mb-4 uppercase tracking-tight">
            Server <span className="text-primary">Store</span>
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-6">
            Support the server and get exclusive perks. Purchases help keep the server running lag-free!
          </p>
          {count > 0 && (
            <Link href="/cart">
              <Button className="bg-primary text-primary-foreground neon-glow-hover font-bold gap-2">
                <ShoppingCart className="w-4 h-4" />
                View Cart ({count})
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-10">
        {/* Search + sort + currency row */}
        <div className="flex flex-wrap gap-3 mb-6 items-center">
          <div className="relative flex-1 min-w-60 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search items..."
              className="pl-10 bg-card border-border h-10"
            />
          </div>
          <div className="flex gap-2 items-center ml-auto flex-wrap">
            <SlidersHorizontal className="w-4 h-4 text-muted-foreground hidden sm:block" />
            <Select value={currency} onValueChange={setCurrency}>
              <SelectTrigger className="w-36 h-10 bg-card border-border">
                <SelectValue placeholder="Currency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Currencies</SelectItem>
                <SelectItem value="usd">
                  <span className="flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-green-500" /> USD ($)
                  </span>
                </SelectItem>
                <SelectItem value="owo">
                  <span className="flex items-center gap-1.5">
                    <Star className="w-3.5 h-3.5 text-yellow-400" /> OWO Coins
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-44 h-10 bg-card border-border">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="featured">Featured First</SelectItem>
                <SelectItem value="price_asc">Price: Low to High</SelectItem>
                <SelectItem value="price_desc">Price: High to Low</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="name">Name (A-Z)</SelectItem>
              </SelectContent>
            </Select>
            {hasFilters && (
              <Button variant="ghost" size="sm" className="h-10 text-muted-foreground hover:text-foreground" onClick={clearFilters}>
                <X className="w-3.5 h-3.5 mr-1.5" /> Clear
              </Button>
            )}
          </div>
        </div>

        {/* Category tabs */}
        <div className="flex flex-wrap gap-2 mb-8">
          {allCategories.map(cat => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.value}
                onClick={() => setCategory(cat.value)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                  category === cat.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* Results count */}
        {!isLoading && (
          <p className="text-sm text-muted-foreground mb-4">
            {items.length} {items.length === 1 ? "item" : "items"}
            {category !== "all" && ` in ${allCategories.find(c => c.value === category)?.label}`}
            {search && ` matching "${search}"`}
          </p>
        )}

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="h-96 rounded-2xl bg-card animate-pulse" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="py-24 text-center">
            <Package className="w-16 h-16 text-muted-foreground/20 mx-auto mb-4" />
            <p className="text-xl font-medium mb-2">No items found</p>
            <p className="text-muted-foreground mb-4">Try a different category, search term, or filter.</p>
            {hasFilters && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <X className="w-3.5 h-3.5 mr-1.5" /> Clear filters
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {items.map((item, i) => (
              <Link key={item.id} href={`/store/${item.id}`}>
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className="relative flex flex-col bg-card rounded-2xl border border-border hover:border-primary/60 overflow-hidden group transition-all cursor-pointer h-full"
                >
                  {item.isFeatured && (
                    <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-xl z-10">
                      FEATURED
                    </div>
                  )}

                  <div className="h-48 bg-background relative flex items-center justify-center p-6 border-b border-border overflow-hidden">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.name} className="max-h-full object-contain drop-shadow-xl group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-border/50 flex items-center justify-center">
                        <ShoppingCart className="w-10 h-10 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  <div className="p-5 flex flex-col flex-grow">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">{item.name}</h3>
                      {item.badge && (
                        <Badge variant="outline" className="text-xs shrink-0 text-primary border-primary/40">
                          {item.badge}
                        </Badge>
                      )}
                    </div>

                    <p className="text-sm text-muted-foreground mb-4 flex-grow line-clamp-2">{item.description}</p>

                    {item.features && item.features.length > 0 && (
                      <ul className="space-y-1 mb-4">
                        {item.features.slice(0, 3).map((feat, idx) => (
                          <li key={idx} className="flex items-start text-xs text-muted-foreground">
                            <Check className="w-3.5 h-3.5 text-primary mr-2 flex-shrink-0 mt-0.5" />
                            <span className="line-clamp-1">{feat}</span>
                          </li>
                        ))}
                        {item.features.length > 3 && (
                          <li className="text-xs text-muted-foreground ml-5">+{item.features.length - 3} more...</li>
                        )}
                      </ul>
                    )}

                    <div className="pt-4 border-t border-border mt-auto flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1 font-bold text-xl">
                        {item.currency === "usd" ? (
                          <>
                            <DollarSign className="w-4 h-4 text-green-500" />
                            <span>{(item.price / 100).toFixed(2)}</span>
                          </>
                        ) : (
                          <span className="text-yellow-400">{item.price} OWO</span>
                        )}
                      </div>
                      <Button
                        onClick={(e) => handleAddToCart(item, e)}
                        size="sm"
                        className="bg-primary/20 text-primary hover:bg-primary hover:text-primary-foreground transition-colors gap-1.5"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        Add
                      </Button>
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
