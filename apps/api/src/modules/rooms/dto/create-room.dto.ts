import {
  IsString,
  IsOptional,
  IsInt,
  IsEnum,
  IsBoolean,
  IsArray,
  Min,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { RoomStatus, BedType } from '@Noblesse/shared';

export class BedDto {
  @ApiProperty({ enum: BedType })
  @IsEnum(BedType)
  type: BedType;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  count?: number;
}

export class CreateRoomDto {
  @ApiProperty({ example: 'prop-cuid' })
  @IsString()
  propertyId: string;

  @ApiProperty({ example: 'room-type-cuid' })
  @IsString()
  roomTypeId: string;

  @ApiPropertyOptional({ example: 'floor-cuid' })
  @IsOptional()
  @IsString()
  floorId?: string;

  @ApiProperty({ example: '101' })
  @IsString()
  @MaxLength(20)
  number: string;

  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  floor?: number;

  @ApiPropertyOptional({ enum: RoomStatus, default: RoomStatus.AVAILABLE })
  @IsOptional()
  @IsEnum(RoomStatus)
  status?: RoomStatus;

  @ApiPropertyOptional({ example: 'Corner room with extra windows' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: true, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ type: [BedDto] })
  @IsOptional()
  @IsArray()
  beds?: BedDto[];
}