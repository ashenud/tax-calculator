/**
 * @vitest-environment jsdom
 *
 * Keyboard-only operation of every primitive.
 *
 * Driven with `@testing-library/user-event`, which dispatches real key events
 * through the DOM rather than calling handlers directly — so what is asserted
 * is what a keyboard user gets, not what the component's props suggest they
 * ought to get. "Keyboard accessible" asserted by inspection is a claim; this
 * is a check.
 *
 * What each component owes a keyboard user:
 *
 *   Button              reachable by Tab; Enter and Space activate.
 *   TextField           reachable by Tab; typing works; disabled leaves the
 *                       tab order entirely.
 *   CurrencyField       as TextField, plus the caret survives regrouping so
 *                       editing the middle of a figure is possible at all.
 *   RadioCardGroup      ONE tab stop for the group; arrows move the selection;
 *                       Home/End jump; disabled options are skipped.
 *   PersonaCardGroup    the same contract.
 *   Select              Enter/Space/Alt+Down open; arrows move; Enter chooses;
 *                       Escape closes AND returns focus to the trigger.
 *   Tabs                one tab stop for the list; arrows move focus; Enter
 *                       selects (manual activation); Tab then enters the panel.
 *   Stepper             each activatable step is a real button.
 *   Table               the scroll region is focusable, so columns pushed
 *                       off-screen on a narrow display are reachable.
 *   ProgressIndicator   no tab stop — it takes no input.
 *   Skeleton            no tab stop.
 *   Callout / Card      no tab stop of their own.
 */

import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { UserEvent } from '@testing-library/user-event';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Button } from './Button.tsx';
import { Callout } from './Callout.tsx';
import { Card } from './Card.tsx';
import { CurrencyField } from './CurrencyField.tsx';
import { PersonaCardGroup } from './PersonaCard.tsx';
import { ProgressIndicator } from './ProgressIndicator.tsx';
import { RadioCardGroup } from './RadioCardGroup.tsx';
import { Select } from './Select.tsx';
import { Skeleton } from './Skeleton.tsx';
import { Stepper } from './Stepper.tsx';
import { Table } from './Table.tsx';
import { Tabs } from './Tabs.tsx';
import { TextField } from './TextField.tsx';
import { installDomPolyfills } from '../../test/dom-polyfills.ts';

installDomPolyfills();
afterEach(cleanup);

const ROUTES = [
  { value: 'direct', label: 'Direct transfer into my Sri Lankan bank account' },
  { value: 'fx', label: 'Into a foreign-currency account at a Sri Lankan bank' },
  { value: 'offshore', label: 'Kept in an account outside Sri Lanka' },
] as const;

const YEARS = [
  { value: '2025-2026', label: '2025/2026 (1 Apr 2025 – 31 Mar 2026)' },
  { value: '2024-2025', label: '2024/2025 (1 Apr 2024 – 31 Mar 2025)' },
] as const;

/**
 * Move roving focus with an arrow key inside a Radix `RadioGroup`, and wait for the
 * selection to follow it.
 *
 * Radix's roving-focus-group moves focus via `setTimeout(0)` rather than synchronously
 * inside the keydown handler (`@radix-ui/react-roving-focus`), and `RadioGroupItemTrigger`
 * decides whether to select the newly focused item by checking a ref that is only `true`
 * between a document-level `keydown` and the matching `keyup`
 * (`@radix-ui/react-radio-group`). `userEvent.keyboard('{ArrowDown}')` dispatches both of
 * those synchronously, so by the time the deferred focus actually lands the ref has
 * already flipped back to `false` and nothing gets selected — a real gap between "focus
 * moved" and "selection followed" that only shows up because this harness drives real
 * events instead of calling handlers directly.
 *
 * Holding the key down (`{ArrowDown>}`) keeps that ref `true` until we release it, which
 * gives the deferred focus its intended window. `settledOn` is asserted inside `waitFor`
 * so the release always happens, pass or fail, and a real regression here fails with a
 * timeout on the assertion rather than hanging.
 */
async function arrowTo(
  user: UserEvent,
  key: 'ArrowDown' | 'ArrowUp',
  settledOn: () => HTMLElement,
): Promise<void> {
  await user.keyboard(`{${key}>}`);
  try {
    await waitFor(() => {
      expect(settledOn()).toHaveProperty('ariaChecked', 'true');
    });
  } finally {
    await user.keyboard(`{/${key}}`);
  }
}

