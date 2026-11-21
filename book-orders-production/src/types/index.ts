export interface BookInput {
  title: string;
  subject: string;
  level: string;
}

export interface SchoolInput {
  name: string;
  region: string;
}

export interface OrderItemInput {
  bookId: number;
  quantity: number;
}

export interface OrderInput {
  schoolId: number;
  items: OrderItemInput[];
}

export interface AggregatedBook {
  bookId: number;
  title: string;
  subject: string;
  level: string;
  totalQuantity: number;
  schoolCount: number;
  schools: string[];
}
