import { Router, type Request, type Response, type NextFunction } from "express";
import { authMiddleware } from "../middleware/auth";
import { roleMiddleware } from "../middleware/role";
import {
  listResources,
  createResource,
  updateResource,
  deleteResource,
  listBookings,
  createHotelListing,
  createTaxiListing,
  listTaxiListings,
  updateTaxiListing,
  deleteTaxiListing,
} from "../controllers/partner.controller";
import { mediaUpload } from "../middleware/upload";
import { HttpError } from "../middleware/error";

const router = Router();

router.use(authMiddleware, roleMiddleware("partner"));

router.get("/resources", listResources);
router.get("/bookings", listBookings);
router.post("/resources", createResource);
router.put("/resources/:id", updateResource);
router.delete("/resources/:id", deleteResource);

// Multipart parsing with dynamic field names (hotel `roomImages-<id>`, taxi
// `vehiclePhotos`/doc fields), converting multer/upload errors into a clean 400.
function uploadAny(req: Request, res: Response, next: NextFunction): void {
  mediaUpload.any()(req, res, (err: unknown) => {
    if (err) {
      next(new HttpError(400, err instanceof Error ? err.message : "Upload failed"));
      return;
    }
    next();
  });
}

router.post("/hotels", uploadAny, createHotelListing);

// Taxi listings (DB-backed; images/docs to Cloudinary).
router.get("/taxis", listTaxiListings);
router.post("/taxis", uploadAny, createTaxiListing);
router.patch("/taxis/:id", updateTaxiListing);
router.delete("/taxis/:id", deleteTaxiListing);

export default router;