/* ========================================================================= */

describe('Button', () => {
  it('is reachable by Tab and activated by Enter and by Space', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Show my figure</Button>);

    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole('button'));

    await user.keyboard('{Enter}');
    expect(onClick).toHaveBeenCalledTimes(1);

    await user.keyboard(' ');
    expect(onClick).toHaveBeenCalledTimes(2);
  });

  it('leaves the tab order when disabled, and cannot be activated', async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <>
        <Button onClick={onClick} disabled disabledReason="Choose a year first.">
          Show my figure
        </Button>
        <Button>After</Button>
      </>,
    );

    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'After' }));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('defaults to type="button" so it cannot submit a form by accident', () => {
    render(<Button>Show my figure</Button>);
    expect(screen.getByRole('button').getAttribute('type')).toBe('button');
  });
});

/* ========================================================================= */

describe('TextField', () => {
  it('is reachable by Tab and accepts typing', async () => {
    const user = userEvent.setup();
    function Host() {
      const [value, setValue] = useState('');
      return <TextField label="Name as registered" value={value} onChange={setValue} />;
    }
    render(<Host />);

    await user.tab();
    const input = screen.getByLabelText(/name as registered/i);
    expect(document.activeElement).toBe(input);

    await user.keyboard('A. Perera');
    expect(input).toHaveProperty('value', 'A. Perera');
  });

  it('is skipped by Tab when disabled', async () => {
    const user = userEvent.setup();
    render(
      <>
        <TextField label="Assessment number" disabled value="" onChange={() => {}} />
        <Button>After</Button>
      </>,
    );
    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'After' }));
  });
});

/* ========================================================================= */

describe('CurrencyField', () => {
  it('is reachable by Tab and blurs to the next control with Tab', async () => {
    const user = userEvent.setup();
    render(
      <>
        <CurrencyField label="Employment income" value={null} onChange={() => {}} />
        <Button>After</Button>
      </>,
    );

    await user.tab();
    const input = screen.getByLabelText(/employment income/i);
    expect(document.activeElement).toBe(input);

    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'After' }));
  });

  it('keeps the caret where the user is typing when a separator is inserted', async () => {
    // Without caret restoration, typing into the middle of "1,234,567" throws
    // the cursor to a position unrelated to where the user was — which makes
    // correcting a mistyped digit effectively impossible from the keyboard.
    const user = userEvent.setup();
    function Host() {
      const [value, setValue] = useState<number | null>(1234567);
      return (
        <CurrencyField label="Employment income" value={value} onChange={setValue} />
      );
    }
    render(<Host />);

    const input = screen.getByLabelText(/employment income/i) as HTMLInputElement;
    await user.click(input);
    // Place the caret after the "4" in "1,2 3 4,567" → offset 6.
    input.setSelectionRange(6, 6);
    await user.keyboard('9');

    expect(input.value).toBe('12,349,567');
    // The caret sits immediately after the digit just typed.
    expect(input.selectionStart).toBe(6);
    expect(input.value.slice(0, 6)).toBe('12,349');
  });

  it('can be corrected entirely from the keyboard after a refusal', async () => {
    const user = userEvent.setup();
    function Host() {
      const [value, setValue] = useState<number | null>(null);
      return (
        <CurrencyField label="Interest received" value={value} onChange={setValue} />
      );
    }
    render(<Host />);

    await user.tab();
    await user.keyboard('12.50');
    await user.tab();
    expect(screen.queryByText(/whole number of rupees/i)).not.toBeNull();

    // Shift+Tab back, select all, retype. No pointer involved anywhere.
    await user.tab({ shift: true });
    await user.keyboard('{Control>}a{/Control}1250');
    await user.tab();

    expect(screen.queryByText(/whole number of rupees/i)).toBeNull();
    expect(screen.getByLabelText(/interest received/i)).toHaveProperty('value', '1,250');
  });
});

/* ========================================================================= */

