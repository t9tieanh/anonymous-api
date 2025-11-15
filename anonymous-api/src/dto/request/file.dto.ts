import { IsString, IsOptional, IsBoolean, IsNumber, IsEnum } from 'class-validator'

/**
 * DTO cho việc upload file
 */
export class UploadFileDto {
  @IsString()
  subject!: string // ID của subject (môn học)

  @IsOptional()
  @IsBoolean()
  createSummary?: boolean // Có tạo summary không?

  @IsOptional()
  @IsBoolean()
  generateQuiz?: boolean // Có tạo quiz không?

  @IsOptional()
  @IsNumber()
  quizQuestions?: number // Số câu hỏi trong quiz (mặc định: 10)

  @IsOptional()
  @IsEnum(['Easy', 'Medium', 'Hard'])
  quizDifficulty?: 'Easy' | 'Medium' | 'Hard' // Độ khó của quiz
}

/**
 * DTO cho query parameters khi lấy danh sách files
 */
export class GetFilesQueryDto {
  @IsOptional()
  @IsNumber()
  page?: number // Trang hiện tại (mặc định: 1)

  @IsOptional()
  @IsNumber()
  limit?: number // Số items mỗi trang (mặc định: 20)
}
