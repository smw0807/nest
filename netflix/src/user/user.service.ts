import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
// import { InjectRepository } from '@nestjs/typeorm';
// import { User } from './entities/user.entity';
// import { Repository } from 'typeorm';
import { envVariableKeys } from 'src/common/constants/env.const';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
// import { PrismaService } from 'src/common/prisma.service';
import { Prisma } from '@prisma/client';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './schema/user.schema';
import { Model } from 'mongoose';
@Injectable()
export class UserService {
  constructor(
    // @InjectRepository(User)
    // private readonly userRepository: Repository<User>,
    private readonly configService: ConfigService,
    // private readonly prisma: PrismaService,
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const { email, password } = createUserDto;

    const user = await this.userModel
      .findOne({
        email,
      })
      .exec();
    // const user = await this.prisma.user.findUnique({
    //   where: {
    //     email,
    //   },
    // });

    // const user = await this.userRepository.findOne({
    //   where: {
    //     email,
    //   },
    // });

    if (user) {
      throw new BadRequestException('이미 가입된 이메일입니다.!');
    }

    const hashedPassword = await bcrypt.hash(
      password,
      this.configService.get<number>(envVariableKeys.hashRounds),
    );
    await this.userModel.create({
      email,
      password: hashedPassword,
    });

    // await this.prisma.user.create({
    //   data: {
    //     email,
    //     password: hashedPassword,
    //   },
    // });
    // await this.userRepository.save({
    //   email,
    //   password: hashedPassword,
    // });
    return this.userModel
      .findOne(
        { email },
        {
          createdMovies: 0,
          likedMovies: 0,
          chats: 0,
          chatRooms: 0,
        },
      )
      .exec();
    // return this.prisma.user.findUnique({
    //   where: {
    //     email,
    //   },
    // });

    // return this.userRepository.findOne({
    //   where: {
    //     email,
    //   },
    // });
  }

  findAll() {
    return this.userModel.find().exec();
    // return this.prisma.user.findMany({
    //   omit: {
    //     // 필드 제외
    //     password: true,
    //   },
    // });
    // return this.userRepository.find();
  }

  async findOne(id: number) {
    const user = await this.userModel.findById(id).exec();
    // const user = await this.prisma.user.findUnique({
    //   where: {
    //     id,
    //   },
    // });
    // const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('존재하지 않는 사용자입니다!');
    }
    return user;
  }

  async update(id: number, updateUserDto: UpdateUserDto) {
    const { password } = updateUserDto;
    const user = await this.userModel.findById(id).exec();
    // const user = await this.prisma.user.findUnique({
    //   where: {
    //     id,
    //   },
    // });
    // const user = await this.findOne(id);
    if (!user) {
      throw new NotFoundException('존재하지 않는 사용자입니다!');
    }

    let input: Prisma.UserUpdateInput = { ...updateUserDto };

    if (password) {
      const hash = await bcrypt.hash(
        password,
        this.configService.get<number>(envVariableKeys.hashRounds),
      );
      input = {
        ...updateUserDto,
        password: hash,
      };
    }

    await this.userModel.findByIdAndUpdate(id, input).exec();
    // await this.prisma.user.update({
    //   where: {
    //     id,
    //   },
    //   data: input,
    // });
    // await this.userRepository.update(id, {
    //   ...updateUserDto,
    //   password: hash,
    // });
    return this.userModel.findById(id).exec();
    // return this.prisma.user.findUnique({
    //   where: {
    //     id,
    //   },
    // });
    // return this.findOne(id);
  }

  async remove(id: number) {
    const user = await this.userModel.findById(id).exec();
    // const user = await this.prisma.user.findUnique({
    //   where: {
    //     id,
    //   },
    // });
    // const user = await this.findOne(id);
    if (!user) {
      throw new NotFoundException('존재하지 않는 사용자입니다!');
    }
    await this.userModel.findByIdAndDelete(id);
    // await this.prisma.user.delete({
    //   where: {
    //     id,
    //   },
    // });
    // await this.userRepository.delete(id);
    return id;
  }
}
