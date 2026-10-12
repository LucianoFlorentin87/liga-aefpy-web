import "server-only";

// Asunción, Paraguay — sede de la Liga AEFPY. Fija a propósito (no hay
// geolocalización del visitante): el dato es contexto de la organización,
// no del usuario.
const ASUNCION_LAT = -25.2637;
const ASUNCION_LON = -57.5759;

export type WeatherCondition = { label: string; icon: "sun" | "cloud-sun" | "cloud" | "cloud-rain" | "bolt" | "snow" | "fog" };

// Códigos WMO que devuelve Open-Meteo (current_weather.weathercode) — ver
// https://open-meteo.com/en/docs#weathervariables
function describeWeatherCode(code: number): WeatherCondition {
  if (code === 0) return { label: "Despejado", icon: "sun" };
  if (code === 1 || code === 2) return { label: "Parcialmente nublado", icon: "cloud-sun" };
  if (code === 3) return { label: "Nublado", icon: "cloud" };
  if (code === 45 || code === 48) return { label: "Neblina", icon: "fog" };
  if ([51, 53, 55, 56, 57].includes(code)) return { label: "Llovizna", icon: "cloud-rain" };
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { label: "Lluvia", icon: "cloud-rain" };
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { label: "Nieve", icon: "snow" };
  if ([95, 96, 99].includes(code)) return { label: "Tormenta", icon: "bolt" };
  return { label: "—", icon: "cloud" };
}

export type AsuncionWeather = { temperatureC: number } & WeatherCondition;

/**
 * Clima actual de Asunción vía Open-Meteo (gratis, sin API key). Si falla
 * (sin red, servicio caído), devuelve null — el InfoBar simplemente no
 * muestra el bloque de clima en vez de romper la página.
 */
export async function getAsuncionWeather(): Promise<AsuncionWeather | null> {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${ASUNCION_LAT}&longitude=${ASUNCION_LON}&current_weather=true&timezone=America%2FAsuncion`;
    const res = await fetch(url, { next: { revalidate: 1800 } }); // 30 min
    if (!res.ok) return null;

    const data = await res.json();
    const current = data?.current_weather;
    if (typeof current?.temperature !== "number" || typeof current?.weathercode !== "number") return null;

    return { temperatureC: Math.round(current.temperature), ...describeWeatherCode(current.weathercode) };
  } catch {
    return null;
  }
}
