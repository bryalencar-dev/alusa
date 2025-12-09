"use client"

import * as React from "react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export interface DatePickerProps {
  /** Data selecionada */
  value?: Date
  /** Callback quando a data muda */
  onChange?: (date: Date | undefined) => void
  /** Placeholder quando não há data selecionada */
  placeholder?: string
  /** Classes CSS adicionais para o trigger */
  className?: string
  /** Se o componente está desabilitado */
  disabled?: boolean
  /** ID para associação com label */
  id?: string
  /** Formato de exibição da data */
  dateFormat?: string
  /** Variante do trigger: "button" (padrão) ou "input" */
  variant?: "button" | "input"
  /** Ano inicial do dropdown (padrão: ano atual - 10) */
  fromYear?: number
  /** Ano final do dropdown (padrão: ano atual + 10) */
  toYear?: number
}

function formatDisplayDate(date: Date | undefined, dateFormat: string): string {
  if (!date) return ""
  return format(date, dateFormat, { locale: ptBR })
}

function isValidDate(date: Date | undefined): boolean {
  if (!date) return false
  return !isNaN(date.getTime())
}

function DatePicker({
  value,
  onChange,
  placeholder = "Selecione uma data",
  className,
  disabled = false,
  id,
  dateFormat = "dd 'de' MMMM 'de' yyyy",
  variant = "button",
  fromYear,
  toYear,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [month, setMonth] = React.useState<Date | undefined>(value || new Date())
  const [inputValue, setInputValue] = React.useState(formatDisplayDate(value, dateFormat))

  // Calcula range de anos padrão (10 anos para trás e para frente)
  const currentYear = new Date().getFullYear()
  const startMonth = fromYear ? new Date(fromYear, 0) : new Date(currentYear - 10, 0)
  const endMonth = toYear ? new Date(toYear, 11) : new Date(currentYear + 10, 11)

  // Sincroniza o input quando o value externo muda
  React.useEffect(() => {
    setInputValue(formatDisplayDate(value, dateFormat))
    if (value) setMonth(value)
  }, [value, dateFormat])

  const handleSelect = (date: Date | undefined) => {
    onChange?.(date)
    setInputValue(formatDisplayDate(date, dateFormat))
    setOpen(false)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setInputValue(val)
    const parsedDate = new Date(val)
    if (isValidDate(parsedDate)) {
      onChange?.(parsedDate)
      setMonth(parsedDate)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setOpen(true)
    }
  }

  // Variante com Input
  if (variant === "input") {
    return (
      <div className="relative flex gap-2">
        <Input
          id={id}
          value={inputValue}
          placeholder={placeholder}
          disabled={disabled}
          className={cn("bg-white pr-10", className)}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
        />
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              disabled={disabled}
              className="absolute top-1/2 right-2 size-6 -translate-y-1/2 p-0"
            >
              <CalendarIcon className="size-3.5" />
              <span className="sr-only">Selecionar data</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto overflow-hidden p-0"
            align="end"
            alignOffset={-8}
            sideOffset={10}
          >
            <Calendar
              mode="single"
              selected={value}
              captionLayout="dropdown"
              month={month}
              onMonthChange={setMonth}
              onSelect={handleSelect}
              startMonth={startMonth}
              endMonth={endMonth}
            />
          </PopoverContent>
        </Popover>
      </div>
    )
  }

  // Variante padrão com Button
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          disabled={disabled}
          data-empty={!value}
          className={cn(
            "w-full justify-start text-left font-normal",
            "data-[empty=true]:text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? (
            format(value, dateFormat, { locale: ptBR })
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          captionLayout="dropdown"
          month={month}
          onMonthChange={setMonth}
          onSelect={handleSelect}
          startMonth={startMonth}
          endMonth={endMonth}
        />
      </PopoverContent>
    </Popover>
  )
}

DatePicker.displayName = "DatePicker"

export { DatePicker }
