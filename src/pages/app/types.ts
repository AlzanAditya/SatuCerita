export interface UserInvitation {
  id: string;
  title: string;
  brideName: string;
  groomName: string;
  eventDate: string;
  eventLocation: string;
  slug: string;
  templateName: string;
  templateCover: string;
  status: "active" | "draft";
  guestCount: number;
  rsvpCount: number;
}

export interface OrderAddon {
  id: string;
  name: string;
  price: number;
}

export interface OrderItem {
  id: string;
  invoiceNo: string;
  date: string;
  dueDate: string;
  status: "pending" | "paid" | "cancelled";
  templateName: string;
  templateCategory: string;
  templateCover: string;
  packageTier: string;
  basePrice: number;
  addons: OrderAddon[];
  discountCode?: string;
  discountAmount?: number;
  uniqueCode: number;
  total: number;
  paymentMethod: "qris" | "bca_va" | "mandiri_va" | "gopay";
  vaNumber?: string;
  slug: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
}

export type UserAppTab =
  | "home"
  | "task"
  | "proses"
  | "chat"
  | "app"
  | "joki"
  | "katalog"
  | "profile"
  | "bayar";

export interface UserAppProps {
  activeTab?: UserAppTab;
  currentPath: string;
  onNavigate: (path: string) => void;
}
