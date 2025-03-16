import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { UpdateLinkDto } from './dto/update-link.dto';
import { LinksService } from './links.service';
import { CreateLinkDto } from './dto/create-link.dto';
import { Link } from './link.entity';
import { GetLinkDto } from './dto/get-link.dto';

@Controller('links')
export class LinksController {
  constructor(private readonly linksService: LinksService) {}

  @Get()
  getAllLinks() {
    return this.linksService.getAllLinks();
  }

  @Post()
  createLink(@Body() createLinkDto: CreateLinkDto): Promise<Link> {
    return this.linksService.createLink(createLinkDto);
  }

  @Delete('/:id')
  deleteLink(@Param() getLinkDto: GetLinkDto): Promise<void> {
    return this.linksService.deleteLink(getLinkDto);
  }

  @Put('/:id')
  async updateLink(
    @Param() getLinkDto: GetLinkDto,
    @Body() updateLinkDto: UpdateLinkDto,
  ): Promise<Link> {
    const updatedLink = await this.linksService.updateLink(
      getLinkDto,
      updateLinkDto,
    );
    if (!updatedLink) {
      throw new NotFoundException(`Link with ID "${getLinkDto.id}" not found`);
    }
    return updatedLink;
  }
}
