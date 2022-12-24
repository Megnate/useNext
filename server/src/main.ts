import { TransformIntercepter } from './common/interceptor/transformIntercepter';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // 注册返回拦截器
  app.useGlobalInterceptors(new TransformIntercepter());
  // 加入管道对数据参数进行验证，将输入数据转换成所需要的数据输出
  app.useGlobalPipes(new ValidationPipe());
  await app.listen(3000);
}
bootstrap();
