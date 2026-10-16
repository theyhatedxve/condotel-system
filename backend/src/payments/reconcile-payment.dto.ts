import { IsString, Matches } from 'class-validator';
export class ReconcilePaymentDto {
  @IsString()
  @Matches(/^cs_[A-Za-z0-9_]+$/)
  checkoutSessionId: string;
}
