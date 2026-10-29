import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { setMediaQuery } from "@/test/matchMedia";
import { Contact } from "./Contact";

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  // Keeps GridField from drawing: jsdom has no 2D canvas.
  setMediaQuery("(prefers-reduced-motion: reduce)", true);
});

const fillForm = async () => {
  const user = userEvent.setup();
  render(<Contact />);
  await user.type(screen.getByTestId("contact-name-input"), "Ada Lovelace");
  await user.type(screen.getByTestId("contact-email-input"), "ada@example.com");
  await user.type(screen.getByTestId("contact-message-input"), "Let's build an engine.");
  return { user, submit: () => user.click(screen.getByTestId("contact-submit-button")) };
};

describe("Contact", () => {
  it("validates before sending", async () => {
    const user = userEvent.setup();
    render(<Contact />);
    await user.type(screen.getByTestId("contact-name-input"), "A");
    await user.click(screen.getByTestId("contact-submit-button"));
    expect(screen.getByTestId("contact-error")).toHaveTextContent("name must be at least 2");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("posts the form, honeypot included, and clears it on success", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 200 }));
    const { submit } = await fillForm();
    await submit();

    expect(fetchMock).toHaveBeenCalledWith(
      "http://api.test/api/contact",
      expect.objectContaining({ method: "POST" }),
    );
    const body = JSON.parse(fetchMock.mock.calls[0]?.[1]?.body as string);
    expect(body).toEqual({
      name: "Ada Lovelace",
      email: "ada@example.com",
      company: "",
      message: "Let's build an engine.",
      website: "",
    });
    expect(await screen.findByText(/MESSAGE TRANSMITTED/)).toBeInTheDocument();
    expect(screen.getByTestId("contact-name-input")).toHaveValue("");
  });

  it.each([
    [429, /RATE LIMIT/],
    [500, /server responded 500/],
  ])("reports a %i response", async (status, message) => {
    fetchMock.mockResolvedValue(new Response("{}", { status }));
    const { submit } = await fillForm();
    await submit();
    expect(await screen.findByTestId("contact-error")).toHaveTextContent(message);
    expect(screen.getByTestId("contact-name-input")).toHaveValue("Ada Lovelace");
  });

  it("reports a network failure", async () => {
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    const { submit } = await fillForm();
    await submit();
    expect(await screen.findByTestId("contact-error")).toHaveTextContent(/NETWORK OFFLINE/);
  });

  it("sends once while a request is in flight", async () => {
    fetchMock.mockReturnValue(new Promise(() => {}));
    const { submit } = await fillForm();
    await submit();
    await submit();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
  });
});
