# User System documentation

This markdown mainly introduces the technology stack desgigned for the user system and the points need to be paid attention to the during the implementation process.

[Zh-cn](https://github.com/KieSun/fullstack-project/blob/main/doc/user.md)


## back-end

---

### Database and connection related

The database will use the Mysql which is generally started directly by [docker](https://docs.docker.com/engine/install/ "docker installation documentation") at present.

Found the Mysql installation on the home page in Docker Desktop after installing docker. Then use the database visualization to connect.

First, we need a user table, the structor is as follows:

- id: user id, type uuid

- mobile: mobile phone number, type string

- password: admin password, type string

- name: user name, type string

- salt: the secret text, type string

- address: user wallet address, type string

- created_at: created time, type timestamp

- update_at: updated time, type timestamp

- only index mobile: guarantee uniqueness under high cocurrent data, index address

We use [typeorm](https://typeorm.bootcss.com/) which allows us to operate the database without writing sql words.

Second, install the related npm package:

`npm install --save @nestjs/typeorm typeorm mysql2`

### Connection

We should save the service config in `.env` file, use a single service to run this file.

It would throw the whole error when wrong at startup the server project.

We generate the file at: `/src/config/config.service.ts`

### Generate the entity model

We should generate a basic model names `base.entity.ts`, includes `id created_at updated_at`, which under the model folder.

```typescript
// src/model/base.entity.ts

import {
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  CreateDateColumn,
} from 'typeorm';

export abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP(6)',
    name: 'created_at',
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP(6)',
    onUpdate: 'CURRENT_TIMESTAMP(6)',
    name: 'updated_at',
  })
  updateAt: Date;
}
```

We could generate the user entity by table structure that we maked before.

```typescript
// src/model/user.entity.ts

import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity({ name: 'user' })
export class User extends BaseEntity {
  @Column({ type: 'varchar', length: 300 })
  name: string;

  @Column({ type: 'varchar', length: 300 })
  mobile: string;

  @Column({ type: 'varchar', length: 300 })
  password: string;

  @Column({ type: 'varchar', length: 300 })
  address: string;
}
```
Import the user entity after generating it.

```typescript
// src/app.module.ts

import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { User } from 'src/model/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
```

We could generate other models refer to the above steps.

### Generate tables in database

We could write the options at `config.service.ts`:

- `synchronize: true` : It will auto create the table schema by the entites that we have written at `*.entity.ts`.

### Generate Http API

We operate database at service files and define the interface at controller files.

For example, we should define two interfece, one is for getting user datas, another is for registing a new user data.

```typescript
// src/user/user.controller.ts

import { UserService } from './user.service';
import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { RegisterDTO } from './dto/signup.dto';

@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @HttpCode(200)
  @Get()
  getUserList() {
    return this.userService.findAll();
  }

  @Post('signup')
  signUp(@Body() signupDto: RegisterDTO) {
    return this.userService.registUser(signupDto);
  }
}
```

### Paramters validation

We use DTO to check paramters in post data process.

```typescript
// src/user/dto/signup.dto.ts

import { IsString, IsMobilePhone, IsNotEmpty } from 'class-validator';

export class RegisterDTO {
  @IsNotEmpty({ message: '请输入用户名' })
  @IsString({ message: '名字必须是字符串类型' })
  readonly name: string;

  @IsMobilePhone('zh-CN')
  @IsNotEmpty({ message: '请输入手机号' })
  readonly mobile: string;

  @IsNotEmpty({ message: '请输入密码' })
  @IsString({ message: '密码必须是字符串类型' })
  readonly password: string;

  @IsNotEmpty({ message: '请再次输入密码' })
  @IsString({ message: '密码必须是字符串类型' })
  readonly passwordRepeat: string;
}

```

### Encrypt password

We use `crypto` to encrypt password. 

`npm install crypto-js @types/crypto-js`

Usually, we generate a folder to save functions which have special abilities.

```typescript
// src/utils/cryptogram.util.ts

import * as crypto from 'crypto';

// 随机盐
export function makeSalt(): string {
  return crypto.randomBytes(3).toString('base64');
}

/**
 * 使用盐加密明文密码
 * @param password 密码
 * @param salt 密码盐
 */
export function encryptPassword(password: string, salt: string): string {
  if (!password || !salt) {
    return '';
  }
  const tempSalt = Buffer.from(salt, 'base64');
  return (
    // 10000 代表迭代次数 16代表长度
    crypto.pbkdf2Sync(password, tempSalt, 10000, 16, 'sha1').toString('base64')
  );
}
```

We use the function at the file `user.service.ts` to encrypt the password and save the new user data.

```typescript
// src/user/user.service.ts

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
}
```

We also could use `Match()` function at DTO as a decorator to validate that if the password equals the repeat password in addition to above methods.