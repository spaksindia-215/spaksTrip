"use client";

import { useState } from "react";

type PromotionData = {
  id: string;
  name: string;
  discountType: string;
  discountValue: number;
  startDate: string;
  endDate: string;
};

interface Props {
  promotions: PromotionData[];
  onPromotionsChange: (promotions: PromotionData[]) => void;
}

const DISCOUNT_TYPES = ["Percentage", "Fixed Amount"];

export default function HotelPartnerPromotions({
  promotions,
  onPromotionsChange,
}: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<PromotionData>>({});

  const startEdit = (promotion?: PromotionData) => {
    if (promotion) {
      setEditingId(promotion.id);
      setFormData(promotion);
    } else {
      const newId = `promo-${Date.now()}`;
      setEditingId(newId);
      setFormData({
        id: newId,
        name: "",
        discountType: "Percentage",
        discountValue: 0,
        startDate: "",
        endDate: "",
      });
    }
  };

  const savePromotion = () => {
    if (
      !formData.name ||
      !formData.discountType ||
      formData.discountValue === undefined ||
      !formData.startDate ||
      !formData.endDate
    ) {
      alert("Please fill all required fields");
      return;
    }

    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      alert("End date must be after start date");
      return;
    }

    const updatedPromotions = editingId &&
      promotions.find((p) => p.id === editingId)
      ? promotions.map((p) =>
          p.id === editingId ? (formData as PromotionData) : p
        )
      : [...promotions, formData as PromotionData];

    onPromotionsChange(updatedPromotions);
    setEditingId(null);
    setFormData({});
  };

  const deletePromotion = (id: string) => {
    onPromotionsChange(promotions.filter((p) => p.id !== id));
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-brand-950">Promotions</h2>
        <p className="mt-2 text-ink-muted">
          Create special offers and discounts (Optional)
        </p>
      </div>

      {editingId ? (
        <div className="space-y-6 border rounded-lg p-6 bg-gray-50">
          <h3 className="text-lg font-semibold text-brand-950">
            {promotions.find((p) => p.id === editingId) ? "Edit Promotion" : "Add New Promotion"}
          </h3>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-brand-950 mb-2">
                Promotion Name *
              </label>
              <input
                type="text"
                value={formData.name || ""}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600"
                placeholder="e.g., Summer Special, Early Bird Offer"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-950 mb-2">
                Discount Type *
              </label>
              <select
                value={formData.discountType || ""}
                onChange={(e) =>
                  setFormData({ ...formData, discountType: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600"
              >
                <option value="">Select discount type</option>
                {DISCOUNT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-950 mb-2">
                Discount Value *
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.discountValue || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      discountValue: parseFloat(e.target.value) || 0,
                    })
                  }
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600"
                  placeholder="Amount"
                />
                <div className="px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 flex items-center text-gray-600 font-medium">
                  {formData.discountType === "Percentage" ? "%" : "₹"}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-950 mb-2">
                Start Date *
              </label>
              <input
                type="date"
                value={formData.startDate || ""}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-950 mb-2">
                End Date *
              </label>
              <input
                type="date"
                value={formData.endDate || ""}
                onChange={(e) =>
                  setFormData({ ...formData, endDate: e.target.value })
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={savePromotion}
              className="flex-1 px-4 py-2 rounded-lg bg-brand-600 text-white font-medium hover:bg-brand-700"
            >
              Save Promotion
            </button>
            <button
              onClick={() => {
                setEditingId(null);
                setFormData({});
              }}
              className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => startEdit()}
          className="w-full px-4 py-3 border-2 border-dashed border-brand-600 rounded-lg text-brand-600 font-medium hover:bg-brand-50 transition"
        >
          + Add Promotion
        </button>
      )}

      {promotions.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-brand-950">Active Promotions</h3>
          {promotions.map((promo) => (
            <div
              key={promo.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
            >
              <div>
                <h4 className="font-medium text-brand-950">{promo.name}</h4>
                <p className="text-sm text-ink-muted">
                  {promo.discountType === "Percentage"
                    ? `${promo.discountValue}% off`
                    : `₹${promo.discountValue} off`}{" "}
                  • {new Date(promo.startDate).toLocaleDateString()} to{" "}
                  {new Date(promo.endDate).toLocaleDateString()}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => startEdit(promo)}
                  className="px-3 py-1 text-sm rounded-lg border border-brand-600 text-brand-600 hover:bg-brand-50"
                >
                  Edit
                </button>
                <button
                  onClick={() => deletePromotion(promo.id)}
                  className="px-3 py-1 text-sm rounded-lg border border-red-500 text-red-500 hover:bg-red-50"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="pt-4 bg-blue-50 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          <strong>Note:</strong> Promotions are optional and can be added anytime. They will help attract more guests to your hotel.
        </p>
      </div>
    </div>
  );
}
