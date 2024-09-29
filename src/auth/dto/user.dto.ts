import { IsNotEmpty, IsString } from 'class-validator';

export class VerifyDto {
  @IsString()
  @IsNotEmpty()
  jwt: string;
}