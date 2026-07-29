/**
 * @vitest-environment jsdom
 *
 * `CurrencyField` as a user meets it.
 *
 * `currency.test.ts` proves the parser. This proves the component around it:
 * that the parser's guarantees survive contact with typing, blurring, pasting
 * and a controlled parent — which is where they are actually lost.
 *
 * The four acceptance cases P08 names are asserted here through the DOM as well
 * as through the parser, because "12.50 is rejected" is only a real guarantee
 * if it is still true when someone types it into the field.
 */

import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CurrencyField } from './CurrencyField.tsx';
import { installDomPolyfills } from '../../test/dom-polyfills.ts';

installDomPolyfills();
afterEach(cleanup);

/** A controlled host, because that is how the calculator will use the field. */
function Host({
  onChange,
  initial = null,
  ...rest
}: {
  onChange?: (value: number | null) => void;
  initial?: number | null;
  label?: string;
  disabled?: boolean;
}) {
  const [value, setValue] = useState<number | null>(initial);
  return (
    <CurrencyField
      label={rest.label ?? 'Income from overseas clients'}
      hint="Whole rupees."
      value={value}
      disabled={rest.disabled}
      onChange={(next) => {
        setValue(next);
        onChange?.(next);
      }}
    />
  );
}

const field = () => screen.getByLabelText(/income from overseas clients/i);

describe('the input element itself', () => {
  it('is never type="number"', () => {
    render(<Host />);
    const input = field();
    // The prohibition that matters most in this file. A number input brings a
    // spinner and scroll-to-change, and a stray scroll over a focused field
    // silently alters a figure the user is about to declare.
    expect(input).toHaveProperty('type', 'text');
    expect(input.getAttribute('type')).toBe('text');
    expect(input.getAttribute('type')).not.toBe('number');
  });

  it('carries inputmode="numeric" so a phone offers a keypad', () => {
    render(<Host />);
    expect(field().getAttribute('inputmode')).toBe('numeric');
  });

  it('has a real <label> associated with it — not a placeholder', () => {
    render(<Host />);
    const input = field();
    const label = document.querySelector(`label[for="${input.id}"]`);
    expect(label).not.toBeNull();
    expect(label?.textContent).toMatch(/Income from overseas clients/);
    expect(input.getAttribute('placeholder')).toBeNull();
  });

  it('renders in the tabular numeric face via P01’s `figure` utility', () => {
    render(<Host />);
    // Reuses the utility declared in global.css rather than restating
    // font-variant-numeric, so there is one definition of what a figure is.
    expect(field().className.split(/\s+/)).toContain('figure');
  });

  it('describes itself with the hint and the error region', () => {
    render(<Host />);
    const input = field();
    const described = (input.getAttribute('aria-describedby') ?? '').split(/\s+/);
    expect(described).toHaveLength(2);
    for (const id of described) {
      expect(document.getElementById(id)).not.toBeNull();
    }
  });
});

