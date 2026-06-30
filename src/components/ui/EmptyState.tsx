export default function EmptyState({ icon='📭', title='Nothing here yet', desc='' }: { icon?:string; title?:string; desc?:string }) {
  return (
    <div className="empty-state">
      <div className="empty-icon">{icon}</div>
      <h3>{title}</h3>
      {desc && <p>{desc}</p>}
    </div>
  )
}
