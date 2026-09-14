import { ForecastPageClient } from "@/components/forecast/forecast-page-client";
import { forecastMocks } from "@/lib/mock-forecast";

export default function ForecastPage() {
  return <ForecastPageClient initialForecasts={forecastMocks} />;
}