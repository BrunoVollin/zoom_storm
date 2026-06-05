import { Consumer } from 'kafkajs';

export function setupGracefulShutdown(consumer: Consumer) {
  const handleShutdown = async (signal: string): Promise<void> => {
    console.log(`\n[System] Received ${signal}. Disconnecting consumer...`);
    try {
      await consumer.disconnect();
      console.log('[System] Kafka consumer disconnected safely.');
      process.exit(0);
    } catch (err) {
      console.error('[System] Error during shutdown:', err);
      process.exit(1);
    }
  };

  process.on('SIGINT', () => handleShutdown('SIGINT'));
  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
}
