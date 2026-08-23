import { IsArray, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateSpaceDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber({}, { message: 'O preço deve ser um número válido' })
  @Min(0.01, { message: 'O preço por noite deve ser maior que zero' })
  @Type(() => Number)
  pricePerNight?: number;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsInt({ message: 'A capacidade deve ser um número inteiro' })
  @Min(1, { message: 'A capacidade mínima é de 1 pessoa' })
  @Type(() => Number)
  capacity?: number;

  @IsOptional()
  @IsArray({ message: 'Características deve ser uma lista de itens' })
  @IsString({ each: true })
  features?: string[];

  @IsOptional()
  @IsArray({ message: 'Imagens deve ser uma lista de URLs' })
  @IsString({ each: true })
  images?: string[];
}
