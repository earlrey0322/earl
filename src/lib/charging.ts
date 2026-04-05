// Charging calculation based on PSPCS specs:
// Solar Panel -> Rectifier Bridge Diode -> DC Voltage -> Battery -> Inverter
// Output: 220VAC -> Converter Transformer -> 12VAC -> Rectifier -> 3.6VDC
//
// 1 peso = 3 minutes of charging
// Phone charging rate varies by brand (approximate watts)

const PHONE_CHARGING_RATES: Record<string, number> = {
  "Apple iPhone": 20,
  "Samsung Galaxy": 25,
  "Xiaomi": 33,
  "Huawei": 40,
  "OPPO": 30,
  "Vivo": 33,
  "Realme": 30,
  "OnePlus": 30,
  "Nokia": 18,
  "Google Pixel": 23,
  "Infinix": 18,
  "Tecno": 18,
  "Other": 20,
};

const PESO_PER_MINUTE = 1 / 3; // 1 peso = 3 minutes
const OUTPUT_VOLTAGE_DC = 3.6; // 3.6VDC rotary output
const MAX_POWER_WATTS = 50; // Solar panel typical capacity

export function calculateChargingSession(
  phoneBrand: string,
  currentBattery: number,
  targetBattery: number = 100
): {
  estimatedWatts: number;
  durationMinutes: number;
  costPesos: number;
  energyNeeded: number;
} {
  const chargingRate = PHONE_CHARGING_RATES[phoneBrand] || PHONE_CHARGING_RATES["Other"];
  const batteryToCharge = targetBattery - currentBattery;

  // Average phone battery capacity: 4500mAh at 3.7V = 16.65Wh
  const avgBatteryWh = 16.65;
  const energyNeeded = (batteryToCharge / 100) * avgBatteryWh;

  // Duration in minutes based on charging rate
  const durationHours = energyNeeded / chargingRate;
  const durationMinutes = Math.ceil(durationHours * 60);

  // Cost: 1 peso per 3 minutes
  const costPesos = Math.ceil(durationMinutes * PESO_PER_MINUTE);

  return {
    estimatedWatts: chargingRate,
    durationMinutes: Math.max(durationMinutes, 3), // Minimum 3 minutes
    costPesos: Math.max(costPesos, 1), // Minimum 1 peso
    energyNeeded: Math.round(energyNeeded * 100) / 100,
  };
}

export function getPhoneBrands(): string[] {
  return Object.keys(PHONE_CHARGING_RATES);
}

export const PSPCS_SPECS = {
  solarPanel: "Solar Panel with Rectifier Bridge-type Diode",
  outputDC: "DC Voltage for Battery Charging",
  inverter: "Battery to Inverter, Output 220VAC",
  converter: "Converter Transformer, Output 12VAC",
  rectifier: "Rectifier for 12VAC to DC",
  rotaryOutput: "3.6VDC Rotary Output - Charges All Types",
  pesoRate: "1 peso = 3 minutes",
};
