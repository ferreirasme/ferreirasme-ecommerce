"use client"

import { useEffect, useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2, MapPin, CheckCircle, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"

interface PostalCodeInputProps {
  value: string
  onChange: (value: string) => void
  onAddressFound?: (address: {
    locality: string
    municipality: string
    district: string
    parish?: string
    street?: string
  }) => void
  label?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  className?: string
}

export function PostalCodeInput({
  value,
  onChange,
  onAddressFound,
  label = "Código Postal",
  placeholder = "XXXX-XXX",
  required = false,
  disabled = false,
  className
}: PostalCodeInputProps) {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<"idle" | "valid" | "invalid">("idle")
  const [errorMessage, setErrorMessage] = useState("")

  const formatPostalCode = (input: string) => {
    // Remove tudo que não é número
    const numbers = input.replace(/\D/g, "")
    
    // Formata como XXXX-XXX
    if (numbers.length <= 4) {
      return numbers
    } else {
      return `${numbers.slice(0, 4)}-${numbers.slice(4, 7)}`
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPostalCode(e.target.value)
    onChange(formatted)
    setStatus("idle")
    setErrorMessage("")
  }

  // Validar código postal quando estiver completo
  useEffect(() => {
    const validatePostalCode = async () => {
      if (value.length !== 8) {
        return
      }

      setLoading(true)
      setStatus("idle")
      setErrorMessage("")

      try {
        const response = await fetch(`/api/postal-code/validate?code=${value}`)
        const data = await response.json()

        if (response.ok && data.valid) {
          setStatus("valid")
          if (onAddressFound) {
            onAddressFound({
              locality: data.locality,
              municipality: data.municipality,
              district: data.district,
              parish: data.parish,
              street: data.street
            })
          }
        } else {
          setStatus("invalid")
          setErrorMessage(data.message || "Código postal não encontrado")
        }
      } catch (error) {
        setStatus("invalid")
        setErrorMessage("Erro ao validar código postal")
      } finally {
        setLoading(false)
      }
    }

    // Debounce de 500ms
    const timer = setTimeout(() => {
      validatePostalCode()
    }, 500)

    return () => clearTimeout(timer)
  }, [value, onAddressFound])

  const getIcon = () => {
    if (loading) {
      return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
    }
    
    switch (status) {
      case "valid":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "invalid":
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <MapPin className="h-4 w-4 text-muted-foreground" />
    }
  }

  return (
    <div className={className}>
      {label && (
        <Label htmlFor="postal-code">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      <div className="relative mt-1">
        <Input
          id="postal-code"
          type="text"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          maxLength={8}
          disabled={disabled}
          className={cn(
            "pr-10",
            status === "invalid" && "border-red-500 focus:ring-red-500",
            status === "valid" && "border-green-500 focus:ring-green-500"
          )}
          required={required}
        />
        <div className="absolute right-3 top-3">
          {getIcon()}
        </div>
      </div>
      {errorMessage && (
        <p className="text-sm text-red-600 mt-1">{errorMessage}</p>
      )}
      {status === "valid" && value.length === 8 && (
        <p className="text-sm text-green-600 mt-1">Código postal válido</p>
      )}
    </div>
  )
}