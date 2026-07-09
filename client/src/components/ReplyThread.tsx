import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import axios from "axios";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { type SenderType as SenderTypeValue } from "core/constants/ticket";
import { type Ticket } from "core/schemas/ticket";
import { createReplySchema, type CreateReplyInput } from "core/schemas/reply";

interface Reply {
  id: number;
  body: string;
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

  const onSubmit = form.handleSubmit((data) => {
    mutation.mutate(data);
  });

  return (
    <>
      {replies && replies.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-medium text-slate-400">Replies</h2>
          {replies.map((reply) => (
            <div
              key={reply.id}
              className={`rounded-2xl border p-4 ${
                reply.senderType === "agent"
                  ? "border-purple-500/20 bg-purple-500/[0.05] ml-6"
                  : "border-white/10 bg-white/[0.03] mr-6"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      reply.senderType === "agent"
                        ? "bg-purple-500/20 text-purple-300"
                        : "bg-slate-500/20 text-slate-300"
                    }`}
                  >
                    {reply.senderType === "agent" ? "Agent" : "Customer"}
                  </span>
                  <span className="text-sm text-slate-300">
                    {reply.user?.name ?? senderName}
                  </span>
                </div>
                <span className="text-xs text-slate-500">
                  {new Date(reply.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="text-sm text-slate-200 whitespace-pre-wrap">{reply.body}</p>
            </div>
          ))}
        </div>
      )}

      <form
        onSubmit={onSubmit}
        className="rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-4 space-y-3"
      >
        <h2 className="text-sm font-medium text-slate-400">Add Reply</h2>
        <Textarea
          placeholder="Type your reply..."
          className="bg-white/[0.05] border-white/10 text-white placeholder:text-slate-500 resize-none"
          {...form.register("body")}
        />
        {form.formState.errors.body && (
          <p className="text-xs text-red-400">{form.formState.errors.body.message}</p>
        )}
        {mutation.isError && (
          <p className="text-xs text-red-400">Failed to send reply. Please try again.</p>
        )}
        <div className="flex justify-end">
          <Button type="submit" size="sm" disabled={mutation.isPending}>
            <Send className="h-4 w-4 mr-1" />
            {mutation.isPending ? "Sending..." : "Send Reply"}
          </Button>
        </div>
      </form>
    </>
  );
}
