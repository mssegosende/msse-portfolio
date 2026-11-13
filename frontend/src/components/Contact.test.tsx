import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setMediaQuery } from "@/test/matchMedia";
import { MAX_LEN } from "@/lib/contactLimits";
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
  it("caps every field at the backend's limit (MAX_LEN, checked against server.py)", () => {
    render(<Contact />);
    for (const field of ["name", "email", "company", "linkedin", "message"] as const)
      expect(screen.getByTestId(`contact-${field}-input`)).toHaveAttribute(
        "maxLength",
        String(MAX_LEN[field]),
      );
    expect(document.querySelector('input[name="website"]')).toHaveAttribute(
      "maxLength",
      String(MAX_LEN.website),
    );
  });

  it("footer: GITHUB, LINKEDIN and the credit, the profiles in a new tab, no EMAIL", () => {
    render(<Contact />);
    const linkedin = screen.getByTestId("footer-linkedin-link");
    expect(linkedin).toHaveTextContent("LINKEDIN");
    expect(linkedin).toHaveAttribute("href", "https://www.linkedin.com/in/mssegosende");
    expect(linkedin).toHaveAttribute("target", "_blank");
    expect(linkedin).toHaveAttribute("rel", "noopener noreferrer");
    const footer = screen.getByTestId("footer");
    expect(footer).toHaveTextContent(/MSSE:\/\/.*GITHUB.*LINKEDIN.*©/);
    expect(footer).not.toHaveTextContent("EMAIL");
    expect(screen.queryByTestId("footer-email-link")).not.toBeInTheDocument();
  });

  it("sends nothing with the required fields empty: an error under each, focus on the first", async () => {
    const user = userEvent.setup();
    render(<Contact />);
    await user.click(screen.getByTestId("contact-submit-button"));

    expect(screen.getByTestId("contact-name-error")).toHaveTextContent("name is required");
    expect(screen.getByTestId("contact-email-error")).toHaveTextContent("email is required");
    expect(screen.getByTestId("contact-message-error")).toHaveTextContent("message is required");
    expect(screen.queryByTestId("contact-company-error")).not.toBeInTheDocument();
    expect(screen.getByTestId("contact-name-input")).toHaveFocus();
    expect(screen.getByTestId("contact-name-input")).toHaveAttribute("aria-invalid", "true");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("treats whitespace as empty and checks the minimum lengths", async () => {
    const user = userEvent.setup();
    render(<Contact />);
    await user.type(screen.getByTestId("contact-name-input"), "A");
    await user.type(screen.getByTestId("contact-email-input"), "   ");
    await user.type(screen.getByTestId("contact-message-input"), "too short");
    await user.click(screen.getByTestId("contact-submit-button"));

    expect(screen.getByTestId("contact-name-error")).toHaveTextContent("at least 2 characters");
    expect(screen.getByTestId("contact-email-error")).toHaveTextContent("email is required");
    expect(screen.getByTestId("contact-message-error")).toHaveTextContent("at least 10 characters");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects an invalid email, focuses it, and clears the error once fixed", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 200 }));
    const user = userEvent.setup();
    render(<Contact />);
    await user.type(screen.getByTestId("contact-name-input"), "Ada Lovelace");
    await user.type(screen.getByTestId("contact-email-input"), "ada@example");
    await user.type(screen.getByTestId("contact-message-input"), "Let's build an engine.");
    await user.click(screen.getByTestId("contact-submit-button"));

    expect(screen.getByTestId("contact-email-error")).toHaveTextContent("invalid email format");
    expect(screen.getByTestId("contact-email-input")).toHaveFocus();
    expect(screen.queryByTestId("contact-name-error")).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();

    await user.type(screen.getByTestId("contact-email-input"), ".com");
    expect(screen.queryByTestId("contact-email-error")).not.toBeInTheDocument();
    await user.click(screen.getByTestId("contact-submit-button"));
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("posts the form, honeypot included, and clears it on success", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 200 }));
    const { user, submit } = await fillForm();
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
      linkedin: "",
      message: "Let's build an engine.",
      website: "",
    });
    expect(await screen.findByText(/MESSAGE TRANSMITTED/)).toBeInTheDocument();
    // The confirmation takes the form's place (the window keeps its height);
    // NEW MESSAGE brings the form back, empty.
    expect(screen.queryByTestId("contact-name-input")).not.toBeInTheDocument();
    await user.click(screen.getByTestId("contact-new-message"));
    expect(screen.getByTestId("contact-name-input")).toHaveValue("");
    expect(screen.queryByTestId("contact-status-lines")).not.toBeInTheDocument();
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
    expect(screen.getByTestId("contact-submit-button")).toBeDisabled();
    await submit();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
  });
});

