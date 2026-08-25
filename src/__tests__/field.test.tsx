import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Field } from "@/components/auth/field";

describe("Field", () => {
  it("renders label and input", () => {
    render(<Field label="Email" name="email" />);
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
  });

  it("renders placeholder", () => {
    render(<Field label="Email" name="email" placeholder="you@example.com" />);
    expect(screen.getByPlaceholderText("you@example.com")).toBeInTheDocument();
  });

  it("shows error state", () => {
    render(<Field label="Email" name="email" error="Required" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Required");
  });

  it("shows valid state with check icon", () => {
    const { container } = render(
      <Field label="Email" name="email" valid value="test@example.com" />
    );
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("calls onChange with value", () => {
    const onChange = vi.fn();
    render(<Field label="Email" name="email" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "test" },
    });
    expect(onChange).toHaveBeenCalledWith("test");
  });

  it("calls onBlur", () => {
    const onBlur = vi.fn();
    render(<Field label="Email" name="email" onBlur={onBlur} />);
    fireEvent.blur(screen.getByLabelText("Email"));
    expect(onBlur).toHaveBeenCalled();
  });

  it("renders trailing element", () => {
    render(
      <Field
        label="Password"
        name="password"
        trailing={<button>Toggle</button>}
      />
    );
    expect(screen.getByText("Toggle")).toBeInTheDocument();
  });

  it("renders hint text", () => {
    render(<Field label="Name" name="name" hint="Your full name" />);
    expect(screen.getByText("Your full name")).toBeInTheDocument();
  });

  it("renders validText when valid", () => {
    render(
      <Field label="Password" name="password" valid validText="Strong" />
    );
    expect(screen.getByText("Strong")).toBeInTheDocument();
  });

  it("applies custom className", () => {
    render(<Field label="Test" name="test" className="custom-class" />);
    expect(screen.getByLabelText("Test").className).toContain("custom-class");
  });

  it("passes input props like type and autoComplete", () => {
    render(
      <Field
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
      />
    );
    const input = screen.getByLabelText("Email");
    expect(input).toHaveAttribute("type", "email");
    expect(input).toHaveAttribute("autocomplete", "email");
  });
});
