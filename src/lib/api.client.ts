import { API_TIMEOUT, BASE_URL } from "@/shared/constants"
import type { AxiosInstance } from "axios"
import axios from "axios"

export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: API_TIMEOUT
})