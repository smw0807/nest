import { Module } from '@nestjs/common';
import { DirectorService } from './director.service';
import { DirectorController } from './director.controller';
// import { TypeOrmModule } from '@nestjs/typeorm';
// import { Director } from './entity/director.entity';
import { CommonModule } from 'src/common/common.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Director, DirectorSchema } from './schema/director.schema';

@Module({
  imports: [
    // TypeOrmModule.forFeature([Director]),
    CommonModule,
    MongooseModule.forFeature([
      {
        name: Director.name,
        schema: DirectorSchema,
      },
    ]),
  ],
  controllers: [DirectorController],
  providers: [DirectorService],
  exports: [DirectorService],
})
export class DirectorModule {}
