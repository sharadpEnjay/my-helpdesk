import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface BackButtonProps {
  to: string;
  label: string;
}

export function BackButton({ to, label }: BackButtonProps) {
  return (
    <Button variant="ghost" size="sm" asChild className="-ml-2 mb-4 text-muted-foreground hover:text-foreground">
      <Link to={to}>
        <ArrowLeft className="size-4" />
        {label}
      </Link>
    </Button>
  );
}