describe('RadioCardGroup', () => {
  function Host({ initial = null }: { initial?: string | null }) {
    const [value, setValue] = useState<string | null>(initial);
    return (
      <>
        <RadioCardGroup
          legend="How did the money reach you?"
          options={ROUTES}
          value={value}
          onValueChange={setValue}
        />
        <Button>After</Button>
      </>
    );
  }

  it('is one tab stop for the whole group', async () => {
    const user = userEvent.setup();
    render(<Host initial="direct" />);

    await user.tab();
    expect(document.activeElement).toBe(
      screen.getByRole('radio', { name: ROUTES[0].label }),
    );

    await user.tab();
    // Not the second radio — the group is a single stop, per the WAI-ARIA
    // radio pattern. A group built from buttons would put three stops here.
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'After' }));
  });

  it('moves and selects with the arrow keys', async () => {
    const user = userEvent.setup();
    render(<Host initial="direct" />);

    await user.tab();
    await arrowTo(user, 'ArrowDown', () =>
      screen.getByRole('radio', { name: ROUTES[1].label }),
    );

    await arrowTo(user, 'ArrowDown', () =>
      screen.getByRole('radio', { name: ROUTES[2].label }),
    );

    // Wraps, which is what the pattern specifies.
    await arrowTo(user, 'ArrowDown', () =>
      screen.getByRole('radio', { name: ROUTES[0].label }),
    );

    await arrowTo(user, 'ArrowUp', () =>
      screen.getByRole('radio', { name: ROUTES[2].label }),
    );
  });

  it('selects the focused card with Space when nothing was selected', async () => {
    const user = userEvent.setup();
    render(<Host />);

    await user.tab();
    await user.keyboard(' ');
    expect(screen.getByRole('radio', { name: ROUTES[0].label })).toHaveProperty(
      'ariaChecked',
      'true',
    );
  });

  it('exposes the group with its question as the accessible name', () => {
    render(<Host />);
    const group = screen.getByRole('radiogroup', {
      name: /how did the money reach you\?/i,
    });
    expect(group).not.toBeNull();
  });

  it('announces each option’s description without swallowing its name', () => {
    render(
      <RadioCardGroup
        legend="How did the money reach you?"
        options={[
          {
            value: 'direct',
            label: 'Direct transfer into my Sri Lankan bank account',
            description: 'The money arrived in a rupee account at a bank in Sri Lanka.',
          },
        ]}
        value={null}
        onValueChange={() => {}}
      />,
    );
    const radio = screen.getByRole('radio', {
      name: 'Direct transfer into my Sri Lankan bank account',
    });
    const describedBy = radio.getAttribute('aria-describedby');
    expect(describedBy).not.toBeNull();
    expect(document.getElementById(describedBy!)?.textContent).toMatch(/rupee account/);
  });

  it('skips a disabled option when arrowing', async () => {
    const user = userEvent.setup();
    function DisabledHost() {
      const [value, setValue] = useState<string | null>('direct');
      return (
        <RadioCardGroup
          legend="How did the money reach you?"
          options={[
            ROUTES[0],
            { value: 'fx', label: 'Unavailable route', disabled: true },
            ROUTES[2],
          ]}
          value={value}
          onValueChange={setValue}
        />
      );
    }
    render(<DisabledHost />);

    await user.tab();
    // Item 1 (index 1) is disabled, so the roving focus group must skip straight to
    // item 2 — the same arrowTo helper proves both that focus skipped it AND that the
    // selection followed, in one wait.
    await arrowTo(user, 'ArrowDown', () =>
      screen.getByRole('radio', { name: ROUTES[2].label }),
    );
  });
});

/* ========================================================================= */

describe('PersonaCardGroup', () => {
  it('is one tab stop, arrow-navigable, and always offers a way out', async () => {
    const user = userEvent.setup();
    function Host() {
      const [value, setValue] = useState<string | null>('p1');
      return (
        <PersonaCardGroup
          legend="Which of these is closest to your situation?"
          personas={[
            { id: 'p1', situation: 'I work for overseas clients' },
            { id: 'p2', situation: 'I am employed but no tax is deducted' },
          ]}
          value={value}
          onValueChange={setValue}
        />
      );
    }
    render(<Host />);

    // The escape hatch is part of the component, not the caller's memory.
    const none = screen.getByRole('radio', { name: /none of these/i });
    expect(none).not.toBeNull();

    await user.tab();
    await arrowTo(user, 'ArrowDown', () =>
      screen.getByRole('radio', { name: 'I am employed but no tax is deducted' }),
    );
    await arrowTo(user, 'ArrowDown', () => none);
  });
});

