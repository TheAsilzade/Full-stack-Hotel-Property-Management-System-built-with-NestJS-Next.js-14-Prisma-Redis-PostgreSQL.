import {
  IsString,
  IsOptional,
  IsEmail,
  IsEnum,
  IsDateString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GenderType } from '@Noblesse/shared';

export class CreateGuestDto {
  @ApiProperty({ example: 'John' })
  @IsString()
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @MaxLength(100)
  lastName: string;

  @ApiPropertyOptional({ example: 'john.doe@example.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '+1234567890' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'US' })
  @IsOptional()
  @IsString()
  @MaxLength(2)
  nationality?: string;

  @ApiPropertyOptional({ example: 'PASSPORT', description: 'ID document type' })
  @IsOptional()
  @IsString()
  idType?: string;

  @ApiPropertyOptional({ example: 'AB123456' })
  @IsOptional()
  @IsString()
  idNumber?: string;

  @ApiPropertyOptional({ example: '1985-06-15' })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ enum: GenderType })
  @IsOptional()
  @IsEnum(GenderType)
  gender?: GenderType;

  @ApiPropertyOptional({ example: '123 Main St' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'New York' })
  @IsOptional()
  @IsString()
  city?: string;

  @ApiPropertyOptional({ example: 'US' })
  @IsOptional()
  @IsString()
  @MaxLength(2)
  country?: string;

  @ApiPropertyOptional({ example: 'VIP guest, prefers high floor' })
  @IsOptional()
  @IsString()
  notes?: string;
}