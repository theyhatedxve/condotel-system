import { IsOptional, Matches } from 'class-validator';

export class ReportRangeQueryDto {
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'from must use YYYY-MM-DD format.',
  })
  from?: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'to must use YYYY-MM-DD format.',
  })
  to?: string;
}
