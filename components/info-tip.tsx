'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Info } from 'lucide-react'

export type InfoTipItem = { label: string; text: string }

export function InfoTip({ text, items, tone = 'default' }: {
  text?: string
  items?: InfoTipItem[]
  tone?: 'default' | 'light'
}) {
  const id = useId()
  const buttonRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const hoverTimer = useRef<number | null>(null)
  const [pinned, setPinned] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [position, setPosition] = useState<{ left: number; top: number; width: number; maxHeight: number | null }>({
    left: 12,
    top: 12,
    width: 300,
    maxHeight: null,
  })
  const content = items ?? (text ? [{ label: '', text }] : [])
  const open = pinned || hovered

  useEffect(() => {
    if (!open) return
    const updatePosition = () => {
      const button = buttonRef.current
      if (!button) return
      const rect = button.getBoundingClientRect()
      const width = Math.max(0, Math.min(300, window.innerWidth - 24))
      const centeredLeft = rect.left + rect.width / 2 - width / 2
      const rightAlignedLeft = rect.right - width
      const preferredLeft = rect.left + rect.width / 2 > window.innerWidth / 2 ? rightAlignedLeft : centeredLeft
      const left = Math.max(12, Math.min(preferredLeft, window.innerWidth - width - 12))
      const height = popoverRef.current?.getBoundingClientRect().height ?? 120
      const spaceAbove = Math.max(0, rect.top - 20)
      const spaceBelow = Math.max(0, window.innerHeight - rect.bottom - 20)
      const placeBelow = height <= spaceBelow || (height > spaceAbove && spaceBelow >= spaceAbove)
      const maxHeight = Math.max(0, Math.min(window.innerHeight - 24, placeBelow ? spaceBelow : spaceAbove))
      const visibleHeight = Math.min(height, maxHeight)
      const preferredTop = placeBelow ? rect.bottom + 8 : rect.top - visibleHeight - 8
      const top = Math.max(12, Math.min(preferredTop, window.innerHeight - visibleHeight - 12))
      setPosition({ left, top, width, maxHeight })
    }
    const closeOnOutside = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof Node) || buttonRef.current?.contains(target) || popoverRef.current?.contains(target)) return
      setPinned(false)
      setHovered(false)
    }
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setPinned(false)
        setHovered(false)
      }
    }
    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    document.addEventListener('pointerdown', closeOnOutside)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
      document.removeEventListener('pointerdown', closeOnOutside)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [open])

  function scheduleHoverClose() {
    if (hoverTimer.current !== null) window.clearTimeout(hoverTimer.current)
    hoverTimer.current = window.setTimeout(() => setHovered(false), 140)
  }

  function keepHoverOpen() {
    if (hoverTimer.current !== null) window.clearTimeout(hoverTimer.current)
    setHovered(true)
  }

  return <>
    <button
      ref={buttonRef}
      type="button"
      aria-label="Explicação"
      aria-expanded={open}
      aria-describedby={open ? id : undefined}
      data-infotip-trigger
      onClick={() => {
        setPinned(value => !value)
        setHovered(false)
      }}
      onPointerEnter={event => {
        if (event.pointerType === 'mouse') keepHoverOpen()
      }}
      onPointerLeave={event => {
        if (event.pointerType === 'mouse') scheduleHoverClose()
      }}
      className={`inline-flex size-8 shrink-0 items-center justify-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-600 ${tone === 'light' ? 'text-white/80 hover:bg-white/10 hover:text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800'}`}
    >
      <Info aria-hidden="true" size={18} />
    </button>
    {open && typeof document !== 'undefined' && createPortal(
      <div
        ref={popoverRef}
        id={id}
        role="tooltip"
        data-infotip-popover
        onPointerEnter={event => {
          if (event.pointerType === 'mouse') keepHoverOpen()
        }}
        onPointerLeave={event => {
          if (event.pointerType === 'mouse') scheduleHoverClose()
        }}
        style={{ left: position.left, top: position.top, width: position.width, maxHeight: position.maxHeight ?? 'calc(100vh - 24px)' }}
        className="fixed z-[70] max-w-[min(300px,calc(100vw-24px))] max-h-[calc(100vh-24px)] overflow-y-auto rounded-lg border border-gray-200 bg-white p-3 text-sm leading-5 text-slate-600 shadow-lg"
      >
        <div className="space-y-2">
          {content.map((item, index) => <p key={`${item.label}-${index}`}>
            {item.label && <strong className="font-bold text-slate-800">{item.label}: </strong>}
            {item.text}
          </p>)}
        </div>
      </div>,
      document.body,
    )}
  </>
}
