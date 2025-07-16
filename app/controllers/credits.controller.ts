import { Request, Response, NextFunction } from "express";
import * as creditsService from "../services/credits.service";
import { CreditTransactionType } from "../models/credits.history.model";
import { AppError } from "../utils/app.error";
import Stripe from "stripe";
import config from "../config";

const stripe = new Stripe(config.stripe.secretKey, {
  apiVersion: "2025-02-24.acacia", // Use the latest API version
});

/**
 * Get user's credit balance
 * @route GET /api/credits/balance
 */
export const getUserCredits = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.payload.id;

    const result = await creditsService.getUserCredits({ userId });

    res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get user's credit history with pagination
 * @route GET /api/credits/history
 */
export const getUserCreditHistory = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.payload.id;
    const { limit = 10, page = 1, type } = req.query;

    const limitNum = parseInt(limit as string, 10) || 10;
    const pageNum = parseInt(page as string, 10) || 1;
    const offset = (pageNum - 1) * limitNum;

    const result = await creditsService.getUserCreditHistory({
      userId,
      limit: limitNum,
      offset,
      type: (type as string) || null,
    });

    res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all credit products
 * @route GET /api/credits/products
 */
export const getCreditProducts = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const products = await creditsService.getCreditProducts();

    res.status(200).json({
      status: "success",
      data: { products },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get specific credit product
 * @route GET /api/credits/products/:productId
 */
export const getCreditProductById = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { productId } = req.params;

    const product = await creditsService.getCreditProductById(productId);

    res.status(200).json({
      status: "success",
      data: { product },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Calculate price for custom credit amount
 * @route POST /api/credits/calculate-price
 */
export const calculateCustomCreditPrice = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { creditAmount } = req.body;

    if (
      !creditAmount ||
      isNaN(parseInt(creditAmount, 10)) ||
      parseInt(creditAmount, 10) <= 0
    ) {
      return next(new AppError("Valid credit amount is required", 400));
    }

    const result = await creditsService.calculateCustomCreditPrice(
      parseInt(creditAmount, 10),
    );

    res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create embedded checkout for credit purchase
 * @route POST /api/credits/embedded-checkout
 */
export const createEmbeddedCreditPurchaseCheckout = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.payload.id;
    const { productId, customAmount } = req.body;

    // Validate that either productId or customAmount is provided
    if (!productId && !customAmount) {
      return next(
        new AppError("Either productId or customAmount must be provided", 400),
      );
    }

    // For custom amount, validate it's a positive number
    if (
      customAmount &&
      (isNaN(parseInt(customAmount, 10)) || parseInt(customAmount, 10) <= 0)
    ) {
      return next(new AppError("Custom amount must be a positive number", 400));
    }

    const result = await creditsService.createEmbeddedCreditPurchaseCheckout({
      userId,
      productId: productId || null,
      customAmount: customAmount ? parseInt(customAmount, 10) : null,
    });

    res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get session details
 * @route GET /api/credits/session/:sessionId
 */
export const getSessionDetails = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return next(new AppError("Session ID is required", 400));
    }

    const session = await creditsService.getSessionDetails(sessionId);

    res.status(200).json({
      status: "success",
      data: { session },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get credit pricing settings
 * @route GET /api/credits/pricing
 */
export const getCreditPricingSettings = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const pricingConfig = await creditsService.getCreditPricingSettings();

    res.status(200).json({
      status: "success",
      data: { pricingConfig },
    });
  } catch (error) {
    console.log(error, "error");
    next(error);
  }
};

/**
 * Calculate credit cost for song generation
 * @route POST /api/credits/calculate-song-cost
 */
export const calculateSongGenerationCost = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { quality, genre, ...otherOptions } = req.body;

    const result = await creditsService.calculateSongGenerationCost({
      quality,
      genre,
      ...otherOptions,
    });

    res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Check if user has enough credits for an action
 * @route POST /api/credits/check
 */
export const checkUserCredits = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const userId = req.payload.id;
    const { requiredAmount } = req.body;

    if (
      !requiredAmount ||
      isNaN(parseInt(requiredAmount, 10)) ||
      parseInt(requiredAmount, 10) <= 0
    ) {
      return next(new AppError("Valid required amount is required", 400));
    }

    const result = await creditsService.checkUserCredits(
      userId,
      parseInt(requiredAmount, 10),
    );

    res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin only: Update credit pricing settings
 * @route PUT /api/credits/admin/pricing
 */
export const updateCreditPricingSettings = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Check if user is admin
    if (req.payload.role !== "admin") {
      return next(new AppError("Unauthorized: Admin access required", 403));
    }

    const { basePrice, customTiers } = req.body;

    if (
      basePrice === undefined ||
      isNaN(parseFloat(basePrice)) ||
      parseFloat(basePrice) <= 0
    ) {
      return next(new AppError("Valid base price is required", 400));
    }

    if (!Array.isArray(customTiers)) {
      return next(new AppError("Custom tiers must be an array", 400));
    }

    // Validate custom tiers
    for (const tier of customTiers) {
      if (
        !tier.min ||
        isNaN(parseInt(tier.min, 10)) ||
        parseInt(tier.min, 10) <= 0
      ) {
        return next(new AppError("Each tier must have a valid min value", 400));
      }

      if (
        tier.max !== null &&
        (isNaN(parseInt(tier.max, 10)) || parseInt(tier.max, 10) <= tier.min)
      ) {
        return next(
          new AppError(
            "Each tier must have a valid max value greater than min",
            400,
          ),
        );
      }

      if (
        !tier.pricePerCredit ||
        isNaN(parseFloat(tier.pricePerCredit)) ||
        parseFloat(tier.pricePerCredit) <= 0
      ) {
        return next(
          new AppError("Each tier must have a valid price per credit", 400),
        );
      }
    }

    const updatedPricing = await creditsService.updateCreditPricingSettings({
      basePrice: parseFloat(basePrice),
      customTiers: customTiers.map((tier: any) => ({
        min: parseInt(tier.min, 10),
        max: tier.max === null ? null : parseInt(tier.max, 10),
        pricePerCredit: parseFloat(tier.pricePerCredit),
      })),
    });

    res.status(200).json({
      status: "success",
      data: { pricingConfig: updatedPricing },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin only: Create a credit product
 * @route POST /api/credits/admin/products
 */
export const createCreditProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Check if user is admin
    if (req.payload.role !== "admin") {
      return next(new AppError("Unauthorized: Admin access required", 403));
    }

    const {
      name,
      description,
      amount,
      price,
      strikethroughPrice,
      tag,
      isPopular,
      isActive,
      sortOrder,
    } = req.body;

    // Validate required fields
    if (!name || !amount || !price) {
      return next(new AppError("Name, amount, and price are required", 400));
    }

    // Convert price from dollars to cents if needed
    const priceInCents = price < 100 ? Math.round(price * 100) : price;

    const product = await creditsService.createCreditProduct({
      name,
      description,
      amount: parseInt(amount, 10),
      price: priceInCents,
      strikethroughPrice: strikethroughPrice
        ? strikethroughPrice < 100
          ? Math.round(strikethroughPrice * 100)
          : strikethroughPrice
        : null,
      tag,
      isPopular: !!isPopular,
      isActive: isActive !== false,
      sortOrder: sortOrder || 0,
    });

    res.status(201).json({
      status: "success",
      data: { product },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin only: Update a credit product
 * @route PUT /api/credits/admin/products/:productId
 */
export const updateCreditProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Check if user is admin
    if (req.payload.role !== "admin") {
      return next(new AppError("Unauthorized: Admin access required", 403));
    }

    const { productId } = req.params;

    // Convert price from dollars to cents if needed
    if (req.body.price && req.body.price < 100) {
      req.body.price = Math.round(req.body.price * 100);
    }

    // Convert strikethrough price from dollars to cents if needed
    if (req.body.strikethroughPrice && req.body.strikethroughPrice < 100) {
      req.body.strikethroughPrice = Math.round(
        req.body.strikethroughPrice * 100,
      );
    }

    const product = await creditsService.updateCreditProduct(
      productId,
      req.body,
    );

    res.status(200).json({
      status: "success",
      data: { product },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin only: Delete a credit product
 * @route DELETE /api/credits/admin/products/:productId
 */
export const deleteCreditProduct = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Check if user is admin
    if (req.payload.role !== "admin") {
      return next(new AppError("Unauthorized: Admin access required", 403));
    }

    const { productId } = req.params;

    await creditsService.deleteCreditProduct(productId);

    res.status(200).json({
      status: "success",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin only: Get credit statistics
 * @route GET /api/credits/admin/stats
 */
export const getCreditStatistics = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Check if user is admin
    // if (req.payload.role !== "admin") {
    //   return next(new AppError("Unauthorized: Admin access required", 403));
    // }

    const stats = await creditsService.getCreditStatistics();

    res.status(200).json({
      status: "success",
      data: { stats },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin only: Add credits to a user
 * @route POST /api/credits/admin/add
 */
export const adminAddCreditsToUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Check if user is admin
    if (req.payload.role !== "admin") {
      return next(new AppError("Unauthorized: Admin access required", 403));
    }

    const { userId, amount, reason } = req.body;
    const adminId = req.payload.id;

    if (
      !userId ||
      !amount ||
      isNaN(parseInt(amount, 10)) ||
      parseInt(amount, 10) <= 0
    ) {
      return next(
        new AppError("Valid user ID and positive amount are required", 400),
      );
    }

    const result = await creditsService.addCreditsToUser({
      userId,
      amount: parseInt(amount, 10),
      type: CreditTransactionType.ADMIN_ADJUSTMENT,
      description: reason || "Admin credit adjustment",
      metadata: {
        adminId,
        reason,
      },
    });

    res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Admin only: Deduct credits from a user
 * @route POST /api/credits/admin/deduct
 */
export const adminDeductCreditsFromUser = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    // Check if user is admin
    if (req.payload.role !== "admin") {
      return next(new AppError("Unauthorized: Admin access required", 403));
    }

    const { userId, amount, reason } = req.body;
    const adminId = req.payload.id;

    if (
      !userId ||
      !amount ||
      isNaN(parseInt(amount, 10)) ||
      parseInt(amount, 10) <= 0
    ) {
      return next(
        new AppError("Valid user ID and positive amount are required", 400),
      );
    }

    const result = await creditsService.deductCreditsFromUser({
      userId,
      amount: parseInt(amount, 10),
      type: CreditTransactionType.ADMIN_ADJUSTMENT,
      description: reason || "Admin credit adjustment",
      metadata: {
        adminId,
        reason,
      },
    });

    res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Handle Stripe webhook events for credit purchases
 * @route POST /api/webhooks/credits
 */
export const handleStripeWebhook = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const signature = req.headers["stripe-signature"] as string;

  if (!signature) {
    return next(new AppError("Stripe signature is missing", 400));
  }

  try {
    // Verify the signature
    const event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      config?.stripe?.webhookSecret,
    );

    let result;

    // Process different event types
    switch (event.type) {
      case "checkout.session.completed":
        const session = event.data.object;

        // Check if this is a credit purchase (by checking metadata)
        if (
          session.metadata &&
          (session.metadata.type === "product_credits" ||
            session.metadata.type === "custom_credits")
        ) {
          result = await creditsService.handleCreditPurchaseSuccess(session);
        } else {
          result = { message: `Not a credit purchase: ${event.type}` };
        }
        break;

      default:
        result = { message: `Unhandled event type: ${event.type}` };
    }

    res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (error) {
    // Important to respond with 200 to Stripe even for errors to prevent retries
    console.error("Webhook error:", error);
    res.status(200).json({
      status: "error",
      message:
        error instanceof Error ? error.message : "Webhook processing failed",
    });
  }
};

declare global {
  namespace Express {
    interface Request {
      payload: {
        id: string;
        email: string;
        role: string;
      };
    }
  }
}
