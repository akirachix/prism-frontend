import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";

import OtpInput from "@/app/_components/ui/OtpInput";

function Harness({ onValue }: { onValue?: (v: string) => void }) {
  const [value, setValue] = useState("");
  return (
    <OtpInput
      value={value}
      onChange={(next) => {
        setValue(next);
        onValue?.(next);
      }}
    />
  );
}

describe("OtpInput", () => {
  it("shows six boxes", () => {
    render(<Harness />);
    expect(screen.getAllByLabelText(/Digit \d of 6/)).toHaveLength(6);
  });

  it("moves to the next box after a digit", () => {
    render(<Harness />);
    fireEvent.change(screen.getByLabelText("Digit 1 of 6"), {
      target: { value: "4" },
    });
    expect(screen.getByLabelText("Digit 2 of 6")).toHaveFocus();
  });

  it("ignores letters", () => {
    const onValue = jest.fn();
    render(<Harness onValue={onValue} />);
    fireEvent.change(screen.getByLabelText("Digit 1 of 6"), {
      target: { value: "a" },
    });
    expect(onValue).toHaveBeenLastCalledWith("");
  });

  it("fills every box when a whole code is pasted", () => {
    const onValue = jest.fn();
    render(<Harness onValue={onValue} />);
    fireEvent.paste(screen.getByLabelText("Digit 1 of 6"), {
      clipboardData: { getData: () => "123-456" },
    });
    expect(onValue).toHaveBeenLastCalledWith("123456");
    expect(screen.getByLabelText("Digit 6 of 6")).toHaveValue("6");
  });
});
