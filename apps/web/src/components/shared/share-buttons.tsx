"use client";

import { useState } from "react";
import { Facebook, Link2, MessageCircle, Twitter } from "lucide-react";

import { Button } from "@/components/ui/button";

interface ShareButtonsProps {
  url: string;
  title: string;
}

export function ShareButtons({ url, title }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex items-center gap-2">
      <Button asChild variant="outline" size="icon" aria-label="Share on WhatsApp">
        <a
          href={`https://wa.me/?text=${encodedTitle}%20${encodedUrl}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <MessageCircle className="size-4" />
        </a>
      </Button>
      <Button asChild variant="outline" size="icon" aria-label="Share on X/Twitter">
        <a
          href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Twitter className="size-4" />
        </a>
      </Button>
      <Button asChild variant="outline" size="icon" aria-label="Share on Facebook">
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Facebook className="size-4" />
        </a>
      </Button>
      <Button
        type="button"
        variant="outline"
        size="icon"
        aria-label="Copy link"
        onClick={handleCopy}
      >
        <Link2 className="size-4" />
      </Button>
      {copied ? <span className="text-xs text-muted-foreground">Link copied!</span> : null}
    </div>
  );
}
