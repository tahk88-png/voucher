import { 
  Utensils, 
  Sparkles, 
  Music, 
  ShoppingBag, 
  Plane, 
  Briefcase, 
  Coffee, 
  Beer, 
  Dumbbell, 
  Scissors, 
  Ticket, 
  Camera, 
  Car, 
  Home, 
  Gift, 
  Baby, 
  Smartphone,
  Tent
} from 'lucide-react';

export interface SubCategory {
  id: string;
  label: string;
}

export interface Category {
  id: string;
  label: string;
  description: string;
  icon: any;
  gradient: string;
  subcategories: SubCategory[];
}

export const CATEGORY_DATA: Category[] = [
  {
    id: 'food_drink',
    label: 'Toit ja Jook',
    description: 'Restoranid, kohvikud ja gurmee elamused',
    icon: Utensils,
    gradient: 'from-[#FF9A9E] to-[#FECFEF]',
    subcategories: [
      { id: 'fine_dining', label: 'Fine Dining' },
      { id: 'casual', label: 'Casual Dining' },
      { id: 'cafe', label: 'Kohvikud & Pagarid' },
      { id: 'bar', label: 'Baarid & Pubid' },
      { id: 'fast_food', label: 'Kiirtoit' },
      { id: 'delivery', label: 'Toidukuller' },
      { id: 'vegan', label: 'Vegan & Tervislik' }
    ]
  },
  {
    id: 'wellness',
    label: 'Ilu ja Tervis',
    description: 'Spa, sport ja hoolitsused',
    icon: Sparkles,
    gradient: 'from-[#a18cd1] to-[#fbc2eb]',
    subcategories: [
      { id: 'spa', label: 'SPA & Saunad' },
      { id: 'massage', label: 'Massaaž' },
      { id: 'hair', label: 'Juuksur & Barber' },
      { id: 'beauty', label: 'Kosmeetik & Küünetehnik' },
      { id: 'gym', label: 'Jõusaal & Treeningud' },
      { id: 'yoga', label: 'Jooga & Pilates' },
      { id: 'medical', label: 'Meditsiin & Hambaravi' }
    ]
  },
  {
    id: 'entertainment',
    label: 'Meelelahutus',
    description: 'Kultuur, üritused ja vaba aeg',
    icon: Ticket,
    gradient: 'from-[#84fab0] to-[#8fd3f4]',
    subcategories: [
      { id: 'cinema', label: 'Kino & Teater' },
      { id: 'concert', label: 'Kontserdid & Festivalid' },
      { id: 'nightlife', label: 'Ööklubid' },
      { id: 'family', label: 'Perepuhkus & Lapsed' },
      { id: 'museum', label: 'Muuseumid & Näitused' },
      { id: 'workshops', label: 'Töötoad & Koolitused' },
      { id: 'sports_events', label: 'Spordiüritused' }
    ]
  },
  {
    id: 'retail',
    label: 'Kaubandus',
    description: 'Poed, butiigid ja e-kaubandus',
    icon: ShoppingBag,
    gradient: 'from-[#fccb90] to-[#d57eeb]',
    subcategories: [
      { id: 'fashion', label: 'Riided & Mood' },
      { id: 'home', label: 'Kodu & Sisustus' },
      { id: 'electronics', label: 'Elektroonika' },
      { id: 'beauty_products', label: 'Kosmeetikatooted' },
      { id: 'gifts', label: 'Kingitused & Lilled' },
      { id: 'pets', label: 'Lemmikloomad' }
    ]
  },
  {
    id: 'travel',
    label: 'Reisimine',
    description: 'Majutus ja elamusturism',
    icon: Plane,
    gradient: 'from-[#e0c3fc] to-[#8ec5fc]',
    subcategories: [
      { id: 'hotel', label: 'Hotellid & Majutus' },
      { id: 'packages', label: 'Reisipaketid' },
      { id: 'adventure', label: 'Matkad & Seiklus' },
      { id: 'rental', label: 'Rent (Auto, Ratas)' },
      { id: 'tours', label: 'Giiditeenused' }
    ]
  },
  {
    id: 'services',
    label: 'Teenused',
    description: 'Professionaalsed teenused',
    icon: Briefcase,
    gradient: 'from-[#fa709a] to-[#fee140]',
    subcategories: [
      { id: 'photo', label: 'Fotograafia' },
      { id: 'cleaning', label: 'Puhastus & Koristus' },
      { id: 'auto', label: 'Autoteenindus' },
      { id: 'education', label: 'Haridus & Kursused' },
      { id: 'business', label: 'Äriteenused' }
    ]
  }
];
