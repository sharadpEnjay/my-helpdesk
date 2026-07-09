import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

interface BackButtonProps {
  to: string;
  label: string;
}

export function BackButton({ to, label }: BackButtonProps) {
  return (
    <Button variant="ghost" size="sm" asChild className="text-slate-400 hover:text-white -ml-2 mb-4">
      <Link to={to}>
        <ArrowLeft className="h-4 w-4 mr-1" />
        {label}
      </Link>
    </Button>
  );
}
