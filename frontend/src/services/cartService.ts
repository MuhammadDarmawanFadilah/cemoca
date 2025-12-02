import { config } from '@/lib/config';

interface CartItem {
  id: number;
  user: {
    id: number;
    username: string;
  };
  barang: {
    id: number;
    nama: string;
    harga: number;
    poin: number;
    stock: number;
    berat: number;
    kategori: {
      id: number;
      nama: string;
    };
    gambar?: string;
    isActive: boolean;
  };
  jumlah: number;
  createdAt: string;
  updatedAt: string;
}

interface AddToCartRequest {
  userId: number;
  barangId: number;
  jumlah: number;
}

interface UpdateCartRequest {
  userId: number;
  barangId: number;
  quantity: number;
}

interface RemoveFromCartRequest {
  userId: number;
  barangId: number;
}

class CartService {
  private baseUrl = config.baseUrl;

  async getCartByUser(userId: number): Promise<CartItem[]> {
    const response = await fetch(`${this.baseUrl}/api/cart/user/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch cart items');
    }

    return response.json();
  }

  async addToCart(request: AddToCartRequest): Promise<CartItem> {
    const response = await fetch(`${this.baseUrl}/api/cart/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error('Failed to add item to cart');
    }

    return response.json();
  }

  async updateCartItemQuantity(request: UpdateCartRequest): Promise<CartItem | null> {
    const response = await fetch(`${this.baseUrl}/api/cart/update`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (response.status === 204) {
      return null; // Item was removed
    }

    if (!response.ok) {
      throw new Error('Failed to update cart item');
    }

    return response.json();
  }

  async removeFromCart(request: RemoveFromCartRequest): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/cart/remove`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error('Failed to remove item from cart');
    }
  }

  async clearCart(userId: number): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/cart/clear/${userId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to clear cart');
    }
  }

  async getCartItemCount(userId: number): Promise<number> {
    const response = await fetch(`${this.baseUrl}/api/cart/count/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get cart item count');
    }

    return response.json();
  }

  async getTotalQuantity(userId: number): Promise<number> {
    const response = await fetch(`${this.baseUrl}/api/cart/total-quantity/${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get total quantity');
    }

    return response.json();
  }
}

export const cartService = new CartService();
export type { CartItem, AddToCartRequest, UpdateCartRequest, RemoveFromCartRequest };
