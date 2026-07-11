import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, test, expect, beforeEach } from "vitest";
import { renderWithProviders } from "@/test/render";
import { ReplyThread } from "./ReplyThread";
import axios from "axios";
import type { Ticket } from "core/schemas/ticket";

vi.mock("axios");
const mockedAxios = vi.mocked(axios);

function makeTicket(overrides: Partial<Ticket> = {}): Ticket {
  return {
    id: 1,
    subject: "Test ticket",
    body: "body",
    bodyHtml: null,
    status: "open",
    category: null,
    senderName: "Alice Customer",
    senderEmail: "alice@example.com",
    assignedTo: null,
    createdAt: "2026-07-01T10:00:00.000Z",
    updatedAt: "2026-07-01T10:00:00.000Z",
    ...overrides,
  };
}

const agentReply = {
  id: 1,
  body: "Looking into this now.",
  senderType: "agent" as const,
  user: { id: "u1", name: "Bob Agent", email: "bob@example.com" },
  createdAt: "2026-07-01T11:00:00.000Z",
};

const customerReply = {
  id: 2,
  body: "Thanks for the help!",
  senderType: "customer" as const,
  user: null,
  createdAt: "2026-07-01T12:00:00.000Z",
};

describe("ReplyThread", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  test("renders reply form even when there are no replies", async () => {
    mockedAxios.get.mockResolvedValue({ data: [] });
    renderWithProviders(<ReplyThread ticket={makeTicket()} />);

    expect(await screen.findByPlaceholderText("Type your reply...")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send Reply" })).toBeInTheDocument();
  });

  test("does not render Replies heading when list is empty", async () => {
    mockedAxios.get.mockResolvedValue({ data: [] });
    renderWithProviders(<ReplyThread ticket={makeTicket()} />);

    await screen.findByPlaceholderText("Type your reply...");
    expect(screen.queryByText("Replies")).not.toBeInTheDocument();
  });

  test("renders agent reply with agent badge and user name", async () => {
    mockedAxios.get.mockResolvedValue({ data: [agentReply] });
    renderWithProviders(<ReplyThread ticket={makeTicket()} />);

    expect(await screen.findByText("Agent")).toBeInTheDocument();
    expect(screen.getByText("Bob Agent")).toBeInTheDocument();
    expect(screen.getByText("Looking into this now.")).toBeInTheDocument();
  });

  test("renders customer reply with customer badge and ticket sender name", async () => {
    mockedAxios.get.mockResolvedValue({ data: [customerReply] });
    renderWithProviders(<ReplyThread ticket={makeTicket({ senderName: "Alice Customer" })} />);

    expect(await screen.findByText("Customer")).toBeInTheDocument();
    expect(screen.getByText("Alice Customer")).toBeInTheDocument();
    expect(screen.getByText("Thanks for the help!")).toBeInTheDocument();
  });

  test("renders multiple replies in order", async () => {
    mockedAxios.get.mockResolvedValue({ data: [agentReply, customerReply] });
    renderWithProviders(<ReplyThread ticket={makeTicket()} />);

    expect(await screen.findByText("Looking into this now.")).toBeInTheDocument();
    expect(screen.getByText("Thanks for the help!")).toBeInTheDocument();
  });

  test("Send Reply button is disabled when draft is empty", async () => {
    mockedAxios.get.mockResolvedValue({ data: [] });
    renderWithProviders(<ReplyThread ticket={makeTicket()} />);

    await screen.findByPlaceholderText("Type your reply...");
    expect(screen.getByRole("button", { name: "Send Reply" })).toBeDisabled();
  });

  test("submits reply with correct payload", async () => {
    const user = userEvent.setup();
    mockedAxios.get.mockResolvedValue({ data: [] });
    mockedAxios.post.mockResolvedValue({ data: agentReply });
    renderWithProviders(<ReplyThread ticket={makeTicket()} />);

    const textarea = await screen.findByPlaceholderText("Type your reply...");
    await user.type(textarea, "Here is my reply");
    await user.click(screen.getByRole("button", { name: "Send Reply" }));

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith("/api/tickets/1/replies", {
        body: "Here is my reply",
        senderType: "agent",
      });
    });
  });

  test("shows Sending... while submitting", async () => {
    const user = userEvent.setup();
    mockedAxios.get.mockResolvedValue({ data: [] });
    mockedAxios.post.mockReturnValue(new Promise(() => {}));
    renderWithProviders(<ReplyThread ticket={makeTicket()} />);

    const textarea = await screen.findByPlaceholderText("Type your reply...");
    await user.type(textarea, "Some reply text");
    await user.click(screen.getByRole("button", { name: "Send Reply" }));

    expect(await screen.findByRole("button", { name: "Sending..." })).toBeDisabled();
  });

  test("shows error message on API failure", async () => {
    const user = userEvent.setup();
    mockedAxios.get.mockResolvedValue({ data: [] });
    mockedAxios.post.mockRejectedValue(new Error("Network error"));
    renderWithProviders(<ReplyThread ticket={makeTicket()} />);

    const textarea = await screen.findByPlaceholderText("Type your reply...");
    await user.type(textarea, "Some reply text");
    await user.click(screen.getByRole("button", { name: "Send Reply" }));

    expect(await screen.findByText("Failed to send reply. Please try again.")).toBeInTheDocument();
  });

  test("Polish button is disabled while the draft is empty", async () => {
    mockedAxios.get.mockResolvedValue({ data: [] });
    renderWithProviders(<ReplyThread ticket={makeTicket()} />);

    await screen.findByPlaceholderText("Type your reply...");
    expect(screen.getByRole("button", { name: "Polish" })).toBeDisabled();
  });

  test("polishes the draft and replaces the textarea content", async () => {
    const user = userEvent.setup();
    mockedAxios.get.mockResolvedValue({ data: [] });
    mockedAxios.post.mockResolvedValue({ data: { polished: "A polished, professional reply." } });
    renderWithProviders(<ReplyThread ticket={makeTicket()} />);

    const textarea = await screen.findByPlaceholderText("Type your reply...");
    await user.type(textarea, "fix ur thing");
    await user.click(screen.getByRole("button", { name: "Polish" }));

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith("/api/tickets/1/polish-reply", {
        draft: "fix ur thing",
      });
    });
    expect(textarea).toHaveValue("A polished, professional reply.");
  });

  test("shows Polishing... while the polish request is in flight", async () => {
    const user = userEvent.setup();
    mockedAxios.get.mockResolvedValue({ data: [] });
    mockedAxios.post.mockReturnValue(new Promise(() => {}));
    renderWithProviders(<ReplyThread ticket={makeTicket()} />);

    const textarea = await screen.findByPlaceholderText("Type your reply...");
    await user.type(textarea, "some draft");
    await user.click(screen.getByRole("button", { name: "Polish" }));

    expect(await screen.findByRole("button", { name: "Polishing..." })).toBeDisabled();
  });

  test("shows error message when polishing fails", async () => {
    const user = userEvent.setup();
    mockedAxios.get.mockResolvedValue({ data: [] });
    mockedAxios.post.mockRejectedValue(new Error("Network error"));
    renderWithProviders(<ReplyThread ticket={makeTicket()} />);

    const textarea = await screen.findByPlaceholderText("Type your reply...");
    await user.type(textarea, "some draft");
    await user.click(screen.getByRole("button", { name: "Polish" }));

    expect(
      await screen.findByText("Failed to polish reply. Please try again."),
    ).toBeInTheDocument();
  });

  test("polish calls the correct ticket-specific endpoint", async () => {
    const user = userEvent.setup();
    mockedAxios.get.mockResolvedValue({ data: [] });
    mockedAxios.post.mockResolvedValue({ data: { polished: "improved" } });
    renderWithProviders(<ReplyThread ticket={makeTicket({ id: 42 })} />);

    const textarea = await screen.findByPlaceholderText("Type your reply...");
    await user.type(textarea, "draft text");
    await user.click(screen.getByRole("button", { name: "Polish" }));

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith("/api/tickets/42/polish-reply", {
        draft: "draft text",
      });
    });
  });

  test("both buttons are disabled when input is only whitespace", async () => {
    const user = userEvent.setup();
    mockedAxios.get.mockResolvedValue({ data: [] });
    renderWithProviders(<ReplyThread ticket={makeTicket()} />);

    const textarea = await screen.findByPlaceholderText("Type your reply...");
    await user.type(textarea, "   ");

    expect(screen.getByRole("button", { name: "Polish" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Send Reply" })).toBeDisabled();
  });

  test("Send Reply button is enabled after polish replaces content", async () => {
    const user = userEvent.setup();
    mockedAxios.get.mockResolvedValue({ data: [] });
    mockedAxios.post.mockResolvedValue({ data: { polished: "A polished reply." } });
    renderWithProviders(<ReplyThread ticket={makeTicket()} />);

    const textarea = await screen.findByPlaceholderText("Type your reply...");
    await user.type(textarea, "rough draft");
    await user.click(screen.getByRole("button", { name: "Polish" }));

    await waitFor(() => expect(textarea).toHaveValue("A polished reply."));
    expect(screen.getByRole("button", { name: "Send Reply" })).toBeEnabled();
  });

  test("can send the polished reply", async () => {
    const user = userEvent.setup();
    mockedAxios.get.mockResolvedValue({ data: [] });
    mockedAxios.post
      .mockResolvedValueOnce({ data: { polished: "A polished reply." } })
      .mockResolvedValueOnce({ data: agentReply });
    renderWithProviders(<ReplyThread ticket={makeTicket()} />);

    const textarea = await screen.findByPlaceholderText("Type your reply...");
    await user.type(textarea, "rough draft");
    await user.click(screen.getByRole("button", { name: "Polish" }));

    await waitFor(() => expect(textarea).toHaveValue("A polished reply."));
    await user.click(screen.getByRole("button", { name: "Send Reply" }));

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith("/api/tickets/1/replies", {
        body: "A polished reply.",
        senderType: "agent",
      });
    });
  });

  test("Send Reply button is disabled while polishing", async () => {
    const user = userEvent.setup();
    mockedAxios.get.mockResolvedValue({ data: [] });
    mockedAxios.post.mockReturnValue(new Promise(() => {}));
    renderWithProviders(<ReplyThread ticket={makeTicket()} />);

    const textarea = await screen.findByPlaceholderText("Type your reply...");
    await user.type(textarea, "some draft");

    expect(screen.getByRole("button", { name: "Send Reply" })).toBeEnabled();
    await user.click(screen.getByRole("button", { name: "Polish" }));

    await screen.findByRole("button", { name: "Polishing..." });
    expect(screen.getByRole("button", { name: "Send Reply" })).toBeEnabled();
  });
});
