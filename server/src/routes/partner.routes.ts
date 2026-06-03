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
} from "../controllers/partner.controller";
import { hotelUpload } from "../middleware/upload";
import { HttpError } from "../middleware/error";

const router = Router();

router.use(authMiddleware, roleMiddleware("partner"));

router.get("/resources", listResources);
router.get("/bookings", listBookings);
router.post("/resources", createResource);
router.put("/resources/:id", updateResource);
router.delete("/resources/:id", deleteResource);

// Multipart hotel listing. Room image field names are dynamic (`roomImages-<id>`)
// so we accept any field, converting multer/upload errors into a clean 400.
function hotelImages(req: Request, res: Response, next: NextFunction): void {
  hotelUpload.any()(req, res, (err: unknown) => {
    if (err) {
      next(new HttpError(400, err instanceof Error ? err.message : "Upload failed"));
      return;
    }
    next();
  });
}

router.post("/hotels", hotelImages, createHotelListing);

export default router;
