import { IsString, MaxLength, MinLength } from 'class-validator';

// Define the validated search query input accepted by the API.
export class SearchQueryDto {
  // Validate q using the rules declared below.
  @IsString()
  @MinLength(2, {
    message: 'Search requires at least 2 characters.',
  })
  @MaxLength(255)
  q: string;
}
