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

type InventoryData = {
  roomTypeId: string;
  totalRooms: number;
  availableRooms: number;
};

interface Props {
  rooms: RoomType[];
  inventory: InventoryData[];
  onInventoryChange: (inventory: InventoryData[]) => void;
}

export default function HotelPartnerInventory({
  rooms,
  inventory,
  onInventoryChange,
}: Props) {
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<InventoryData>>({});

  const startEdit = (roomTypeId: string) => {
    const existingInventory = inventory.find((i) => i.roomTypeId === roomTypeId);
    if (existingInventory) {
      setEditingRoomId(roomTypeId);
      setFormData(existingInventory);
    } else {
      setEditingRoomId(roomTypeId);
      setFormData({
        roomTypeId,
        totalRooms: 0,
        availableRooms: 0,
      });
    }
  };

  const saveInventory = () => {
    if (
      !formData.roomTypeId ||
      formData.totalRooms === undefined ||
      formData.availableRooms === undefined
    ) {
      alert("Please fill all required fields");
      return;
    }

    if (formData.availableRooms > formData.totalRooms) {
      alert("Available rooms cannot exceed total rooms");
      return;
    }

    const updatedInventory = inventory.find(
      (i) => i.roomTypeId === editingRoomId
    )
      ? inventory.map((i) =>
          i.roomTypeId === editingRoomId ? (formData as InventoryData) : i
        )
      : [...inventory, formData as InventoryData];

    onInventoryChange(updatedInventory);
    setEditingRoomId(null);
    setFormData({});
  };

  const removeInventory = (roomTypeId: string) => {
    onInventoryChange(inventory.filter((i) => i.roomTypeId !== roomTypeId));
  };

  const getRoomName = (roomTypeId: string) => {
    return rooms.find((r) => r.id === roomTypeId)?.name || "Unknown";
  };

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-brand-950">Inventory Management</h2>
        <p className="mt-2 text-ink-muted">
          Set the number of rooms available for each room type
        </p>
      </div>

      {rooms.length === 0 ? (
        <div className="p-6 bg-yellow-50 rounded-lg border border-yellow-200">
          <p className="text-yellow-900">
            Please add at least one room type before setting inventory.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {rooms.map((room) => {
              const roomInventory = inventory.find((i) => i.roomTypeId === room.id);
              const isEditing = editingRoomId === room.id;

              return (
                <div
                  key={room.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h4 className="font-medium text-brand-950">{room.name}</h4>
                      <p className="text-sm text-ink-muted">{room.bedType} • {room.roomSize}</p>
                    </div>
                    {!isEditing && (
                      <button
                        onClick={() => startEdit(room.id)}
                        className="px-3 py-1 text-sm rounded-lg border border-brand-600 text-brand-600 hover:bg-brand-50"
                      >
                        {roomInventory ? "Edit" : "Add Inventory"}
                      </button>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="grid gap-4 md:grid-cols-2 pt-4 border-t">
                      <div>
                        <label className="block text-sm font-medium text-brand-950 mb-2">
                          Total Rooms *
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={formData.totalRooms || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              totalRooms: parseInt(e.target.value) || 0,
                            })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600"
                          placeholder="Total number of rooms"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-brand-950 mb-2">
                          Available Rooms *
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={formData.availableRooms || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              availableRooms: parseInt(e.target.value) || 0,
                            })
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-600"
                          placeholder="Currently available rooms"
                        />
                      </div>
                    </div>
                  ) : roomInventory ? (
                    <div className="grid gap-4 md:grid-cols-2 pt-4 border-t">
                      <div>
                        <p className="text-sm text-ink-muted">Total Rooms</p>
                        <p className="text-lg font-semibold text-brand-950">
                          {roomInventory.totalRooms}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-ink-muted">Available Rooms</p>
                        <p className="text-lg font-semibold text-brand-950">
                          {roomInventory.availableRooms}
                        </p>
                      </div>
                    </div>
                  ) : null}

                  {isEditing && (
                    <div className="flex gap-3 mt-4 pt-4 border-t">
                      <button
                        onClick={saveInventory}
                        className="flex-1 px-4 py-2 rounded-lg bg-brand-600 text-white font-medium hover:bg-brand-700"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => {
                          setEditingRoomId(null);
                          setFormData({});
                        }}
                        className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      {roomInventory && (
                        <button
                          onClick={() => {
                            removeInventory(room.id);
                            setEditingRoomId(null);
                            setFormData({});
                          }}
                          className="flex-1 px-4 py-2 rounded-lg border border-red-500 text-red-500 font-medium hover:bg-red-50"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="pt-4 bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>Note:</strong> Inventory can be updated anytime. Available rooms should not exceed total rooms.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
