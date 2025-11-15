import { IsOptional, IsInt, Min, Max, IsString, IsIn, IsNotEmpty } from 'class-validator'
import { Type, Transform } from 'class-transformer'

export class GenerateQuizDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  numQuestions?: number

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.toLowerCase() : value))
  @IsString()
  @IsIn(['easy', 'medium', 'hard'])
  difficulty?: string

  @IsNotEmpty()
  id: string
}