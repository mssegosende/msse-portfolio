/** "01" -> "1", "3.1" stays. */
const plainNum = (value: string): string => value.replace(/^0+(?=\d)/, "");

/**
 * A number with the slashed zero in front: Ø1, Ø2.1, Ø3.4. Visual only —
 * screen readers get the plain number.
 */
export const Num = ({ value, className }: { value: string; className?: string }) => {
  const n = plainNum(value);
  return (
    <span aria-label={n} className={className}>
      <span aria-hidden="true">Ø{n}</span>
    </span>
  );
};
