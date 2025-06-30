"use client"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { formatCurrency } from "@/lib/format"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ProductFiltersProps {
  priceRange: [number, number]
  setPriceRange: (range: [number, number]) => void
  selectedColors: string[]
  setSelectedColors: (colors: string[]) => void
  selectedSizes: string[]
  setSelectedSizes: (sizes: string[]) => void
  onReset: () => void
}

const colors = [
  { name: "Dourado", value: "dourado" },
  { name: "Prateado", value: "prateado" },
  { name: "Rosé", value: "rose" },
]

const sizes = [
  { name: "PP", value: "pp" },
  { name: "P", value: "p" },
  { name: "M", value: "m" },
  { name: "G", value: "g" },
  { name: "GG", value: "gg" },
]

export function ProductFilters({
  priceRange,
  setPriceRange,
  selectedColors,
  setSelectedColors,
  selectedSizes,
  setSelectedSizes,
  onReset
}: ProductFiltersProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label className="text-sm font-semibold mb-3">Preço</Label>
            <div className="space-y-4 mt-3">
              <div className="flex items-center justify-between text-sm">
                <span>{formatCurrency(priceRange[0])}</span>
                <span>{formatCurrency(priceRange[1])}</span>
              </div>
              <Slider
                value={priceRange}
                onValueChange={setPriceRange as any}
                min={0}
                max={500}
                step={10}
                className="mt-2"
              />
            </div>
          </div>

          <Separator />

          <div>
            <Label className="text-sm font-semibold mb-3">Cor</Label>
            <div className="space-y-2 mt-3">
              {colors.map((color) => (
                <div key={color.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`desktop-${color.value}`}
                    checked={selectedColors.includes(color.value)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedColors([...selectedColors, color.value])
                      } else {
                        setSelectedColors(selectedColors.filter(c => c !== color.value))
                      }
                    }}
                  />
                  <Label
                    htmlFor={`desktop-${color.value}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {color.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div>
            <Label className="text-sm font-semibold mb-3">Tamanho</Label>
            <div className="space-y-2 mt-3">
              {sizes.map((size) => (
                <div key={size.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`desktop-${size.value}`}
                    checked={selectedSizes.includes(size.value)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedSizes([...selectedSizes, size.value])
                      } else {
                        setSelectedSizes(selectedSizes.filter(s => s !== size.value))
                      }
                    }}
                  />
                  <Label
                    htmlFor={`desktop-${size.value}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {size.name}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <Button
            variant="outline"
            className="w-full"
            onClick={onReset}
          >
            Limpar Filtros
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}