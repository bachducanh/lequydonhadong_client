import { Body, Controller, Delete, Get, Module, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Public, Staff } from '../../common/decorators';
import { AddPhotosDto, AlbumQueryDto, CreateAlbumDto, UpdateAlbumDto, UpdatePhotoDto } from './albums.dto';
import { AlbumsService } from './albums.service';

@ApiTags('Albums ảnh')
@Public()
@Controller('albums')
export class AlbumsController {
  constructor(private readonly albums: AlbumsService) {}

  @Get()
  list(@Query() query: AlbumQueryDto) {
    return this.albums.publicList(query);
  }

  @Get(':id')
  detail(@Param('id') id: string) {
    return this.albums.publicDetail(id);
  }
}

@ApiTags('Quản trị · Albums')
@ApiBearerAuth()
@Staff()
@Controller('admin/albums')
export class AdminAlbumsController {
  constructor(private readonly albums: AlbumsService) {}

  @Get()
  list(@Query() query: AlbumQueryDto) {
    return this.albums.adminList(query);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.albums.adminGet(id);
  }

  @Post()
  create(@Body() dto: CreateAlbumDto) {
    return this.albums.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAlbumDto) {
    return this.albums.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.albums.remove(id);
  }

  /** Thêm ảnh (url lấy từ /admin/uploads) */
  @Post(':id/photos')
  addPhotos(@Param('id') id: string, @Body() dto: AddPhotosDto) {
    return this.albums.addPhotos(id, dto);
  }

  @Patch(':id/photos/:photoId')
  updatePhoto(@Param('id') id: string, @Param('photoId') photoId: string, @Body() dto: UpdatePhotoDto) {
    return this.albums.updatePhoto(id, photoId, dto);
  }

  @Delete(':id/photos/:photoId')
  removePhoto(@Param('id') id: string, @Param('photoId') photoId: string) {
    return this.albums.removePhoto(id, photoId);
  }
}

@Module({
  controllers: [AlbumsController, AdminAlbumsController],
  providers: [AlbumsService],
  exports: [AlbumsService],
})
export class AlbumsModule {}
