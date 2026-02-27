import restaurant1 from "@/assets/restaurant-1.jpg";
import restaurant2 from "@/assets/restaurant-2.jpg";
import restaurant3 from "@/assets/restaurant-3.jpg";
import restaurant4 from "@/assets/restaurant-4.jpg";

export interface Restaurant {
  id: string;
  name: string;
  location: string;
  cuisine: string;
  bagContents: string;
  bagPrice: number;
  originalValue: number;
  bagsAvailable: number;
  bagsTotal: number;
  window: string;
  windowType: "Delivery" | "Pickup";
  image: string;
  possibleItems: string[];
}

export const restaurants: Restaurant[] = [
  {
    id: "mad-over-donuts",
    name: "Mad Over Donuts",
    location: "Bandra West, Mumbai",
    cuisine: "Bakery & Desserts",
    bagContents: "Assorted donuts, muffins and pastries freshly made today",
    bagPrice: 199,
    originalValue: 650,
    bagsAvailable: 5,
    bagsTotal: 5,
    window: "8:00 PM – 10:00 PM",
    windowType: "Delivery",
    image: restaurant1,
    possibleItems: [
      "Freshly glazed donuts (assorted flavours)",
      "Chocolate chip muffins & cupcakes",
      "Flaky croissants and Danish pastries",
    ],
  },
  {
    id: "the-nutcracker-cafe",
    name: "The Nutcracker Cafe",
    location: "Colaba, Mumbai",
    cuisine: "Cafe & Continental",
    bagContents: "Artisan sandwiches, quiches and baked goods",
    bagPrice: 249,
    originalValue: 780,
    bagsAvailable: 3,
    bagsTotal: 5,
    window: "9:00 PM – 10:00 PM",
    windowType: "Pickup",
    image: restaurant2,
    possibleItems: [
      "Gourmet sandwiches with artisan bread",
      "Freshly baked quiche lorraine",
      "Assorted cookies and scones",
    ],
  },
  {
    id: "theobroma",
    name: "Theobroma",
    location: "Churchgate, Mumbai",
    cuisine: "Patisserie & Desserts",
    bagContents: "Premium cakes, brownies and dessert items",
    bagPrice: 299,
    originalValue: 950,
    bagsAvailable: 4,
    bagsTotal: 5,
    window: "7:00 PM – 9:00 PM",
    windowType: "Delivery",
    image: restaurant3,
    possibleItems: [
      "Rich chocolate brownies and blondies",
      "Layered mousse cakes and pastries",
      "Artisan cookies and biscotti",
    ],
  },
  {
    id: "chaayos",
    name: "Chaayos",
    location: "Andheri West, Mumbai",
    cuisine: "Indian Cafe & Snacks",
    bagContents: "Fresh chai accompaniments, sandwiches and snacks",
    bagPrice: 149,
    originalValue: 450,
    bagsAvailable: 6,
    bagsTotal: 8,
    window: "8:30 PM – 9:30 PM",
    windowType: "Pickup",
    image: restaurant4,
    possibleItems: [
      "Masala chai with fresh accompaniments",
      "Grilled sandwiches and wraps",
      "Samosas, pakoras and Indian snacks",
    ],
  },
];

export interface Order {
  id: string;
  orderNumber: string;
  restaurant: Restaurant;
  date: string;
  pricePaid: number;
  status: "Collected" | "On the way" | "Upcoming";
  deliveryType: "Pickup" | "Delivery";
}

export const sampleOrders: Order[] = [
  {
    id: "1",
    orderNumber: "#BB001",
    restaurant: restaurants[0],
    date: "Today, 8:00 PM",
    pricePaid: 209,
    status: "Upcoming",
    deliveryType: "Delivery",
  },
  {
    id: "2",
    orderNumber: "#BB002",
    restaurant: restaurants[2],
    date: "Yesterday, 7:30 PM",
    pricePaid: 309,
    status: "Collected",
    deliveryType: "Delivery",
  },
];
