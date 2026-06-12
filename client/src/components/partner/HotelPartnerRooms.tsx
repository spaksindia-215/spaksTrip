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

interface Props {
  rooms: RoomType[];
  onRoomsChange: (rooms: RoomType[]) => void;
}

const ROOM_AMENITIES = [
  "AC",
  "TV",
  "WiFi",
  "Balcony",
  "Mini Bar",
  "Bathtub",
  "Safe Locker",
  "Coffee Maker",
  "Others",
];

const EXAMPLE_ROOM_TYPES = [
  "Deluxe Room",
  "Luxury Room",
  "Suite",
  "Family Room",
  "Executive Room",
];

export default function HotelPartnerRooms({ rooms, onRoomsChange }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<RoomType>>({});

  const startEdit = (room?: RoomType) => {
    if (room) {
      setEditingId(room.id);
      setFormData(room);
    } else {
      const newId = `room-${Date.now()}`;
      setEditingId(newId);
      setFormData({
        id: newId,
        name: "",
        description: "",
        maxAdults: 1,
        maxChildren: 0,
        bedType: "",
        roomSize: "",
        roomImages: [],
        amenities: [],
      });
    }
  };

  const saveRoom = () => {
    if (!formData.name || !formData.bedType || !formData.roomSize) {
      alert("Please fill all required fields");
      return;
    }

    const updatedRooms = editingId && rooms.find((r) => r.id === editingId)
      ? rooms.map((r) => (r.id === editingId ? (formData as RoomType) : r))
      : [...rooms, formData as RoomType];

    onRoomsChange(updatedRooms);
    setEditingId(null);
    setFormData({});
  };

  const deleteRoom = (id: string) => {
    onRoomsChange(rooms.filter((r) => r.id !== id));
  };

  const toggleAmenity = (amenity: string) => {
    const amenities = formData.amenities || [];
    const updated = amenities.includes(amenity)
      ? amenities.filter((a) => a !== amenity)
      : [...amenities, amenity];
    setFormData({ ...formData, amenities: updated });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setFormData({ ...formData, roomImages: files });
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-brand-950">Room Types</h2>
        <p className="mt-2 text-ink-muted">
          Add different room categories available at your hotel
        </p>
      </div>

      {editingId ? (
        <div className="space-y-6 border rounded-lg p-6 bg-surface-muted">
          <h3 className="text-lg font-semibold text-brand-950">
            {rooms.find((r) => r.id === editingId) ? "Edit Room" : "Add New Room"}
          </h3>

          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-brand-950 mb-2">
                Room Name *
              </label>
              <select
                value={formData.name || ""}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600"
              >
                <option value="">Select room type</option>
                {EXAMPLE_ROOM_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
                <option value="Custom">Custom</option>
              </select>
              {formData.name === "Custom" && (
                <input
                  type="text"
                  placeholder="Enter custom room name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="mt-2 w-full px-4 py-2 border border-border rounded-lg"
                />
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-950 mb-2">
                Bed Type *
              </label>
              <input
                type="text"
                value={formData.bedType || ""}
                onChange={(e) => setFormData({ ...formData, bedType: e.target.value })}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600"
                placeholder="e.g., Single, Double, Twin"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-950 mb-2">
                Room Size *
              </label>
              <input
                type="text"
                value={formData.roomSize || ""}
                onChange={(e) => setFormData({ ...formData, roomSize: e.target.value })}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600"
                placeholder="e.g., 300 sq ft"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-950 mb-2">
                Max Adults *
              </label>
              <input
                type="number"
                min="1"
                value={formData.maxAdults || ""}
                onChange={(e) => setFormData({ ...formData, maxAdults: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-950 mb-2">
                Max Children
              </label>
              <input
                type="number"
                min="0"
                value={formData.maxChildren || ""}
                onChange={(e) => setFormData({ ...formData, maxChildren: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-950 mb-2">
              Room Description
            </label>
            <textarea
              value={formData.description || ""}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600"
              placeholder="Describe this room type..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-brand-950 mb-2">
              Room Images
            </label>
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageChange}
              className="block w-full px-4 py-2 border border-border rounded-lg"
            />
            {formData.roomImages && formData.roomImages.length > 0 && (
              <p className="mt-2 text-sm text-success-600">
                ✓ {formData.roomImages.length} image(s) selected
              </p>
            )}
          </div>

          <div>
            <h4 className="text-sm font-medium text-brand-950 mb-3">Room Amenities</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {ROOM_AMENITIES.map((amenity) => (
                <label key={amenity} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.amenities?.includes(amenity) || false}
                    onChange={() => toggleAmenity(amenity)}
                    className="rounded"
                  />
                  <span className="text-sm text-brand-950">{amenity}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={saveRoom}
              className="flex-1 px-4 py-2 rounded-lg bg-brand-600 text-white font-medium hover:bg-brand-700"
            >
              Save Room
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
          + Add Room Type
        </button>
      )}

      {rooms.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-brand-950">Added Rooms</h3>
          {rooms.map((room) => (
            <div
              key={room.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-surface-muted"
            >
              <div>
                <h4 className="font-medium text-brand-950">{room.name}</h4>
                <p className="text-sm text-ink-muted">
                  {room.bedType} • {room.roomSize} • {room.maxAdults} adults
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => startEdit(room)}
                  className="px-3 py-1 text-sm rounded-lg border border-brand-600 text-brand-600 hover:bg-brand-50"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteRoom(room.id)}
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
          <strong>Note:</strong> You can add multiple room types. Each room type can have different pricing and availability.
        </p>
      </div>
    </div>
  );
}
