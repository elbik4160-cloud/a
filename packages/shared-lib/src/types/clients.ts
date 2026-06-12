export interface ClientDTO {
  id: number;
  clientId: string;
  name: string;
  countryCode: string | null;
  phone: string | null;
  countryCode2: string | null;
  phone2: string | null;
  request: string | null;
  notes: string | null;
  chooseSales: string | null;
  createdBy: string;
  createdByName: string | null;
  createdAt: string;
}
