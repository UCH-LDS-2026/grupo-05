import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentPlayer, AuthPlayer } from '../auth/current-player.decorator';

@Controller('kiosks/:kioskId/reviews')
@UseGuards(JwtAuthGuard)
export class ReviewsController {
  constructor(private readonly reviews: ReviewsService) {}

  @Post()
  upsert(
    @Param('kioskId') kioskId: string,
    @CurrentPlayer() player: AuthPlayer,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviews.upsert(player.id, kioskId, dto);
  }
}
