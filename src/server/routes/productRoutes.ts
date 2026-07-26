import { Router } from 'express';
import { db } from '../db';
import { requireAuth, requireAdmin, AuthRequest } from '../auth';
import { Product, Category, Brand } from '../../types';

const router = Router();

// GET /api/products
router.get('/products', (req, res) => {
  const {
    q,
    category,
    brand,
    minPrice,
    maxPrice,
    minRating,
    sortBy,
    inStock,
    featured,
    page = '1',
    limit = '12'
  } = req.query;

  let products = db.get('products');

  // Search filter
  if (q) {
    const query = String(q).toLowerCase();
    products = products.filter(
      (p) =>
        p.title.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query) ||
        p.brand.toLowerCase().includes(query) ||
        p.tags.some((t) => t.toLowerCase().includes(query))
    );
  }

  // Category filter
  if (category) {
    const cat = String(category).toLowerCase();
    products = products.filter((p) => p.category.toLowerCase() === cat || p.category.toLowerCase().replace(/\s+/g, '-') === cat);
  }

  // Brand filter
  if (brand) {
    const br = String(brand).toLowerCase();
    products = products.filter((p) => p.brand.toLowerCase() === br);
  }

  // Price range filter
  if (minPrice) {
    products = products.filter((p) => (p.discountPrice || p.price) >= Number(minPrice));
  }
  if (maxPrice) {
    products = products.filter((p) => (p.discountPrice || p.price) <= Number(maxPrice));
  }

  // Rating filter
  if (minRating) {
    products = products.filter((p) => p.rating >= Number(minRating));
  }

  // Stock filter
  if (inStock === 'true') {
    products = products.filter((p) => p.stock > 0);
  }

  // Featured filter
  if (featured === 'true') {
    products = products.filter((p) => p.isFeatured);
  }

  // Sorting
  if (sortBy === 'price_asc') {
    products.sort((a, b) => (a.discountPrice || a.price) - (b.discountPrice || b.price));
  } else if (sortBy === 'price_desc') {
    products.sort((a, b) => (b.discountPrice || b.price) - (a.discountPrice || a.price));
  } else if (sortBy === 'rating') {
    products.sort((a, b) => b.rating - a.rating);
  } else if (sortBy === 'discount') {
    products.sort((a, b) => {
      const discA = a.discountPrice ? a.price - a.discountPrice : 0;
      const discB = b.discountPrice ? b.price - b.discountPrice : 0;
      return discB - discA;
    });
  } else {
    // Default newest
    products.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  // Pagination
  const pageNum = parseInt(String(page), 10) || 1;
  const limitNum = parseInt(String(limit), 10) || 12;
  const totalCount = products.length;
  const totalPages = Math.ceil(totalCount / limitNum);
  const startIndex = (pageNum - 1) * limitNum;
  const paginatedProducts = products.slice(startIndex, startIndex + limitNum);

  res.json({
    success: true,
    products: paginatedProducts,
    pagination: {
      totalCount,
      totalPages,
      currentPage: pageNum,
      limit: limitNum
    }
  });
});

