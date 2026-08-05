import { http } from "@/lib/http";
import type { CreateReviewInput } from "@/schemas/review.schema";
import type { Product } from "@/types/product";

interface ReviewResponse {
  status: "SUCCESS" | "ERROR";
  product?: Product;
  message?: string;
}

export const reviewService = {
  async create(productId: string, input: CreateReviewInput): Promise<Product> {
    const { data } = await http.post<ReviewResponse>(`/products/${productId}/reviews`, input);
    if (data.status === "ERROR" || !data.product) {
      throw new Error(data.message ?? "Não foi possível enviar sua avaliação");
    }
    return data.product;
  },
};
