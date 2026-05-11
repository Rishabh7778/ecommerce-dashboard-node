export interface IProduct {
    id?: number;
    title: string;
    description?: string | null; 
    category: string;
    brand: string;
    price: number;
    oldPrice?: number;
    rating?: number;
    badge?: string | null;
    badgeColor?: string | null;
    img: string;
    createdAt?: Date;
}