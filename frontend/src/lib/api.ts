import { User, Vehicle } from '../types';

// Requests use relative paths (e.g. '/api/vehicles') so they hit the Vite dev
// server's origin and are forwarded to the backend by the proxy in
// vite.config.ts — no cross-origin/CORS from the browser. An empty base also
// works in production when the API is served from the same origin as the app.
const API_BASE = '';

export interface AuthResponse {
  token: string;
  user: User;
}

export interface VehicleInput {
  make: string;
  model: string;
  category: string;
  price: number;
  quantity?: number;
}

export interface VehicleSearchFilters {
  make?: string;
  model?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  token?: string | null;
}

// Single fetch wrapper: attaches the bearer token when present and turns any
// non-2xx response into a thrown Error carrying the backend's `message` field so
// callers (and the UI) get a clean, human-readable message instead of a raw
// HTTP status.
async function request<T>(path: string, { method = 'GET', body, token }: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // 204 No Content (e.g. DELETE) has no body to parse.
  if (res.status === 204) {
    return undefined as T;
  }

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const message =
      (data && typeof data === 'object' && 'message' in data && typeof data.message === 'string'
        ? data.message
        : null) ?? `Request failed (${res.status})`;
    throw new Error(message);
  }

  return data as T;
}

function buildQuery(filters: VehicleSearchFilters): string {
  const params = new URLSearchParams();
  if (filters.make) params.set('make', filters.make);
  if (filters.model) params.set('model', filters.model);
  if (filters.category) params.set('category', filters.category);
  if (filters.minPrice !== undefined) params.set('minPrice', String(filters.minPrice));
  if (filters.maxPrice !== undefined) params.set('maxPrice', String(filters.maxPrice));
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

// --- Auth (public) ---------------------------------------------------------

export function register(email: string, password: string): Promise<AuthResponse> {
  return request<AuthResponse>('/api/auth/register', {
    method: 'POST',
    body: { email, password },
  });
}

export function login(email: string, password: string): Promise<AuthResponse> {
  return request<AuthResponse>('/api/auth/login', {
    method: 'POST',
    body: { email, password },
  });
}

// --- Vehicles (authenticated) ---------------------------------------------

export function listVehicles(token: string): Promise<Vehicle[]> {
  return request<Vehicle[]>('/api/vehicles', { token });
}

export function createVehicle(input: VehicleInput, token: string): Promise<Vehicle> {
  return request<Vehicle>('/api/vehicles', { method: 'POST', body: input, token });
}

export function searchVehicles(filters: VehicleSearchFilters, token: string): Promise<Vehicle[]> {
  return request<Vehicle[]>(`/api/vehicles/search${buildQuery(filters)}`, { token });
}

export function updateVehicle(id: string, input: Partial<VehicleInput>, token: string): Promise<Vehicle> {
  return request<Vehicle>(`/api/vehicles/${id}`, { method: 'PUT', body: input, token });
}

export function deleteVehicle(id: string, token: string): Promise<void> {
  return request<void>(`/api/vehicles/${id}`, { method: 'DELETE', token });
}

export function purchaseVehicle(id: string, token: string): Promise<Vehicle> {
  return request<Vehicle>(`/api/vehicles/${id}/purchase`, { method: 'POST', token });
}

export function restockVehicle(id: string, qty: number, token: string): Promise<Vehicle> {
  return request<Vehicle>(`/api/vehicles/${id}/restock`, { method: 'POST', body: { qty }, token });
}
