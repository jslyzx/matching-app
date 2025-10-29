"use client"

import { Fragment, type ReactNode } from "react"
import "katex/dist/katex.min.css"
import { InlineMath, BlockMath } from "react-katex"

import { cn } from "@/lib/utils"

interface MathFormulaProps {
  formula: string
  block?: boolean
  className?: string
}

const INLINE_START = "\\("
const INLINE_END = "\\)"
const BLOCK_START = "\\["
const BLOCK_END = "\\]"
const MATH_EXPRESSION_PATTERN = /(\\\[[\s\S]*?\\\]|\\\([\s\S]*?\\\))/g

function stripDelimiters(formula: string) {
  const trimmed = formula.trim()

  if (
    (trimmed.startsWith(INLINE_START) && trimmed.endsWith(INLINE_END)) ||
    (trimmed.startsWith(BLOCK_START) && trimmed.endsWith(BLOCK_END))
  ) {
    return trimmed.slice(2, -2).trim()
  }

  return trimmed
}

export function MathFormula({ formula, block = false, className }: MathFormulaProps) {
  const cleanFormula = stripDelimiters(formula)

  if (block) {
    return (
      <span className={cn("block w-full", className)}>
        <BlockMath math={cleanFormula} />
      </span>
    )
  }

  return (
    <span className={className}>
      <InlineMath math={cleanFormula} />
    </span>
  )
}

export interface MathSegment {
  type: "math" | "text"
  value: string
  block?: boolean
}

export function splitMathContent(content: string): MathSegment[] {
  if (!content) {
    return []
  }

  const parts = content
    .split(MATH_EXPRESSION_PATTERN)
    .filter((part) => part !== undefined && part !== "")

  return parts.map((part) => {
    const trimmed = part.trim()

    if (trimmed.startsWith(INLINE_START) && trimmed.endsWith(INLINE_END)) {
      return { type: "math", value: trimmed, block: false }
    }

    if (trimmed.startsWith(BLOCK_START) && trimmed.endsWith(BLOCK_END)) {
      return { type: "math", value: trimmed, block: true }
    }

    return { type: "text", value: part }
  })
}

export interface RenderMathContentOptions {
  as?: "div" | "span"
  justify?: "start" | "center" | "between"
  wrapperClassName?: string
  blockClassName?: string
}

export function renderMathContent(
  content: string,
  keyPrefix: string,
  { as = "div", justify = "center", wrapperClassName = "", blockClassName }: RenderMathContentOptions = {},
): ReactNode {
  if (!content) {
    return null
  }

  const segments = splitMathContent(content)
  const hasMath = segments.some((segment) => segment.type === "math")

  if (!hasMath) {
    return content
  }

  const flexBase = as === "span" ? "inline-flex" : "flex"
  const wrapperClasses = cn(
    `${flexBase} flex-wrap items-center gap-1`,
    justify === "start" && "justify-start",
    justify === "between" && "justify-between",
    justify === "center" && "justify-center",
    wrapperClassName,
  )

  const nodes = segments.map((segment, index) => {
    if (segment.type === "math") {
      const formulaClassName = segment.block ? cn("basis-full", blockClassName) : blockClassName

      return (
        <MathFormula
          key={`${keyPrefix}-math-${index}`}
          formula={segment.value}
          block={segment.block}
          className={formulaClassName}
        />
      )
    }

    return (
      <span key={`${keyPrefix}-text-${index}`}>
        {segment.value.split(/\n/).map((line, lineIndex, arr) => (
          <Fragment key={`${keyPrefix}-text-${index}-line-${lineIndex}`}>
            {line}
            {lineIndex < arr.length - 1 && <br />}
          </Fragment>
        ))}
      </span>
    )
  })

  if (as === "span") {
    return <span className={wrapperClasses}>{nodes}</span>
  }

  return <div className={wrapperClasses}>{nodes}</div>
}
