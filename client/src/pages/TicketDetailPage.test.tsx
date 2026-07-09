import { screen, waitFor, fireEvent } from "@testing-library/react";
import { vi, describe, test, expect, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Routes, Route } from "react-router";
import { TicketDetailPage } from "./TicketDetailPage";
import axios from "axios";

vi.mock("axios");
const mockedAxios = vi.mocked(axios);

// Radix primitives rely on APIs that jsdom doesn't implement
class MockResizeObserver { observe = vi.fn(); unobserve = vi.fn(); disconnect = vi.fn(); }
vi.stubGlobal("ResizeObserver", MockResizeObserver);

beforeEach(() => {
  window.HTMLElement.prototype.hasPointerCapture = vi.fn();
  window.HTMLElement.prototype.setPointerCapture = vi.fn();
  window.HTMLElement.prototype.releasePointerCapture = vi.fn();
  window.HTMLElement.prototype.scrollIntoView = vi.fn();
  Element.prototype.getBoundingClientRect = vi.fn(() => ({
    x: 0, y: 0, width: 200, height: 40, top: 0, right: 200, bottom: 40, left: 0, toJSON: vi.fn(),
  }));
});

const MOCK_TICKET = {
  id: 1,
  subject: "Login not working",
  body: "I cannot log in to my account.",
  bodyHtml: null,
  status: "open" as const,
  category: "technical" as const,
  senderName: "Jane Doe",
  senderEmail: "jane@example.com",
  assignedTo: null,
  createdAt: "2026-07-01T10:00:00Z",
  updatedAt: "2026-07-01T12:00:00Z",
};

const MOCK_AGENTS = [
  { id: "agent-1", name: "Alice Agent", email: "alice@example.com" },
  { id: "agent-2", name: "Bob Agent", email: "bob@example.com" },
];

function mockAxiosGet(ticket = MOCK_TICKET, agents = MOCK_AGENTS) {
  mockedAxios.get.mockImplementation((url: string) => {
    if (url.match(/\/api\/tickets\/\d+\/replies/)) {
      return Promise.resolve({ data: [] });
    }
    if (url.match(/\/api\/tickets\/\d+/)) {
      return Promise.resolve({ data: ticket });
    }
    if (url === "/api/users/agents") {
      return Promise.resolve({ data: agents });
    }
    return Promise.reject(new Error("Unknown URL"));
  });
}

function renderDetailPage(ticketId = "1") {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[`/tickets/${ticketId}`]}>
        <Routes>
          <Route
            path="/tickets/:id"
            element={<TicketDetailPage userName="Admin" role="admin" />}
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function getSelectTriggerByLabel(label: string) {
  const labelEl = screen.getByText(label);
  const container = labelEl.closest('[class*="rounded-xl"]')!;
  return container.querySelector('[data-slot="select-trigger"]')!;
}

async function openSelectAndChoose(label: string, optionName: string) {
  const trigger = getSelectTriggerByLabel(label);
  const combobox = trigger.closest('[role="combobox"]') ?? trigger;
  fireEvent.focus(combobox);
  fireEvent.keyDown(combobox, { key: "Enter" });

  const option = await screen.findByRole("option", { name: optionName });
  fireEvent.click(option);
}

