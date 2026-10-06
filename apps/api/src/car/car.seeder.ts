import { Inject, Injectable, Logger, type OnApplicationBootstrap } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Env } from "../env.js";
import type { Car, NewCar } from "../db/schema.js";
import { CarsRepository } from "./cars.repository.js";

type CarType = Car["type"];
type Random = () => number;

const FLEET_SIZE = 80;
const SEED = 42;

const VIN_ALPHABET = "ABCDEFGHJKLMNPRSTUVWXYZ0123456789";

const MODELS: Record<CarType, readonly string[]> = {
  sedan: [
    "Toyota Corolla",
    "Honda Accord",
    "Skoda Octavia",
    "Mazda 6",
    "BMW 320i",
    "Volkswagen Passat",
    "Audi A4",
    "Hyundai Elantra",
  ],
  suv: [
    "Toyota RAV4",
    "Mazda CX-5",
    "Nissan Qashqai",
    "Hyundai Tucson",
    "Kia Sorento",
    "Volkswagen Tiguan",
    "Volvo XC60",
    "Ford Kuga",
  ],
  van: [
    "Volkswagen Transporter",
    "Ford Transit Custom",
    "Mercedes Vito",
    "Renault Trafic",
    "Peugeot Expert",
    "Opel Vivaro",
  ],
};

const PLATE_PREFIXES = ["KR", "WA", "GD", "PO", "WR", "LU", "KA", "SK"];

const VIN_PREFIX: Record<CarType, string> = { sedan: "JTD", suv: "JM3", van: "WV2" };

const BASE_PRICE: Record<CarType, number> = { sedan: 120, suv: 200, van: 280 };

/**
 * Fills an empty fleet with placeholder cars so the browse view has something to show.
 * Development only, and a no-op once any car exists, so restarting never duplicates or overwrites.
 *
 * The generator is seeded with a constant: a reset database reproduces the same 80 cars, which
 * keeps screenshots and manual testing stable.
 */
@Injectable()
export class CarSeeder implements OnApplicationBootstrap {
  readonly #logger = new Logger(CarSeeder.name);

  constructor(
    @Inject() private readonly cars: CarsRepository,
    @Inject() private readonly config: ConfigService<Env, true>,
  ) {}

  async onApplicationBootstrap() {
    if (this.config.get("NODE_ENV", { infer: true }) !== "development") return;
    if ((await this.cars.count()) > 0) return;

    const fleet = generate();
    await this.cars.createMany(fleet);
    this.#logger.log(`Seeded ${fleet.length} cars`);
  }
}

function generate(): NewCar[] {
  const random = mulberry32(SEED);

  // Mixed so ids are not grouped by type, which would make paging look artificial.
  const types = shuffle(
    [
      ...Array<CarType>(32).fill("sedan"),
      ...Array<CarType>(30).fill("suv"),
      ...Array<CarType>(18).fill("van"),
    ],
    random,
  );

  // Cycled rather than randomly picked, so the fleet is stocked evenly across models
  // instead of leaving one model with ten copies and another with one.
  const modelCursor: Record<CarType, number> = { sedan: 0, suv: 0, van: 0 };

  return types.slice(0, FLEET_SIZE).map((type, index) => {
    const year = 2015 + nextInt(random, 11);

    return {
      model: pick(MODELS[type], modelCursor[type]++),
      year,
      registrationNumber: plate(index),
      vin: vin(type, index, random),
      seats: seats(type, random),
      doors: doors(type, random),
      pricePerDay: pricePerDay(type, year, random),
      type,
    };
  });
}

function seats(type: CarType, random: Random) {
  switch (type) {
    case "sedan":
      return 5;
    case "suv":
      return nextInt(random, 4) === 0 ? 7 : 5;
    case "van":
      return 7 + nextInt(random, 3);
  }
}

function doors(type: CarType, random: Random) {
  switch (type) {
    case "sedan":
      return 4;
    case "suv":
      return 5;
    case "van":
      return random() < 0.5 ? 4 : 5;
  }
}

function pricePerDay(type: CarType, year: number, random: Random) {
  const whole = BASE_PRICE[type] + (year - 2015) * 9 + nextInt(random, 46);
  return whole + nextInt(random, 4) * 0.25;
}

// Already in the normalized form the create endpoint stores, so a duplicate entered by hand collides.
function plate(index: number) {
  return `${pick(PLATE_PREFIXES, index)}${1000 + index * 11}`;
}

function vin(type: CarType, index: number, random: Random) {
  let middle = "";
  for (let i = 0; i < 8; i++) {
    middle += VIN_ALPHABET.charAt(nextInt(random, VIN_ALPHABET.length));
  }
  return `${VIN_PREFIX[type]}${middle}${String(index).padStart(6, "0")}`;
}

function pick<T>(items: readonly T[], index: number): T {
  const item = items[index % items.length];
  if (item === undefined) throw new Error("Cannot pick from an empty list");
  return item;
}

function shuffle<T>(items: T[], random: Random): T[] {
  return items
    .map((item) => ({ item, key: random() }))
    .sort((a, b) => a.key - b.key)
    .map(({ item }) => item);
}

function nextInt(random: Random, bound: number) {
  return Math.floor(random() * bound);
}

/** Small seeded PRNG (mulberry32), so the generated fleet is identical on every reset. */
function mulberry32(seed: number): Random {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
