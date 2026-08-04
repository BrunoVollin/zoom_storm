import '../src/config/env';
import { prisma } from '../src/infrastructure/database/prisma/prisma-connection';
import { closeDatabaseConnections } from '../src/infrastructure/database/prisma/prisma-connection';
import { PrismaProductRepository } from '../src/infrastructure/database/prisma/repositories/PrismaProductRepository';
import { CreateProductUseCase } from '../src/application/usecases/CreateProductUseCase';
import { Status } from '../src/application/contracts/UseCase';

const SAMPLE_PRODUCTS = [
  {
    name: 'The Legend of Zelda: Tears of the Kingdom',
    price: 349.9,
    description: 'Jogo de aventura para Nintendo Switch.',
    category: 'Nintendo Switch',
    stock: 25,
    transportHeight: 2,
    transportWidth: 14,
    transportLength: 17,
    weight: 0.1,
  },
  {
    name: 'Super Nintendo Classic Edition',
    price: 899.9,
    description: 'Console retro com 21 jogos clássicos pré-instalados.',
    category: 'Retro',
    stock: 10,
    transportHeight: 6,
    transportWidth: 20,
    transportLength: 24,
    weight: 0.6,
  },
  {
    name: 'PlayStation 5',
    price: 3999.9,
    description: 'Console de última geração com suporte a jogos em 4K.',
    category: 'Console',
    stock: 8,
    transportHeight: 15,
    transportWidth: 30,
    transportLength: 39,
    weight: 4.5,
  },
  {
    name: 'Sonic the Hedgehog (Mega Drive)',
    price: 149.9,
    description: 'Cartucho retro clássico para Mega Drive.',
    category: 'Retro',
    stock: 40,
    transportHeight: 1,
    transportWidth: 11,
    transportLength: 15,
    weight: 0.05,
  },
  {
    name: 'Xbox Wireless Controller',
    price: 399.9,
    description: 'Controle sem fio compatível com Xbox e PC.',
    category: 'Acessório',
    stock: 60,
    transportHeight: 7,
    transportWidth: 11,
    transportLength: 16,
    weight: 0.3,
  },
];

async function main() {
  const existing = await prisma.product.count();

  if (existing > 0) {
    console.log(
      `[seed] ${existing} produto(s) já cadastrado(s), pulando seed.`,
    );

    return;
  }

  const createProduct = new CreateProductUseCase(new PrismaProductRepository());

  for (const input of SAMPLE_PRODUCTS) {
    const result = await createProduct.execute(input);

    if (result.status === Status.ERROR) {
      console.error(`[seed] falha ao criar "${input.name}": ${result.message}`);
    } else {
      console.log(`[seed] produto criado: ${input.name}`);
    }
  }
}

main()
  .catch((error) => {
    console.error('[seed] erro ao popular produtos:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDatabaseConnections();
  });
