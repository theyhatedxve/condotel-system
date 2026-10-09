import poolImage from '../../assets/homepage-background.png';
import buildingImage from '../../assets/login-background.jpg';

// Homepage presentation data only. Replace these examples with property details.
// These room previews never create reservations or alter the live room catalog.
export const property = {
  name: 'Seabreeze Condotel',
  brand: 'SEABREEZE',
  address: 'Coastal Road, Bayview City',
  email: 'hello@seabreeze.example',
  phone: '+63 000 000 0000',
  description:
    'Seabreeze Condotel is conveniently situated in the heart of Bayview City, just minutes from the beach, top attractions, transport hubs, and a variety of dining and lifestyle options.',
};

export const gallery = [
  {
    src: poolImage,
    alt: 'Twilight over an infinity pool beside the coast',
    label: 'A little closer to paradise',
    position: 'center 58%',
  },
  {
    src: buildingImage,
    alt: 'Warmly lit condotel rooms overlooking a tropical pool',
    label: 'Modern living, coastal calm',
    position: 'center 54%',
  },
];

export const featuredRooms = [
  {
    id: 'sample-deluxe',
    roomNumber: '101',
    name: 'Deluxe Room',
    roomType: 'Deluxe',
    description:
      'A stylish and cozy room with modern furnishings and a private balcony.',
    capacity: 2,
    beds: '1 Queen Bed',
    ratePerNightCentavos: 250000,
    imageUrl:
      'https://images.unsplash.com/photo-1611892440504-42a792e24d32?auto=format&fit=crop&w=800&q=85',
  },
  {
    id: 'sample-twin',
    roomNumber: '102',
    name: 'Superior Twin Room',
    roomType: 'Twin',
    description: 'Spacious and comfortable, perfect for families or friends.',
    capacity: 2,
    beds: '2 Single Beds',
    ratePerNightCentavos: 300000,
    imageUrl:
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=85',
  },
  {
    id: 'sample-suite',
    roomNumber: '103',
    name: 'Executive Suite',
    roomType: 'Suite',
    description:
      'A more spacious stay with a separate living area and breathtaking views.',
    capacity: 4,
    beds: '1 King Bed',
    ratePerNightCentavos: 480000,
    imageUrl:
      'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=800&q=85',
  },
];

export const coastImage =
  'https://images.unsplash.com/photo-1510414842594-a61c69b5ae57?auto=format&fit=crop&w=900&q=85';
