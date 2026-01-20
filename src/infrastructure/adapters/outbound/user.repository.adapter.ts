import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../../domain/entities/user.entity';
import { UserRepository } from '../../../domain/ports/outbound/user.repository';
import { UserOrmEntity } from '../../persistence/entities/user.orm-entity';
import { UserMapper } from '../../persistence/mappers/user.mapper';

@Injectable()
export class UserRepositoryAdapter implements UserRepository {
  constructor(
    @InjectRepository(UserOrmEntity)
    private readonly userRepository: Repository<UserOrmEntity>,
  ) {}

  async findById(id: number): Promise<User | null> {
    const entity = await this.userRepository.findOne({ where: { id } });
    return entity ? UserMapper.toDomain(entity) : null;
  }

  async findByAccountNumber(accountNumber: string): Promise<User | null> {
    const entity = await this.userRepository.findOne({ where: { accountNumber } });
    return entity ? UserMapper.toDomain(entity) : null;
  }
}
