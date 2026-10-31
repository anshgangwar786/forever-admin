'use client';

import React, { useState } from 'react';
import { X, Package } from 'lucide-react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { Button } from '../ui';

export default function RestockModal({
  product,
  isOpen,
  onClose,
  backendUrl,
  token,
  onSuccess,
}) {
  const [addQty, setAddQty] = useState(25);
  const [loading, setLoading] = useState(false);

  if (!isOpen || !product) return null;

  const currentStock = product.stock !== undefined ? product.stock : 0;
  const newStock = currentStock + Number(addQty || 0);

  const handleRestock = async (e) => {
    e.preventDefault();
    if (addQty <= 0) {
      toast.error('Please enter a positive restock quantity');
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('id', product._id);
      formData.append('name', product.name);
      formData.append('price', product.price);
      formData.append('category', product.category);
      formData.append('subCategory', product.subCategory);
      formData.append('stock', newStock);
      formData.append('existingImages', JSON.stringify(product.image || []));
      formData.append('attributes', JSON.stringify(product.attributes || []));

      const res = await axios.post(`${backendUrl}/api/v1/product/update`, formData, {
        headers: { token },
      });

      if (res.data.success) {
        toast.success(`Restocked ${product.name}: stock is now ${newStock}`);
        if (onSuccess) onSuccess(product._id, newStock);
        onClose();
      } else {
        toast.error(res.data.message || 'Restock failed');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Restock failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-[#1C1917]/50 backdrop-blur-xs" onClick={onClose} />
      <div className="relative bg-[#FAF8F5] rounded-xl shadow-2xl border border-[#E7E3D9] max-w-sm w-full p-6 space-y-4 z-10 animate-fadeIn">
        <div className="flex items-center justify-between pb-3 border-b border-[#E7E3D9]">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-[#B08D57]" />
            <h3 className="font-serif text-base font-medium text-[#1C1917]">Replenish Stock</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-[#78716C] hover:text-[#1C1917] rounded-full hover:bg-[#F4F1EA] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div>
          <p className="text-xs font-serif font-medium text-[#1C1917] line-clamp-1">{product.name}</p>
          <p className="text-[11px] text-[#78716C] mt-0.5">
            Current stock: <strong className="text-[#8E2824]">{currentStock} units</strong>
          </p>
        </div>

        <form onSubmit={handleRestock} className="space-y-4">
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-[#78716C] mb-1.5">
              Select Preset Units:
            </label>
            <div className="flex items-center gap-2">
              {[10, 25, 50, 100].map((preset) => (
                <button
                  type="button"
                  key={preset}
                  onClick={() => setAddQty(preset)}
                  className={`flex-1 py-1.5 text-xs font-medium rounded-xs border transition cursor-pointer ${
                    addQty === preset
                      ? 'bg-[#1C1917] text-[#FAF8F5] border-[#1C1917]'
                      : 'bg-white text-[#44403C] border-[#E7E3D9] hover:bg-[#F4F1EA]'
                  }`}
                >
                  +{preset}
                </button>
              ))}
            </div>
            <input
              type="number"
              min="1"
              value={addQty}
              onChange={(e) => setAddQty(Number(e.target.value))}
              className="mt-2.5 w-full text-xs px-3 py-2 bg-white border border-[#E7E3D9] rounded-md focus:border-[#B08D57] outline-none text-[#1C1917]"
              placeholder="Or enter custom units"
              required
            />
          </div>

          <div className="bg-[#EBF3EC] p-3 rounded-md border border-[#C2D9C6] text-[11px] text-[#2E5A36] flex justify-between">
            <span>Projected Inventory:</span>
            <strong className="font-semibold">{newStock} units</strong>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-[#E7E3D9]">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              loading={loading}
            >
              Confirm Restock
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