describe("TicketDetailPage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  test("shows loading skeleton while fetching", () => {
    mockedAxios.get.mockReturnValue(new Promise(() => {}));
    renderDetailPage();

    const skeletons = document.querySelectorAll('[data-slot="skeleton"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  test("shows error message on fetch failure", async () => {
    mockedAxios.get.mockRejectedValue(new Error("Network Error"));
    renderDetailPage();

    expect(await screen.findByText("Network Error")).toBeInTheDocument();
  });

  test("renders ticket subject and id", async () => {
    mockAxiosGet();
    renderDetailPage();

    expect(await screen.findByText("Login not working")).toBeInTheDocument();
    expect(screen.getByText("#1")).toBeInTheDocument();
  });

  test("renders sender info", async () => {
    mockAxiosGet();
    renderDetailPage();

    await screen.findByText("Login not working");
    expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText("jane@example.com")).toBeInTheDocument();
  });

  test("renders plain text body when bodyHtml is null", async () => {
    mockAxiosGet();
    renderDetailPage();

    expect(await screen.findByText("I cannot log in to my account.")).toBeInTheDocument();
  });

  test("renders HTML body when bodyHtml is present", async () => {
    mockAxiosGet({
      ...MOCK_TICKET,
      bodyHtml: "<p>I <strong>cannot</strong> log in.</p>",
    });
    renderDetailPage();

    await screen.findByText("Login not working");
    const prose = document.querySelector(".prose");
    expect(prose?.innerHTML).toContain("<strong>cannot</strong>");
  });

  test("renders back link to tickets list", async () => {
    mockAxiosGet();
    renderDetailPage();

    await screen.findByText("Login not working");
    const backLink = screen.getByRole("link", { name: /back to tickets/i });
    expect(backLink).toHaveAttribute("href", "/tickets");
  });

  test("renders last updated timestamp", async () => {
    mockAxiosGet();
    renderDetailPage();

    await screen.findByText("Login not working");
    expect(screen.getByText(/last updated/i)).toBeInTheDocument();
  });

  test("fetches ticket with the id from URL params", async () => {
    mockAxiosGet();
    renderDetailPage("42");

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith("/api/tickets/42");
    });
  });

  test("fetches agents list on mount", async () => {
    mockAxiosGet();
    renderDetailPage();

    await waitFor(() => {
      expect(mockedAxios.get).toHaveBeenCalledWith("/api/users/agents");
    });
  });

  // --- Assigned to ---

  test("shows Unassigned in the select when ticket has no assignee", async () => {
    mockAxiosGet();
    renderDetailPage();

    await screen.findByText("Login not working");
    const trigger = getSelectTriggerByLabel("Assigned to");
    expect(trigger.textContent).toContain("Unassigned");
  });

  test("shows assigned agent name in the select when ticket is assigned", async () => {
    mockAxiosGet({ ...MOCK_TICKET, assignedTo: MOCK_AGENTS[0]! });
    renderDetailPage();

    await screen.findByText("Login not working");
    const trigger = getSelectTriggerByLabel("Assigned to");
    await waitFor(() => {
      expect(trigger.textContent).toContain("Alice Agent");
    });
  });

  test("calls PATCH with agent id when selecting an agent", async () => {
    mockAxiosGet();
    mockedAxios.patch.mockResolvedValue({
      data: { ...MOCK_TICKET, assignedTo: MOCK_AGENTS[0] },
    });
    renderDetailPage();

    await screen.findByText("Login not working");
    await openSelectAndChoose("Assigned to", "Alice Agent");

    await waitFor(() => {
      expect(mockedAxios.patch).toHaveBeenCalledWith("/api/tickets/1", {
        assignedToId: "agent-1",
      });
    });
  });

  test("calls PATCH with null when selecting Unassigned", async () => {
    mockAxiosGet({ ...MOCK_TICKET, assignedTo: MOCK_AGENTS[0]! });
    mockedAxios.patch.mockResolvedValue({
      data: { ...MOCK_TICKET, assignedTo: null },
    });
    renderDetailPage();

    await screen.findByText("Login not working");
    await openSelectAndChoose("Assigned to", "Unassigned");

    await waitFor(() => {
      expect(mockedAxios.patch).toHaveBeenCalledWith("/api/tickets/1", {
        assignedToId: null,
      });
    });
  });

  // --- Status ---

  test("shows current status in the status select", async () => {
    mockAxiosGet();
    renderDetailPage();

    await screen.findByText("Login not working");
    const trigger = getSelectTriggerByLabel("Status");
    expect(trigger.textContent?.toLowerCase()).toContain("open");
  });

  test("calls PATCH with new status when changing status", async () => {
    mockAxiosGet();
    mockedAxios.patch.mockResolvedValue({
      data: { ...MOCK_TICKET, status: "resolved" },
    });
    renderDetailPage();

    await screen.findByText("Login not working");
    await openSelectAndChoose("Status", "resolved");

    await waitFor(() => {
      expect(mockedAxios.patch).toHaveBeenCalledWith("/api/tickets/1", {
        status: "resolved",
      });
    });
  });

  // --- Category ---

  test("shows current category in the category select", async () => {
    mockAxiosGet();
    renderDetailPage();

    await screen.findByText("Login not working");
    const trigger = getSelectTriggerByLabel("Category");
    expect(trigger.textContent).toContain("Technical");
  });

  test("shows None when category is null", async () => {
    mockAxiosGet({ ...MOCK_TICKET, category: null });
    renderDetailPage();

    await screen.findByText("Login not working");
    const trigger = getSelectTriggerByLabel("Category");
    expect(trigger.textContent).toContain("None");
  });

  test("calls PATCH with new category when changing category", async () => {
    mockAxiosGet();
    mockedAxios.patch.mockResolvedValue({
      data: { ...MOCK_TICKET, category: "billing" },
    });
    renderDetailPage();

    await screen.findByText("Login not working");
    await openSelectAndChoose("Category", "Billing");

    await waitFor(() => {
      expect(mockedAxios.patch).toHaveBeenCalledWith("/api/tickets/1", {
        category: "billing",
      });
    });
  });

  test("calls PATCH with null when selecting None category", async () => {
    mockAxiosGet();
    mockedAxios.patch.mockResolvedValue({
      data: { ...MOCK_TICKET, category: null },
    });
    renderDetailPage();

    await screen.findByText("Login not working");
    await openSelectAndChoose("Category", "None");

    await waitFor(() => {
      expect(mockedAxios.patch).toHaveBeenCalledWith("/api/tickets/1", {
        category: null,
      });
    });
  });

  test("shows Feature Request label for feature_request category", async () => {
    mockAxiosGet({ ...MOCK_TICKET, category: "feature_request" as const });
    renderDetailPage();

    await screen.findByText("Login not working");
    const trigger = getSelectTriggerByLabel("Category");
    expect(trigger.textContent).toContain("Feature Request");
  });
});
