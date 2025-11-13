"use client"

import { useEffect, useRef, useState } from "react"
import { X, Undo2, Redo2, Eraser, PenLine, Trash2 } from "lucide-react"

interface DraftOverlayProps {
  open: boolean
  onClose: () => void
}

export function DraftOverlay({ open, onClose }: DraftOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null)
  const [mode, setMode] = useState<'draw' | 'erase'>('draw')
  const undoStack = useRef<ImageData[]>([])
  const redoStack = useRef<ImageData[]>([])
  const drawing = useRef(false)
  const last = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    if (!open) return
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.lineWidth = 4
    ctx.strokeStyle = '#111827'
    ctxRef.current = ctx
    undoStack.current = []
    redoStack.current = []
    drawing.current = false
    last.current = null
  }, [open])

  const startDraw = (x: number, y: number) => {
    const ctx = ctxRef.current
    const canvas = canvasRef.current
    if (!ctx || !canvas) return
    undoStack.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height))
    redoStack.current = []
    drawing.current = true
    last.current = { x, y }
  }

  const moveDraw = (x: number, y: number) => {
    const ctx = ctxRef.current
    if (!ctx || !drawing.current || !last.current) return
    if (mode === 'erase') {
      ctx.globalCompositeOperation = 'destination-out'
      ctx.lineWidth = 16
    } else {
      ctx.globalCompositeOperation = 'source-over'
      ctx.lineWidth = 4
      ctx.strokeStyle = '#111827'
    }
    ctx.beginPath()
    ctx.moveTo(last.current.x, last.current.y)
    ctx.lineTo(x, y)
    ctx.stroke()
    last.current = { x, y }
  }

  const endDraw = () => {
    drawing.current = false
    last.current = null
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect()
    startDraw(e.clientX - rect.left, e.clientY - rect.top)
  }
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = (e.target as HTMLCanvasElement).getBoundingClientRect()
    moveDraw(e.clientX - rect.left, e.clientY - rect.top)
  }
  const handlePointerUp = () => endDraw()

  const undo = () => {
    const ctx = ctxRef.current
    const canvas = canvasRef.current
    if (!ctx || !canvas) return
    if (undoStack.current.length === 0) return
    const img = undoStack.current.pop()!
    redoStack.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height))
    ctx.putImageData(img, 0, 0)
  }

  const redo = () => {
    const ctx = ctxRef.current
    const canvas = canvasRef.current
    if (!ctx || !canvas) return
    if (redoStack.current.length === 0) return
    const img = redoStack.current.pop()!
    undoStack.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height))
    ctx.putImageData(img, 0, 0)
  }

  const clear = () => {
    const ctx = ctxRef.current
    const canvas = canvasRef.current
    if (!ctx || !canvas) return
    undoStack.current.push(ctx.getImageData(0, 0, canvas.width, canvas.height))
    redoStack.current = []
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

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
        className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3 rounded-xl bg-white/90 px-4 py-2 shadow-lg backdrop-blur"
        onPointerDown={(e) => { e.stopPropagation() }}
        onPointerMove={(e) => { e.stopPropagation() }}
      >
        <button type="button" onClick={() => setMode('draw')} className={`p-2 rounded ${mode==='draw'?'bg-gray-200':''}`}><PenLine className="w-5 h-5" /></button>
        <button type="button" onClick={() => setMode('erase')} className={`p-2 rounded ${mode==='erase'?'bg-gray-200':''}`}><Eraser className="w-5 h-5" /></button>
        <button type="button" onClick={undo} className="p-2 rounded"><Undo2 className="w-5 h-5" /></button>
        <button type="button" onClick={redo} className="p-2 rounded"><Redo2 className="w-5 h-5" /></button>
        <button type="button" onClick={clear} className="p-2 rounded"><Trash2 className="w-5 h-5" /></button>
        <button type="button" onClick={onClose} className="p-2 rounded"><X className="w-5 h-5" /></button>
      </div>
    </div>
  )
}
