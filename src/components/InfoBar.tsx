import { FaLocationDot, FaRegClock, FaSun, FaCloudSun, FaCloud, FaCloudRain, FaBolt, FaSnowflake, FaSmog } from "react-icons/fa6";
import type { IconType } from "react-icons";
import { getAsuncionWeather, type WeatherCondition } from "@/lib/weather";
import { LiveClock } from "@/components/LiveClock";

const WEATHER_ICON: Record<WeatherCondition["icon"], IconType> = {
  sun: FaSun,
  "cloud-sun": FaCloudSun,
  cloud: FaCloud,
  "cloud-rain": FaCloudRain,
  bolt: FaBolt,
  snow: FaSnowflake,
  fog: FaSmog,
};

/** Franja utilitaria arriba de todo el sitio público: ubicación de la liga,
 *  hora local y clima de Asunción. Puramente informativo — no afecta
 *  ninguna regla del torneo. */
export async function InfoBar() {
  const weather = await getAsuncionWeather();
  const WeatherIcon = weather ? WEATHER_ICON[weather.icon] : null;

  return (
    <div className="border-b border-white/10 bg-[var(--color-navy-950)]">
      <div className="mx-auto flex max-w-[82rem] items-center justify-end gap-3 px-3 py-1.5 text-[0.72rem] font-semibold text-white/60 sm:gap-4 sm:px-4">
        <span className="flex shrink-0 items-center gap-1.5 whitespace-nowrap">
          <FaLocationDot className="shrink-0" />
          Asunción<span className="hidden sm:inline">, Paraguay</span>
        </span>
        <span className="flex shrink-0 items-center gap-1.5 whitespace-nowrap">
          <FaRegClock className="shrink-0" />
          <LiveClock />
        </span>
        {weather && WeatherIcon && (
          <span className="flex shrink-0 items-center gap-1.5 whitespace-nowrap">
            <WeatherIcon className="shrink-0" />
            {weather.temperatureC}°C<span className="hidden sm:inline"> · {weather.label}</span>
          </span>
        )}
      </div>
    </div>
  );
}