/* ========================================================================= */

describe('Select', () => {
  function Host({ initial = null }: { initial?: string | null }) {
    const [value, setValue] = useState<string | null>(initial);
    return (
      <Select
        label="Year of assessment"
        prompt="Choose a year"
        options={YEARS}
        value={value}
        onValueChange={setValue}
      />
    );
  }

  it('opens with Enter and chooses with Enter', async () => {
    const user = userEvent.setup();
    render(<Host />);

    await user.tab();
    const trigger = screen.getByRole('combobox', { name: /year of assessment/i });
    expect(document.activeElement).toBe(trigger);

    await user.keyboard('{Enter}');
    expect(await screen.findByRole('listbox')).not.toBeNull();

    await user.keyboard('{ArrowDown}{Enter}');
    expect(trigger.textContent).toMatch(/2024\/2025/);
  });

  it('opens with Space', async () => {
    const user = userEvent.setup();
    render(<Host />);
    await user.tab();
    await user.keyboard(' ');
    expect(await screen.findByRole('listbox')).not.toBeNull();
  });

  it('closes with Escape and returns focus to the trigger', async () => {
    // ui-behaviour.md: "Escape closes any overlay; focus returns to the
    // trigger." A dropdown that drops focus to <body> on Escape strands a
    // keyboard user at the top of the page.
    const user = userEvent.setup();
    render(<Host />);

    await user.tab();
    const trigger = screen.getByRole('combobox', { name: /year of assessment/i });
    await user.keyboard('{Enter}');
    await screen.findByRole('listbox');

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('listbox')).toBeNull();
    expect(document.activeElement).toBe(trigger);
  });

  it('has a real <label> bound to the trigger, not just an aria-label', () => {
    render(<Host />);
    const trigger = screen.getByRole('combobox', { name: /year of assessment/i });
    // <button> is a labelable element, so `for` genuinely associates and
    // clicking the label opens the list.
    const label = document.querySelector(`label[for="${trigger.id}"]`);
    expect(label).not.toBeNull();
    expect(label?.textContent).toMatch(/Year of assessment/);
  });

  it('shows the prompt when nothing is chosen, and no year is preselected', () => {
    render(<Host />);
    const trigger = screen.getByRole('combobox', { name: /year of assessment/i });
    expect(trigger.textContent).toMatch(/Choose a year/);
    // The year of assessment is never defaulted from the clock (ADR-0003).
    expect(trigger.textContent).not.toMatch(/\d{4}\/\d{4}/);
  });
});

/* ========================================================================= */

describe('Tabs', () => {
  const items = [
    { value: 'a', label: '2025/2026', content: <p>Bands for 2025/2026</p> },
    { value: 'b', label: '2024/2025', content: <p>Bands for 2024/2025</p> },
  ];

  it('is one tab stop, arrow-navigable, Enter to select', async () => {
    const user = userEvent.setup();
    render(<Tabs ariaLabel="Rate bands by year" items={items} />);

    await user.tab();
    expect(document.activeElement).toBe(screen.getByRole('tab', { name: '2025/2026' }));

    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(screen.getByRole('tab', { name: '2024/2025' }));
    // Manual activation: arrowing moves focus without swapping the panel, so a
    // screen reader is not made to read a new panel on every arrow press.
    expect(screen.getByRole('tab', { name: '2025/2026' })).toHaveProperty(
      'ariaSelected',
      'true',
    );

    await user.keyboard('{Enter}');
    expect(screen.getByRole('tab', { name: '2024/2025' })).toHaveProperty(
      'ariaSelected',
      'true',
    );
    expect(screen.getByRole('tabpanel').textContent).toMatch(/2024\/2025/);
  });

  it('names its tab list', () => {
    render(<Tabs ariaLabel="Rate bands by year" items={items} />);
    expect(screen.getByRole('tablist', { name: 'Rate bands by year' })).not.toBeNull();
  });
});

/* ========================================================================= */

