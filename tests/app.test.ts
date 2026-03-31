/// <reference types="jest" />
import request from 'supertest';
import app from '#src/app.ts';

describe('API Endpoints', () => {
  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health').expect(200);

      expect(response.body).toHaveProperty('status', 'OK');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
    });
  });

  describe('GET /api', () => {
    it('should return API message', async () => {
      const response = await request(app).get('/api').expect(200);

      expect(response.body).toHaveProperty('message', 'Acquisition Running');
    });
  });

  describe('GET /nonexistent', () => {
    it('should return 404 Not Found for nonexistent endpoint', async () => {
      const response = await request(app).get('/nonexistent').expect(404);

      expect(response.body).toHaveProperty('error', 'Not Found');
    });
  });
});
