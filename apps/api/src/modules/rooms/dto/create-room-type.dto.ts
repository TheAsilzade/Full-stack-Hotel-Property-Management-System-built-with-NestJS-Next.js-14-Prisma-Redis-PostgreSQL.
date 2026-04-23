import {
  IsString,
  IsOptional,
  IsInt,
  IsNumber,
  IsBoolean,
  IsArray,
  Min,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateRoomTypeDto {
  @ApiProperty({ example: 'Deluxe King' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'DLX-K' })
  @IsString()
  @MaxLength(20)
  code: string;

  @ApiPropertyOptional({ example: 'Spacious room with king bed and city view' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 2, default: 2 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxOccupancy?: number;

  @ApiProperty({ example: 250.00 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  baseRate: number;

  @ApiPropertyOptional({ example: ['WiFi', 'Mini Bar', 'Safe'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  amenities?: string[];

  @ApiPropertyOptional({ example: ['https://hotel.com/room1.jpg'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  imageUrls?: string[];

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}