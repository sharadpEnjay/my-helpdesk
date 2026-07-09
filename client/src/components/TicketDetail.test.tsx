import { screen } from "@testing-library/react";
import { describe, test, expect } from "vitest";
import { renderWithProviders } from "@/test/render";
import { TicketDetail } from "./TicketDetail";
import type { Ticket } from "core/schemas/ticket";

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
  test("renders subject as heading", () => {
    renderWithProviders(<TicketDetail ticket={makeTicket()} />);

    expect(screen.getByRole("heading", { name: "Login page broken" })).toBeInTheDocument();
  });

  test("renders ticket id and creation date", () => {
    renderWithProviders(<TicketDetail ticket={makeTicket()} />);

    expect(screen.getByText("#42")).toBeInTheDocument();
    expect(screen.getByText(new Date("2026-07-01T10:00:00.000Z").toLocaleString())).toBeInTheDocument();
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
});
