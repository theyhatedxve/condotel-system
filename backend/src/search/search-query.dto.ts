import { IsString, MaxLength, MinLength } from 'class-validator';

export class SearchQueryDto {
  @IsString()
  @MinLength(2, {
    message: 'Search requires at least 2 characters.',
  })
  @MaxLength(100)
  q: string;
}