describe("Contact endpoint without VITE_BACKEND_URL", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it.each([
    ["production calls the same origin", false, "/api/contact"],
    ["dev calls the local backend", true, "http://localhost:8000/api/contact"],
  ])("%s", async (_, dev, url) => {
    vi.stubEnv("VITE_BACKEND_URL", "");
    vi.stubEnv("DEV", dev);
    vi.resetModules();
    const { Contact: FreshContact } = await import("./Contact");
    fetchMock.mockResolvedValue(new Response("{}", { status: 200 }));

    const user = userEvent.setup();
    render(<FreshContact />);
    await user.type(screen.getByTestId("contact-name-input"), "Ada Lovelace");
    await user.type(screen.getByTestId("contact-email-input"), "ada@example.com");
    await user.type(screen.getByTestId("contact-message-input"), "Let's build an engine.");
    await user.click(screen.getByTestId("contact-submit-button"));

    expect(fetchMock).toHaveBeenCalledWith(url, expect.objectContaining({ method: "POST" }));
  });
});

describe("Contact, Turnstile", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    delete window.turnstile;
  });

  it("is off without a site key: no widget, no Cloudflare script, no token sent", async () => {
    vi.stubEnv("VITE_TURNSTILE_SITE_KEY", "");
    fetchMock.mockResolvedValue(new Response("{}", { status: 200 }));
    const { submit } = await fillForm();
    await submit();

    expect(screen.queryByTestId("contact-turnstile")).not.toBeInTheDocument();
    expect(document.querySelector('script[src*="challenges.cloudflare.com"]')).toBeNull();
    const body = JSON.parse(fetchMock.mock.calls[0]?.[1]?.body as string);
    expect(body).not.toHaveProperty("turnstile_token");
  });

  it("with a site key renders the widget, sends its token, then asks for a new one", async () => {
    vi.stubEnv("VITE_TURNSTILE_SITE_KEY", "1x00000000000000000000AA");
    const reset = vi.fn();
    const render = vi.fn((_el: HTMLElement, options: { callback: (t: string) => void }) => {
      options.callback("tok-1");
      return "widget-1";
    });
    window.turnstile = { render, reset, remove: vi.fn() };
    fetchMock.mockResolvedValue(new Response("{}", { status: 200 }));
    const { submit } = await fillForm();
    await waitFor(() => expect(render).toHaveBeenCalledTimes(1));
    expect(render.mock.calls[0]?.[1]).toMatchObject({
      sitekey: "1x00000000000000000000AA",
      appearance: "interaction-only",
    });
    await submit();

    const body = JSON.parse(fetchMock.mock.calls[0]?.[1]?.body as string);
    expect(body.turnstile_token).toBe("tok-1");
    await waitFor(() => expect(reset).toHaveBeenCalledWith("widget-1"));
  });

  it("reports a refused verification (403) clearly", async () => {
    vi.stubEnv("VITE_TURNSTILE_SITE_KEY", "1x00000000000000000000AA");
    window.turnstile = { render: vi.fn(() => "w"), reset: vi.fn(), remove: vi.fn() };
    fetchMock.mockResolvedValue(new Response("{}", { status: 403 }));
    const { submit } = await fillForm();
    await submit();

    expect(await screen.findByTestId("contact-error")).toHaveTextContent(/VERIFICATION FAILED/);
  });
});
