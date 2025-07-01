"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Loader2, Camera, Link, AlertCircle, CheckCircle, XCircle } from "lucide-react"
import { toast } from "sonner"

interface ImportStatus {
  statistics: {
    total: number
    mapped: number
    unmapped: number
    withPhotos: number
    withoutPhotos: number
    readyForPhotoImport: number
  }
  progress: {
    mapping: { percentage: number; label: string }
    photos: { percentage: number; label: string }
    photosOfMapped: { percentage: number; label: string }
  }
  recommendations: string[]
}

export function OdooPhotoImport() {
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<ImportStatus | null>(null)
  const [importing, setImporting] = useState(false)
  const [matching, setMatching] = useState(false)

  const fetchStatus = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/products/import-status')
      if (!response.ok) throw new Error('Failed to fetch status')
      const data = await response.json()
      setStatus(data)
    } catch (error) {
      toast.error('Failed to fetch import status')
    } finally {
      setLoading(false)
    }
  }

  const matchProducts = async (dryRun: boolean = false) => {
    setMatching(true)
    try {
      const response = await fetch('/api/products/match-odoo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dryRun })
      })
      
      if (!response.ok) throw new Error('Failed to match products')
      
      const data = await response.json()
      toast.success(
        dryRun 
          ? `Preview: ${data.stats.matched} products can be matched`
          : `Successfully matched ${data.stats.updated} products`
      )
      
      // Refresh status
      await fetchStatus()
    } catch (error) {
      toast.error('Failed to match products')
    } finally {
      setMatching(false)
    }
  }

  const importPhotos = async () => {
    setImporting(true)
    try {
      const response = await fetch('/api/products/batch-import-photos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          totalBatches: 5,
          batchSize: 50,
          startFrom: 0,
          onlyMissingPhotos: true
        })
      })
      
      if (!response.ok) throw new Error('Failed to import photos')
      
      const data = await response.json()
      toast.success(`Imported ${data.stats.totalUpdated} photos successfully`)
      
      // Refresh status
      await fetchStatus()
    } catch (error) {
      toast.error('Failed to import photos')
    } finally {
      setImporting(false)
    }
  }

  // Auto-fetch status on mount
  useState(() => {
    fetchStatus()
  }, [])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Odoo Photo Import Manager
          </CardTitle>
          <CardDescription>
            Import and sync product photos from Odoo
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : status ? (
            <>
              {/* Statistics */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Total Products</p>
                  <p className="text-2xl font-bold">{status.statistics.total}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Mapped to Odoo</p>
                  <p className="text-2xl font-bold">{status.statistics.mapped}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">With Photos</p>
                  <p className="text-2xl font-bold">{status.statistics.withPhotos}</p>
                </div>
              </div>

              {/* Progress Bars */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Mapping Progress</span>
                    <span>{status.progress.mapping.percentage}%</span>
                  </div>
                  <Progress value={status.progress.mapping.percentage} />
                  <p className="text-xs text-muted-foreground">{status.progress.mapping.label}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Photo Import Progress</span>
                    <span>{status.progress.photos.percentage}%</span>
                  </div>
                  <Progress value={status.progress.photos.percentage} />
                  <p className="text-xs text-muted-foreground">{status.progress.photos.label}</p>
                </div>
              </div>

              {/* Recommendations */}
              {status.recommendations.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Recommendations</h4>
                  {status.recommendations.map((rec, index) => (
                    <Alert key={index}>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{rec}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <Button
                  onClick={() => fetchStatus()}
                  variant="outline"
                  disabled={loading}
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Refresh Status
                </Button>

                {status.statistics.unmapped > 0 && (
                  <>
                    <Button
                      onClick={() => matchProducts(true)}
                      variant="outline"
                      disabled={matching}
                    >
                      {matching ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Link className="h-4 w-4 mr-2" />
                      )}
                      Preview Matching
                    </Button>
                    <Button
                      onClick={() => matchProducts(false)}
                      disabled={matching}
                    >
                      {matching ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Link className="h-4 w-4 mr-2" />
                      )}
                      Match Products
                    </Button>
                  </>
                )}

                {status.statistics.readyForPhotoImport > 0 && (
                  <Button
                    onClick={importPhotos}
                    disabled={importing}
                  >
                    {importing ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Camera className="h-4 w-4 mr-2" />
                    )}
                    Import Photos ({status.statistics.readyForPhotoImport} available)
                  </Button>
                )}
              </div>

              {/* Status Badges */}
              <div className="flex flex-wrap gap-2">
                {status.statistics.total === status.statistics.mapped && (
                  <Badge variant="success" className="gap-1">
                    <CheckCircle className="h-3 w-3" />
                    All products mapped
                  </Badge>
                )}
                {status.statistics.mapped === status.statistics.withPhotos && status.statistics.mapped > 0 && (
                  <Badge variant="success" className="gap-1">
                    <CheckCircle className="h-3 w-3" />
                    All mapped products have photos
                  </Badge>
                )}
                {status.statistics.unmapped > 0 && (
                  <Badge variant="secondary" className="gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {status.statistics.unmapped} unmapped products
                  </Badge>
                )}
                {status.statistics.readyForPhotoImport > 0 && (
                  <Badge variant="default" className="gap-1">
                    <Camera className="h-3 w-3" />
                    {status.statistics.readyForPhotoImport} ready for photos
                  </Badge>
                )}
              </div>
            </>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No status data available. Click refresh to load.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  )
}