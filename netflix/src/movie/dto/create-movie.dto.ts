export class CreateMovieDto {
  id?: number;
  name: string;
  description: string;
  rating: number;
  year: number;
  genre: string;
  director: string;
  cast: string[];
}

export class UpdateMovieDto {
  name?: string;
  description?: string;
  rating?: number;
  year?: number;
  genre?: string;
  director?: string;
  cast?: string[];
}
