/** Marks placeholder content so it is never mistaken for platform data. */
export function SampleBadge({ label = "Sample" }: { label?: string }) {
  return (
    <span className="rounded-full border border-dashed border-steel px-2 py-0.5 text-[11px] leading-4 text-muted-foreground">
      {label}
    </span>
  );
}

/** Notice placed above a group of sample items. */
export function SampleNotice({ children }: { children: React.ReactNode }) {
  return <p className="text-[14px] text-muted-foreground">{children}</p>;
}
