const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 Iniciando gerador automático da API SpaceHub Backend...');

const files = {
  'package.json': JSON.stringify({
    name: 'spacehub-backend',
    version: '1.0.0',
    description: 'API Backend para a plataforma SpaceHub - Conectando Lugares e Pessoas',
    author: 'SpaceHub Team',
    private: true,
    license: 'MIT',
    scripts: {
      build: 'nest build',
      format: 'prettier --write "src/**/*.ts"',
      start: 'nest start',
      'start:dev': 'nest start --watch',
      'start:debug': 'nest start --debug --watch',
      'start:prod': 'node dist/main',
      'prisma:generate': 'prisma generate',
      'prisma:migrate': 'prisma db push',
      'prisma:studio': 'prisma studio',
      'generate:zip': 'node generate_backend.js'
    },
    dependencies: {
      '@nestjs/common': '^10.3.0',
      '@nestjs/config': '^3.1.1',
      '@nestjs/core': '^10.3.0',
      '@nestjs/jwt': '^10.2.0',
      '@nestjs/passport': '^10.0.3',
      '@nestjs/platform-express': '^10.3.0',
      '@prisma/client': '^5.10.2',
      bcryptjs: '^2.4.3',
      'class-transformer': '^0.5.1',
      'class-validator': '^0.14.1',
      cloudinary: '^2.0.1',
      multer: '^1.4.5-lts.1',
      passport: '^0.7.0',
      'passport-jwt': '^4.0.1',
      'reflect-metadata': '^0.2.1',
      rxjs: '^7.8.1'
    },
    devDependencies: {
      '@nestjs/cli': '^10.3.0',
      '@nestjs/schematics': '^10.1.0',
      '@nestjs/testing': '^10.3.0',
      '@types/bcryptjs': '^2.4.6',
      '@types/express': '^4.17.21',
      '@types/multer': '^1.4.11',
      '@types/node': '^20.11.0',
      '@types/passport-jwt': '^4.0.1',
      prisma: '^5.10.2',
      'source-map-support': '^0.5.21',
      'ts-loader': '^9.5.1',
      'ts-node': '^10.9.2',
      'tsconfig-paths': '^4.2.0',
      typescript: '^5.3.3'
    }
  }, null, 2),

  'tsconfig.json': JSON.stringify({
    compilerOptions: {
      module: 'commonjs',
      declaration: true,
      removeComments: true,
      emitDecoratorMetadata: true,
      experimentalDecorators: true,
      allowSyntheticDefaultImports: true,
      target: 'ES2021',
      sourceMap: true,
      outDir: './dist',
      baseUrl: './',
      incremental: true,
      skipLibCheck: true,
      strictNullChecks: false,
      noImplicitAny: false
    }
  }, null, 2),

  'tsconfig.build.json': JSON.stringify({
    extends: './tsconfig.json',
    exclude: ['node_modules', 'dist', 'test', '**/*spec.ts']
  }, null, 2),

  'nest-cli.json': JSON.stringify({
    $schema: 'https://json.schemastore.org/nest-cli',
    collection: '@nestjs/schematics',
    sourceRoot: 'src'
  }, null, 2),

  '.env': `DATABASE_URL="mysql://2JvHp5JUKLH1dDR.spacehub_api:SenhaSegura123!@gateway01.us-east-1.prod.aws.tidbcloud.com:4000/spacehub?sslaccept=strict"
JWT_SECRET="spacehub_super_secret_jwt_key_2026_production"
JWT_EXPIRES_IN="7d"
PORT=3000
CLOUDINARY_CLOUD_NAME="spacehub-cloud"
CLOUDINARY_API_KEY="123456789012345"
CLOUDINARY_API_SECRET="abcdefghijklmnopqrstuvwxyz"
`,

  '.env.example': `DATABASE_URL="mysql://USER:PASSWORD@HOST:PORT/DB_NAME?sslaccept=strict"
JWT_SECRET="sua_chave_secreta_jwt_aqui"
JWT_EXPIRES_IN="7d"
PORT=3000
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"
`,

  '.gitignore': `/dist
/node_modules
.env
npm-debug.log*
.DS_Store
Thumbs.db
backend_spacehub.zip
`,

  'prisma/schema.prisma': `datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  HOST
  GUEST
}

enum BookingStatus {
  CONFIRMED
  CANCELLED
  COMPLETED
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  name      String
  role      Role     @default(GUEST)
  avatarUrl String?  @db.Text
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  spaces   Space[]   @relation("HostSpaces")
  bookings Booking[] @relation("GuestBookings")

  @@map("users")
}

model Space {
  id            String   @id @default(uuid())
  title         String
  description   String   @db.Text
  pricePerNight Decimal  @db.Decimal(10, 2)
  location      String
  capacity      Int
  features      Json
  images        Json
  hostId        String
  host          User     @relation("HostSpaces", fields: [hostId], references: [id], onDelete: Cascade)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  bookings Booking[]

  @@map("spaces")
}

model Booking {
  id         String        @id @default(uuid())
  spaceId    String
  space      Space         @relation(fields: [spaceId], references: [id], onDelete: Cascade)
  guestId    String
  guest      User          @relation("GuestBookings", fields: [guestId], references: [id], onDelete: Cascade)
  startDate  DateTime
  endDate    DateTime
  totalPrice Decimal       @db.Decimal(10, 2)
  status     BookingStatus @default(CONFIRMED)
  createdAt  DateTime      @default(now())
  updatedAt  DateTime      @updatedAt

  @@map("bookings")
}
`
};

// Escrever arquivos estáticos
Object.entries(files).forEach(([filepath, content]) => {
  const fullPath = path.join(__dirname, filepath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`  ✓ Gerado: ${filepath}`);
});

console.log('\n📦 Compactando backend em backend_spacehub.zip...');

try {
  if (process.platform === 'win32') {
    execSync('powershell -Command "Get-ChildItem -Exclude \'node_modules\',\'dist\',\'backend_spacehub.zip\' | Compress-Archive -DestinationPath backend_spacehub.zip -Force"');
  } else {
    execSync('zip -r backend_spacehub.zip . -x "node_modules/*" "dist/*" "backend_spacehub.zip"');
  }
  console.log('✅ Arquivo backend_spacehub.zip gerado com sucesso!');
} catch (err) {
  console.error('⚠️ Falha ao compactar usando comando nativo do SO. Os arquivos de código estão intactos na pasta.');
}
