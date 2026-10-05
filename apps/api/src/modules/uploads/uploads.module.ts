import { BadRequestException, Controller, Module, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { randomBytes } from 'crypto';
import { mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { Roles } from '../../common/decorators';
import { decodeFileName, slugify } from '../../common/text';
import { ALLOWED_EXT, uploadMaxBytes, uploadRoot } from './upload.config';

const storage = diskStorage({
  destination: (_req, _file, cb) => {
    const now = new Date();
    const sub = join(String(now.getFullYear()), String(now.getMonth() + 1).padStart(2, '0'));
    const dir = join(uploadRoot(), sub);
    mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const original = decodeFileName(file.originalname);
    const ext = extname(original).toLowerCase();
    const base = slugify(original.slice(0, original.length - ext.length), 'tep');
    cb(null, `${randomBytes(4).toString('hex')}-${base.slice(0, 60)}${ext}`);
  },
});

@ApiTags('Quản trị · Tải tệp lên')
@ApiBearerAuth()
@Roles(Role.ADMIN, Role.EDITOR, Role.TEACHER)
@Controller('admin/uploads')
export class UploadsController {
  /** Tải 1 tệp lên, trả về đường dẫn /uploads/... để gắn vào tin bài, văn bản, album… */
  @Post()
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', properties: { file: { type: 'string', format: 'binary' } } } })
  @UseInterceptors(
    FileInterceptor('file', {
      storage,
      limits: { fileSize: uploadMaxBytes() },
      fileFilter: (_req, file, cb) => {
        const ext = extname(decodeFileName(file.originalname)).slice(1).toLowerCase();
        if (ALLOWED_EXT.includes(ext)) cb(null, true);
        else cb(new BadRequestException(`Không hỗ trợ định dạng .${ext || '?'}`), false);
      },
    }),
  )
  upload(@UploadedFile() file?: Express.Multer.File) {
    if (!file) throw new BadRequestException('Chưa chọn tệp');
    const relative = file.path.slice(uploadRoot().length).split(/[\\/]+/).filter(Boolean).join('/');
    return {
      url: `/uploads/${relative}`,
      fileName: decodeFileName(file.originalname),
      size: file.size,
      mimeType: file.mimetype,
    };
  }
}

@Module({ controllers: [UploadsController] })
export class UploadsModule {}
