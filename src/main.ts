import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // === PREFIXO GLOBAL: TODAS AS ROTAS COMEÇAM COM /api ===
  app.setGlobalPrefix('api', {

  });

  // CORS + Validation Pipe (com mensagens bonitinhas)
  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (errors) => {
        const messages = errors.map(err => ({
          property: err.property,
          constraints: err.constraints,
        }));
        return new Error(JSON.stringify(messages));
      },
    }),
  );

  // === SWAGGER COM DICIONÁRIO INTERATIVO ===
  const config = new DocumentBuilder()
    .setTitle('🚀 Minha API Awesome - v1.0')
    .setDescription(`
# Bem-vindo à API Awesome! 

Todas as rotas agora estão sob **/api** → ex: \`POST /api/auth/login\`

## 🔐 Autenticação JWT
- Após login → recebe \`access_token\`
- Use no header: \`Authorization: Bearer <token>\`
- Botão **Authorize** no topo já configura automático!

## ⚠️ Erros comuns
| Código | Motivo                  | Exemplo |
|--------|-------------------------|---------|
| 400    | Validação falhou        | Email inválido ou senha curta |
| 401    | Token inválido/expirado | Unauthorized |

## 🧪 Teste rápido
\`\`\`bash
curl -X POST http://localhost:9696/api/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email": "isaac@exemplo.com", "password": "12345678"}'
\`\`\`

**Documentação completa:** http://localhost:9696/api/docs  
**Dev:** Isaac Isvaldo - GitHub: [@isaacisvaldo](https://github.com/isaacisvaldo)
    `)
    .setVersion('1.0')
    .setContact('Isaac Isvaldo', 'https://github.com/isaacisvaldo', 'isaac.bunga@outlook.com')
    .addTag('auth', 'Autenticação & Autorização')
    .addTag('user', 'Gerenciamento de usuários')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Swagger em /api/docs (sem prefixo duplo)
  SwaggerModule.setup('api/docs', app, document, {
    customCss: '.swagger-ui .topbar { background: #1a1a2e; } body { margin: 0; }',
    customSiteTitle: 'Awesome API - Docs',
    swaggerOptions: {
      persistAuthorization: true,
      tryItOutEnabled: true,
    },
  });

  const port = process.env.PORT || 9696;
  await app, app.listen(port);

  console.log(`🚀 Server rodando em: http://localhost:${port}`);
  console.log(`📚 Swagger UI: http://localhost:${port}/api/docs`);
  console.log(`🔗 Todas as rotas: http://localhost:${port}/api/...`);
}
bootstrap();