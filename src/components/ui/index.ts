/**
 * The UI component inventory.
 *
 * `ui-design-system.md` splits components into "constrained" (required
 * behaviour from ADR-0003) and "free" (ordinary). Both halves are exported
 * here, and the file is split the same way, because the distinction is the
 * whole point: a change to a free component is a design decision, and a change
 * to a constrained one is an ADR.
 *
 * The constrained ones are built *from* the free ones — `Callout` is the base
 * of `WarningList` and `RefusalPanel`, which is why `Callout` has no dismiss
 * and no collapse.
 *
 * `Disclaimer` and `AsAtStamp` are the other two constrained components and are
 * not here: they are `.astro` components in `src/components/`, because the
 * disclaimer belongs to the base layout on every page rather than to a
 * hydrated island.
 */

// ---------------------------------------------------------------------------
// Free — ordinary components (P08)
// ---------------------------------------------------------------------------

export { Button } from './Button.tsx';
export type { ButtonProps, ButtonVariant } from './Button.tsx';

export { TextField } from './TextField.tsx';
export type { TextFieldProps } from './TextField.tsx';

export { CurrencyField } from './CurrencyField.tsx';
export type { CurrencyFieldProps, CurrencyFieldValidity } from './CurrencyField.tsx';

export {
  CURRENCY_MESSAGES,
  formatRupees,
  formatRupeesWithUnit,
  parseRupees,
} from './currency.ts';
export type { CurrencyParseErrorCode, CurrencyParseResult } from './currency.ts';

export { RadioCardGroup } from './RadioCardGroup.tsx';
export type { RadioCardGroupProps, RadioCardOption } from './RadioCardGroup.tsx';

export { Select } from './Select.tsx';
export type { SelectOption, SelectProps } from './Select.tsx';

export { Callout } from './Callout.tsx';
export type { CalloutProps, CalloutTone } from './Callout.tsx';

export { Card } from './Card.tsx';
export type { CardProps } from './Card.tsx';

export { Table } from './Table.tsx';
export type { TableColumn, TableProps } from './Table.tsx';

export { Stepper } from './Stepper.tsx';
export type { Step, StepperProps, StepStatus } from './Stepper.tsx';

export { ProgressIndicator } from './ProgressIndicator.tsx';
export type { ProgressIndicatorProps } from './ProgressIndicator.tsx';

export { Tabs } from './Tabs.tsx';
export type { TabItem, TabsProps } from './Tabs.tsx';

export { Skeleton } from './Skeleton.tsx';
export type { SkeletonProps } from './Skeleton.tsx';

export { PersonaCardGroup } from './PersonaCard.tsx';
export type { Persona, PersonaCardGroupProps } from './PersonaCard.tsx';

// ---------------------------------------------------------------------------
// Constrained — ADR-0003 requires these behaviours (P09)
//
// Warnings above the result and expanded; refusals replacing the figure;
// a citation on every displayed rate; a badge on every unverified figure; a
// year of assessment that is chosen and never assumed. Changing any of these
// needs a superseding ADR, not a judgement call in a component.
// ---------------------------------------------------------------------------

export { WarningList } from './WarningList.tsx';
export type { WarningListProps } from './WarningList.tsx';

export {
  RefusalPanel,
  refusalCopy,
  hasRefusalCopy,
  UI_REFUSAL_CODES,
} from './RefusalPanel.tsx';
export type {
  ComputedTaxResult,
  RefusalCopy,
  RefusalPanelProps,
} from './RefusalPanel.tsx';

export {
  UI_WARNING_CODES,
  SEVERITY_LABEL,
  SEVERITY_TONE,
  UNKNOWN_WARNING_COPY,
  hasWarningCopy,
  warningCopy,
} from './warning-copy.ts';
export type { WarningCopy } from './warning-copy.ts';

export { CitationRef, splitSrc } from './CitationRef.tsx';
export type { CitationRefProps, CitationSource } from './CitationRef.tsx';

export { NotYetLawBadge, UnverifiedBadge } from './UnverifiedBadge.tsx';
export type { NotYetLawBadgeProps, UnverifiedBadgeProps } from './UnverifiedBadge.tsx';

export {
  YearSelector,
  countUnverifiedFigures,
  newestFirst,
  reviewedOnLabel,
  toYearOption,
  yearSpanLabel,
} from './YearSelector.tsx';
export type { YearOption, YearSelectorProps } from './YearSelector.tsx';

// ---------------------------------------------------------------------------
// Icons — exported so a status shown outside `src/components/ui/` (P12's
// mobile summary bar, which pairs a blocking indicator's icon with its own
// word rather than colour alone) can use the same distinct shapes as
// `Callout` and `WarningList`, instead of inventing a second glyph for the
// same tone.
// ---------------------------------------------------------------------------

export { IconOctagonAlert } from './icons.tsx';
