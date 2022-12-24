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
