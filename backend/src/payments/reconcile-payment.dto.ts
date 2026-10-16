import { IsString, Matches } from 'class-validator';
// Define the validated reconcile payment input accepted by the API.
export class ReconcilePaymentDto {
  // Validate checkout session id using the rules declared below.
  @IsString()
  @Matches(/^cs_[A-Za-z0-9_]+$/)
  checkoutSessionId: string;
}
