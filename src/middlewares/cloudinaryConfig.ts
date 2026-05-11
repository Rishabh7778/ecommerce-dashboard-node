import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import multer from 'multer';

// 1. Cloudinary Settings (Ye keys aapko Cloudinary Dashboard se milengi)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: 'dealport_products',
      resource_type: 'auto', 
      transformation: [
        { width: 800, height: 800, crop: 'limit' }, 
        { quality: 'auto' },                         
        { fetch_format: 'auto' }                     
      ],
      public_id: `${Date.now()}-${file.originalname.split('.')[0].replace(/\s+/g, '_')}`, 
    };
  },
});

export const upload = multer({ storage: storage });