import request from 'supertest';
import { app } from '../src/app';

// Mock global fetch to avoid hitting real OpenWeatherMap in tests
const mockFetch = jest.fn();
global.fetch = mockFetch;

// Full mock response matching OpenWeatherMap's shape
const mockWeatherResponse = {
  name: 'Seattle',
  sys: { country: 'US' },
  main: { temp: 12, feels_like: 10, temp_min: 9, temp_max: 14, humidity: 72 },
  weather: [{ description: 'light rain' }],
  wind: { speed: 5.2 },
};

beforeEach(() => {
  mockFetch.mockReset();
  process.env.WEATHER_API_KEY = 'test-api-key';
});

describe('Proxy Routes', () => {
  describe('GET /proxy/weather?city=Seattle (raw pass-through)', () => {
    it('returns full weather data on success', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockWeatherResponse,
      });

      const res = await request(app).get('/proxy/weather?city=Seattle');
      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Seattle');
      expect(res.body.main.temp).toBe(12);
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('q=Seattle'));
    });

    it('returns 400 when city is missing (middleware)', async () => {
      const res = await request(app).get('/proxy/weather');
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/city/i);
    });

    it('returns upstream error status on API failure', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ message: 'city not found' }),
      });

      const res = await request(app).get('/proxy/weather?city=FakeCity123');
      expect(res.status).toBe(404);
    });

    it('returns 502 when fetch throws', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const res = await request(app).get('/proxy/weather?city=Seattle');
      expect(res.status).toBe(502);
    });
  });

  describe('GET /proxy/weather/:city (route param variant)', () => {
    it('accepts city as route param', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ ...mockWeatherResponse, name: 'Portland' }),
      });

      const res = await request(app).get('/proxy/weather/Portland');
      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Portland');
    });
  });

  describe('GET /proxy/summary?city=Seattle (transformed response)', () => {
    it('returns a simplified weather summary', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockWeatherResponse,
      });

      const res = await request(app).get('/proxy/summary?city=Seattle');
      expect(res.status).toBe(200);

      // Verify the transformed shape — not the raw OpenWeatherMap blob
      expect(res.body).toEqual({
        city: 'Seattle',
        country: 'US',
        temperature: {
          current: 12,
          feelsLike: 10,
          min: 9,
          max: 14,
        },
        conditions: 'light rain',
        humidity: 72,
        windSpeed: 5.2,
      });
    });

    it('returns 400 when city is missing (middleware)', async () => {
      const res = await request(app).get('/proxy/summary');
      expect(res.status).toBe(400);
      expect(res.body.error).toMatch(/city/i);
    });

    it('returns upstream error on API failure', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ message: 'city not found' }),
      });

      const res = await request(app).get('/proxy/summary?city=FakeCity123');
      expect(res.status).toBe(404);
    });

    it('returns 502 when fetch throws', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'));

      const res = await request(app).get('/proxy/summary?city=Seattle');
      expect(res.status).toBe(502);
    });
  });

  describe('GET /proxy/summary/:city (route param variant)', () => {
    it('accepts city as route param and returns summary', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ ...mockWeatherResponse, name: 'Tacoma' }),
      });

      const res = await request(app).get('/proxy/summary/Tacoma');
      expect(res.status).toBe(200);
      expect(res.body.city).toBe('Tacoma');
      expect(res.body.temperature).toBeDefined();
      expect(res.body.conditions).toBe('light rain');
    });
  });

  describe('GET /proxy/forecast (raw pass-through)', () => {
    it('returns forecast data on success', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ city: { name: 'Seattle' }, list: [] }),
      });

      const res = await request(app).get('/proxy/forecast?city=Seattle');
      expect(res.status).toBe(200);
      expect(res.body.city.name).toBe('Seattle');
    });

    it('returns 400 when city is missing (middleware)', async () => {
      const res = await request(app).get('/proxy/forecast');
      expect(res.status).toBe(400);
    });
  });

  describe('Missing API key (middleware)', () => {
    it('returns 500 when WEATHER_API_KEY is not set', async () => {
      delete process.env.WEATHER_API_KEY;

      const res = await request(app).get('/proxy/weather?city=Seattle');
      expect(res.status).toBe(500);
      expect(res.body.error).toMatch(/WEATHER_API_KEY/);
    });

    it('blocks summary route too when key is missing', async () => {
      delete process.env.WEATHER_API_KEY;

      const res = await request(app).get('/proxy/summary?city=Seattle');
      expect(res.status).toBe(500);
    });
  });
});
