import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateSpaceDto } from './dto/create-space.dto';
import { UpdateSpaceDto } from './dto/update-space.dto';
import { QuerySpaceDto } from './dto/query-space.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class SpacesService {
  constructor(private prisma: PrismaService) {}

  async create(hostId: string, dto: CreateSpaceDto) {
    return this.prisma.space.create({
      data: {
        title: dto.title,
        description: dto.description,
        pricePerNight: dto.pricePerNight,
        location: dto.location,
        capacity: dto.capacity,
        features: dto.features,
        images: dto.images,
        hostId,
      },
      include: {
        host: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });
  }

  async findAll(query: QuerySpaceDto) {
    const where: Prisma.SpaceWhereInput = {};

    if (query.location) {
      where.location = {
        contains: query.location,
      };
    }

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      where.pricePerNight = {};
      if (query.minPrice !== undefined) {
        where.pricePerNight.gte = query.minPrice;
      }
      if (query.maxPrice !== undefined) {
        where.pricePerNight.lte = query.maxPrice;
      }
    }

    if (query.minCapacity !== undefined) {
      where.capacity = {
        gte: query.minCapacity,
      };
    }

    // Filtrar apenas imóveis disponíveis nas datas informadas (excluindo os que possuem reservas confirmadas sobrepostas)
    if (query.startDate && query.endDate) {
      const start = new Date(query.startDate);
      const end = new Date(query.endDate);

      if (start >= end) {
        throw new BadRequestException('A data de término deve ser posterior à data de início.');
      }

      where.bookings = {
        none: {
          status: 'CONFIRMED',
          AND: [
            { startDate: { lt: end } },
            { endDate: { gt: start } },
          ],
        },
      };
    }

    const spaces = await this.prisma.space.findMany({
      where,
      include: {
        host: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Se houver filtro de feature/característica específica em memória ou json
    if (query.feature) {
      const featLower = query.feature.toLowerCase();
      return spaces.filter((space) => {
        const feats = Array.isArray(space.features) ? (space.features as string[]) : [];
        return feats.some((f) => f.toLowerCase().includes(featLower));
      });
    }

    return spaces;
  }

  async findOne(id: string) {
    const space = await this.prisma.space.findUnique({
      where: { id },
      include: {
        host: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
        bookings: {
          where: {
            status: 'CONFIRMED',
            endDate: { gte: new Date() },
          },
          select: {
            id: true,
            startDate: true,
            endDate: true,
          },
        },
      },
    });

    if (!space) {
      throw new NotFoundException('Espaço não encontrado.');
    }

    return space;
  }

  async findMySpaces(hostId: string) {
    return this.prisma.space.findMany({
      where: { hostId },
      include: {
        bookings: {
          select: {
            id: true,
            startDate: true,
            endDate: true,
            totalPrice: true,
            status: true,
            guest: { select: { id: true, name: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, hostId: string, dto: UpdateSpaceDto) {
    const space = await this.prisma.space.findUnique({ where: { id } });

    if (!space) {
      throw new NotFoundException('Espaço não encontrado.');
    }

    if (space.hostId !== hostId) {
      throw new ForbiddenException('Você só tem permissão para editar seus próprios imóveis.');
    }

    return this.prisma.space.update({
      where: { id },
      data: {
        ...(dto.title && { title: dto.title }),
        ...(dto.description && { description: dto.description }),
        ...(dto.pricePerNight !== undefined && { pricePerNight: dto.pricePerNight }),
        ...(dto.location && { location: dto.location }),
        ...(dto.capacity !== undefined && { capacity: dto.capacity }),
        ...(dto.features && { features: dto.features }),
        ...(dto.images && { images: dto.images }),
      },
      include: {
        host: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async remove(id: string, hostId: string) {
    const space = await this.prisma.space.findUnique({ where: { id } });

    if (!space) {
      throw new NotFoundException('Espaço não encontrado.');
    }

    if (space.hostId !== hostId) {
      throw new ForbiddenException('Você só tem permissão para excluir seus próprios imóveis.');
    }

    await this.prisma.space.delete({ where: { id } });

    return {
      message: 'Espaço removido com sucesso.',
    };
  }
}
