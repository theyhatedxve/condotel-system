import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PrivateDataService } from './private-data.service';
// Stop startup when migration, write protections, or configured keys are incomplete.
@Injectable()
export class PrivacyReadinessService implements OnApplicationBootstrap {
  constructor(
    private readonly prisma: PrismaService,
    private readonly privacy: PrivateDataService,
  ) {}
  // Require finalized privacy protections and matching keys before allowing the API to
  // serve requests.
  async onApplicationBootstrap() {
    try {
      const markers = await this.prisma.$queryRawUnsafe<
        Array<{ keyCheck: string }>
      >('SELECT keyCheck FROM PrivacyState WHERE id=1');
      const triggers = await this.prisma.$queryRaw<
        Array<{ name: string }>
      >`SELECT name FROM sqlite_master WHERE type='trigger' AND name IN ('User_encrypted_INSERT','User_encrypted_UPDATE','GuestProfile_encrypted_INSERT','GuestProfile_encrypted_UPDATE','Reservation_encrypted_INSERT','Reservation_encrypted_UPDATE')`;
      if (
        markers[0]?.keyCheck !==
          this.privacy.index('email', 'condotel:privacy-ready:v1') ||
        triggers.length !== 6
      )
        throw new Error();
      const sample = await this.prisma.user.findFirst();
      if (sample) this.privacy.readContacts(sample);
    } catch {
      throw new Error(
        'Privacy setup is incomplete or keys do not match. Keep the server offline and follow PRIVACY.md. Do not replace existing keys.',
      );
    }
  }
}
