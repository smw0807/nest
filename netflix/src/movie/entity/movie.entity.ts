import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';
import { BaseTable } from './base-table.entity';
import { MovieDetail } from './movie-detail.entity';

/// Many to One - Director -> 감독은 여러개의 영화를 만들 수 있음
// One To One - MovieDetail -> 영화는 하나의 상세 내용을 갖을 수 있음
/// Many To Many - Genre -> 영화는 여러개의 장르를 갖을 수 있고 장르는 여러개의 영화에 속할 수 있음

@Entity()
export class Movie extends BaseTable {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column({ type: 'decimal', precision: 3, scale: 1 })
  rating: number;

  @Column()
  year: number;

  @Column()
  genre: string;

  @Column()
  director: string;

  @Column('text', { array: true })
  actors: string[];

  @OneToOne(() => MovieDetail)
  @JoinColumn()
  detail: MovieDetail;

  // @Column(() => BaseEntity)
  // base: BaseEntity;
}
