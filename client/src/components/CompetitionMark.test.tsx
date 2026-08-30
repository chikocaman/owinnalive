// @vitest-environment jsdom
import { fireEvent, render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { CompetitionMark } from "./CompetitionMark";
import type { Competition } from "@/lib/types";

afterEach(cleanup);

const competition: Competition = {
  slug: "caf.w.nations",
  name: "Women's Africa Cup of Nations",
  region: "Africa / CAF",
  logo: "https://invalid.example/competition.png",
};

describe("CompetitionMark", () => {
  it("renders initials when no logo is supplied", () => {
    render(<CompetitionMark competition={{ ...competition, logo: undefined }} className="test-mark" />);
    const fallback = screen.getByLabelText("Women's Africa Cup of Nations mark");
    expect(fallback.textContent).toBe("WA");
    expect(fallback.classList.contains("competition-mark__fallback")).toBe(true);
  });

  it("switches to initials after the artwork reports an error", () => {
    const view = render(<CompetitionMark competition={competition} className="test-mark" />);
    const image = view.container.querySelector("img.test-mark");
    if (!image) throw new Error("Competition artwork image was not rendered");
    fireEvent.error(image);
    expect(screen.getByLabelText("Women's Africa Cup of Nations mark").textContent).toBe("WA");
  });
});