describe('the four acceptance cases, through the DOM', () => {
  it('typing 1234567 shows "1,234,567" and emits the integer 1234567', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Host onChange={onChange} />);

    await user.type(field(), '1234567');

    expect(field()).toHaveProperty('value', '1,234,567');
    expect(onChange).toHaveBeenLastCalledWith(1234567);
    expect(typeof onChange.mock.calls.at(-1)?.[0]).toBe('number');
  });

  it('clearing the field emits null — not 0', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Host onChange={onChange} initial={45000} />);

    await user.clear(field());

    expect(field()).toHaveProperty('value', '');
    expect(onChange).toHaveBeenLastCalledWith(null);
    // Stated separately because this is the invariant that would be easiest to
    // break by accident and hardest to notice: a `?? 0` anywhere on the path
    // turns "not entered" into "declared nil".
    expect(onChange.mock.calls.at(-1)?.[0]).toBeNull();
    expect(onChange).not.toHaveBeenCalledWith(0);
  });

  it('12.50 is refused on blur with a message, and is not rounded', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Host onChange={onChange} />);

    await user.type(field(), '12.50');
    const callsWhileTyping = onChange.mock.calls.length;
    await user.tab();

    expect(await screen.findByText(/whole number of rupees/i)).toBeTruthy();
    expect(field().getAttribute('aria-invalid')).toBe('true');

    // The refusal emitted nothing at all. No rounded figure, no null, no zero —
    // the call count is unchanged across the blur.
    expect(onChange.mock.calls).toHaveLength(callsWhileTyping);

    // And "12.50" never became a number by any route. 13 would be rounding up,
    // 12.5 would be a float on a calculation path, and 1250 would be reading
    // the cents as rupees.
    const emitted = onChange.mock.calls.map((call) => call[0]);
    expect(emitted).not.toContain(13);
    expect(emitted).not.toContain(12.5);
    expect(emitted).not.toContain(1250);

    // The text the user typed is still on screen — the field does not eat it.
    expect(field()).toHaveProperty('value', '12.50');
  });

  it('documents the live-update emissions that precede a refusal', async () => {
    // Worth stating plainly because it looks like a leak and is not. Typing
    // "12.50" one key at a time means the field genuinely held "1", then "12",
    // and each of those was a readable figure at the moment it was emitted —
    // ui-behaviour.md's valid state is "result updates live". The keystrokes
    // from "12." onward emit nothing.
    //
    // The consequence is that after the refusal the consumer still holds 12,
    // which is why `onValidityChange(false)` fires: the specified invalid
    // behaviour is that the panel "retains the last valid figure, visibly
    // marked stale". It is not that the figure silently becomes 12.
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onValidityChange = vi.fn();
    render(
      <CurrencyField
        label="Interest received"
        value={null}
        onChange={onChange}
        onValidityChange={onValidityChange}
      />,
    );

    await user.type(screen.getByLabelText(/interest received/i), '12.50');
    expect(onChange.mock.calls.map((call) => call[0])).toEqual([1, 12]);

    await user.tab();
    expect(onValidityChange).toHaveBeenLastCalledWith({
      valid: false,
      message: expect.stringMatching(/whole number of rupees/i),
    });
  });

  it('pasting "Rs. 45,000" gives 45000', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Host onChange={onChange} />);

    await user.click(field());
    await user.paste('Rs. 45,000');

    expect(onChange).toHaveBeenLastCalledWith(45000);
    expect(field()).toHaveProperty('value', '45,000');
  });
});

describe('empty is not zero, everywhere', () => {
  it('an untouched field renders blank — never "Rs. 0" and never "0"', () => {
    render(<Host />);
    expect(field()).toHaveProperty('value', '');
    expect(screen.queryByDisplayValue('0')).toBeNull();
    expect(screen.queryByText('Rs. 0')).toBeNull();
  });

  it('marks itself data-state="empty" for anything styling the empty case', () => {
    const { container } = render(<Host />);
    expect(container.querySelector('.ui-currency')?.getAttribute('data-state')).toBe(
      'empty',
    );
  });

  it('a typed 0 is a declared nil and is emitted as 0, distinct from empty', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Host onChange={onChange} />);

    await user.type(field(), '0');

    expect(onChange).toHaveBeenLastCalledWith(0);
    expect(field()).toHaveProperty('value', '0');
  });

  it('a null value prop never renders a zero into the box', () => {
    render(<CurrencyField label="Rent received" value={null} onChange={() => {}} />);
    expect(screen.getByLabelText(/rent received/i)).toHaveProperty('value', '');
  });
});

describe('validation happens on blur, not on keystroke', () => {
  it('says nothing while a decimal is still being typed', async () => {
    const user = userEvent.setup();
    render(<Host />);

    await user.type(field(), '12.');

    // Half a number is not an error. Telling someone their half-typed figure is
    // wrong is hostile, and this tool's users are already anxious.
    expect(screen.queryByText(/whole number of rupees/i)).toBeNull();
    expect(field().getAttribute('aria-invalid')).toBeNull();
  });

  it('reports the refusal only once focus leaves', async () => {
    const user = userEvent.setup();
    const onValidityChange = vi.fn();
    render(
      <CurrencyField
        label="Interest received"
        value={null}
        onChange={() => {}}
        onValidityChange={onValidityChange}
      />,
    );

    await user.type(screen.getByLabelText(/interest received/i), '99.99');
    expect(onValidityChange).not.toHaveBeenCalled();

    await user.tab();
    expect(onValidityChange).toHaveBeenCalledWith({
      valid: false,
      message: expect.stringMatching(/whole number of rupees/i),
    });
  });

  it('clears an earned error as soon as the entry parses again', async () => {
    const user = userEvent.setup();
    render(<Host />);

    await user.type(field(), '12.50');
    await user.tab();
    expect(screen.queryByText(/whole number of rupees/i)).not.toBeNull();

    await user.click(field());
    await user.clear(field());
    await user.type(field(), '1250');

    expect(screen.queryByText(/whole number of rupees/i)).toBeNull();
    expect(field().getAttribute('aria-invalid')).toBeNull();
  });

  it('keeps the model’s last good figure while the entry is unreadable', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Host onChange={onChange} initial={45000} />);

    await user.click(field());
    await user.type(field(), 'x');
    await user.tab();

    // Nothing was emitted for the bad entry, so the consumer still holds 45000
    // and can mark it stale — which is exactly what ui-behaviour.md's invalid
    // state describes. Emitting null here would blank a figure the user never
    // deleted.
    const emitted = onChange.mock.calls.map((call) => call[0]);
    expect(emitted).not.toContain(null);
    expect(emitted.every((value) => value === 45000 || value === undefined)).toBe(true);
  });
});

