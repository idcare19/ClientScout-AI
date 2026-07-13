import { ExternalLink, Phone, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

function phoneHref(value: string) {
  return `tel:${value.replace(/[^\d+]/g, "")}`;
}

function whatsappHref(value: string) {
  return `https://wa.me/${value.replace(/[^\d]/g, "")}`;
}

export function ExternalContactLinks({
  website,
  email,
  phone,
  whatsapp,
}: {
  website?: string | null;
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {website ? (
        <Button asChild variant="outline" size="sm">
          <a href={website} target="_blank" rel="noopener noreferrer">
            Website
            <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
      ) : null}
      {email ? (
        <Button asChild variant="outline" size="sm">
          <a href={`mailto:${email}`}>
            Email
            <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
      ) : null}
      {phone ? (
        <Button asChild variant="outline" size="sm">
          <a href={phoneHref(phone)}>
            <Phone className="h-4 w-4" />
            Call
          </a>
        </Button>
      ) : null}
      {whatsapp ? (
        <Button asChild variant="outline" size="sm">
          <a href={whatsappHref(whatsapp)} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </a>
        </Button>
      ) : null}
    </div>
  );
}
