import { IsDateString, IsNotEmpty, IsUUID } from 'class-validator';

export class CreateBookingDto {
  @IsNotEmpty({ message: 'O ID do espaço é obrigatório' })
  @IsUUID('4', { message: 'O ID do espaço deve ser um UUID válido' })
  spaceId: string;

  @IsNotEmpty({ message: 'A data de início da reserva é obrigatória' })
  @IsDateString({}, { message: 'A data de início deve ser uma data válida ISO (YYYY-MM-DD)' })
  startDate: string;

  @IsNotEmpty({ message: 'A data de término da reserva é obrigatória' })
  @IsDateString({}, { message: 'A data de término deve ser uma data válida ISO (YYYY-MM-DD)' })
  endDate: string;
}
