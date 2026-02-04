/**
 * API Handler - Centralized API calling logic
 * All backend API calls should go through this file
 *
 * Note: For SSR or Node environments without global fetch, install `node-fetch`:
 *   pnpm add -D node-fetch
 * or
 *   npm install --save-dev node-fetch
 *
 * Node 18+ includes global fetch; the file dynamically imports `node-fetch` as a fallback.
 */

// Determine API URL based on environment
let API_BASE_URL: string;

if (typeof window !== 'undefined') {
  // Browser/Client-side
  API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5056";
} else {
  // Server-side
  API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5056";
}

console.log("[API Handler] API_BASE_URL:", API_BASE_URL);
console.log("[API Handler] NEXT_PUBLIC_API_URL env:", process.env.NEXT_PUBLIC_API_URL);
console.log("[API Handler] Environment:", typeof window !== 'undefined' ? 'browser' : 'server');

// Type definitions for API responses
export interface HelloWorldResponse {
  message: string;
  timestamp: string;
  service: string;
  version: string;
}

export interface GreetResponse {
  message: string;
  timestamp: string;
  service: string;
}

export interface HealthCheckResponse {
  status: string;
  timestamp: string;
  uptime: string;
}

export interface ApiError {
  message: string;
  status?: number;
  statusText?: string;
}

/**
 * Generic API call handler with error handling
 */
async function callApi<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    
    console.log(`[API] Calling: ${url}`);

    // Ensure we have a fetch function that works in both browser and Node
    let fetchFn: typeof fetch;
    if (typeof fetch === "function") {
      fetchFn = fetch;
    } else {
      // Server-side Node environment without global fetch (older Node versions)
      try {
        // @ts-ignore - node-fetch types may not be installed in dev env; dynamic import used as a runtime fallback
        const nodeFetch = await import("node-fetch");
        // node-fetch v3 exports default
        fetchFn = (nodeFetch as any).default ?? (nodeFetch as any);
      } catch (impErr) {
        console.error("[API] Failed to load node-fetch dynamically:", impErr);
        throw new Error("Fetch is not available in this environment. On Node.js, install node-fetch or use a Node version with global fetch.");
      }
    }

    const response = await fetchFn(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      ...options,
    });

    console.log(`[API] Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[API] Error response:`, errorText);
      throw {
        message: `API Error: ${response.statusText} (${response.status})`,
        status: response.status,
        statusText: response.statusText,
      } as ApiError;
    }

    const data: T = await response.json();
    console.log(`[API] Response data:`, data);
    return data;
  } catch (error: any) {
    console.error(`[API] Catch block error:`, error);
    
    // If it's already an ApiError, just rethrow it
    if (error.status !== undefined) {
      throw error;
    }
    
    // Handle network errors, CORS errors, etc
    const apiError: ApiError = {
      message: error?.message || `Failed to call API. Make sure the backend is running and ${API_BASE_URL} is reachable`,
      status: error?.status,
      statusText: error?.statusText,
    };
    
    console.error(`[API] Final error:`, apiError);
    throw apiError;
  }
}

/**
 * Hello World API - Get a greeting message
 */
export async function getHelloWorld(): Promise<HelloWorldResponse> {
  return callApi<HelloWorldResponse>("/api/helloworld");
}

/**
 * Greet API - Get a personalized greeting
 */
export async function greetUser(name: string): Promise<GreetResponse> {
  return callApi<GreetResponse>(`/api/helloworld/greet/${encodeURIComponent(name)}`);
}

/**
 * Health Check API - Check API service status
 */
export async function checkHealth(): Promise<HealthCheckResponse> {
  return callApi<HealthCheckResponse>("/api/helloworld/health");
}

/**
 * Welcome API - Get service information
 */
export async function getWelcome(): Promise<any> {
  return callApi<any>("/");
}

/**
 * Bulk Upload Matrix API - Upload Excel file with matrix format
 * Returns summary of successful and failed uploads
 */
export interface BulkUploadSummary {
  totalRows: number;
  successfulRows: number;
  failedRows: number;
  errors: string[];
}

export async function uploadBulkMatrixFile(
  file: File,
  category: string = ""
): Promise<BulkUploadSummary> {
  try {
    const formData = new FormData();
    formData.append("file", file);
    if (category) {
      formData.append("category", category);
    }

    const url = `${API_BASE_URL}/api/bulkupload/upload-matrix`;
    console.log(`[API] Bulk Upload: Posting to ${url}`);
    console.log(`[API] File: ${file.name}, Size: ${file.size}, Category: ${category}`);

    const response = await fetch(url, {
      method: "POST",
      body: formData,
      // Don't set Content-Type header - browser will set it with boundary
    });

    console.log(`[API] Bulk Upload Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[API] Bulk Upload Error response:`, errorText);
      throw {
        message: `Bulk Upload Failed: ${response.statusText} (${response.status})`,
        status: response.status,
        statusText: response.statusText,
      } as ApiError;
    }

    const data: BulkUploadSummary = await response.json();
    console.log(`[API] Bulk Upload Response data:`, data);
    return data;
  } catch (error: any) {
    console.error(`[API] Bulk Upload Error:`, error);

    const apiError: ApiError = {
      message: error?.message || `Bulk upload failed. Make sure the backend is running and ${API_BASE_URL} is reachable`,
      status: error?.status,
      statusText: error?.statusText,
    };

    console.error(`[API] Bulk Upload Final error:`, apiError);
    throw apiError;
  }
}
