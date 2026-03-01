import DialogueBlock from './DialogueBlock'

export default function StepList({ steps }) {
  return (
    <ul className="step-list">
      {steps.map((s, i) => (
        <li key={i} className="step-item">
          <div className="step-num">{i + 1}</div>
          <div className="step-content">
            {s.loc && <div className="step-loc">{s.loc}</div>}
            <div className="step-title">{s.title}</div>
            <div className="step-desc">{s.desc}</div>
            <DialogueBlock dialogues={s.dialogues} avoid={s.avoid} />
          </div>
        </li>
      ))}
    </ul>
  )
}
