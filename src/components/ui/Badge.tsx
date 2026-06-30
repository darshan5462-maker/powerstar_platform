type Variant = 'orange'|'green'|'red'|'yellow'|'blue'|'gray'
const MAP: Record<string,string> = { active:'orange', accepted:'orange', pending:'yellow', completed:'green', cancelled:'red', verified:'green', submitted:'blue', rejected:'red', online:'green', offline:'gray' }
export function StatusBadge({ status }: { status: string }) {
  const v: Variant = (MAP[status] ?? 'gray') as Variant
  return <span className={`badge badge-${v}`}>{status.charAt(0).toUpperCase()+status.slice(1)}</span>
}
export function Badge({ children, variant='gray' }: { children: React.ReactNode; variant?: Variant }) {
  return <span className={`badge badge-${variant}`}>{children}</span>
}
