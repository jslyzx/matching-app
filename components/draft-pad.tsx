"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { X, Undo2, Redo2, Eraser, PenLine } from "lucide-react"

type Mode = "draw" | "erase"

type ShapeType =
  | "line"
  | "dashed"
  | "segment"
  | "square"
  | "triangle"
  | "pentagon"
  | "hexagon"
  | "circle"
  | "brace"

interface ShapeBase {
  id: string
  type: ShapeType
  stroke: string
  lineWidth: number
}

interface LineShape extends ShapeBase {
  type: "line" | "dashed" | "segment"
  start: { x: number; y: number }
  end: { x: number; y: number }
}

interface CircleShape extends ShapeBase {
  type: "circle"
  center: { x: number; y: number }
  radius: number
}

interface PolygonShape extends ShapeBase {
  type: "square" | "triangle" | "pentagon" | "hexagon"
  center: { x: number; y: number }
  size: number
  rotation: number
}

interface BraceShape extends ShapeBase {
  type: "brace"
  center: { x: number; y: number }
  size: number
  width: number
  orientation: "left" | "right" | "top" | "bottom"
}

type Shape = LineShape | CircleShape | PolygonShape | BraceShape

type HistoryAction =
  | { kind: "addStroke"; index: number }
  | { kind: "addShape"; id: string }
  | { kind: "removeShape"; shape: Shape }
  | { kind: "updateShape"; id: string; before: Shape; after: Shape }

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
  const redoStrokeRef = useRef<Stroke[]>([])
  const drawingRef = useRef<boolean>(false)

  const shapesRef = useRef<Shape[]>([])
  const [shapeType, setShapeType] = useState<ShapeType | null>(null)
  const [shapeMenuOpen, setShapeMenuOpen] = useState<boolean>(false)
  const selectedShapeIdRef = useRef<string | null>(null)
  const pendingLineRef = useRef<LineShape | null>(null)
  const confirmingShapeIdRef = useRef<string | null>(null)
  const draggingHandleRef = useRef<
    | null
    | { kind: "center"; id: string; rotate?: boolean }
    | { kind: "radius"; id: string }
    | { kind: "corner" | "edge"; id: string; index: number }
    | { kind: "line-end"; id: string; which: "start" | "end" }
    | { kind: "brace-top" | "brace-bottom" | "brace-width"; id: string }
  >(null)

  const rotationOffsetRef = useRef<number>(0)
  const [axisLock, setAxisLock] = useState<"none" | "horizontal" | "vertical">("none")

  const historyRef = useRef<HistoryAction[]>([])
  const redoHistoryRef = useRef<HistoryAction[]>([])

  const canUndo = useMemo(() => historyRef.current.length > 0, [])
  const canRedo = useMemo(() => redoHistoryRef.current.length > 0, [])
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
    redoStrokeRef.current = []
    shapesRef.current = []
    historyRef.current = []
    redoHistoryRef.current = []
    drawingRef.current = false
    confirmingShapeIdRef.current = null
    setAxisLock("none")
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
      const oldShapes = [...shapesRef.current]
      canvas.style.width = `${w}px`
      canvas.style.height = `${h}px`
      canvas.width = Math.floor(w * dpr)
      canvas.height = Math.floor(h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      strokesRef.current = oldStrokes
      shapesRef.current = oldShapes
      renderAll()
    }
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault()
        undo()
        return
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && e.shiftKey) {
        e.preventDefault()
        redo()
        return
      }
      if (e.key === "Escape") {
        if (confirmingShapeIdRef.current) {
          cancelConfirm()
        } else if (shapeType) {
          setShapeType(null)
        } else onClose()
        return
      }
      const k = e.key.toLowerCase()
      const map: Record<string, ShapeType> = {
        l: "line",
        d: "dashed",
        s: "segment",
        q: "square",
        t: "triangle",
        p: "pentagon",
        h: "hexagon",
        c: "circle",
        b: "brace",
      }
      if (map[k]) {
        if (confirmingShapeIdRef.current) finishConfirm()
        setShapeType(map[k])
        setShapeMenuOpen(false)
      }
      if (k === "h") { setAxisLock("horizontal"); applyBraceAxisLock("horizontal") }
      if (k === "v") { setAxisLock("vertical"); applyBraceAxisLock("vertical") }
      if (k === "n") { setAxisLock("none"); applyBraceAxisLock("none") }
      if (e.key === "Enter") {
        finishConfirm()
        return
      }
      if (confirmingShapeIdRef.current) {
        if (e.key === "ArrowLeft") setBraceOrientation("left")
        if (e.key === "ArrowRight") setBraceOrientation("right")
        if (e.key === "ArrowUp") setBraceOrientation("top")
        if (e.key === "ArrowDown") setBraceOrientation("bottom")
      }
    }
    window.addEventListener("resize", onResize)
    window.addEventListener("keydown", onKey)
    return () => {
      window.removeEventListener("resize", onResize)
      window.removeEventListener("keydown", onKey)
    }
  }, [open, dpr, onClose])

  const startDraw = (x: number, y: number) => {
    if (shapeType) {
      startShapeInteraction(x, y)
      return
    }
    const stroke: Stroke = { mode, color, size: mode === "erase" ? eraserSize : size, points: [{ x, y }] }
    strokesRef.current = [...strokesRef.current, stroke]
    redoStrokeRef.current = []
    drawingRef.current = true
    setRenderTick((v) => v + 1)
  }

  const moveDraw = (x: number, y: number) => {
    if (shapeType) {
      moveShapeInteraction(x, y)
      return
    }
    if (!drawingRef.current) return
    const lastStroke = strokesRef.current[strokesRef.current.length - 1]
    if (!lastStroke) return
    lastStroke.points.push({ x, y })
    scheduleRender()
  }

  const endDraw = () => {
    if (shapeType) {
      endShapeInteraction()
      return
    }
    drawingRef.current = false
    if (strokesRef.current.length > 0) {
      historyRef.current.push({ kind: "addStroke", index: strokesRef.current.length - 1 })
      redoHistoryRef.current = []
    }
  }

  const renderAll = () => {
    const ctx = ctxRef.current
    const canvas = canvasRef.current
    if (!ctx || !canvas) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    // draw shapes
    for (const sh of shapesRef.current) {
      ctx.save()
      ctx.globalCompositeOperation = "source-over"
      ctx.strokeStyle = sh.stroke
      ctx.lineWidth = sh.lineWidth
      if (confirmingShapeIdRef.current === sh.id) ctx.globalAlpha = 0.75
      if (sh.type === "line" || sh.type === "segment" || sh.type === "dashed") {
        const ln = sh as LineShape
        if (sh.type === "dashed") ctx.setLineDash([8, 8])
        else ctx.setLineDash([])
        ctx.beginPath()
        ctx.moveTo(ln.start.x, ln.start.y)
        ctx.lineTo(ln.end.x, ln.end.y)
        ctx.stroke()
        if (sh.type === "segment") {
          ctx.setLineDash([])
          const tickLen = 10
          ctx.beginPath()
          ctx.moveTo(ln.start.x, ln.start.y - tickLen)
          ctx.lineTo(ln.start.x, ln.start.y + tickLen)
          ctx.moveTo(ln.end.x, ln.end.y - tickLen)
          ctx.lineTo(ln.end.x, ln.end.y + tickLen)
          ctx.stroke()
        }
      } else if (sh.type === "circle") {
        const c = sh as CircleShape
        ctx.beginPath()
        ctx.arc(c.center.x, c.center.y, c.radius, 0, Math.PI * 2)
        ctx.stroke()
      } else if (sh.type === "brace") {
        const br = sh as BraceShape
        const cx = br.center.x
        const cy = br.center.y
        ctx.setLineDash([])
        if (br.orientation === "left" || br.orientation === "right") {
          const topY = cy - br.size / 2
          const bottomY = cy + br.size / 2
          const dir = br.orientation === "left" ? -1 : 1
          const W = br.width
          ctx.beginPath()
          ctx.moveTo(cx + dir * W, topY)
          ctx.bezierCurveTo(cx + dir * W * 0.6, topY, cx + dir * W * 0.3, topY + br.size * 0.25, cx, cy - br.size * 0.1)
          ctx.stroke()
          ctx.beginPath()
          ctx.moveTo(cx, cy + br.size * 0.1)
          ctx.bezierCurveTo(cx + dir * W * 0.3, cy + br.size * 0.25, cx + dir * W * 0.6, bottomY, cx + dir * W, bottomY)
          ctx.stroke()
        } else {
          const leftX = cx - br.size / 2
          const rightX = cx + br.size / 2
          const dir = br.orientation === "top" ? -1 : 1
          const W = br.width
          ctx.beginPath()
          ctx.moveTo(leftX, cy + dir * W)
          ctx.bezierCurveTo(leftX, cy + dir * W * 0.6, leftX + br.size * 0.25, cy + dir * W * 0.3, cx - br.size * 0.1, cy)
          ctx.stroke()
          ctx.beginPath()
          ctx.moveTo(cx + br.size * 0.1, cy)
          ctx.bezierCurveTo(rightX - br.size * 0.25, cy + dir * W * 0.3, rightX, cy + dir * W * 0.6, rightX, cy + dir * W)
          ctx.stroke()
        }
      } else {
        const pg = sh as PolygonShape
        const verts = polygonVertices(pg.type, pg.center, pg.size, pg.rotation)
        ctx.beginPath()
        ctx.moveTo(verts[0].x, verts[0].y)
        for (let i = 1; i < verts.length; i++) ctx.lineTo(verts[i].x, verts[i].y)
        ctx.closePath()
        ctx.stroke()
      }
      ctx.restore()
    }
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
    // draw selection handles
    const selId = selectedShapeIdRef.current
    if (selId) {
      const sh = shapesRef.current.find((s) => s.id === selId)
      if (sh) {
        ctx.save()
        ctx.setLineDash([4, 4])
        ctx.strokeStyle = "#9ca3af"
        ctx.lineWidth = 1
        if (sh.type === "circle") {
          const c = sh as CircleShape
          ctx.beginPath()
          ctx.arc(c.center.x, c.center.y, c.radius, 0, Math.PI * 2)
          ctx.stroke()
          // center handle
          drawHandle(ctx, c.center.x, c.center.y)
          // radius handle at angle 0
          drawHandle(ctx, c.center.x + c.radius, c.center.y)
        } else if (sh.type === "line" || sh.type === "segment" || sh.type === "dashed") {
          const ln = sh as LineShape
          drawHandle(ctx, ln.start.x, ln.start.y)
          drawHandle(ctx, ln.end.x, ln.end.y)
        } else if (sh.type === "brace") {
          const br = sh as BraceShape
          const cx = br.center.x
          const cy = br.center.y
          drawHandle(ctx, cx, cy)
          if (br.orientation === "left" || br.orientation === "right") {
            const topY = cy - br.size / 2
            const bottomY = cy + br.size / 2
            const dir = br.orientation === "left" ? -1 : 1
            const W = br.width
            drawHandle(ctx, cx + dir * W, topY)
            drawHandle(ctx, cx + dir * W, bottomY)
            drawHandle(ctx, cx + dir * W, cy)
          } else {
            const leftX = cx - br.size / 2
            const rightX = cx + br.size / 2
            const dir = br.orientation === "top" ? -1 : 1
            const W = br.width
            drawHandle(ctx, leftX, cy + dir * W)
            drawHandle(ctx, rightX, cy + dir * W)
            drawHandle(ctx, cx, cy + dir * W)
          }
        } else {
          const pg = sh as PolygonShape
          const verts = polygonVertices(pg.type, pg.center, pg.size, pg.rotation)
          // corners
          for (const v of verts) drawHandle(ctx, v.x, v.y)
          // edge midpoints
          for (let i = 0; i < verts.length; i++) {
            const a = verts[i]
            const b = verts[(i + 1) % verts.length]
            drawHandle(ctx, (a.x + b.x) / 2, (a.y + b.y) / 2)
          }
          // center
          drawHandle(ctx, pg.center.x, pg.center.y)
        }
        ctx.restore()
      }
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

  // shape helpers
  const polygonVertices = (
    type: PolygonShape["type"],
    center: { x: number; y: number },
    size: number,
    rotation: number
  ) => {
    const map: Record<PolygonShape["type"], number> = {
      square: 4,
      triangle: 3,
      pentagon: 5,
      hexagon: 6,
    }
    const n = map[type]
    const verts: { x: number; y: number }[] = []
    for (let i = 0; i < n; i++) {
      const ang = rotation + (i * 2 * Math.PI) / n
      const x = center.x + (size / 2) * Math.cos(ang)
      const y = center.y + (size / 2) * Math.sin(ang)
      verts.push({ x, y })
    }
    return verts
  }

  const drawHandle = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    ctx.save()
    ctx.setLineDash([])
    ctx.fillStyle = "#ffffff"
    ctx.strokeStyle = "#2563eb"
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(x, y, 5, 0, Math.PI * 2)
    ctx.fill()
    ctx.stroke()
    ctx.restore()
  }

  const pickShapeAt = (x: number, y: number) => {
    for (let i = shapesRef.current.length - 1; i >= 0; i--) {
      const sh = shapesRef.current[i]
      if (sh.type === "circle") {
        const c = sh as CircleShape
        const dx = x - c.center.x
        const dy = y - c.center.y
        const dist = Math.hypot(dx, dy)
        if (Math.abs(dist - c.radius) <= 8) return sh
        if (Math.hypot(dx, dy) <= 10) return sh
      } else if (sh.type === "line" || sh.type === "segment" || sh.type === "dashed") {
        const ln = sh as LineShape
        const d = pointLineDistance(x, y, ln.start, ln.end)
        if (d <= 6) return sh
      } else if (sh.type === "brace") {
        const br = sh as BraceShape
        const cx = br.center.x
        const cy = br.center.y
        if (br.orientation === "left" || br.orientation === "right") {
          const topY = cy - br.size / 2
          const bottomY = cy + br.size / 2
          const dir = br.orientation === "left" ? -1 : 1
          const W = br.width
          const minx = Math.min(cx, cx + dir * W)
          const maxx = Math.max(cx, cx + dir * W)
          if (x >= minx - 8 && x <= maxx + 8 && y >= topY - 8 && y <= bottomY + 8) return sh
        } else {
          const leftX = cx - br.size / 2
          const rightX = cx + br.size / 2
          const dir = br.orientation === "top" ? -1 : 1
          const W = br.width
          const miny = Math.min(cy, cy + dir * W)
          const maxy = Math.max(cy, cy + dir * W)
          if (x >= leftX - 8 && x <= rightX + 8 && y >= miny - 8 && y <= maxy + 8) return sh
        }
      } else {
        const pg = sh as PolygonShape
        const verts = polygonVertices(pg.type, pg.center, pg.size, pg.rotation)
        // rough bbox
        const xs = verts.map((v) => v.x)
        const ys = verts.map((v) => v.y)
        const minx = Math.min(...xs)
        const maxx = Math.max(...xs)
        const miny = Math.min(...ys)
        const maxy = Math.max(...ys)
        if (x >= minx - 6 && x <= maxx + 6 && y >= miny - 6 && y <= maxy + 6) return sh
      }
    }
    return null
  }

  const pointLineDistance = (
    x: number,
    y: number,
    a: { x: number; y: number },
    b: { x: number; y: number }
  ) => {
    const A = x - a.x
    const B = y - a.y
    const C = b.x - a.x
    const D = b.y - a.y
    const dot = A * C + B * D
    const lenSq = C * C + D * D
    const t = Math.max(0, Math.min(1, dot / lenSq))
    const px = a.x + t * C
    const py = a.y + t * D
    return Math.hypot(x - px, y - py)
  }

  const startShapeInteraction = (x: number, y: number) => {
    if (!shapeType) return
    if (shapeType === "line" || shapeType === "segment" || shapeType === "dashed") {
      if (!pendingLineRef.current) {
        pendingLineRef.current = {
          id: cryptoId(),
          type: shapeType,
          start: { x, y },
          end: { x, y },
          stroke: color,
          lineWidth: size,
        }
        selectedShapeIdRef.current = pendingLineRef.current.id
      } else {
        // finalize
        shapesRef.current.push(pendingLineRef.current)
        confirmingShapeIdRef.current = pendingLineRef.current.id
        setAxisLock(shapeType === "dashed" ? "none" : "horizontal")
        pendingLineRef.current = null
        scheduleRender()
      }
      return
    }
    // create centered shapes
    if (shapeType === "circle") {
      const sh: CircleShape = {
        id: cryptoId(),
        type: "circle",
        center: { x, y },
        radius: 50,
        stroke: color,
        lineWidth: size,
      }
      shapesRef.current.push(sh)
      selectedShapeIdRef.current = sh.id
      confirmingShapeIdRef.current = sh.id
      setAxisLock("none")
      scheduleRender()
    } else if (shapeType === "brace") {
      const sh: BraceShape = {
        id: cryptoId(),
        type: "brace",
        center: { x, y },
        size: 100,
        width: 30,
        orientation: "left",
        stroke: color,
        lineWidth: size,
      }
      shapesRef.current.push(sh)
      selectedShapeIdRef.current = sh.id
      confirmingShapeIdRef.current = sh.id
      setAxisLock("none")
      scheduleRender()
    } else {
      const sh: PolygonShape = {
        id: cryptoId(),
        type: shapeType as PolygonShape["type"],
        center: { x, y },
        size: 100,
        rotation: defaultRotationFor(shapeType as PolygonShape["type"]),
        stroke: color,
        lineWidth: size,
      }
      shapesRef.current.push(sh)
      selectedShapeIdRef.current = sh.id
      confirmingShapeIdRef.current = sh.id
      setAxisLock("none")
      scheduleRender()
    }
  }

  const moveShapeInteraction = (x: number, y: number) => {
    if (pendingLineRef.current) {
      const isLine = pendingLineRef.current.type === "line" || pendingLineRef.current.type === "segment"
      if (isLine) {
        if (axisLock === "horizontal") pendingLineRef.current.end = { x, y: pendingLineRef.current.start.y }
        else if (axisLock === "vertical") pendingLineRef.current.end = { x: pendingLineRef.current.start.x, y }
        else pendingLineRef.current.end = { x, y: pendingLineRef.current.start.y }
      } else {
        pendingLineRef.current.end = { x, y }
      }
      scheduleRender()
      return
    }
    const selId = selectedShapeIdRef.current
    if (!selId) return
    const sh = shapesRef.current.find((s) => s.id === selId)
    if (!sh) return
    const drag = draggingHandleRef.current
    if (!drag) return
    if (drag.kind === "center") {
      if (drag.rotate && sh.type !== "line" && sh.type !== "segment" && sh.type !== "dashed") {
        if (sh.type === "circle") {
          (sh as CircleShape).center = { x, y }
        } else {
          const pg = sh as PolygonShape
          const ang = Math.atan2(y - pg.center.y, x - pg.center.x)
          pg.rotation = rotationOffsetRef.current + ang
        }
      } else if (sh.type === "circle") (sh as CircleShape).center = { x, y }
      else if (sh.type === "line" || sh.type === "segment" || sh.type === "dashed") {
        const ln = sh as LineShape
        const dx = x - ln.start.x
        const dy = y - ln.start.y
        const sx = ln.end.x - ln.start.x
        const sy = ln.end.y - ln.start.y
        ln.end = { x: ln.start.x + sx + dx, y: ln.start.y + sy + dy }
        ln.start = { x, y }
      } else if (sh.type === "brace") {
        const br = sh as BraceShape
        br.center = { x, y }
      } else {
        (sh as PolygonShape).center = { x, y }
      }
      scheduleRender()
    } else if (drag.kind === "radius" && sh.type === "circle") {
      const c = sh as CircleShape
      c.radius = Math.max(5, Math.hypot(x - c.center.x, y - c.center.y))
      scheduleRender()
    } else if (drag.kind === "line-end" && (sh.type === "line" || sh.type === "segment" || sh.type === "dashed")) {
      const ln = sh as LineShape
      if (drag.which === "start") ln.start = { x, y }
      else ln.end = { x, y }
      scheduleRender()
    } else if (sh.type === "brace" && (drag.kind === "brace-top" || drag.kind === "brace-bottom" || drag.kind === "brace-width")) {
      const br = sh as BraceShape
      const cy = br.center.y
      if (drag.kind === "brace-top") {
        br.size = Math.max(20, (cy - y) * 2)
      } else if (drag.kind === "brace-bottom") {
        br.size = Math.max(20, (y - cy) * 2)
      } else {
        const nx = x - br.center.x
        br.width = Math.max(10, Math.abs(nx))
        br.orientation = nx >= 0 ? "right" : "left"
      }
      scheduleRender()
    } else if ((drag.kind === "brace-top" || drag.kind === "brace-bottom" || drag.kind === "brace-width") && sh.type === "brace") {
      const br = sh as BraceShape
      const cx = br.center.x
      const cy = br.center.y
      if (br.orientation === "left" || br.orientation === "right") {
        if (drag.kind === "brace-top") br.size = Math.max(20, (cy - y) * 2)
        else if (drag.kind === "brace-bottom") br.size = Math.max(20, (y - cy) * 2)
        else {
          const nx = x - cx
          br.width = Math.max(10, Math.abs(nx))
          br.orientation = nx >= 0 ? "right" : "left"
        }
      } else {
        if (drag.kind === "brace-top") br.size = Math.max(20, (cx - x) * 2)
        else if (drag.kind === "brace-bottom") br.size = Math.max(20, (x - cx) * 2)
        else {
          const ny = y - cy
          br.width = Math.max(10, Math.abs(ny))
          br.orientation = ny >= 0 ? "bottom" : "top"
        }
      }
      scheduleRender()
    } else if (sh.type !== "circle" && (drag.kind === "corner" || drag.kind === "edge")) {
      const pg = sh as PolygonShape
      const before = { ...pg }
      if (drag.kind === "corner") {
        // corner drag: scale size by distance from center
        pg.size = Math.max(10, Math.hypot(x - pg.center.x, y - pg.center.y) * 2)
      } else {
        // edge drag: move center towards pointer
        pg.center = { x, y }
      }
      scheduleRender()
    }
  }

  const endShapeInteraction = () => {
    const selId = selectedShapeIdRef.current
    if (!selId) return
    const sh = shapesRef.current.find((s) => s.id === selId)
    if (!sh) return
    // for simplicity, record generic update using shallow clone before-after
    // In this minimal version, we skip capturing before-state on pointerdown;
    // advanced diffing can be added later.
    redoHistoryRef.current = []
  }

  const cryptoId = () => Math.random().toString(36).slice(2)

  const finishConfirm = () => {
    const id = confirmingShapeIdRef.current
    if (!id) return
    historyRef.current.push({ kind: "addShape", id })
    redoHistoryRef.current = []
    confirmingShapeIdRef.current = null
    setAxisLock("none")
    setShapeType(null)
    setShapeMenuOpen(false)
    selectedShapeIdRef.current = null
    draggingHandleRef.current = null
    scheduleRender()
  }

  const cancelConfirm = () => {
    const id = confirmingShapeIdRef.current
    if (!id) return
    const idx = shapesRef.current.findIndex((s) => s.id === id)
    if (idx >= 0) shapesRef.current.splice(idx, 1)
    confirmingShapeIdRef.current = null
    setAxisLock("none")
    setShapeType(null)
    setShapeMenuOpen(false)
    selectedShapeIdRef.current = null
    draggingHandleRef.current = null
    scheduleRender()
  }

  const applyBraceAxisLock = (lock: "horizontal" | "vertical" | "none") => {
    const id = confirmingShapeIdRef.current
    if (!id) return
    const sh = shapesRef.current.find((s) => s.id === id)
    if (!sh || sh.type !== "brace") return
    const br = sh as BraceShape
    if (lock === "horizontal") br.orientation = "top"
    else if (lock === "vertical") br.orientation = "left"
    scheduleRender()
  }

  const setBraceOrientation = (o: "left" | "right" | "top" | "bottom") => {
    const id = confirmingShapeIdRef.current
    if (!id) return
    const sh = shapesRef.current.find((s) => s.id === id)
    if (!sh || sh.type !== "brace") return
    const br = sh as BraceShape
    br.orientation = o
    scheduleRender()
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    if (shapeType) {
      const sh = confirmingShapeIdRef.current
        ? shapesRef.current.find((s) => s.id === confirmingShapeIdRef.current) || null
        : pickShapeAt(x, y) || null
      if (sh) {
        selectedShapeIdRef.current = sh.id
        if (sh.type === "circle") {
          const c = sh as CircleShape
          const distCenter = Math.hypot(x - c.center.x, y - c.center.y)
          if (distCenter <= 10) draggingHandleRef.current = { kind: "center", id: sh.id }
          else if (Math.hypot(x - (c.center.x + c.radius), y - c.center.y) <= 10)
            draggingHandleRef.current = { kind: "radius", id: sh.id }
          else draggingHandleRef.current = { kind: "center", id: sh.id }
        } else if (sh.type === "line" || sh.type === "segment" || sh.type === "dashed") {
          const ln = sh as LineShape
          if (Math.hypot(x - ln.start.x, y - ln.start.y) <= 10) draggingHandleRef.current = { kind: "line-end", id: sh.id, which: "start" }
          else if (Math.hypot(x - ln.end.x, y - ln.end.y) <= 10) draggingHandleRef.current = { kind: "line-end", id: sh.id, which: "end" }
          else draggingHandleRef.current = { kind: "center", id: sh.id }
        } else if (sh.type === "brace") {
          const br = sh as BraceShape
          const cx = br.center.x
          const cy = br.center.y
          if (br.orientation === "left" || br.orientation === "right") {
            const topY = cy - br.size / 2
            const bottomY = cy + br.size / 2
            const dir = br.orientation === "left" ? -1 : 1
            const W = br.width
            if (Math.hypot(x - (cx + dir * W), y - topY) <= 10) draggingHandleRef.current = { kind: "brace-top", id: sh.id }
            else if (Math.hypot(x - (cx + dir * W), y - bottomY) <= 10) draggingHandleRef.current = { kind: "brace-bottom", id: sh.id }
            else if (Math.hypot(x - (cx + dir * W), y - cy) <= 10) draggingHandleRef.current = { kind: "brace-width", id: sh.id }
            else draggingHandleRef.current = { kind: "center", id: sh.id }
          } else {
            const leftX = cx - br.size / 2
            const rightX = cx + br.size / 2
            const dir = br.orientation === "top" ? -1 : 1
            const W = br.width
            if (Math.hypot(x - leftX, y - (cy + dir * W)) <= 10) draggingHandleRef.current = { kind: "brace-top", id: sh.id }
            else if (Math.hypot(x - rightX, y - (cy + dir * W)) <= 10) draggingHandleRef.current = { kind: "brace-bottom", id: sh.id }
            else if (Math.hypot(x - cx, y - (cy + dir * W)) <= 10) draggingHandleRef.current = { kind: "brace-width", id: sh.id }
            else draggingHandleRef.current = { kind: "center", id: sh.id }
          }
        } else {
          const pg = sh as PolygonShape
          const verts = polygonVertices(pg.type, pg.center, pg.size, pg.rotation)
          let matched = false
          for (let i = 0; i < verts.length; i++) {
            const v = verts[i]
            if (Math.hypot(x - v.x, y - v.y) <= 10) {
              draggingHandleRef.current = { kind: "corner", id: sh.id, index: i }
              matched = true
              break
            }
          }
          if (!matched) {
            for (let i = 0; i < verts.length; i++) {
              const a = verts[i]
              const b = verts[(i + 1) % verts.length]
              const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
              if (Math.hypot(x - mid.x, y - mid.y) <= 10) {
                draggingHandleRef.current = { kind: "edge", id: sh.id, index: i }
                matched = true
                break
              }
            }
          }
          if (!matched) draggingHandleRef.current = { kind: "center", id: sh.id, rotate: (e as any).shiftKey }
          if ((draggingHandleRef.current as any)?.rotate) {
            const ang = Math.atan2(y - pg.center.y, x - pg.center.x)
            rotationOffsetRef.current = pg.rotation - ang
          }
        }
        return
      }
    }
    startDraw(x, y)
  }
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    moveDraw(x, y)
  }
  const handlePointerUp = () => {
    draggingHandleRef.current = null
    endDraw()
  }

  const undo = () => {
    if (historyRef.current.length === 0) return
    const act = historyRef.current.pop() as HistoryAction
    if (act.kind === "addStroke") {
      const s = strokesRef.current.pop()
      if (s) redoStrokeRef.current.push(s)
      redoHistoryRef.current.push(act)
    } else if (act.kind === "addShape") {
      const idx = shapesRef.current.findIndex((s) => s.id === act.id)
      if (idx >= 0) {
        const [removed] = shapesRef.current.splice(idx, 1)
        redoHistoryRef.current.push({ kind: "removeShape", shape: removed })
      }
    } else if (act.kind === "updateShape") {
      const idx = shapesRef.current.findIndex((s) => s.id === act.id)
      if (idx >= 0) shapesRef.current[idx] = act.before
      redoHistoryRef.current.push(act)
    } else if (act.kind === "removeShape") {
      shapesRef.current.push(act.shape)
      redoHistoryRef.current.push({ kind: "addShape", id: act.shape.id })
    }
    scheduleRender()
  }

  const redo = () => {
    if (redoHistoryRef.current.length === 0) return
    const act = redoHistoryRef.current.pop() as HistoryAction
    if (act.kind === "addStroke") {
      const s = redoStrokeRef.current.pop()
      if (s) strokesRef.current.push(s)
      historyRef.current.push(act)
    } else if (act.kind === "removeShape") {
      const idx = shapesRef.current.findIndex((s) => s.id === act.shape.id)
      if (idx >= 0) shapesRef.current.splice(idx, 1)
      historyRef.current.push({ kind: "removeShape", shape: act.shape })
    } else if (act.kind === "addShape") {
      const shape = act.id
      // cannot reconstruct; skip
      // in our flow, we only push removeShape to redo; keep history consistent
    } else if (act.kind === "updateShape") {
      const idx = shapesRef.current.findIndex((s) => s.id === act.id)
      if (idx >= 0) shapesRef.current[idx] = act.after
      historyRef.current.push(act)
    }
    scheduleRender()
  }

  const clear = () => {
    if (strokesRef.current.length === 0 && shapesRef.current.length === 0) return
    strokesRef.current = []
    redoStrokeRef.current = []
    shapesRef.current = []
    historyRef.current = []
    redoHistoryRef.current = []
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
        className="absolute z-10 flex items-center gap-3 rounded-2xl bg-white/90 px-3 py-2 shadow-lg backdrop-blur overflow-visible"
        style={toolbarStyle}
        onPointerDown={onToolbarPointerDown}
        onPointerMove={onToolbarPointerMove}
        onPointerUp={onToolbarPointerUp}
      >
        <button type="button" onClick={() => { if (confirmingShapeIdRef.current) finishConfirm(); setMode("draw"); }} className={`p-2 rounded ${mode === "draw" ? "bg-gray-200" : ""}`}><PenLine className="w-5 h-5" /></button>
        <button type="button" onClick={() => { if (confirmingShapeIdRef.current) finishConfirm(); setMode("erase"); }} className={`p-2 rounded ${mode === "erase" ? "bg-gray-200" : ""}`}><Eraser className="w-5 h-5" /></button>
        <div className="relative inline-block">
          <button type="button" onClick={() => { if (shapeType) { if (confirmingShapeIdRef.current) finishConfirm(); setShapeType(null); setShapeMenuOpen(false) } else { setShapeMenuOpen((v) => !v) } }} className={`p-2 rounded ${shapeType ? "bg-gray-200" : ""}`}>图形</button>
          {shapeMenuOpen && (
            <div className="absolute top-full left-0 translate-y-2 z-50 w-64 grid grid-cols-2 gap-2 rounded-xl bg-white/95 p-3 shadow-lg">
              {[
                { t: "line", label: "直线" },
                { t: "dashed", label: "虚线" },
                { t: "segment", label: "线段" },
                { t: "square", label: "正方形" },
                { t: "triangle", label: "三角形" },
                { t: "pentagon", label: "五边形" },
                { t: "hexagon", label: "六边形" },
                { t: "circle", label: "圆" },
                { t: "brace", label: "大括号" },
                { t: "none", label: "自由绘" },
              ].map(({ t, label }) => (
                <button
                  key={t}
                  type="button"
                  className={`px-2 py-1 rounded whitespace-nowrap text-sm hover:bg-gray-100 ${shapeType === (t as ShapeType) ? "bg-gray-200" : ""}`}
                  onClick={() => {
                    if (confirmingShapeIdRef.current) finishConfirm()
                    if (t === "none") setShapeType(null)
                    else setShapeType(t as ShapeType)
                    setShapeMenuOpen(false)
                    selectedShapeIdRef.current = null
                    draggingHandleRef.current = null
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
          {confirmingShapeIdRef.current && (
            <div className="absolute top-full left-0 translate-y-2 z-50 flex gap-2 rounded-xl bg-white/95 px-3 py-2 shadow-lg">
              <button type="button" className="px-2 py-1 rounded bg-blue-600 text-white text-sm" onClick={finishConfirm}>完成</button>
              <button type="button" className="px-2 py-1 rounded bg-gray-200 text-sm" onClick={cancelConfirm}>取消</button>
              <div className="flex items-center gap-1 text-xs">
                <button type="button" className={`px-2 py-1 rounded ${axisLock === "horizontal" ? "bg-gray-300" : ""}`} onClick={() => { setAxisLock("horizontal"); applyBraceAxisLock("horizontal") }}>水平</button>
                <button type="button" className={`px-2 py-1 rounded ${axisLock === "vertical" ? "bg-gray-300" : ""}`} onClick={() => { setAxisLock("vertical"); applyBraceAxisLock("vertical") }}>垂直</button>
                <button type="button" className={`px-2 py-1 rounded ${axisLock === "none" ? "bg-gray-300" : ""}`} onClick={() => { setAxisLock("none"); applyBraceAxisLock("none") }}>自由</button>
              </div>
              {(() => {
                const id = confirmingShapeIdRef.current
                const sh = id ? shapesRef.current.find((s) => s.id === id) : null
                if (sh && sh.type === "brace") {
                  const br = sh as BraceShape
                  return (
                    <div className="flex items-center gap-1 text-xs">
                      <button type="button" className={`px-2 py-1 rounded ${br.orientation === "left" ? "bg-gray-300" : ""}`} onClick={() => setBraceOrientation("left")}>←左</button>
                      <button type="button" className={`px-2 py-1 rounded ${br.orientation === "right" ? "bg-gray-300" : ""}`} onClick={() => setBraceOrientation("right")}>右→</button>
                      <button type="button" className={`px-2 py-1 rounded ${br.orientation === "top" ? "bg-gray-300" : ""}`} onClick={() => setBraceOrientation("top")}>↑上</button>
                      <button type="button" className={`px-2 py-1 rounded ${br.orientation === "bottom" ? "bg-gray-300" : ""}`} onClick={() => setBraceOrientation("bottom")}>下↓</button>
                    </div>
                  )
                }
                return null
              })()}
            </div>
          )}
        </div>
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
        <button type="button" onClick={undo} disabled={historyRef.current.length === 0} className={`p-2 rounded ${historyRef.current.length === 0 ? "opacity-40" : ""}`}><Undo2 className="w-5 h-5" /></button>
        <button type="button" onClick={redo} disabled={redoHistoryRef.current.length === 0} className={`p-2 rounded ${redoHistoryRef.current.length === 0 ? "opacity-40" : ""}`}><Redo2 className="w-5 h-5" /></button>
        <button type="button" onClick={clear} className={`p-2 rounded`}>
          <span className="block h-4 w-6 border-b-2 border-gray-500" />
        </button>
        <button type="button" onClick={onClose} className="p-2 rounded"><X className="w-5 h-5" /></button>
      </div>
    </div>
  )
}
  const defaultRotationFor = (type: PolygonShape["type"]) => {
    if (type === "square") return Math.PI / 4
    if (type === "triangle") return -Math.PI / 2
    if (type === "pentagon") return -Math.PI / 2
    if (type === "hexagon") return Math.PI / 6
    return 0
  }
