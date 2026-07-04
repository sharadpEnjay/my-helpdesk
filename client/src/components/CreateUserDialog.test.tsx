import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, test, expect, beforeEach } from "vitest";
import { renderWithProviders } from "@/test/render";
import { UserFormDialog } from "./UserFormDialog";
import axios from "axios";

vi.mock("axios");
const mockedAxios = vi.mocked(axios);

function renderDialog(props: { state?: "create" | null; onClose?: () => void } = {}) {
  const onClose = props.onClose ?? vi.fn();
  return {
    onClose,
    ...renderWithProviders(
      <UserFormDialog state={props.state ?? "create"} onClose={onClose} />
    ),
  };
}

async function fillForm(user: ReturnType<typeof userEvent.setup>, overrides: { name?: string; email?: string; password?: string } = {}) {
  const name = overrides.name ?? "John Doe";
  const email = overrides.email ?? "john@example.com";
  const password = overrides.password ?? "password123";

  if (name) await user.type(screen.getByLabelText("Name"), name);
  if (email) await user.type(screen.getByLabelText("Email"), email);
  if (password) await user.type(screen.getByLabelText("Password"), password);
}

describe("UserFormDialog — create mode", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  test("renders all form fields", () => {
    renderDialog();

    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Create User" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
  });

  test("shows validation error when name is too short", async () => {
    const user = userEvent.setup();
    renderDialog();

    await fillForm(user, { name: "AB", email: "a@b.com", password: "password123" });
    await user.click(screen.getByRole("button", { name: "Create User" }));

    expect(await screen.findByText("Name must be at least 3 characters")).toBeInTheDocument();
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });

  test("shows validation error when email is empty", async () => {
    const user = userEvent.setup();
    renderDialog();

    await fillForm(user, { name: "John Doe", email: "", password: "password123" });
    await user.click(screen.getByRole("button", { name: "Create User" }));

    expect(await screen.findByText("Invalid email address")).toBeInTheDocument();
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });

  test("shows validation error when password is too short", async () => {
    const user = userEvent.setup();
    renderDialog();

    await fillForm(user, { name: "John Doe", email: "a@b.com", password: "short" });
    await user.click(screen.getByRole("button", { name: "Create User" }));

    expect(await screen.findByText("Password must be at least 8 characters")).toBeInTheDocument();
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });

  test("shows all validation errors when form is empty", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole("button", { name: "Create User" }));

    expect(await screen.findByText("Name must be at least 3 characters")).toBeInTheDocument();
    expect(screen.getByText("Invalid email address")).toBeInTheDocument();
    expect(screen.getByText("Password must be at least 8 characters")).toBeInTheDocument();
  });

  test("rejects whitespace-only name", async () => {
    const user = userEvent.setup();
    renderDialog();

    await fillForm(user, { name: "   ", email: "a@b.com", password: "password123" });
    await user.click(screen.getByRole("button", { name: "Create User" }));

    expect(await screen.findByText("Name must be at least 3 characters")).toBeInTheDocument();
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });

  test("marks invalid fields with aria-invalid", async () => {
    const user = userEvent.setup();
    renderDialog();

    await user.click(screen.getByRole("button", { name: "Create User" }));

    await waitFor(() => {
      expect(screen.getByLabelText("Name")).toHaveAttribute("aria-invalid", "true");
      expect(screen.getByLabelText("Email")).toHaveAttribute("aria-invalid", "true");
      expect(screen.getByLabelText("Password")).toHaveAttribute("aria-invalid", "true");
    });
  });

  test("submits form with valid data", async () => {
    const user = userEvent.setup();
    mockedAxios.post.mockResolvedValue({ data: { id: "1", name: "John Doe", email: "john@example.com", role: "agent" } });
    renderDialog();

    await fillForm(user);
    await user.click(screen.getByRole("button", { name: "Create User" }));

    await waitFor(() => {
      expect(mockedAxios.post).toHaveBeenCalledWith("/api/users", {
        name: "John Doe",
        email: "john@example.com",
        password: "password123",
        role: "agent",
      });
    });
  });

  test("shows server error on API failure", async () => {
    const user = userEvent.setup();
    mockedAxios.post.mockRejectedValue({
      response: { data: { error: "A user with this email already exists" } },
      isAxiosError: true,
    });
    renderDialog();

    await fillForm(user);
    await user.click(screen.getByRole("button", { name: "Create User" }));

    expect(await screen.findByText("A user with this email already exists")).toBeInTheDocument();
  });

  test("calls onClose and resets form on successful submit", async () => {
    const user = userEvent.setup();
    mockedAxios.post.mockResolvedValue({ data: { id: "1" } });
    const { onClose } = renderDialog();

    await fillForm(user);
    await user.click(screen.getByRole("button", { name: "Create User" }));

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  test("calls onClose when Cancel is clicked", async () => {
    const user = userEvent.setup();
    const { onClose } = renderDialog();

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onClose).toHaveBeenCalled();
  });

  test("shows Creating... while submitting", async () => {
    const user = userEvent.setup();
    mockedAxios.post.mockReturnValue(new Promise(() => {}));
    renderDialog();

    await fillForm(user);
    await user.click(screen.getByRole("button", { name: "Create User" }));

    expect(await screen.findByRole("button", { name: "Creating..." })).toBeDisabled();
  });
});
