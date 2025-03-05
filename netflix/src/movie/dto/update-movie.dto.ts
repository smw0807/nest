import { PartialType } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsNumber,
  IsArray,
  IsNotEmpty,
  ArrayNotEmpty,
} from 'class-validator';
import { CreateMovieDto } from './create-movie.dto';

// @ValidatorConstraint({ name: 'password' })
// class PasswordValidator implements ValidatorConstraintInterface {
//   validate(value: any) {
//     return value.length > 4 && value.length < 10;
//   }

//   defaultMessage() {
//     return '비밀번호는 4자 이상 10자 이하여야 합니다. (현재 값: $value)';
//   }
// }

// function IsPasswordValid(validationOptions?: ValidationOptions) {
//   return function (object: Object, propertyName: string) {
//     registerDecorator({
//       target: object.constructor,
//       propertyName,
//       options: validationOptions,
//       validator: PasswordValidator,
//     });
//   };
// }

export class UpdateMovieDto extends PartialType(CreateMovieDto) {
  // @IsOptional()
  // @IsString()
  // name?: string;
  // @IsOptional()
  // @IsNumber()
  // rating?: number;
  // @IsOptional()
  // @IsNumber()
  // year?: number;
  // @IsOptional()
  // @IsArray()
  // @ArrayNotEmpty()
  // @IsNumber({}, { each: true })
  // genreIds?: number[];
  // @IsOptional()
  // @IsNumber()
  // directorId?: number;
  // @IsOptional()
  // @IsArray()
  // actors?: string[];
  // @IsNotEmpty()
  // @IsOptional()
  // detail?: string;
  // null || undefined 일 때 오류 발생
  // @IsDefined()
  // @Equals('test')
  // @IsDateString()
  // @Validate(PasswordValidator, {
  //   message: '비밀번호는 4자 이상 10자 이하여야 합니다. (현재 값: $value)',
  // })
  // @IsPasswordValid()
  // test: string;
}
