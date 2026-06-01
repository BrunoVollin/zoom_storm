import { Cart } from '../../domain/entities/cart/Cart';
import { CartItem } from '../../domain/entities/cart/CartItem';
import { CartRepository } from '../../domain/repositories/CartRepository';
import { CouponRepository } from '../../domain/repositories/CouponRepository';
import { ProductRepository } from '../../domain/repositories/ProductRepository';
import { IdType } from '../../domain/shared/IdType';
import { Status, UseCase } from '../contracts/UseCase';

export class CreateCartUseCase implements UseCase<Input, Output> {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly couponRepository: CouponRepository,
    private readonly cartRepository: CartRepository,
  ) {}
  async execute(input: Input): Promise<Output> {
    try {
      const [products, coupons] = await Promise.all([
        this.productRepository.findByIds(
          input.products.map((item) => IdType.create(item.id)),
        ),
        this.couponRepository.findByIds(
          input.coupons.map((item) => IdType.create(item)),
        ),
      ]);

      if (coupons.length !== input.coupons.length) {
        return {
          status: Status.ERROR,
          message: 'Coupon not found',
        };
      }

      if (products.length !== input.products.length) {
        return {
          status: Status.ERROR,
          message: 'Product not found',
        };
      }

      const cart = new Cart(
        IdType.create(input.userId),
        IdType.create(),
      );

      products.forEach((product) => {
        const quantity = input.products.find(
          (item) => item.id === product.getId().toString(),
        )?.quantity;

        if (quantity) {
          cart.addItem(new CartItem(IdType.create(), product, quantity));
        }
      });

      for (const coupon of coupons) {
        if (!coupon.isValid()) {
          return {
            status: Status.ERROR,
            message: 'Error: ' + coupon.getName(),
          };
        }
        cart.addCoupon(coupon);
      }

      await this.cartRepository.save(cart);

      return {
        status: Status.SUCCESS,
      };
    } catch (error) {
      return {
        status: Status.ERROR,
        message:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred.',
      };
    }
  }
}

interface Input {
  userId: string;
  products: Array<{ id: string; quantity: number }>;
  coupons: Array<string>;
}

interface SuccessOutput {
  status: Status.SUCCESS;
}

interface ErrorOutput {
  status: Status.ERROR;
  message: string;
}

type Output = SuccessOutput | ErrorOutput;
