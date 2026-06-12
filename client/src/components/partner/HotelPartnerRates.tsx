"use client";

import { useState } from "react";

type RoomType = {
  id: string;
  name: string;
  description: string;
  maxAdults: number;
  maxChildren: number;
  bedType: string;
  roomSize: string;
  roomImages: File[];
  amenities: string[];
};

type RatePlan = {
  id: string;
  roomTypeId: string;
  name: string;
  mealType: string;
  refundable: boolean;
  inclusions: string[];
};

interface Props {
  rooms: RoomType[];
  rates: RatePlan[];
  onRatesChange: (rates: RatePlan[]) => void;
}

const MEAL_TYPES = [
  "Room Only",
  "Breakfast Included",
  "Half Board",
  "Full Board",
];

const INCLUSIONS_OPTIONS = [
  "Breakfast",
  "Free WiFi",
  "Free Parking",
  "Welcome Drink",
  "Gym Access",
  "Pool Access",
  "Spa Access",
  "Airport Transfer",
];

export default function HotelPartnerRates({ rooms, rates, onRatesChange }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<RatePlan>>({});

  const startEdit = (rate?: RatePlan) => {
    if (rate) {
      setEditingId(rate.id);
      setFormData(rate);
    } else {
      const newId = `rate-${Date.now()}`;
      setEditingId(newId);
      setFormData({
        id: newId,
        roomTypeId: rooms.length > 0 ? rooms[0].id : "",
        name: "",
        mealType: "Room Only",
        refundable: true,
        inclusions: [],
      });
    }
  };

  const saveRate = () => {
    if (!formData.roomTypeId || !formData.name || !formData.mealType) {
      alert("Please fill all required fields");
      return;
    }

    const updatedRates = editingId && rates.find((r) => r.id === editingId)
      ? rates.map((r) => (r.id === editingId ? (formData as RatePlan) : r))
      : [...rates, formData as RatePlan];

    onRatesChange(updatedRates);
    setEditingId(null);
    setFormData({});
  };

  const deleteRate = (id: string) => {
    onRatesChange(rates.filter((r) => r.id !== id));
  };

  const toggleInclusion = (inclusion: string) => {
    const inclusions = formData.inclusions || [];
    const updated = inclusions.includes(inclusion)
      ? inclusions.filter((i) => i !== inclusion)
      : [...inclusions, inclusion];
    setFormData({ ...formData, inclusions: updated });
  };

  const getRoomName = (roomTypeId: string) => {
    return rooms.find((r) => r.id === roomTypeId)?.name || "Unknown";
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-brand-950">Rate Plans</h2>
        <p className="mt-2 text-ink-muted">
          Create pricing plans for each room type
        </p>
      </div>

      {rooms.length === 0 ? (
        <div className="p-6 bg-yellow-50 rounded-lg border border-yellow-200">
          <p className="text-yellow-900">
            Please add at least one room type before creating rate plans.
          </p>
        </div>
      ) : editingId ? (
        <div className="space-y-6 border rounded-lg p-6 bg-surface-muted">
          <h3 className="text-lg font-semibold text-brand-950">
            {rates.find((r) => r.id === editingId) ? "Edit Rate Plan" : "Add New Rate Plan"}
          </h3>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-brand-950 mb-2">
                Room Type *
              </label>
              <select
                value={formData.roomTypeId || ""}
                onChange={(e) => setFormData({ ...formData, roomTypeId: e.target.value })}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600"
              >
                <option value="">Select room type</option>
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-950 mb-2">
                Rate Plan Name *
              </label>
              <input
                type="text"
                value={formData.name || ""}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600"
                placeholder="e.g., Standard Rate"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-950 mb-2">
                Meal Type *
              </label>
              <select
                value={formData.mealType || ""}
                onChange={(e) => setFormData({ ...formData, mealType: e.target.value })}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600"
              >
                <option value="">Select meal type</option>
                {MEAL_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-950 mb-2">
                Refund Policy *
              </label>
              <select
                value={formData.refundable ? "yes" : "no"}
                onChange={(e) => setFormData({ ...formData, refundable: e.target.value === "yes" })}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600"
              >
                <option value="yes">Refundable</option>
                <option value="no">Non-Refundable</option>
              </select>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-brand-950 mb-3">Inclusions</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {INCLUSIONS_OPTIONS.map((inclusion) => (
                <label key={inclusion} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.inclusions?.includes(inclusion) || false}
                    onChange={() => toggleInclusion(inclusion)}
                    className="rounded"
                  />
                  <span className="text-sm text-brand-950">{inclusion}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={saveRate}
              className="flex-1 px-4 py-2 rounded-lg bg-brand-600 text-white font-medium hover:bg-brand-700"
            >
              Save Rate Plan
            </button>
            <button
              onClick={() => {
                setEditingId(null);
                setFormData({});
              }}
              className="flex-1 px-4 py-2 rounded-lg border border-border text-ink-soft font-medium hover:bg-surface-muted"
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
          + Add Rate Plan
        </button>
      )}

      {rates.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-brand-950">Added Rate Plans</h3>
          {rates.map((rate) => (
            <div
              key={rate.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-surface-muted"
            >
              <div>
                <h4 className="font-medium text-brand-950">{rate.name}</h4>
                <p className="text-sm text-ink-muted">
                  {getRoomName(rate.roomTypeId)} • {rate.mealType} • {rate.refundable ? "Refundable" : "Non-Refundable"}
                </p>
                {rate.inclusions.length > 0 && (
                  <p className="text-xs text-ink-muted mt-1">
                    Includes: {rate.inclusions.join(", ")}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => startEdit(rate)}
                  className="px-3 py-1 text-sm rounded-lg border border-brand-600 text-brand-600 hover:bg-brand-50"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteRate(rate.id)}
                  className="px-3 py-1 text-sm rounded-lg border border-danger-500 text-danger-500 hover:bg-danger-50"
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
          <strong>Note:</strong> Each room type can have multiple rate plans with different meal options and refund policies.
        </p>
      </div>
    </div>
  );
}
