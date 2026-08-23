import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';

@Injectable()
export class BookingsService {
  constructor(private prisma: PrismaService) {}

  async createBooking(guestId: string, dto: CreateBookingDto) {
    const start = new Date(dto.startDate);
    const end = new Date(dto.endDate);
    const now = new Date();

    // Resetar horas para comparação justa de datas
    now.setHours(0, 0, 0, 0);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      throw new BadRequestException('Formato de data inválido.');
    }

    if (start < now) {
      throw new BadRequestException('A data de início da reserva não pode ser no passado.');
    }

    if (end <= start) {
      throw new BadRequestException('A data de término deve ser posterior à data de início.');
    }

    // Verificar se o imóvel existe
    const space = await this.prisma.space.findUnique({
      where: { id: dto.spaceId },
    });

    if (!space) {
      throw new NotFoundException('O espaço selecionado não existe.');
    }

    if (space.hostId === guestId) {
      throw new BadRequestException('Um anfitrião não pode reservar seu próprio espaço.');
    }

    // REGRA DE OURO: Prevenção de Double Booking (reservas sobrepostas)
    const overlappingBooking = await this.prisma.booking.findFirst({
      where: {
        spaceId: dto.spaceId,
        status: 'CONFIRMED',
        AND: [
          { startDate: { lt: end } },
          { endDate: { gt: start } },
        ],
      },
    });

    if (overlappingBooking) {
      throw new ConflictException(
        'Este espaço já possui uma reserva confirmada para as datas selecionadas. Por favor, escolha outro período.',
      );
    }

    // Cálculo do total de noites e preço final
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const pricePerNight = Number(space.pricePerNight);
    const totalPrice = pricePerNight * nights;

    // Criar a reserva de forma transacional/atômica
    return this.prisma.booking.create({
      data: {
        spaceId: dto.spaceId,
        guestId,
        startDate: start,
        endDate: end,
        totalPrice,
        status: 'CONFIRMED',
      },
      include: {
        space: {
          select: {
            id: true,
            title: true,
            location: true,
            images: true,
            pricePerNight: true,
          },
        },
        guest: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async findMyBookings(guestId: string) {
    return this.prisma.booking.findMany({
      where: { guestId },
      include: {
        space: {
          select: {
            id: true,
            title: true,
            description: true,
            location: true,
            images: true,
            pricePerNight: true,
            host: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { startDate: 'desc' },
    });
  }

  async findHostBookings(hostId: string) {
    return this.prisma.booking.findMany({
      where: {
        space: {
          hostId,
        },
      },
      include: {
        space: {
          select: {
            id: true,
            title: true,
            location: true,
          },
        },
        guest: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { startDate: 'desc' },
    });
  }

  async cancelBooking(bookingId: string, userId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { space: true },
    });

    if (!booking) {
      throw new NotFoundException('Reserva não encontrada.');
    }

    // Apenas o hóspede que fez a reserva ou o anfitrião do espaço podem cancelar
    if (booking.guestId !== userId && booking.space.hostId !== userId) {
      throw new ForbiddenException('Você não tem permissão para cancelar esta reserva.');
    }

    if (booking.status === 'CANCELLED') {
      throw new BadRequestException('Esta reserva já está cancelada.');
    }

    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: 'CANCELLED' },
    });

    return {
      message: 'Reserva cancelada com sucesso.',
      booking: updated,
    };
  }
}
