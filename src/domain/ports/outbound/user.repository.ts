import { User } from '../../entities/user.entity';

export interface UserRepository {
  findById(id: number): Promise<User | null>;
  findByAccountNumber(accountNumber: string): Promise<User | null>;
}
