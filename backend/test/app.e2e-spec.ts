import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

describe('Isolated application workflows', () => {
  it('runs real HTTP, JWT, Argon2, encryption, migration and mocked payment workflows', () => {
    const output = execFileSync(
      process.execPath,
      [resolve(__dirname, 'integration.cjs')],
      { cwd: resolve(__dirname, '..'), encoding: 'utf8', timeout: 120000 },
    );
    expect(output).toContain('"passed":true');
  }, 130000);
});
