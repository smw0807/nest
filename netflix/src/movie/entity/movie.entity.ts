import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseTable } from '../../common/entity/base-table.entity';
import { MovieDetail } from './movie-detail.entity';
import { Director } from 'src/director/entitie/director.entity';
import { Genre } from 'src/genre/entities/genre.entity';

/// Many to One - Director -> 감독은 여러개의 영화를 만들 수 있음
// One To One - MovieDetail -> 영화는 하나의 상세 내용을 갖을 수 있음
/// Many To Many - Genre -> 영화는 여러개의 장르를 갖을 수 있고 장르는 여러개의 영화에 속할 수 있음

@Entity()
export class Movie extends BaseTable {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @Column({ type: 'decimal', precision: 3, scale: 1 })
  rating: number;

  @Column()
  year: number;

  @ManyToMany(() => Genre, (genre) => genre.movies)
  @JoinTable()
  genres: Genre[];

  @ManyToOne(() => Director, (director) => director.id, {
    cascade: true,
    nullable: false,
  })
  director: Director;

  @Column('text', { array: true })
  actors: string[];

  @OneToOne(() => MovieDetail, (movieDetail) => movieDetail.movie.id, {
    cascade: true,
    nullable: false,
  })
  @JoinColumn()
  detail: MovieDetail;

  // @Column(() => BaseEntity)
  // base: BaseEntity;
}
