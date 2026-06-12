"use client";

type HotelData = {
  hotelName: string;
  description: string;
  hotelType: string;
  starRating: number;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  contactNumber: string;
  email: string;
  checkInTime: string;
  checkOutTime: string;
  hotelImages: File[];
  amenities: string[];
  policies: {
    cancellation: string;
    child: string;
    pet: string;
    smoking: string;
  };
};

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

type InventoryData = {
  roomTypeId: string;
  totalRooms: number;
  availableRooms: number;
};

type PricingData = {
  basePricePerNight: number;
  taxPercentage: number;
  extraAdultCharge?: number;
  extraChildCharge?: number;
  currency: string;
};

type PromotionData = {
  id: string;
  name: string;
  discountType: string;
  discountValue: number;
  startDate: string;
  endDate: string;
};

interface Props {
  hotelData: HotelData;
  rooms: RoomType[];
  rates: RatePlan[];
  inventory: InventoryData[];
  pricing: PricingData;
  promotions: PromotionData[];
}

export default function HotelPartnerReview({
  hotelData,
  rooms,
  rates,
  inventory,
  pricing,
  promotions,
}: Props) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-brand-950">Review Your Registration</h2>
        <p className="mt-2 text-ink-muted">
          Please review all information before final submission
        </p>
      </div>

      {/* Hotel Information */}
      <div className="border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-brand-950 mb-4">Hotel Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <p className="text-sm text-ink-muted">Hotel Name</p>
            <p className="font-medium text-brand-950">{hotelData.hotelName}</p>
          </div>
          <div>
            <p className="text-sm text-ink-muted">Hotel Type</p>
            <p className="font-medium text-brand-950">{hotelData.hotelType}</p>
          </div>
          <div>
            <p className="text-sm text-ink-muted">Star Rating</p>
            <p className="font-medium text-brand-950">⭐ {hotelData.starRating}</p>
          </div>
          <div className="col-span-2">
            <p className="text-sm text-ink-muted">Address</p>
            <p className="font-medium text-brand-950">
              {hotelData.address}, {hotelData.city}, {hotelData.state} {hotelData.postalCode}, {hotelData.country}
            </p>
          </div>
          <div>
            <p className="text-sm text-ink-muted">Contact Number</p>
            <p className="font-medium text-brand-950">{hotelData.contactNumber}</p>
          </div>
          <div>
            <p className="text-sm text-ink-muted">Email</p>
            <p className="font-medium text-brand-950">{hotelData.email}</p>
          </div>
          <div>
            <p className="text-sm text-ink-muted">Check-In Time</p>
            <p className="font-medium text-brand-950">{hotelData.checkInTime}</p>
          </div>
          <div>
            <p className="text-sm text-ink-muted">Check-Out Time</p>
            <p className="font-medium text-brand-950">{hotelData.checkOutTime}</p>
          </div>
        </div>
        {hotelData.amenities && hotelData.amenities.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-ink-muted mb-2">Amenities</p>
            <div className="flex flex-wrap gap-2">
              {hotelData.amenities.map((amenity) => (
                <span
                  key={amenity}
                  className="px-3 py-1 bg-brand-100 text-brand-700 rounded-full text-sm font-medium"
                >
                  {amenity}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Room Types */}
      {rooms.length > 0 && (
        <div className="border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-brand-950 mb-4">
            Room Types ({rooms.length})
          </h3>
          <div className="space-y-3">
            {rooms.map((room) => (
              <div key={room.id} className="p-3 bg-surface-muted rounded-lg">
                <p className="font-medium text-brand-950">{room.name}</p>
                <p className="text-sm text-ink-muted">
                  {room.bedType} • {room.roomSize} • {room.maxAdults} adults
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rate Plans */}
      {rates.length > 0 && (
        <div className="border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-brand-950 mb-4">
            Rate Plans ({rates.length})
          </h3>
          <div className="space-y-3">
            {rates.map((rate) => (
              <div key={rate.id} className="p-3 bg-surface-muted rounded-lg">
                <p className="font-medium text-brand-950">{rate.name}</p>
                <p className="text-sm text-ink-muted">
                  {rate.mealType} • {rate.refundable ? "Refundable" : "Non-Refundable"}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pricing */}
      <div className="border rounded-lg p-6">
        <h3 className="text-lg font-semibold text-brand-950 mb-4">Pricing</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-ink-muted">Base Price Per Night</p>
            <p className="font-medium text-brand-950">
              ₹{(pricing.basePricePerNight || 0).toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-sm text-ink-muted">Tax</p>
            <p className="font-medium text-brand-950">{pricing.taxPercentage || 0}%</p>
          </div>
          {pricing.extraAdultCharge && (
            <div>
              <p className="text-sm text-ink-muted">Extra Adult Charge</p>
              <p className="font-medium text-brand-950">
                ₹{(pricing.extraAdultCharge || 0).toFixed(2)}
              </p>
            </div>
          )}
          {pricing.extraChildCharge && (
            <div>
              <p className="text-sm text-ink-muted">Extra Child Charge</p>
              <p className="font-medium text-brand-950">
                ₹{(pricing.extraChildCharge || 0).toFixed(2)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Promotions */}
      {promotions.length > 0 && (
        <div className="border rounded-lg p-6">
          <h3 className="text-lg font-semibold text-brand-950 mb-4">
            Promotions ({promotions.length})
          </h3>
          <div className="space-y-3">
            {promotions.map((promo) => (
              <div key={promo.id} className="p-3 bg-surface-muted rounded-lg">
                <p className="font-medium text-brand-950">{promo.name}</p>
                <p className="text-sm text-ink-muted">
                  {promo.discountValue}
                  {promo.discountType === "Percentage" ? "%" : "₹"} off •{" "}
                  {new Date(promo.startDate).toLocaleDateString()} to{" "}
                  {new Date(promo.endDate).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="pt-6 border-t bg-yellow-50 rounded-lg p-4">
        <p className="text-sm text-yellow-900">
          <strong>Important:</strong> Your hotel will be submitted for verification and will be set to "Pending Approval" status. You will be notified once our team reviews your submission.
        </p>
      </div>
    </div>
  );
}
