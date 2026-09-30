import { Segmented } from './Segmented';

export type UnitSystem = 'imperial' | 'metric';

export interface UnitToggleProps {
  value: UnitSystem;
  onChange: (v: UnitSystem) => void;
  imperialLabel?: string;
  metricLabel?: string;
}

/** Imperial by default (U.S. audience), metric one tap away (docs/09 stage 4). */
export function UnitToggle({ value, onChange, imperialLabel = 'ft / in', metricLabel = 'm / cm' }: UnitToggleProps) {
  return (
    <Segmented
      label="Units"
      hideLabel
      size="sm"
      value={value}
      onChange={onChange}
      options={[
        { value: 'imperial', label: imperialLabel },
        { value: 'metric', label: metricLabel },
      ]}
    />
  );
}
