import { createProxyRoute } from "@/lib/create-proxy-route";

export const { GET, POST, PATCH, DELETE, PUT } = createProxyRoute("/cart");
