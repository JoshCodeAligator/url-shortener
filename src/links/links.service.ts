import { Injectable, NotFoundException, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { Link } from './link.entity';
import { CreateLinkDto } from './dto/create-link.dto';
import { UpdateLinkDto } from './dto/update-link.dto';
import { GetLinkDto } from './dto/get-link.dto';

@Injectable()
export class LinksService {
  constructor(
    @InjectRepository(Link)
    private readonly linkRepository: Repository<Link>, 
  ) {}

  async getAllLinks(): Promise<Link[]> {
    return this.linkRepository.find();
  }

  async createLink(createLinkDto: CreateLinkDto): Promise<Link> {
    const link = this.linkRepository.create(createLinkDto);

    try {
      await this.linkRepository.save(link);
    } catch (err) {
      if (err.code === '23505') {
        throw new ConflictException('Short name already exists');
      } else {
        throw new InternalServerErrorException();
      }
    }

    return link;
  }

  async getLink(conditions: FindOptionsWhere<Link>): Promise<Link> {
    const link = await this.linkRepository.findOne({ where: conditions });
    if (!link) throw new NotFoundException();
    return link;
  }

  async deleteLink(getLinkDto: GetLinkDto): Promise<void> {
    const { id } = getLinkDto;
    const res = await this.linkRepository.delete({ id });

    if (res.affected === 0) {
      throw new NotFoundException(`Link with ID: "${id}" not found`);
    }
  }

  async updateLink(getLinkDto: GetLinkDto, updateLinkDto: UpdateLinkDto): Promise<Link> {
    const { id } = getLinkDto;
    const link = await this.getLink({ id });

    link.name = updateLinkDto.name;
    link.url = updateLinkDto.url;

    await this.linkRepository.save(link);
    return link;
  }
}

