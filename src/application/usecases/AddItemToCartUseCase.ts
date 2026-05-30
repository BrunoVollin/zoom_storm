import { CartItem } from "../../domain/entities/cart/CartItem";
import { CartRepository } from "../../domain/repositories/CartRepository";
import { ProductRepository } from "../../domain/repositories/ProductRepository";
import { IdType } from "../../domain/shared/IdType";
import { Status, UseCase } from "../contracts/UseCase";

export class AddItemToCartUseCase implements UseCase<Input, Output> {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly cartRepository: CartRepository,
  ) {}
  async execute(input: Input): Promise<Output> {
    const [products, cart] = await Promise.all([
      this.productRepository.findByIds(
        input.products.map((item) => IdType.create(item.id)),
      ),
      this.cartRepository.findById(IdType.create(input.cartId)),
    ]);

    if (!cart) {
      return {
        status: Status.ERROR,
        message: "Cart not found",
      };
    }

    if (products.length !== input.products.length) {
      return {
        status: Status.ERROR,
        message: "Product not found",
      };
    }

    for (const product of products) {
      const quantity = input.products.find(
        (item) => item.id === product.getId().toString(),
      )?.quantity;

      if (quantity) {
        cart.addItem(new CartItem(IdType.create(), product, quantity));
      }
    }

    await this.cartRepository.save(cart);

    return {
      status: Status.SUCCESS,
    };
  }
}

interface Input {
  cartId: string;
  products: Array<{ id: string; quantity: number }>;
}

interface SuccessOutput {
  status: Status.SUCCESS;
}

interface ErrorOutput {
  status: Status.ERROR;
  message: string;
}

type Output = SuccessOutput | ErrorOutput;
