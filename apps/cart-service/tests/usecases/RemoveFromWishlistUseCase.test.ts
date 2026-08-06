import { RemoveFromWishlistUseCase } from '../../src/application/usecases/RemoveFromWishlistUseCase';
import { Status } from '../../src/application/contracts/UseCase';
import { WishlistItem } from '../../src/domain/entities/wishlist/WishlistItem';
import { createIdFromString } from '../factories/IdFactory';
import { FakeWishlistRepository } from '../factories/FakeRepositories';

describe('RemoveFromWishlistUseCase', () => {
  let wishlistRepository: FakeWishlistRepository;
  let useCase: RemoveFromWishlistUseCase;

  const userId = 'user-1';
  const productId = 'product-1';

  beforeEach(() => {
    wishlistRepository = new FakeWishlistRepository();
    useCase = new RemoveFromWishlistUseCase(wishlistRepository);
  });

  describe('Success Scenario', () => {
    it('removes the matching item from the wishlist', async () => {
      wishlistRepository.items.push(
        new WishlistItem(
          createIdFromString('item-1'),
          createIdFromString(userId),
          createIdFromString(productId),
          'Bluza',
        ),
      );

      const result = await useCase.execute({ userId, productId });

      expect(result.status).toBe(Status.SUCCESS);
      expect(wishlistRepository.items).toHaveLength(0);
    });

    it('only removes the item belonging to the given user and product', async () => {
      wishlistRepository.items.push(
        new WishlistItem(
          createIdFromString('item-1'),
          createIdFromString(userId),
          createIdFromString(productId),
          'Bluza',
        ),
        new WishlistItem(
          createIdFromString('item-2'),
          createIdFromString(userId),
          createIdFromString('product-2'),
          'Camisa',
        ),
        new WishlistItem(
          createIdFromString('item-3'),
          createIdFromString('other-user'),
          createIdFromString(productId),
          'Bluza',
        ),
      );

      const result = await useCase.execute({ userId, productId });

      expect(result.status).toBe(Status.SUCCESS);
      expect(wishlistRepository.items).toHaveLength(2);
      expect(
        wishlistRepository.items.some(
          (item) => item.productId.toString() === productId,
        ),
      ).toBe(true);
    });

    it('succeeds even when the item does not exist in the wishlist', async () => {
      const result = await useCase.execute({ userId, productId });

      expect(result.status).toBe(Status.SUCCESS);
    });
  });

  describe('Exception Handling Scenario', () => {
    it('returns an error when wishlistRepository.remove throws', async () => {
      jest
        .spyOn(wishlistRepository, 'remove')
        .mockRejectedValue(new Error('Database failure'));

      const result = await useCase.execute({ userId, productId });

      expect(result.status).toBe(Status.ERROR);
      if (result.status === Status.ERROR) {
        expect(result.message).toBe(
          'An unexpected error occurred. Please try again later.',
        );
      }
    });
  });
});
