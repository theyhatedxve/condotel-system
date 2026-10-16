import { SettingsService } from './settings.service';
import { PrismaService } from '../prisma/prisma.service';

jest.mock('../prisma/prisma.service', () => ({ PrismaService: class {} }));

describe('NEXORA settings branding', () => {
  it('creates settings with NEXORA and displays the historical default without rewriting stored data', async () => {
    const stored = { id: 'system', propertyName: 'CONDOTEL' };
    const upsert = jest.fn().mockResolvedValue(stored);
    const service = new SettingsService({
      systemSetting: { upsert },
    } as unknown as PrismaService);
    expect((await service.getSettings()).propertyName).toBe('NEXORA');
    expect(upsert).toHaveBeenCalledWith({
      where: { id: 'system' },
      update: {},
      create: { id: 'system', propertyName: 'NEXORA' },
    });
    expect(stored.propertyName).toBe('CONDOTEL');
  });

  it('preserves a customized property name', async () => {
    const upsert = jest
      .fn()
      .mockResolvedValue({ id: 'system', propertyName: 'Custom Property' });
    const service = new SettingsService({
      systemSetting: { upsert },
    } as unknown as PrismaService);
    expect((await service.getSettings()).propertyName).toBe('Custom Property');
  });
});
