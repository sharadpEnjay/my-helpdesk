import { screen, within } from "@testing-library/react";
import { vi, describe, test, expect, beforeEach } from "vitest";
import { renderWithProviders } from "@/test/render";
import { TicketsPage } from "./TicketsPage";
import axios from "axios";

vi.mock("axios");
const mockedAxios = vi.mocked(axios);

const MOCK_TICKETS = [
  {
    id: 1,
    subject: "Login not working",
    senderName: "Jane Doe",
    senderEmail: "jane@example.com",
    status: "open" as const,
    category: "technical" as const,
    createdAt: "2026-07-01T10:00:00Z",
    updatedAt: "2026-07-01T10:00:00Z",
  },
  {
    id: 2,
    subject: "Billing question",
    senderName: "John Smith",
    senderEmail: "john@example.com",
    status: "pending" as const,
    category: null,
    createdAt: "2026-06-28T08:00:00Z",
    updatedAt: "2026-06-28T08:00:00Z",
  },
];

function mockResponse(tickets = MOCK_TICKETS) {
  return { data: { data: tickets, total: tickets.length, page: 1, pageSize: 10 } };
}

function renderTicketsPage() {
  return renderWithProviders(<TicketsPage />);
}

describe("TicketsPage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  test("renders the page heading", () => {
    mockedAxios.get.mockReturnValue(new Promise(() => {}));
    renderTicketsPage();
    expect(screen.getByRole("heading", { name: "Tickets" })).toBeInTheDocument();
  });

  test("renders table column headers", async () => {
    mockedAxios.get.mockResolvedValue(mockResponse());
    renderTicketsPage();

    await screen.findByText("Login not working");
    for (const col of ["ID", "Subject", "From", "Status", "Category", "Age"]) {
      expect(screen.getByRole("columnheader", { name: new RegExp(col) })).toBeInTheDocument();
    }
  });

  test("shows skeleton table while loading", () => {
    mockedAxios.get.mockReturnValue(new Promise(() => {}));
    renderTicketsPage();
    const skeletons = document.querySelectorAll('[data-slot="skeleton"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  test("shows empty state when no tickets returned", async () => {
    mockedAxios.get.mockResolvedValue(mockResponse([]));
    renderTicketsPage();

    expect(await screen.findByText(/All clear/)).toBeInTheDocument();
  });

  test("shows error message on fetch failure", async () => {
    mockedAxios.get.mockRejectedValue(new Error("Network Error"));
    renderTicketsPage();

    expect(await screen.findByText("Network Error")).toBeInTheDocument();
  });

  test("renders ticket row with id, subject, sender, status, category, and age", async () => {
    mockedAxios.get.mockResolvedValue(mockResponse());
    renderTicketsPage();

    const row = await screen.findByText("Login not working").then((el) =>
      el.closest("tr")!
    );
    const cells = within(row).getAllByRole("cell");

    expect(within(row).getByText("#0001")).toBeInTheDocument();
    expect(within(row).getByText("Login not working")).toBeInTheDocument();
    expect(within(row).getByText("Jane Doe")).toBeInTheDocument();
    expect(within(row).getByText("jane@example.com")).toBeInTheDocument();
    expect(within(row).getByText("open")).toBeInTheDocument();
    expect(within(row).getByText("technical")).toBeInTheDocument();
    // Age column renders a relative duration (e.g. "14d", "2h 5m", "now").
    expect(cells[5]!.textContent).toMatch(/\d+[dhm]|now/);
  });

  test("renders em dash when category is null", async () => {
    mockedAxios.get.mockResolvedValue(mockResponse());
    renderTicketsPage();

    const row = await screen.findByText("Billing question").then((el) =>
      el.closest("tr")!
    );
    expect(within(row).getByText("—")).toBeInTheDocument();
  });

  test("renders tickets in the order received (newest first)", async () => {
    mockedAxios.get.mockResolvedValue(mockResponse());
    renderTicketsPage();

    await screen.findByText("Login not working");
    const rows = screen.getAllByRole("row");
    const dataRows = rows.slice(1);

    expect(within(dataRows[0]!).getByText("Login not working")).toBeInTheDocument();
    expect(within(dataRows[1]!).getByText("Billing question")).toBeInTheDocument();
  });

  test("calls /api/tickets endpoint with default sort and pagination params", () => {
    mockedAxios.get.mockReturnValue(new Promise(() => {}));
    renderTicketsPage();

    expect(mockedAxios.get).toHaveBeenCalledWith("/api/tickets", {
      params: { sortBy: "createdAt", sortOrder: "desc", page: "1", pageSize: "10" },
    });
  });

});
