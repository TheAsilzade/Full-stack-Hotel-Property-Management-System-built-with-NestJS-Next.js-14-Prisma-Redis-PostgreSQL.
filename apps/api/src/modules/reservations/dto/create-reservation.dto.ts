import {
  IsString,
  IsOptional,
  IsInt,
  IsNumber,
  IsArray,

  IsDateString,
  IsBoolean,
  Min,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class ReservationRoomDto {
  @ApiProperty({ example: 'room-uuid' })
  @IsString()
  roomId: string;

  @ApiProperty({ example: 'room-type-uuid' })
  @IsString()
  roomTypeId: string;

  @ApiProperty({ example: 250.00 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  ratePerNight: number;

  @ApiProperty({ example: 1000.00 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  totalRate: number;
}

export class ReservationGuestDto {
  @ApiProperty({ example: 'guest-uuid' })
  @IsString()
  guestId: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

export class AgeCategoryCountsDto {
  @ApiPropertyOptional({ example: 2, description: '+18 yas guest count' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  adult18Plus?: number;

  @ApiPropertyOptional({ example: 1, description: '7-12 yas guest count' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  child7To12?: number;

  @ApiPropertyOptional({ example: 0, description: '3-6 yas guest count' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  child3To6?: number;

  @ApiPropertyOptional({ example: 0, description: '0-2 yas guest count' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  infant0To2?: number;
}

export class CreateReservationDto {
  @ApiProperty({ example: 'property-uuid' })
  @IsString()
  propertyId: string;

  @ApiProperty({ example: '2025-06-01' })
  @IsDateString()
  checkIn: string;

  @ApiProperty({ example: '2025-06-05' })
  @IsDateString()
  checkOut: string;

  @ApiPropertyOptional({ example: 2, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  adults?: number;

  @ApiPropertyOptional({ example: 0, default: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  children?: number;

  @ApiPropertyOptional({ example: 'source-uuid' })
  @IsOptional()
  @IsString()
  sourceId?: string;

  @ApiPropertyOptional({ example: 'rate-plan-uuid' })
  @IsOptional()
  @IsString()
  ratePlanId?: string;

  @ApiPropertyOptional({ example: 'Late check-in requested' })
  @IsOptional()
  @IsString()
  specialRequests?: string;

  @ApiPropertyOptional({ example: 'Internal note for staff' })
  @IsOptional()
  @IsString()
  internalNotes?: string;

  @ApiPropertyOptional({ type: AgeCategoryCountsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => AgeCategoryCountsDto)
  ageCategoryCounts?: AgeCategoryCountsDto;

  @ApiProperty({ type: [ReservationRoomDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReservationRoomDto)
  rooms: ReservationRoomDto[];

  @ApiPropertyOptional({ type: [ReservationGuestDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReservationGuestDto)
  guests?: ReservationGuestDto[];
}
