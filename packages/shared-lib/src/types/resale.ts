export interface ResaleListingDTO {
  id: number;
  projectName: string;
  unitType: string;
  floor: number | null;
  area: string | null;
  price: string | null;
  finishing: string | null;
  description: string | null;
  images: string | null;
  ownerNameEnc: string;
  ownerPhoneEnc: string;
  ownerIdEnc: string | null;
  status: string;
  uploadedById: string;
  uploadedByName: string | null;
  assignedToId: string | null;
  assignedToName: string | null;
  assignedAt: string | null;
  createdAt: string;
  updatedAt: string;
}
