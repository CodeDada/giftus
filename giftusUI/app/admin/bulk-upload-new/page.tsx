'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, CheckCircle, Upload, Download, Loader } from 'lucide-react';

interface UploadResponse {
  message: string;
  summary: {
    totalRows: number;
    successfulRows: number;
    failedRows: number;
    errors: string[];
  };
}

interface UploadStatus {
  type: 'idle' | 'uploading' | 'success' | 'error';
  message?: string;
  data?: UploadResponse;
}

export default function BulkUploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<UploadStatus>({ type: 'idle' });
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const droppedFile = files[0];
      if (droppedFile.name.endsWith('.xlsx') || droppedFile.name.endsWith('.xls')) {
        setFile(droppedFile);
        setStatus({ type: 'idle' });
      } else {
        setStatus({
          type: 'error',
          message: 'Please upload an Excel file (.xlsx or .xls)'
        });
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files[0]) {
      const selectedFile = files[0];
      if (selectedFile.name.endsWith('.xlsx') || selectedFile.name.endsWith('.xls')) {
        setFile(selectedFile);
        setStatus({ type: 'idle' });
      } else {
        setStatus({
          type: 'error',
          message: 'Please upload an Excel file (.xlsx or .xls)'
        });
      }
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bulkupload/template`);
      const data = await response.text();
      const blob = new Blob([data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'bulk-upload-template.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      setStatus({
        type: 'error',
        message: 'Failed to download template'
      });
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setStatus({
        type: 'error',
        message: 'Please select a file first'
      });
      return;
    }

    setStatus({ type: 'uploading' });

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/bulkupload/upload`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        setStatus({
          type: 'error',
          message: errorData.error || 'Upload failed'
        });
        return;
      }

      const data: UploadResponse = await response.json();
      setStatus({
        type: 'success',
        message: 'Bulk upload completed successfully!',
        data
      });
      setFile(null);
    } catch (error) {
      setStatus({
        type: 'error',
        message: error instanceof Error ? error.message : 'Upload failed'
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Bulk Upload Products</h1>
          <p className="text-slate-300">Upload an Excel file to import products, variants, and images in bulk</p>
        </div>

        <div className="space-y-6">
          {/* Template Download */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Download className="w-5 h-5" />
                Download Template
              </CardTitle>
              <CardDescription>Start with our template to ensure proper formatting</CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={downloadTemplate}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Excel Template
              </Button>
            </CardContent>
          </Card>

          {/* File Upload */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Upload File
              </CardTitle>
              <CardDescription>Drag and drop or select an Excel file</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  dragActive
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-slate-600 bg-slate-700/50 hover:border-slate-500'
                }`}
              >
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-input"
                />
                <label htmlFor="file-input" className="cursor-pointer">
                  <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-white font-medium">Drag and drop your Excel file here</p>
                  <p className="text-slate-400 text-sm">or click to select a file</p>
                </label>
              </div>

              {file && (
                <div className="bg-slate-700 rounded-lg p-4 flex items-center justify-between">
                  <div>
                    <p className="text-white font-medium">{file.name}</p>
                    <p className="text-slate-400 text-sm">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFile(null)}
                    className="text-slate-400 hover:text-white"
                  >
                    Remove
                  </Button>
                </div>
              )}

              <Button
                onClick={handleUpload}
                disabled={!file || status.type === 'uploading'}
                className="w-full bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
              >
                {status.type === 'uploading' ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Products
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Status Messages */}
          {status.type === 'success' && status.data && (
            <Card className="bg-green-900/20 border-green-700">
              <CardHeader>
                <CardTitle className="text-green-400 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  {status.message}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-slate-700/50 rounded-lg p-4">
                    <p className="text-slate-400 text-sm">Total Rows</p>
                    <p className="text-2xl font-bold text-white">{status.data.summary.totalRows}</p>
                  </div>
                  <div className="bg-green-700/20 rounded-lg p-4">
                    <p className="text-green-400 text-sm">Successful</p>
                    <p className="text-2xl font-bold text-green-400">{status.data.summary.successfulRows}</p>
                  </div>
                  <div className="bg-red-700/20 rounded-lg p-4">
                    <p className="text-red-400 text-sm">Failed</p>
                    <p className="text-2xl font-bold text-red-400">{status.data.summary.failedRows}</p>
                  </div>
                </div>

                {status.data.summary.errors.length > 0 && (
                  <div className="bg-red-700/10 border border-red-700 rounded-lg p-4">
                    <p className="text-red-400 font-medium mb-2">Errors:</p>
                    <ul className="text-red-300 text-sm space-y-1">
                      {status.data.summary.errors.slice(0, 5).map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                      {status.data.summary.errors.length > 5 && (
                        <li>• ... and {status.data.summary.errors.length - 5} more errors</li>
                      )}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {status.type === 'error' && (
            <Card className="bg-red-900/20 border-red-700">
              <CardHeader>
                <CardTitle className="text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Error
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-red-300">{status.message}</p>
              </CardContent>
            </Card>
          )}

          {/* Instructions */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">How to Use</CardTitle>
            </CardHeader>
            <CardContent className="text-slate-300 space-y-3">
              <div>
                <h4 className="font-semibold text-white mb-1">1. Download Template</h4>
                <p className="text-sm">Download the Excel template to see the required format and column names.</p>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-1">2. Fill in Data</h4>
                <p className="text-sm">Fill the template with your product data. Required fields are marked in the template.</p>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-1">3. Add Images</h4>
                <p className="text-sm">Provide image URLs in the ImageUrl column. They will be downloaded and stored automatically.</p>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-1">4. Upload</h4>
                <p className="text-sm">Upload your filled template using this form. Products, variants, and images will be created/updated automatically.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
