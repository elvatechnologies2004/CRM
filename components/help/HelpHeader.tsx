"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface HelpHeaderProps {
  onSearch?: (query: string) => void;
}

export function HelpHeader({ onSearch }: HelpHeaderProps = {}) {
  const [query, setQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(query);
    setQuery("");
  };

  return (
    <form onSubmit={handleSearch} className="flex items-center gap-2">
      <Input
        placeholder="Search for help, features, guides, or common questions..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="flex-1"
      />
      <Button type="submit" className="hidden sm:block">
        <Search className="h-4 w-4" />
      </Button>
    </form>
  );
}