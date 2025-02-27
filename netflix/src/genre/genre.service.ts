import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateGenreDto } from './dto/create-genre.dto';
import { UpdateGenreDto } from './dto/update-genre.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Genre } from './entities/genre.entity';
import { Repository } from 'typeorm';

@Injectable()
export class GenreService {
  constructor(
    @InjectRepository(Genre)
    private readonly genreRepository: Repository<Genre>,
  ) {}

  findAll() {
    return this.genreRepository.find();
  }

  findOne(id: number) {
    return this.genreRepository.findOne({ where: { id } });
  }

  async create(createGenreDto: CreateGenreDto) {
    return this.genreRepository.save(createGenreDto);
  }

  async update(id: number, updateGenreDto: UpdateGenreDto) {
    const genre = await this.findOne(id);
    if (!genre) {
      throw new NotFoundException('존재하지 않는 장르 ID입니다.');
    }
    await this.genreRepository.update(id, updateGenreDto);
    return this.findOne(id);
  }

  async remove(id: number) {
    const genre = this.findOne(id);
    if (!genre) {
      throw new NotFoundException('존재하지 않는 장르 ID입니다.');
    }
    await this.genreRepository.delete(id);
    return id;
  }
}
