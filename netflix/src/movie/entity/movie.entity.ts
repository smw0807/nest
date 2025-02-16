import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';

export class BaseEntity {
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @VersionColumn()
  version: number;
}

@Entity()
export class Movie extends BaseEntity {
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

  // @Column(() => BaseEntity)
  // base: BaseEntity;
}
