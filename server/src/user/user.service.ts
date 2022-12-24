import { User } from 'src/model/user.entity';
import {
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RegisterDTO } from './dto/signup.dto';
import { encryptPassword, makeSalt } from 'src/common/utils/cryptogram.util';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  findOneById(idOrMobile: string): Promise<User> {
    return this.usersRepository.findOneBy([
      { id: idOrMobile },
      { mobile: idOrMobile },
    ]);
  }

  // 校验注册数据
  async checkRegisterForm(signupDto: RegisterDTO): Promise<any> {
    if (signupDto.password !== signupDto.passwordRepeat) {
      throw new NotFoundException('两次输入密码不一致，请检查');
    }

    const { mobile } = signupDto;
    const hasUser = await this.findOneById(mobile);
    if (hasUser) {
      throw new HttpException('用户已存在', HttpStatus.BAD_REQUEST);
    }
  }

  async registUser(signupDto: RegisterDTO): Promise<any> {
    // 获取密码的加密
    const { password } = signupDto;

    await this.checkRegisterForm(signupDto);

    const salt = makeSalt();
    const hashPassword = encryptPassword(password, salt);
    const user = this.usersRepository.create({
      ...signupDto,
      password: hashPassword,
      salt: salt,
    });
    return await this.usersRepository.save(user);
    // return this.findAll();
  }

  async remove(id: string): Promise<void> {
    await this.usersRepository.delete(id);
  }
}
