"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface OTPInputProps {
  value: string
  onChange: (value: string) => void
  length?: number
  className?: string
}

export function OTPInput({ value, onChange, length = 8, className }: OTPInputProps) {
  const inputRefs = React.useRef<(HTMLInputElement | null)[]>([])

  const handleChange = (index: number, newValue: string) => {
    const upperValue = newValue.toUpperCase()
    
    if (upperValue.length > 1) {
      // Handle paste
      const pastedValue = upperValue.slice(0, length)
      onChange(pastedValue)
      
      // Focus last input or next empty one
      const nextIndex = Math.min(pastedValue.length, length - 1)
      inputRefs.current[nextIndex]?.focus()
      return
    }

    const newOTP = value.split('')
    newOTP[index] = upperValue
    const updatedOTP = newOTP.join('').slice(0, length)
    onChange(updatedOTP)

    // Move to next input if value entered
    if (upperValue && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').toUpperCase().slice(0, length)
    onChange(pastedData)
    
    const nextIndex = Math.min(pastedData.length, length - 1)
    inputRefs.current[nextIndex]?.focus()
  }

  return (
    <div className={cn("flex gap-2 justify-center", className)}>
      {Array.from({ length }, (_, index) => (
        <input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el
          }}
          type="text"
          value={value[index] || ''}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          maxLength={1}
          className="w-12 h-14 text-center text-2xl font-mono border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          pattern="[A-Z0-9]"
        />
      ))}
    </div>
  )
}