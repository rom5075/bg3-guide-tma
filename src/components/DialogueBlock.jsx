export default function DialogueBlock({ dialogues, avoid }) {
  if (!dialogues && !avoid) return null
  return (
    <div style={{ marginTop: 8 }}>
      {dialogues?.map((d, i) => (
        <div key={i} className="dialogue-block">
          <div className="dialogue-line">«{d.line}»</div>
          <div className={`dialogue-effect eff-${d.effect}`}>{d.effLabel}</div>
        </div>
      ))}
      {avoid && (
        <div className="note warn" style={{ marginTop: 6 }}>
          ⚠ {avoid}
        </div>
      )}
    </div>
  )
}
