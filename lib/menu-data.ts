export type CategoryId = "breakfast" | "mains" | "drinks";

export type MenuItem = {
  id: string;
  category: CategoryId;
  name: string;
  description: string;
  price: number;
  image: string;
};

export const categories: { id: CategoryId; label: string }[] = [
  { id: "breakfast", label: "Сніданки" },
  { id: "mains", label: "Основні страви" },
  { id: "drinks", label: "Напої" },
];

export const menuItems: MenuItem[] = [
  {
    id: "1",
    category: "breakfast",
    name: "Сирники зі сметаною",
    description: "Ніжні сирники з домашньою сметаною та ягідним соусом",
    price: 185,
    image:
      "https://images.unsplash.com/photo-1488477181946-6428a0291777?w=600&q=80",
  },
  {
    id: "2",
    category: "breakfast",
    name: "Яєчня з беконом",
    description: "Смажена яєчня з хрустким беконом та свіжою зеленню",
    price: 165,
    image:
      "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=600&q=80",
  },
  {
    id: "3",
    category: "breakfast",
    name: "Млинці з ягодами",
    description: "Тонкі млинці з лісовими ягодами та вершковим кремом",
    price: 175,
    image:
      "https://images.unsplash.com/photo-1519676867240-f03562e645a9?w=600&q=80",
  },
  {
    id: "4",
    category: "mains",
    name: "Стейк з овочами",
    description: "М'який стейк medium rare з сезонними овочами гриль",
    price: 420,
    image:
      "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&q=80",
  },
  {
    id: "5",
    category: "mains",
    name: "Форель з печі",
    description: "Форель з травами, лимоном та картопляним пюре",
    price: 385,
    image:
      "https://images.unsplash.com/photo-1519708225418-ca8838531788?w=600&q=80",
  },
  {
    id: "6",
    category: "mains",
    name: "Борщ у хлібі",
    description: "Домашній борщ у житньому хлібі зі сметаною",
    price: 245,
    image:
      "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&q=80",
  },
  {
    id: "7",
    category: "drinks",
    name: "Кава лате",
    description: "Еспresso з м'яким молоком та нотками карамелі",
    price: 85,
    image:
      "https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=600&q=80",
  },
  {
    id: "8",
    category: "drinks",
    name: "Фірмовий лимонад",
    description: "Освіжаючий лимонад з м'ятою та медом",
    price: 95,
    image:
      "https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=600&q=80",
  },
  {
    id: "9",
    category: "drinks",
    name: "Карпатський чай",
    description: "Трав'яний настій з гірських трав і липи",
    price: 75,
    image:
      "https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&q=80",
  },
];
