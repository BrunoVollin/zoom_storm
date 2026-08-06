import { CartList } from "@/components/features/cart/cart-list";

export default function CartPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Your cart</h1>
      <CartList />
    </div>
  );
}
