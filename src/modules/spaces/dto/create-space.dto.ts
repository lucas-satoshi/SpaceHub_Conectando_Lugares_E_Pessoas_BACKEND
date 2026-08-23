import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSpaceDto {
  @IsNotEmpty({ message: 'O título do imóvel é obrigatório' })
  @IsString()
  title: string;

  @IsNotEmpty({ message: 'A descrição é obrigatória' })
  @IsString()
  description: string;

  @IsNotEmpty({ message: 'O preço por noite é obrigatório' })
  @IsNumber({}, { message: 'O preço deve ser um número válido' })
  @Min(0.01, { message: 'O preço por noite deve ser maior que zero' })
  @Type(() => Number)
  pricePerNight: number;

  @IsNotEmpty({ message: 'A localização é obrigatória' })
  @IsString()
  location: string;

  @IsNotEmpty({ message: 'A capacidade máxima é obrigatória' })
  @IsInt({ message: 'A capacidade deve ser um número inteiro' })
  @Min(1, { message: 'A capacidade mínima é de 1 pessoa' })
  @Type(() => Number)
  capacity: number;

  @IsNotEmpty({ message: 'As características (amenidades) são obrigatórias' })
  @IsArray({ message: 'Características deve ser uma lista de itens' })
  @IsString({ each: true })
  features: string[];

  @IsNotEmpty({ message: 'Ao menos uma foto do espaço deve ser enviada' })
  @IsArray({ message: 'Imagens deve ser uma lista de URLs' })
  @IsString({ each: true })
  images: string[];
}