// GET /api/products/:id
router.get('/products/:id', (req, res) => {
  const { id } = req.params;
  const products = db.get('products');
  const product = products.find((p) => p.id === id || p.slug === id);

  if (!product) {
    return res.status(404).json({ success: false, message: 'Product not found.' });
  }

  // Fetch reviews for this product
  const reviews = db.get('reviews').filter((r) => r.productId === product.id);

  // Related products in same category
  const related = products
    .filter((p) => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  res.json({
    success: true,
    product,
    reviews,
    related
  });
});

// POST /api/products (Admin)
router.post('/products', requireAuth, requireAdmin, (req: AuthRequest, res) => {
  const {
    title,
    description,
    price,
    discountPrice,
    images,
    category,
    brand,
    stock,
    sku,
    weight,
    tags,
    specifications,
    variants,
    isFeatured,
    isTrending,
    videoUrl
  } = req.body;

  if (!title || !price || !category || !brand) {
    return res.status(400).json({ success: false, message: 'Title, price, category and brand are required.' });
  }

  const products = db.get('products');
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const newProduct: Product = {
    id: `prod_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    title,
    slug,
    description: description || '',
    price: Number(price),
    discountPrice: discountPrice ? Number(discountPrice) : undefined,
    images: Array.isArray(images) && images.length > 0 ? images : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800'],
    videoUrl,
    category,
    brand,
    stock: Number(stock || 10),
    sku: sku || `SKU-${Date.now().toString().slice(-6)}`,
    weight,
    tags: Array.isArray(tags) ? tags : [],
    specifications: Array.isArray(specifications) ? specifications : [],
    variants: Array.isArray(variants) ? variants : [],
    isFeatured: Boolean(isFeatured),
    isTrending: Boolean(isTrending),
    rating: 5.0,
    numReviews: 0,
    createdAt: new Date().toISOString()
  };

  products.unshift(newProduct);
  db.set('products', products);
  db.addLog(req.user!.id, req.user!.name, 'PRODUCT_CREATE', `Created product: ${newProduct.title} (${newProduct.id})`);

  res.status(201).json({ success: true, message: 'Product created successfully!', product: newProduct });
});

// PUT /api/products/:id (Admin)
router.put('/products/:id', requireAuth, requireAdmin, (req: AuthRequest, res) => {
  const { id } = req.params;
  const products = db.get('products');
  const index = products.findIndex((p) => p.id === id);

  if (index === -1) {
    return res.status(404).json({ success: false, message: 'Product not found.' });
  }

  const updated: Product = {
    ...products[index],
    ...req.body,
    price: Number(req.body.price ?? products[index].price),
    discountPrice: req.body.discountPrice ? Number(req.body.discountPrice) : products[index].discountPrice,
    stock: Number(req.body.stock ?? products[index].stock)
  };

  products[index] = updated;
  db.set('products', products);
  db.addLog(req.user!.id, req.user!.name, 'PRODUCT_UPDATE', `Updated product ${updated.title}`);

  res.json({ success: true, message: 'Product updated successfully!', product: updated });
});

// DELETE /api/products/:id (Admin)
router.delete('/products/:id', requireAuth, requireAdmin, (req: AuthRequest, res) => {
  const { id } = req.params;
  let products = db.get('products');
  const target = products.find((p) => p.id === id);

  if (!target) {
    return res.status(404).json({ success: false, message: 'Product not found.' });
  }

  products = products.filter((p) => p.id !== id);
  db.set('products', products);
  db.addLog(req.user!.id, req.user!.name, 'PRODUCT_DELETE', `Deleted product ${target.title}`);

  res.json({ success: true, message: 'Product deleted successfully!' });
});

// GET /api/categories
router.get('/categories', (req, res) => {
  const categories = db.get('categories');
  res.json({ success: true, categories });
});

// POST /api/categories (Admin)
router.post('/categories', requireAuth, requireAdmin, (req: AuthRequest, res) => {
  const { name, image } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, message: 'Category name is required.' });
  }

  const categories = db.get('categories');
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const newCat: Category = {
    id: `cat_${Date.now()}`,
    name,
    slug,
    image: image || 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=600',
    productCount: 0
  };

  categories.push(newCat);
  db.set('categories', categories);
  res.status(201).json({ success: true, category: newCat });
});

// GET /api/brands
router.get('/brands', (req, res) => {
  const brands = db.get('brands');
  res.json({ success: true, brands });
});

// POST /api/brands (Admin)
router.post('/brands', requireAuth, requireAdmin, (req: AuthRequest, res) => {
  const { name, logo } = req.body;
  if (!name) {
    return res.status(400).json({ success: false, message: 'Brand name is required.' });
  }

  const brands = db.get('brands');
  const newBrand: Brand = {
    id: `brand_${Date.now()}`,
    name,
    logo: logo || 'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=100'
  };

  brands.push(newBrand);
  db.set('brands', brands);
  res.status(201).json({ success: true, brand: newBrand });
});

export default router;
