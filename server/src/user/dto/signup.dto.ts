// 对于post 的参数做一个后端的验证
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
