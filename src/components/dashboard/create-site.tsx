"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Entry point to the site-creation wizard (/dashboard/sites/new). */
export function CreateSiteButton() {
  return (
    <Link href="/dashboard/sites/new">
      <Button className="gap-2">
        <Plus className="size-4" /> موقع جديد
      </Button>
    </Link>
  );
}
