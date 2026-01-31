import React from 'react'
import { Button } from '@/components/ui/button'

export default function Navbar() {
  return (
    <nav className="p-8 flex justify-between items-center border-b border-black/5">
      <div className="flex items-center gap-6">
        <div className="font-black text-xl tracking-tighter uppercase">Analis.Lab</div>
        <div className="hidden md:flex gap-6 text-[10px] font-bold tracking-[0.2em] uppercase">
          <a className="opacity-60 hover:opacity-100">Portfolio 2026</a>
          <a className="border-b border-black">Selected Works</a>
          <a className="opacity-60 hover:opacity-100">Blog</a>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm">Contact</Button>
        <Button variant="outline" size="sm">Resume</Button>
      </div>
    </nav>
  )
}
