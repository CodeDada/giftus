"use client"

import React from "react"

import { useState } from "react"
import { Upload, Download, FileSpreadsheet, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

interface UploadSummary {
  totalRows: number
  productsInserted: number
  productsUpdated: number
  variantsInserted: number
  variantsUpdated: number
}

interface UploadError {
  row: number
  message: string
}

export default function BulkUploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [uploadMode, setUploadMode] = useState<string>("")
  const [updateImages, setUpdateImages] = useState(false)
  const [updatePrices, setUpdatePrices] = useState(false)
  const [updateStock, setUpdateStock] = useState(false)
  const [summary, setSummary] = useState<UploadSummary | null>(null)
  const [errors, setErrors] = useState<UploadError[]>([])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
    }
  }

  const handleUpload = () => {
    // Placeholder for API submission
    // In production, this would send data to an API endpoint
    console.log({
      file,
      uploadMode,
      options: {
        updateImages,
        updatePrices,
        updateStock,
      },
    })

    // Mock response for UI demonstration
    setSummary({
      totalRows: 150,
      productsInserted: 45,
      productsUpdated: 80,
      variantsInserted: 120,
      variantsUpdated: 200,
    })

    setErrors([
      { row: 12, message: "Invalid product SKU format" },
      { row: 45, message: "Missing required field: Product Name" },
      { row: 89, message: "Price must be a positive number" },
    ])
  }

  const handleDownloadTemplate = () => {
    // Placeholder for template download
    console.log("Downloading Excel template...")
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-6 py-12">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-foreground">Product Bulk Upload</h1>
          <p className="mt-2 text-muted-foreground">
            Upload an Excel or CSV file to bulk insert or update product data. 
            Use the template to ensure your data is formatted correctly.
          </p>
        </div>

        {/* Upload Panel */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileSpreadsheet className="h-5 w-5" />
              Upload Products
            </CardTitle>
            <CardDescription>
              Select your file and configure upload options
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* File Upload */}
            <div className="space-y-2">
              <Label htmlFor="file-upload">File</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="file-upload"
                  type="file"
                  accept=".xlsx,.csv"
                  onChange={handleFileChange}
                  className="flex-1"
                />
              </div>
              {file && (
                <p className="text-sm text-muted-foreground">
                  Selected: {file.name}
                </p>
              )}
            </div>

            {/* Upload Mode */}
            <div className="space-y-2">
              <Label htmlFor="upload-mode">Upload Mode</Label>
              <Select value={uploadMode} onValueChange={setUploadMode}>
                <SelectTrigger id="upload-mode">
                  <SelectValue placeholder="Select upload mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="insert">Insert only</SelectItem>
                  <SelectItem value="update">Update only</SelectItem>
                  <SelectItem value="insert-update">Insert + Update</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Update Options */}
            <div className="space-y-3">
              <Label>Update Options</Label>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="update-images"
                    checked={updateImages}
                    onCheckedChange={(checked) => setUpdateImages(checked === true)}
                  />
                  <Label htmlFor="update-images" className="font-normal cursor-pointer">
                    Update images
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="update-prices"
                    checked={updatePrices}
                    onCheckedChange={(checked) => setUpdatePrices(checked === true)}
                  />
                  <Label htmlFor="update-prices" className="font-normal cursor-pointer">
                    Update prices
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="update-stock"
                    checked={updateStock}
                    onCheckedChange={(checked) => setUpdateStock(checked === true)}
                  />
                  <Label htmlFor="update-stock" className="font-normal cursor-pointer">
                    Update stock
                  </Label>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button onClick={handleUpload} disabled={!file || !uploadMode} className="gap-2">
                <Upload className="h-4 w-4" />
                Upload File
              </Button>
              <Button variant="outline" onClick={handleDownloadTemplate} className="gap-2 bg-transparent">
                <Download className="h-4 w-4" />
                Download Excel Template
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Upload Summary */}
        {summary && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg">Upload Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                <div className="bg-secondary rounded-lg p-4 text-center">
                  <p className="text-2xl font-semibold text-foreground">{summary.totalRows}</p>
                  <p className="text-sm text-muted-foreground">Total Rows</p>
                </div>
                <div className="bg-secondary rounded-lg p-4 text-center">
                  <p className="text-2xl font-semibold text-foreground">{summary.productsInserted}</p>
                  <p className="text-sm text-muted-foreground">Products Inserted</p>
                </div>
                <div className="bg-secondary rounded-lg p-4 text-center">
                  <p className="text-2xl font-semibold text-foreground">{summary.productsUpdated}</p>
                  <p className="text-sm text-muted-foreground">Products Updated</p>
                </div>
                <div className="bg-secondary rounded-lg p-4 text-center">
                  <p className="text-2xl font-semibold text-foreground">{summary.variantsInserted}</p>
                  <p className="text-sm text-muted-foreground">Variants Inserted</p>
                </div>
                <div className="bg-secondary rounded-lg p-4 text-center">
                  <p className="text-2xl font-semibold text-foreground">{summary.variantsUpdated}</p>
                  <p className="text-sm text-muted-foreground">Variants Updated</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error List */}
        {errors.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-destructive">
                <AlertCircle className="h-5 w-5" />
                Errors ({errors.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">Row</TableHead>
                    <TableHead>Error Message</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {errors.map((error, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{error.row}</TableCell>
                      <TableCell>{error.message}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
