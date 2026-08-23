import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('AppController (e2e) e Fluxo Completo SpaceHub', () => {
  let app: INestApplication;
  
  let hostToken: string;
  let guestToken: string;
  let spaceId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // Configurações importantes para os testes refletirem o ambiente real
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('1. Fluxo de Autenticação', () => {
    it('deve registrar um usuário HOST', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Host de Teste E2E',
          email: `host.e2e.${Date.now()}@teste.com`,
          password: 'senhaForte123',
          role: 'HOST',
        })
        .expect(201);
      
      expect(response.body).toHaveProperty('accessToken');
      hostToken = response.body.accessToken;
    });

    it('deve registrar um usuário GUEST', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Guest de Teste E2E',
          email: `guest.e2e.${Date.now()}@teste.com`,
          password: 'senhaForte123',
          role: 'GUEST',
        })
        .expect(201);
      
      expect(response.body).toHaveProperty('accessToken');
      guestToken = response.body.accessToken;
    });
  });

  describe('2. Fluxo de Espaços (Spaces)', () => {
    it('não deve permitir criar espaço como GUEST', async () => {
      await request(app.getHttpServer())
        .post('/spaces')
        .set('Authorization', `Bearer ${guestToken}`)
        .send({
          title: 'Espaço Inválido',
          description: 'Teste',
          pricePerNight: 100,
          location: 'Local',
          capacity: 2,
          features: [],
          images: [],
        })
        .expect(403);
    });

    it('deve criar um espaço como HOST', async () => {
      const response = await request(app.getHttpServer())
        .post('/spaces')
        .set('Authorization', `Bearer ${hostToken}`)
        .send({
          title: 'Chalé Teste E2E',
          description: 'Lugar criado por teste automatizado.',
          pricePerNight: 200,
          location: 'Gramado, RS',
          capacity: 4,
          features: ['Wi-Fi', 'Lareira'],
          images: ['https://exemplo.com/imagem.jpg'],
        })
        .expect(201);
      
      expect(response.body).toHaveProperty('id');
      spaceId = response.body.id;
    });
  });

  describe('3. Fluxo de Reservas (Bookings)', () => {
    it('deve criar uma reserva no espaço criado', async () => {
      // Pega data daqui a 10 dias
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + 10);
      
      // Data de fim daqui a 15 dias (5 dias de estadia)
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 5);

      const response = await request(app.getHttpServer())
        .post('/bookings')
        .set('Authorization', `Bearer ${guestToken}`)
        .send({
          spaceId: spaceId,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        })
        .expect(201);
      
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('totalPrice');
      expect(Number(response.body.totalPrice)).toBe(200 * 5); // 200/noite * 5 noites = 1000
    });
  });
});
