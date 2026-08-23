import { Controller, Get, Post, Body, Patch, Param, UseGuards } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  async create(
    @GetUser('userId') guestId: string,
    @Body() createBookingDto: CreateBookingDto,
  ) {
    return this.bookingsService.createBooking(guestId, createBookingDto);
  }

  @Get('my-bookings')
  async findMyBookings(@GetUser('userId') guestId: string) {
    return this.bookingsService.findMyBookings(guestId);
  }

  @Roles(Role.HOST)
  @Get('host-bookings')
  async findHostBookings(@GetUser('userId') hostId: string) {
    return this.bookingsService.findHostBookings(hostId);
  }

  @Patch(':id/cancel')
  async cancelBooking(
    @Param('id') bookingId: string,
    @GetUser('userId') userId: string,
  ) {
    return this.bookingsService.cancelBooking(bookingId, userId);
  }
}