describe('Stepper', () => {
  it('makes revisitable steps real buttons and unreachable ones plain text', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(
      <Stepper
        ariaLabel="Progress through the questions"
        steps={[
          { id: 'persona', label: 'Your situation', status: 'complete', onSelect },
          { id: 'income', label: 'Income', status: 'current' },
          { id: 'result', label: 'Result', status: 'upcoming' },
        ]}
      />,
    );

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(1);

    await user.tab();
    expect(document.activeElement).toBe(buttons[0]);
    await user.keyboard('{Enter}');
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('marks the current step with aria-current="step"', () => {
    render(
      <Stepper
        ariaLabel="Progress through the questions"
        steps={[
          { id: 'persona', label: 'Your situation', status: 'complete' },
          { id: 'income', label: 'Income', status: 'current' },
        ]}
      />,
    );
    const current = document.querySelector('[aria-current="step"]');
    expect(current?.textContent).toMatch(/Income/);
  });

  it('states each step’s status in words, not by colour', () => {
    render(
      <Stepper
        ariaLabel="Progress through the questions"
        steps={[
          { id: 'a', label: 'Your situation', status: 'complete' },
          { id: 'b', label: 'Income', status: 'current' },
          { id: 'c', label: 'Tax already paid', status: 'attention' },
          { id: 'd', label: 'Result', status: 'upcoming' },
        ]}
      />,
    );
    // testing-library's default text normalizer trims each matched node, so the
    // component's trailing "Completed: " (the space that keeps the visually-hidden
    // word from running into the visible label for a screen reader) reads as
    // "Completed:" here — a normalizer artefact, not a claim that the component omits
    // the space. Confirmed against the rendered DOM: the visually-hidden span's
    // `textContent` is "Completed: " with the space present.
    const nav = screen.getByRole('navigation', {
      name: 'Progress through the questions',
    });
    expect(within(nav).getByText(/^Completed:$/)).not.toBeNull();
    expect(within(nav).getByText(/^Current step:$/)).not.toBeNull();
    expect(within(nav).getByText(/^Needs attention:$/)).not.toBeNull();
    expect(within(nav).getByText(/^Not started yet:$/)).not.toBeNull();
  });
});

/* ========================================================================= */

describe('Table', () => {
  const columns = [
    { key: 'step', header: 'Step', rowHeader: true },
    { key: 'amount', header: 'Amount (Rs.)', numeric: true },
  ];

  it('gives the scroll region a tab stop and a name', async () => {
    const user = userEvent.setup();
    render(
      <Table
        caption="How the figure was reached"
        columns={columns}
        rows={[{ step: 'Assessable income', amount: '1,234,567' }]}
        emptyMessage="Nothing entered yet."
      />,
    );

    await user.tab();
    const region = screen.getByRole('region', { name: 'How the figure was reached' });
    expect(document.activeElement).toBe(region);
  });

  it('is a real table with scoped headers', () => {
    render(
      <Table
        caption="How the figure was reached"
        columns={columns}
        rows={[{ step: 'Assessable income', amount: '1,234,567' }]}
        emptyMessage="Nothing entered yet."
      />,
    );
    expect(screen.getByRole('table')).not.toBeNull();
    expect(screen.getByRole('columnheader', { name: 'Step' }).getAttribute('scope')).toBe(
      'col',
    );
    expect(
      screen.getByRole('rowheader', { name: 'Assessable income' }).getAttribute('scope'),
    ).toBe('row');
  });
});

/* ========================================================================= */

describe('components that must NOT take a tab stop', () => {
  it('ProgressIndicator, Skeleton, Callout and Card are not focusable', async () => {
    const user = userEvent.setup();
    render(
      <>
        <ProgressIndicator value={3} max={8} label="Question 4 of 8" />
        <Skeleton lines={2} label="Loading" />
        <Callout tone="caution" title="A rate used here is not yet confirmed">
          <p>Treat the result as provisional.</p>
        </Callout>
        <Card title="Ordinary card">
          <p>Body</p>
        </Card>
        <Button>Only stop</Button>
      </>,
    );

    await user.tab();
    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: 'Only stop' }),
    );

    await user.tab();
    // Nothing else in the tree took focus — it wrapped back to the document.
    expect(document.activeElement).toBe(document.body);
  });
});
