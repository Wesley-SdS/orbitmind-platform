import Link from "next/link";
import { notFound } from "next/navigation";
import { Clock, Inbox, Mail, MessageCircle, Wallet } from "lucide-react";
import { QUOTE_STATUSES, type QuoteStatus } from "@orbitmind/shared";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ENGAGEMENT_OPTIONS,
  MONTHLY_BUDGET_OPTIONS,
  PROJECT_BUDGET_OPTIONS,
  SOLUTION_OPTIONS,
  TIMELINE_OPTIONS,
} from "@/components/landing/data";
import { QuoteStatusSelect } from "@/components/quotes/quote-status-select";
import { QUOTE_STATUS_DOT, QUOTE_STATUS_LABELS } from "@/components/quotes/status";
import { getRequiredSession } from "@/lib/auth/session";
import { isPlatformAdmin } from "@/lib/auth/platform-admin";
import { countQuoteRequestsByStatus, listQuoteRequests } from "@/lib/db/queries";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const ENGAGEMENT_LABELS = new Map<string, string>(ENGAGEMENT_OPTIONS.map((o) => [o.value, o.title]));
const SOLUTION_LABELS = new Map<string, string>(SOLUTION_OPTIONS.map((o) => [o.value, o.label]));
const TIMELINE_LABELS = new Map<string, string>(TIMELINE_OPTIONS.map((o) => [o.value, o.label]));
const BUDGET_LABELS = new Map<string, string>(
  [...PROJECT_BUDGET_OPTIONS, ...MONTHLY_BUDGET_OPTIONS].map((o) => [o.value, o.label]),
);

const dateFormatter = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

function whatsappLink(phone: string): string {
  return `https://wa.me/${phone.replace(/\D/g, "")}`;
}

export default async function QuoteRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const session = await getRequiredSession();
  if (!isPlatformAdmin(session.user.email)) notFound();

  const { status: rawStatus } = await searchParams;
  const activeStatus = QUOTE_STATUSES.find((status) => status === rawStatus);

  const [requests, counts] = await Promise.all([
    listQuoteRequests(activeStatus),
    countQuoteRequestsByStatus(),
  ]);
  const totals = new Map<QuoteStatus, number>(counts.map((row) => [row.status, row.total]));
  const total = counts.reduce((sum, row) => sum + row.total, 0);

  const filters: { label: string; href: string; count: number; active: boolean; status?: QuoteStatus }[] = [
    { label: "Todos", href: "/orcamentos", count: total, active: !activeStatus },
    ...QUOTE_STATUSES.map((status) => ({
      label: QUOTE_STATUS_LABELS[status],
      href: `/orcamentos?status=${status}`,
      count: totals.get(status) ?? 0,
      active: activeStatus === status,
      status,
    })),
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Orçamentos</h1>
        <p className="text-muted-foreground">
          Pedidos recebidos pelo site. Visível apenas para a equipe OrbitMind.
        </p>
      </div>

      <nav aria-label="Filtrar por status" className="flex flex-wrap gap-2">
        {filters.map((filter) => (
          <Link
            key={filter.href}
            href={filter.href}
            aria-current={filter.active ? "page" : undefined}
            className={cn(
              "inline-flex h-9 items-center gap-2 rounded-full border px-3.5 text-sm transition-colors",
              filter.active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            {filter.status && (
              <span className={cn("size-2 rounded-full", QUOTE_STATUS_DOT[filter.status])} />
            )}
            {filter.label}
            <span className={cn("text-xs", filter.active ? "opacity-80" : "opacity-70")}>{filter.count}</span>
          </Link>
        ))}
      </nav>

      {requests.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
            <Inbox className="size-8 text-muted-foreground" />
            <p className="font-medium">Nenhum pedido por aqui</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Os pedidos enviados pelo formulário de orçamento do site aparecem nesta lista.
            </p>
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-4">
          {requests.map((request) => (
            <li key={request.id}>
              <Card>
                <CardContent className="p-5 md:p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <h2 className="text-base font-semibold">
                        {request.name}
                        {request.company && (
                          <span className="font-normal text-muted-foreground"> · {request.company}</span>
                        )}
                      </h2>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {dateFormatter.format(request.createdAt)}
                      </p>
                    </div>
                    <QuoteStatusSelect id={request.id} status={request.status} />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Badge variant="secondary">
                      {ENGAGEMENT_LABELS.get(request.engagement) ?? request.engagement}
                    </Badge>
                    <Badge variant="outline" className="gap-1.5">
                      <Clock className="size-3" />
                      {TIMELINE_LABELS.get(request.timeline) ?? request.timeline}
                    </Badge>
                    <Badge variant="outline" className="gap-1.5">
                      <Wallet className="size-3" />
                      {BUDGET_LABELS.get(request.budget) ?? request.budget}
                    </Badge>
                  </div>

                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {request.solutionTypes.map((solution) => (
                      <li key={solution} className="rounded-full bg-muted px-2.5 py-0.5 text-xs">
                        {SOLUTION_LABELS.get(solution) ?? solution}
                      </li>
                    ))}
                  </ul>

                  <p className="mt-4 whitespace-pre-line text-sm leading-relaxed">{request.description}</p>

                  <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t pt-4 text-sm">
                    <a
                      href={`mailto:${request.email}`}
                      className="inline-flex items-center gap-1.5 hover:underline"
                    >
                      <Mail className="size-4 text-muted-foreground" />
                      {request.email}
                    </a>
                    {request.phone && (
                      <a
                        href={whatsappLink(request.phone)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 hover:underline"
                      >
                        <MessageCircle className="size-4 text-muted-foreground" />
                        {request.phone}
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
