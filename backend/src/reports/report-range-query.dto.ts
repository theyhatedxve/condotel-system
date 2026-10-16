import { IsOptional, Matches } from 'class-validator';

// Define the validated report range query input accepted by the API.
export class ReportRangeQueryDto {
  // Validate from using the rules declared below.
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'from must use YYYY-MM-DD format.',
  })
  from?: string;

  // Validate to using the rules declared below.
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'to must use YYYY-MM-DD format.',
  })
  to?: string;
}
