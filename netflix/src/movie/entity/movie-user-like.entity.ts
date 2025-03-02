import { Column, Entity, ManyToOne, PrimaryColumn } from 'typeorm';
import { Movie } from './movie.entity';
import { User } from 'src/user/entities/user.entity';

/**
 * movie 와 user 의 좋아요 관계를 나타내는 엔티티
 *
 * MovieUserLike 테이블이 Many
 * movie, user가 One
 */
@Entity()
export class MovieUserLike {
  @PrimaryColumn({
    name: 'movieId',
    type: 'int8',
  })
  @ManyToOne(() => Movie, (movie) => movie.likedUsers, {
    onDelete: 'CASCADE', // 영화가 삭제되면 좋아요 레코드도 삭제된다.
  })
  movie: Movie;

  @PrimaryColumn({
    name: 'userId',
    type: 'int8',
  })
  @ManyToOne(() => User, (user) => user.likedMovies, {
    onDelete: 'CASCADE', // 유저가 삭제되면 좋아요 레코드도 삭제된다.
  })
  user: User;

  @Column()
  isLike: boolean;
}
