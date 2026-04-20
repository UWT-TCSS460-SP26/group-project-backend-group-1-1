import { Router } from 'express';
import { getWeather, getWeatherSummary, getForecast } from '../../controllers/proxy';
import { requireEnvVar, requireCity, requireCityQuery } from '../../middleware/validation';

const proxyRouter = Router();

// All proxy routes require the API key to be configured
proxyRouter.use(requireEnvVar('WEATHER_API_KEY'));

// Raw pass-through
proxyRouter.get('/weather', requireCity, getWeather);
proxyRouter.get('/weather/:city', requireCity, getWeather);
proxyRouter.get('/forecast', requireCityQuery, getForecast);

// Transformed response — curates the raw data into a simplified shape
proxyRouter.get('/summary', requireCity, getWeatherSummary);
proxyRouter.get('/summary/:city', requireCity, getWeatherSummary);

export { proxyRouter };
