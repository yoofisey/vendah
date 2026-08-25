import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { StatusBadge } from "@/app/(dashboard)/orders/page";

describe("StatusBadge", () => {
  it("renders pending status with correct styles", () => {
    render(<StatusBadge status="pending" />);
    const badge = screen.getByText("pending");
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain("bg-amber-100");
  });

  it("renders paid status", () => {
    render(<StatusBadge status="paid" />);
    expect(screen.getByText("paid")).toHaveClass("bg-emerald-100");
  });

  it("renders processing status", () => {
    render(<StatusBadge status="processing" />);
    expect(screen.getByText("processing")).toHaveClass("bg-blue-100");
  });

  it("renders shipped status", () => {
    render(<StatusBadge status="shipped" />);
    expect(screen.getByText("shipped")).toHaveClass("bg-purple-100");
  });

  it("renders delivered status", () => {
    render(<StatusBadge status="delivered" />);
    expect(screen.getByText("delivered")).toHaveClass("bg-green-100");
  });

  it("renders cancelled status", () => {
    render(<StatusBadge status="cancelled" />);
    expect(screen.getByText("cancelled")).toHaveClass("bg-red-100");
  });

  it("renders unknown status with fallback styles", () => {
    render(<StatusBadge status="unknown" />);
    const badge = screen.getByText("unknown");
    expect(badge).toHaveClass("bg-charcoal/10");
  });

  it("capitalizes the status text via CSS", () => {
    render(<StatusBadge status="pending" />);
    expect(screen.getByText("pending")).toHaveClass("capitalize");
  });
});
