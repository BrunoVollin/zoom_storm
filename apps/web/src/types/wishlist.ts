export interface WishlistItem {
  id: string;
  productId: string;
  productName: string;
  createdAt: string;
}

export interface WishlistListResponse {
  status: "SUCCESS" | "ERROR";
  items?: WishlistItem[];
  message?: string;
}

export interface WishlistItemResponse {
  status: "SUCCESS" | "ERROR";
  item?: WishlistItem;
  message?: string;
}
