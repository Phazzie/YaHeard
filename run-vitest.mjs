import { startVitest } from 'vitest/node';

const vitest = await startVitest('run');

if (vitest.state.getFailed().length > 0) {
    console.error('Tests failed!');
    process.exit(1);
}
