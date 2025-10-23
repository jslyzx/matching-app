"use client"

import { useEffect } from "react"
import "katex/dist/katex.min.css"
import { InlineMath, BlockMath } from "react-katex"

interface MathFormulaProps {
  formula: string
  block?: boolean
  className?: string
}

export function MathFormula({ formula, block = false, className = "" }: MathFormulaProps) {
  // 移除LaTeX分隔符 \( \) 或 \[ \]
  const cleanFormula = formula
    .replace(/\\[\(\[]/, "")
    .replace(/\\[\)\]]/, "")
    .trim()

  if (block) {
    return (
      <div className={className}>
        <BlockMath math={cleanFormula} />
      </div>
    )
  }

  return (
    <span className={className}>
      <InlineMath math={cleanFormula} />
    </span>
  )
}