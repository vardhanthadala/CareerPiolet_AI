import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001/api";

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * Set the auth token for API requests.
 * Called from components that have access to the Clerk session.
 */
export function setAuthToken(token: string | null) {
  if (token) {
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common["Authorization"];
  }
}

// ---- Jobs API ----

export async function searchJobs(params: Record<string, string>) {
  const searchParams = new URLSearchParams(params);
  const { data } = await api.get(`/jobs?${searchParams.toString()}`);
  return data;
}

export async function getJob(id: string) {
  const { data } = await api.get(`/jobs/${id}`);
  return data;
}

export async function getJobStats() {
  const { data } = await api.get("/jobs/stats");
  return data;
}

export async function saveJob(id: string) {
  const { data } = await api.post(`/jobs/save/${id}`);
  return data;
}

export async function unsaveJob(id: string) {
  const { data } = await api.delete(`/jobs/save/${id}`);
  return data;
}

export async function getSavedJobs() {
  const { data } = await api.get("/jobs/saved");
  return data;
}

// ---- Companies API ----

export async function getCompanies() {
  const { data } = await api.get("/companies");
  return data;
}

export async function seedCompanies() {
  const { data } = await api.post("/companies/seed");
  return data;
}

// ---- Connectors API ----

export async function fetchAllJobs() {
  const { data } = await api.post("/connectors/fetch-all");
  return data;
}

export async function fetchJobsForCompany(companyId: string) {
  const { data } = await api.post(`/connectors/fetch/${companyId}`);
  return data;
}

export async function fetchAdzunaJobs(query: string = "React Developer") {
  const { data } = await api.post("/connectors/adzuna", { query });
  return data;
}

// ---- Candidates API ----

export async function getMyProfile() {
  const { data } = await api.get("/candidates/me");
  return data;
}

export async function updateMyProfile(profile: Record<string, unknown>) {
  const { data } = await api.put("/candidates/me", profile);
  return data;
}

// ---- Users API ----

export async function getMe() {
  const { data } = await api.get("/users/me");
  return data;
}

// ---- AI Resume Parser API ----

export async function uploadAndParseResume(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const aiUrl = process.env.NEXT_PUBLIC_AI_SERVICE_URL || "http://localhost:8000";
  const { data } = await axios.post(`${aiUrl}/ai/parse-resume`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}
