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

  test("shows validation error when submitting empty reply", async () => {
    const user = userEvent.setup();
    mockedAxios.get.mockResolvedValue({ data: [] });
    renderWithProviders(<ReplyThread ticket={makeTicket()} />);

    await screen.findByPlaceholderText("Type your reply...");
    await user.click(screen.getByRole("button", { name: "Send Reply" }));

    expect(await screen.findByText("Reply cannot be empty")).toBeInTheDocument();
    expect(mockedAxios.post).not.toHaveBeenCalled();
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
});