describe('normalisation on blur', () => {
  it('regroups a messily separated figure once the user has finished', async () => {
    const user = userEvent.setup();
    render(<Host />);

    await user.type(field(), '1,2,3,4');
    await user.tab();

    expect(field()).toHaveProperty('value', '1,234');
  });

  it('drops leading zeros on blur', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Host onChange={onChange} />);

    await user.type(field(), '0007');
    await user.tab();

    expect(field()).toHaveProperty('value', '7');
    expect(onChange).toHaveBeenLastCalledWith(7);
  });
});

describe('formatting never re-enters the model', () => {
  it('every emitted value is an integer or null — never a string', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<Host onChange={onChange} />);

    await user.type(field(), 'Rs. 1,234,567');
    await user.tab();
    await user.click(field());
    await user.clear(field());
    await user.type(field(), '450');
    await user.tab();

    expect(onChange).toHaveBeenCalled();
    for (const [value] of onChange.mock.calls) {
      if (value === null) continue;
      expect(typeof value).toBe('number');
      expect(Number.isSafeInteger(value)).toBe(true);
    }
  });

  it('separators are inserted while typing, not only on blur', async () => {
    const user = userEvent.setup();
    render(<Host />);

    await user.type(field(), '1234');
    // Still focused — no blur has happened.
    expect(field()).toHaveProperty('value', '1,234');
    expect(document.activeElement).toBe(field());
  });
});

describe('the value prop drives the display when it changes from outside', () => {
  it('shows a figure supplied by the parent, formatted', () => {
    render(
      <CurrencyField label="Employment income" value={1234567} onChange={() => {}} />,
    );
    expect(screen.getByLabelText(/employment income/i)).toHaveProperty(
      'value',
      '1,234,567',
    );
  });

  it('follows a reset to null by emptying, not by showing 0', () => {
    const { rerender } = render(
      <CurrencyField label="Employment income" value={1234567} onChange={() => {}} />,
    );
    rerender(
      <CurrencyField label="Employment income" value={null} onChange={() => {}} />,
    );
    expect(screen.getByLabelText(/employment income/i)).toHaveProperty('value', '');
  });
});

describe('disabled', () => {
  it('is a real disabled attribute, so it leaves the tab order', async () => {
    const user = userEvent.setup();
    render(<Host disabled />);
    const input = field();
    expect(input).toHaveProperty('disabled', true);

    await user.tab();
    expect(document.activeElement).not.toBe(input);
  });
});

describe('the refusal message is content, not decoration', () => {
  it('is announced through a live region that already exists', () => {
    render(<Host />);
    const region = document.querySelector('.ui-field__error');
    // Present before it has anything to say. A live region created at the
    // moment it fills is frequently missed by screen readers.
    expect(region).not.toBeNull();
    expect(region?.getAttribute('aria-live')).toBe('polite');
    expect(region?.textContent).toBe('');
  });

  it('carries the word "Error" for anyone not reading the triangle’s shape', async () => {
    const user = userEvent.setup();
    render(<Host />);

    await user.type(field(), '12.50');
    await user.tab();

    const region = document.querySelector('.ui-field__error');
    expect(region?.textContent).toMatch(/^Error: /);
    // Colour never carries meaning alone: an icon AND a word AND the text.
    expect(region?.querySelector('svg')).not.toBeNull();
  });
});
