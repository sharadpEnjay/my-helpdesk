import { screen, within } from "@testing-library/react";
import { vi, describe, test, expect, beforeEach } from "vitest";
import { renderWithProviders } from "@/test/render";
import { UsersPage } from "./UsersPage";
import axios from "axios";

vi.mock("axios");
const mockedAxios = vi.mocked(axios);

const MOCK_USERS = [
  { id: "1", name: "Alice Admin", email: "alice@example.com", role: "admin" as const, createdAt: "2025-01-15T00:00:00Z" },
  { id: "2", name: "Bob Agent", email: "bob@example.com", role: "agent" as const, createdAt: "2025-02-20T00:00:00Z" },
];

function renderUsersPage(props: { userName: string; role?: string } = { userName: "Admin", role: "admin" }) {
  return renderWithProviders(<UsersPage {...props} />);
}

describe("UsersPage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  test("renders the page heading", () => {
    mockedAxios.get.mockReturnValue(new Promise(() => {}));
    renderUsersPage();
    expect(screen.getByRole("heading", { name: "Users" })).toBeInTheDocument();
  });

  test("shows skeleton table while loading", () => {
    mockedAxios.get.mockReturnValue(new Promise(() => {}));
    renderUsersPage();
    const skeletons = document.querySelectorAll('[data-slot="skeleton"]');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  test("renders users in a table after loading", async () => {
    mockedAxios.get.mockResolvedValue({ data: MOCK_USERS });
    renderUsersPage();

    expect(await screen.findByText("Alice Admin")).toBeInTheDocument();
    expect(screen.getByText("bob@example.com")).toBeInTheDocument();
  });

  test("renders table column headers", async () => {
    mockedAxios.get.mockResolvedValue({ data: MOCK_USERS });
    renderUsersPage();

    await screen.findByText("Alice Admin");
    expect(screen.getByRole("columnheader", { name: "Name" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Email" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Role" })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Joined" })).toBeInTheDocument();
  });

  test("renders role badges with correct variant", async () => {
    mockedAxios.get.mockResolvedValue({ data: MOCK_USERS });
    renderUsersPage();

    const adminBadge = await screen.findByText("admin");
    expect(adminBadge).toHaveAttribute("data-variant", "default");

    const agentBadge = screen.getByText("agent");
    expect(agentBadge).toHaveAttribute("data-variant", "secondary");
  });

  test("renders formatted dates", async () => {
    mockedAxios.get.mockResolvedValue({ data: MOCK_USERS });
    renderUsersPage();

    await screen.findByText("Alice Admin");
    const rows = screen.getAllByRole("row");
    const dataRows = rows.slice(1);
    expect(dataRows).toHaveLength(2);

    dataRows.forEach((row) => {
      const cells = within(row).getAllByRole("cell");
      expect(cells[3]!.textContent).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
    });
  });

  test("shows empty state when no users returned", async () => {
    mockedAxios.get.mockResolvedValue({ data: [] });
    renderUsersPage();

    expect(await screen.findByText("No users found")).toBeInTheDocument();
  });

  test("shows error message on fetch failure", async () => {
    mockedAxios.get.mockRejectedValue(new Error("Network Error"));
    renderUsersPage();

    expect(await screen.findByText("Network Error")).toBeInTheDocument();
  });

  test("calls /api/users endpoint", () => {
    mockedAxios.get.mockReturnValue(new Promise(() => {}));
    renderUsersPage();

    expect(mockedAxios.get).toHaveBeenCalledWith("/api/users");
  });

  test("renders the navbar with user name", () => {
    mockedAxios.get.mockReturnValue(new Promise(() => {}));
    renderUsersPage({ userName: "Test User", role: "admin" });

    expect(screen.getByText("Test User")).toBeInTheDocument();
  });
});
