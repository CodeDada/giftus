/**
 * API Handler - Centralized API calling logic
 * All backend API calls should go through this file
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

console.log("[API Handler] API_BASE_URL:", API_BASE_URL);
console.log("[API Handler] NEXT_PUBLIC_API_URL env:", process.env.NEXT_PUBLIC_API_URL);

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
    
    const response = await fetch(url, {
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
      message: error?.message || "Failed to call API. Make sure the backend is running on http://localhost:5000",
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
