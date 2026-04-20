import { Request, Response } from 'express';

const BASE_URL = 'https://api.openweathermap.org/data/2.5';

/**
 * Raw pass-through proxy — returns the full OpenWeatherMap response unchanged.
 */
export const getWeather = async (request: Request, response: Response) => {
  const city = request.query.city || request.params.city;
  const apiKey = process.env.WEATHER_API_KEY;

  try {
    const result = await fetch(
      `${BASE_URL}/weather?q=${encodeURIComponent(String(city))}&appid=${apiKey}&units=metric`
    );
    const data = (await result.json()) as Record<string, unknown>;

    if (!result.ok) {
      response.status(result.status).json({ error: data.message || 'Weather API error' });
      return;
    }

    response.json(data);
  } catch (_error) {
    response.status(502).json({ error: 'Failed to reach weather service' });
  }
};

/**
 * Transformed proxy — fetches from OpenWeatherMap but reshapes the response
 * into a simplified summary. Demonstrates that a proxy doesn't have to be
 * a raw pass-through; your API can add value by curating the data.
 */
export const getWeatherSummary = async (request: Request, response: Response) => {
  const city = request.query.city || request.params.city;
  const apiKey = process.env.WEATHER_API_KEY;

  try {
    const result = await fetch(
      `${BASE_URL}/weather?q=${encodeURIComponent(String(city))}&appid=${apiKey}&units=metric`
    );
    const data = (await result.json()) as Record<string, unknown>;

    if (!result.ok) {
      response.status(result.status).json({ error: data.message || 'Weather API error' });
      return;
    }

    // Transform the raw response into a clean, simplified shape
    const main = data.main as Record<string, unknown>;
    const weather = (data.weather as Record<string, unknown>[])?.[0];
    const wind = data.wind as Record<string, unknown>;

    response.json({
      city: data.name,
      country: (data.sys as Record<string, unknown>)?.country,
      temperature: {
        current: main?.temp,
        feelsLike: main?.feels_like,
        min: main?.temp_min,
        max: main?.temp_max,
      },
      conditions: weather?.description,
      humidity: main?.humidity,
      windSpeed: wind?.speed,
    });
  } catch (_error) {
    response.status(502).json({ error: 'Failed to reach weather service' });
  }
};

/**
 * Raw pass-through proxy for 5-day forecast.
 */
export const getForecast = async (request: Request, response: Response) => {
  const city = request.query.city;
  const apiKey = process.env.WEATHER_API_KEY;

  try {
    const result = await fetch(
      `${BASE_URL}/forecast?q=${encodeURIComponent(String(city))}&appid=${apiKey}&units=metric`
    );
    const data = (await result.json()) as Record<string, unknown>;

    if (!result.ok) {
      response.status(result.status).json({ error: data.message || 'Weather API error' });
      return;
    }

    response.json(data);
  } catch (_error) {
    response.status(502).json({ error: 'Failed to reach weather service' });
  }
};
