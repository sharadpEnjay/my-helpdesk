import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, test, expect, beforeEach } from "vitest";
import { renderWithProviders } from "@/test/render";
import { TicketDetail } from "./TicketDetail";
import axios from "axios";
import type { Ticket } from "core/schemas/ticket";

vi.mock("axios");
const mockedAxios = vi.mocked(axios);

function makeTicket(overrides: Partial<Ticket> = {}): Ticket {
  return {
    id: 42,
    subject: "Login page broken",
    body: "I can't log in since the last update.",
    bodyHtml: null,
    status: "open",
    category: "bug",
    senderName: "Jane Doe",
    senderEmail: "jane@example.com",
    assignedTo: null,
    createdAt: "2026-07-01T10:00:00.000Z",
    updatedAt: "2026-07-01T12:00:00.000Z",
    ...overrides,
  };
}

describe("TicketDetail", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  test("renders subject as heading", () => {
    renderWithProviders(<TicketDetail ticket={makeTicket()} />);

    expect(screen.getByRole("heading", { name: "Login page broken" })).toBeInTheDocument();
  });

  test("renders ticket id and creation date", () => {
    renderWithProviders(<TicketDetail ticket={makeTicket()} />);

    expect(screen.getByText("#0042")).toBeInTheDocument();
    expect(
      screen.getByText(`Opened ${new Date("2026-07-01T10:00:00.000Z").toLocaleString()}`),
    ).toBeInTheDocument();
  });

  test("renders sender name and email", () => {
    renderWithProviders(<TicketDetail ticket={makeTicket()} />);

    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText("jane@example.com")).toBeInTheDocument();
  });

  test("renders plain text body when bodyHtml is null", () => {
    renderWithProviders(<TicketDetail ticket={makeTicket({ bodyHtml: null })} />);

    expect(screen.getByText("I can't log in since the last update.")).toBeInTheDocument();
  });

  test("renders HTML body when bodyHtml is provided", () => {
    renderWithProviders(
      <TicketDetail ticket={makeTicket({ bodyHtml: "<strong>Important</strong> issue" })} />
    );

    expect(screen.getByText("Important")).toBeInTheDocument();
    expect(screen.queryByText("I can't log in since the last update.")).not.toBeInTheDocument();
  });

  test("preserves whitespace in plain text body", () => {
    const body = "Line one\n\nLine three";
    renderWithProviders(<TicketDetail ticket={makeTicket({ body, bodyHtml: null })} />);

    const el = screen.getByText(/Line one/);
    expect(el).toHaveClass("whitespace-pre-wrap");
  });

  test("renders Summarize button", () => {
    renderWithProviders(<TicketDetail ticket={makeTicket()} />);

    expect(screen.getByRole("button", { name: "Summarize" })).toBeInTheDocument();
  });

  test("does not show summary before clicking Summarize", () => {
    renderWithProviders(<TicketDetail ticket={makeTicket()} />);

    expect(screen.queryByText("Summary")).not.toBeInTheDocument();
  });

  test("calls the correct ticket-specific summarize endpoint", async () => {
    const user = userEvent.setup();
    mockedAxios.post.mockResolvedValue({ data: { summary: "A brief summary." } });
    renderWithProviders(<TicketDetail ticket={makeTicket({ id: 99 })} />);

    await user.click(screen.getByRole("button", { name: "Summarize" }));

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith("/api/tickets/99/summarize");
    });
  });

  test("displays the summary after clicking Summarize", async () => {
    const user = userEvent.setup();
    mockedAxios.post.mockResolvedValue({
      data: { summary: "Customer reported a login issue after the last update." },
    });
    renderWithProviders(<TicketDetail ticket={makeTicket()} />);

    await user.click(screen.getByRole("button", { name: "Summarize" }));

    expect(
      await screen.findByText("Customer reported a login issue after the last update."),
    ).toBeInTheDocument();
    expect(screen.getByText("AI Summary")).toBeInTheDocument();
  });

  test("shows Summarizing... while request is in flight", async () => {
    const user = userEvent.setup();
    mockedAxios.post.mockReturnValue(new Promise(() => {}));
    renderWithProviders(<TicketDetail ticket={makeTicket()} />);

    await user.click(screen.getByRole("button", { name: "Summarize" }));

    expect(await screen.findByRole("button", { name: "Summarizing..." })).toBeDisabled();
  });

  test("shows error message when summarize fails", async () => {
    const user = userEvent.setup();
    mockedAxios.post.mockRejectedValue(new Error("Network error"));
    renderWithProviders(<TicketDetail ticket={makeTicket()} />);

    await user.click(screen.getByRole("button", { name: "Summarize" }));

    expect(
      await screen.findByText("Failed to generate summary. Please try again."),
    ).toBeInTheDocument();
  });

  test("re-generates summary on subsequent clicks", async () => {
    const user = userEvent.setup();
    mockedAxios.post
      .mockResolvedValueOnce({ data: { summary: "First summary." } })
      .mockResolvedValueOnce({ data: { summary: "Updated summary." } });
    renderWithProviders(<TicketDetail ticket={makeTicket()} />);

    await user.click(screen.getByRole("button", { name: "Summarize" }));
    expect(await screen.findByText("First summary.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Summarize" }));
    expect(await screen.findByText("Updated summary.")).toBeInTheDocument();
    expect(screen.queryByText("First summary.")).not.toBeInTheDocument();
  });
});
