"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { X, Undo2, Redo2, Eraser, PenLine } from "lucide-react"

type Mode = "draw" | "erase"

interface Stroke {
  mode: Mode
  color: string
  size: number
  points: Array<{ x: number; y: number }>
}

interface DraftPadProps {
  open: boolean
  onClose: () => void
}

export function DraftPad({ open, onClose }: DraftPadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null)
  const [mode, setMode] = useState<Mode>("draw")
  const [color, setColor] = useState<string>("#111827")
  const [size, setSize] = useState<number>(4)
  const [eraserSize, setEraserSize] = useState<number>(16)
  const [toolbarPos, setToolbarPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const [dragging, setDragging] = useState<boolean>(false)
  const dragOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 })
  const strokesRef = useRef<Stroke[]>([])
  const redoRef = useRef<Stroke[]>([])
  const drawingRef = useRef<boolean>(false)

  const canUndo = useMemo(() => strokesRef.current.length > 0, [])
  const canRedo = useMemo(() => redoRef.current.length > 0, [])
  const [renderTick, setRenderTick] = useState(0)

  const dpr = useMemo(() => (typeof window === "undefined" ? 1 : Math.max(1, window.devicePixelRatio || 1)), [])

  useEffect(() => {
    if (!open) return
    const canvas = canvasRef.current
    if (!canvas) return
    const w = window.innerWidth
    const h = window.innerHeight
    canvas.style.width = `${w}px`
    canvas.style.height = `${h}px`
    canvas.width = Math.floor(w * dpr)
    canvas.height = Math.floor(h * dpr)
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctxRef.current = ctx
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    strokesRef.current = []
    redoRef.current = []
    drawingRef.current = false
    setToolbarPos({ x: Math.floor(w / 2) - 160, y: 16 })
    renderAll()
  }, [open, dpr])

  useEffect(() => {
    if (!open) return
    const onResize = () => {
      const canvas = canvasRef.current
      const ctx = ctxRef.current
      if (!canvas || !ctx) return
      const w = window.innerWidth
      const h = window.innerHeight
      const oldStrokes = [...strokesRef.current]
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      strokesRef.current = oldStrokes
      renderAll()
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !e.shiftKey) undo()
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && e.shiftKey) redo()
    }
    window.addEventListener("resize", onResize)
    window.addEventListener("keydown", onKey)
    return () => {
      window.removeEventListener("resize", onResize)
      window.removeEventListener("keydown", onKey)
    }
  }, [open, dpr, onClose])

  const startDraw = (x: number, y: number) => {
    const stroke: Stroke = { mode, color, size: mode === "erase" ? eraserSize : size, points: [{ x, y }] }
    strokesRef.current = [...strokesRef.current, stroke]
    redoRef.current = []
    drawingRef.current = true
    setRenderTick((v) => v + 1)
  }

  const moveDraw = (x: number, y: number) => {
    if (!drawingRef.current) return
    const lastStroke = strokesRef.current[strokesRef.current.length - 1]
    if (!lastStroke) return
    lastStroke.points.push({ x, y })
    scheduleRender()
  }

  const endDraw = () => {
    drawingRef.current = false
  }

  const renderAll = () => {
    const ctx = ctxRef.current
    const canvas = canvasRef.current
    if (!ctx || !canvas) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    for (const s of strokesRef.current) {
      if (s.points.length < 2) {
        const p = s.points[0]
        ctx.globalCompositeOperation = s.mode === "erase" ? "destination-out" : "source-over"
        ctx.strokeStyle = s.color
        ctx.lineWidth = s.size
        ctx.beginPath()
        ctx.moveTo(p.x, p.y)
        ctx.lineTo(p.x + 0.01, p.y + 0.01)
        ctx.stroke()
        continue
      }
      ctx.globalCompositeOperation = s.mode === "erase" ? "destination-out" : "source-over"
      ctx.strokeStyle = s.color
      ctx.lineWidth = s.size
      const pts = s.points
      // smooth with quadratic curves
      ctx.beginPath()
      ctx.moveTo(pts[0].x, pts[0].y)
      for (let i = 1; i < pts.length - 1; i++) {
        const mx = (pts[i].x + pts[i + 1].x) / 2
        const my = (pts[i].y + pts[i + 1].y) / 2
        ctx.quadraticCurveTo(pts[i].x, pts[i].y, mx, my)
      }
      const last = pts[pts.length - 1]
      ctx.lineTo(last.x, last.y)
      ctx.stroke()
    }
  }

  // raf-batched render
  const rafRef = useRef<number | null>(null)
  const scheduleRender = () => {
    if (rafRef.current != null) return
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null
      renderAll()
      setRenderTick((v) => v + 1)
    })
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    startDraw(x, y)
  }
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    moveDraw(x, y)
  }
  const handlePointerUp = () => endDraw()

  const undo = () => {
    if (strokesRef.current.length === 0) return
    const s = strokesRef.current.pop() as Stroke
    redoRef.current.push(s)
    scheduleRender()
  }

  const redo = () => {
    if (redoRef.current.length === 0) return
    const s = redoRef.current.pop() as Stroke
    strokesRef.current.push(s)
    scheduleRender()
  }

  const clear = () => {
    if (strokesRef.current.length === 0) return
    strokesRef.current = []
    redoRef.current = []
    scheduleRender()
  }

  const toolbarStyle = {
    transform: `translate(${toolbarPos.x}px, ${toolbarPos.y}px)`,
  } as React.CSSProperties

  const onToolbarPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement
    if (target.tagName.toLowerCase() === "button") return
    setDragging(true)
    dragOffset.current = { x: e.clientX - toolbarPos.x, y: e.clientY - toolbarPos.y }
  }
  const onToolbarPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return
    setToolbarPos({ x: e.clientX - dragOffset.current.x, y: e.clientY - dragOffset.current.y })
  }
  const onToolbarPointerUp = () => setDragging(false)

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 bg-black/60">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-0"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      />
      <div
        className="absolute z-10 flex items-center gap-3 rounded-2xl bg-white/90 px-3 py-2 shadow-lg backdrop-blur"
        style={toolbarStyle}
        onPointerDown={onToolbarPointerDown}
        onPointerMove={onToolbarPointerMove}
        onPointerUp={onToolbarPointerUp}
      >
        <button type="button" onClick={() => setMode("draw")} className={`p-2 rounded ${mode === "draw" ? "bg-gray-200" : ""}`}><PenLine className="w-5 h-5" /></button>
        <button type="button" onClick={() => setMode("erase")} className={`p-2 rounded ${mode === "erase" ? "bg-gray-200" : ""}`}><Eraser className="w-5 h-5" /></button>
        <div className="flex items-center gap-1">
          {[
            { c: "#111827" },
            { c: "#2563eb" },
            { c: "#ef4444" },
          ].map(({ c }) => (
            <button key={c} type="button" onClick={() => { setColor(c); setMode("draw") }} className={`h-6 w-6 rounded-full`} style={{ backgroundColor: c, outline: color === c ? "2px solid #4b5563" : "none" }} />
          ))}
        </div>
        <div className="flex items-center gap-1">
          {[2, 4, 8].map((s) => (
            <button key={s} type="button" onClick={() => setSize(s)} className={`h-6 px-2 rounded ${size === s ? "bg-gray-200" : "bg-transparent"}`}>{s}</button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          {[12, 16, 24].map((s) => (
            <button key={s} type="button" onClick={() => { setEraserSize(s); setMode("erase") }} className={`h-6 px-2 rounded ${eraserSize === s ? "bg-gray-200" : "bg-transparent"}`}>E{s}</button>
          ))}
        </div>
        <button type="button" onClick={undo} disabled={strokesRef.current.length === 0} className={`p-2 rounded ${strokesRef.current.length === 0 ? "opacity-40" : ""}`}><Undo2 className="w-5 h-5" /></button>
        <button type="button" onClick={redo} disabled={redoRef.current.length === 0} className={`p-2 rounded ${redoRef.current.length === 0 ? "opacity-40" : ""}`}><Redo2 className="w-5 h-5" /></button>
        <button type="button" onClick={clear} className={`p-2 rounded`}>
          <span className="block h-4 w-6 border-b-2 border-gray-500" />
        </button>
        <button type="button" onClick={onClose} className="p-2 rounded"><X className="w-5 h-5" /></button>
      </div>
    </div>
  )
}
