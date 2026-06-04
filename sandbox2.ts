import { bootstrap } from '@cart-projection/index';
import './register-env';


(async () => {
  try {
    await startConsumer();
  } catch (error) {
    console.error('❌ Erro durante a execução do sandbox:', error);
  } finally {
  }
})();
