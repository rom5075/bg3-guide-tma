import { useState } from 'react'
import { haptic } from '../telegram'

export default function Accordion({ icon, title, meta, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  function toggle() { haptic('light'); setOpen(o => !o) }
  return (
    <div className={`accordion${open ? ' open' : ''}`}>
      <div className="acc-header" onClick={toggle}>
        {icon && <span className="acc-icon">{icon}</span>}
        <span className="acc-title">{title}</span>
        {meta && <span className="acc-meta">{meta}</span>}
        <span className="acc-chevron">▼</span>
      </div>
      <div className="acc-body">
        <div className="acc-inner">{children}</div>
      </div>
    </div>
  )
}
