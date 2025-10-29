import { Module } from '@nestjs/common';

import { AuthModule } from './module/auth/auth.module';
import { UsersModule } from './module/users/users.module';
import { WordsModule } from './module/words/words.module';
import { MediaModule } from './module/media/media.module';
import { GamesModule } from './module/games/games.module';
import { UtilModule } from './module/util/util.module';

@Module({
  imports: [AuthModule, UsersModule, WordsModule, MediaModule, GamesModule, UtilModule],

})
export class AppModule {}
