import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import DOMPurify from "dompurify";
import { Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { type SenderType as SenderTypeValue } from "core/constants/ticket";
import { type Ticket } from "core/schemas/ticket";
import { createReplySchema, type CreateReplyInput } from "core/schemas/reply";

interface Reply {
  id: number;
  body: string;
  bodyHtml: string | null;
  senderType: SenderTypeValue;
  user: { id: string; name: string; email: string } | null;
  createdAt: string;
}

interface ReplyThreadProps {
  ticket: Ticket;
}

export function ReplyThread({ ticket }: ReplyThreadProps) {
  const ticketId = String(ticket.id);
  const senderName = ticket.senderName;
  const queryClient = useQueryClient();

  const { data: replies } = useQuery({
    queryKey: ["ticket", ticketId, "replies"],
    queryFn: () =>
      axios.get<Reply[]>(`/api/tickets/${ticketId}/replies`).then((res) => res.data),
  });

  const form = useForm<CreateReplyInput>({
    resolver: zodResolver(createReplySchema),
    defaultValues: { body: "", senderType: "agent" },
  });

  const mutation = useMutation({
    mutationFn: (data: CreateReplyInput) =>
      axios.post<Reply>(`/api/tickets/${ticketId}/replies`, data).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket", ticketId, "replies"] });
      form.reset();
    },
  });

  const polishMutation = useMutation({
    mutationFn: (draft: string) =>
      axios
        .post<{ polished: string }>(`/api/tickets/${ticketId}/polish-reply`, {
          draft,
        })
        .then((res) => res.data),
    onSuccess: (data) =>
      form.setValue("body", data.polished, { shouldValidate: true, shouldDirty: true }),
  });

  const onSubmit = form.handleSubmit((data) => {
    mutation.mutate(data);
  });

  return (
    <>
      {replies && replies.length > 0 && (
        <div className="space-y-3">
          <h2 className="font-mono text-[0.65rem] uppercase tracking-wider text-muted-foreground">
            Conversation
          </h2>
          {replies.map((reply) => {
            const isAgent = reply.senderType === "agent";
            return (
              <div
                key={reply.id}
                className={`rounded-lg border p-4 ${
                  isAgent
                    ? "ml-6 border-primary/25 bg-primary/[0.06]"
                    : "mr-6 border-border bg-surface"
                }`}
              >
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`flex items-center gap-1.5 rounded-full px-2 py-0.5 font-mono text-[0.65rem] uppercase tracking-wider ${
                        isAgent
                          ? "bg-primary/15 text-primary"
                          : "bg-secondary text-secondary-foreground"
                      }`}
                    >
                      <span
                        className={`size-1.5 rounded-full ${
                          isAgent ? "bg-primary" : "bg-sla-calm"
                        }`}
                      />
                      {isAgent ? "Agent" : "Customer"}
                    </span>
                    <span className="text-sm text-foreground/90">
                      {reply.user?.name ?? senderName}
                    </span>
                  </div>
                  <span className="font-mono text-xs text-muted-foreground">
                    {new Date(reply.createdAt).toLocaleString()}
                  </span>
                </div>
                {reply.bodyHtml ? (
                  <div
                    className="prose prose-invert prose-sm max-w-none"
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(reply.bodyHtml),
                    }}
                  />
                ) : (
                  <p className="whitespace-pre-wrap text-sm text-foreground/90">
                    {reply.body}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      <form
        onSubmit={onSubmit}
        className="space-y-3 rounded-lg border border-border bg-surface p-4"
      >
        <h2 className="font-mono text-[0.65rem] uppercase tracking-wider text-muted-foreground">
          Reply
        </h2>
        <Textarea
          placeholder="Type your reply..."
          className="resize-none"
          {...form.register("body")}
        />
        {mutation.isError && (
          <p className="font-mono text-xs text-sla-breach">
            Failed to send reply. Please try again.
          </p>
        )}
        {polishMutation.isError && (
          <p className="font-mono text-xs text-sla-breach">
            Failed to polish reply. Please try again.
          </p>
        )}
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={polishMutation.isPending || !form.watch("body")?.trim()}
            onClick={() => polishMutation.mutate(form.getValues("body"))}
          >
            <Sparkles className="size-4" />
            {polishMutation.isPending ? "Polishing..." : "Polish"}
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={mutation.isPending || !form.watch("body")?.trim()}
          >
            <Send className="size-4" />
            {mutation.isPending ? "Sending..." : "Send Reply"}
          </Button>
        </div>
      </form>
    </>
  );
}
