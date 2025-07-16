import { Model, DataTypes, Optional, Op } from "sequelize";
import sequelize from "../config/database";
import User from "./user.models";
import crypto from "crypto";

// Define OTP purpose
export type TOTPPurpose =
  | "password_reset"
  | "email_verification"
  | "2fa"
  | "phone_verification";

// OTP attributes interface
interface OTPAttributes {
  id: string;
  userId: string;
  code: string;
  purpose: TOTPPurpose;
  expiresAt: Date;
  used: boolean;
  metadata: Record<string, any> | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

// Attributes for OTP creation
interface OTPCreationAttributes
  extends Optional<
    OTPAttributes,
    | "id"
    | "code"
    | "used"
    | "metadata"
    | "createdAt"
    | "updatedAt"
    | "deletedAt"
  > {}

export class OTP
  extends Model<OTPAttributes, OTPCreationAttributes>
  implements OTPAttributes
{
  public id!: string;
  public userId!: string;
  public code!: string;
  public purpose!: TOTPPurpose;
  public expiresAt!: Date;
  public used!: boolean;
  public metadata!: Record<string, any> | null;
  public createdAt!: Date;
  public updatedAt!: Date;
  public deletedAt!: Date | null;

  // Define associations
  public readonly user?: User;

  /**
   * Check if OTP is expired
   * @returns Boolean indicating if OTP has expired
   */
  public isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  /**
   * Check if OTP is valid (not expired and not used)
   * @returns Boolean indicating if OTP is valid
   */
  public isValid(): boolean {
    return !this.isExpired() && !this.used;
  }

  /**
   * Mark OTP as used
   * @returns The updated OTP
   */
  public async markAsUsed(): Promise<OTP> {
    this.used = true;
    return this.save();
  }

  /**
   * Static method to generate a random numeric OTP
   * @param length The length of the OTP (default: 6)
   * @returns A random numeric string
   */
  public static generateNumericCode(length: number = 6): string {
    // Generate random digits using crypto for better security
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;

    // Generate a random number between min and max
    const randomBytes = crypto.randomBytes(4);
    const randomNumber = (randomBytes.readUInt32BE(0) % (max - min + 1)) + min;

    return randomNumber.toString().padStart(length, "0");
  }

  /**
   * Static method to generate an alphanumeric code
   * @param length The length of the code (default: 8)
   * @returns A random alphanumeric string
   */
  private static generateAlphanumericCode(length: number = 8): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    const randomBytes = crypto.randomBytes(length);

    for (let i = 0; i < length; i++) {
      const randomIndex = randomBytes[i] % chars.length;
      result += chars.charAt(randomIndex);
    }

    return result;
  }

  /**
   * Static method to create a new OTP
   * @param userId The user ID
   * @param purpose The purpose of the OTP
   * @param options Optional OTP creation options
   * @returns The created OTP
   */
  static async createOTP(
    userId: string,
    purpose: TOTPPurpose,
    options?: {
      expiresInMinutes?: number;
      metadata?: Record<string, any>;
      alphanumeric?: boolean;
      length?: number;
    },
  ): Promise<OTP> {
    // Set expiration time
    const expiresInMinutes = options?.expiresInMinutes || 15;
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + expiresInMinutes);

    // Generate code based on options
    const codeLength = options?.length || (purpose === "2fa" ? 6 : 8);
    const code = options?.alphanumeric
      ? this.generateAlphanumericCode(codeLength)
      : this.generateNumericCode(codeLength);

    // Invalidate any existing OTPs for this user and purpose
    await this.update(
      { used: true },
      {
        where: {
          userId,
          purpose,
          used: false,
          expiresAt: { [Op.gt]: new Date() },
        },
      },
    );

    // Create new OTP
    return this.create({
      userId,
      code,
      purpose,
      expiresAt,
      used: false,
      metadata: options?.metadata || null,
    });
  }

  /**
   * Static method to verify an OTP
   * @param userId The user ID
   * @param code The OTP code
   * @param purpose The purpose of the OTP
   * @returns The OTP if valid, null otherwise
   */
  static async verifyOTP(
    userId: string,
    code: string,
    purpose: TOTPPurpose,
  ): Promise<OTP | null> {
    const otp = await this.findOne({
      where: {
        userId,
        code,
        purpose,
        used: false,
        expiresAt: { [Op.gt]: new Date() },
      },
    });

    return otp;
  }

  /**
   * Static method to verify and consume an OTP
   * @param userId The user ID
   * @param code The OTP code
   * @param purpose The purpose of the OTP
   * @returns The OTP if valid and marked as used, null otherwise
   */
  static async verifyAndConsumeOTP(
    userId: string,
    code: string,
    purpose: TOTPPurpose,
  ): Promise<OTP | null> {
    const otp = await this.verifyOTP(userId, code, purpose);

    if (otp) {
      await otp.markAsUsed();
      return otp;
    }

    return null;
  }

  /**
   * Static method to get all valid OTPs for a user
   * @param userId The user ID
   * @param purpose Optional specific purpose
   * @returns Array of valid OTPs
   */
  static async getValidOTPs(
    userId: string,
    purpose?: TOTPPurpose,
  ): Promise<OTP[]> {
    const where: any = {
      userId,
      used: false,
      expiresAt: { [Op.gt]: new Date() },
    };

    if (purpose) {
      where.purpose = purpose;
    }

    return this.findAll({
      where,
      order: [["createdAt", "DESC"]],
    });
  }

  /**
   * Static method to clean up expired OTPs
   * @returns Number of deleted records
   */
  static async cleanupExpiredOTPs(): Promise<number> {
    const result = await this.update(
      { used: true },
      {
        where: {
          used: false,
          expiresAt: { [Op.lt]: new Date() },
        },
      },
    );

    // The update method returns [affectedCount: number]
    return Array.isArray(result) ? result[0] : 0;
  }
}

OTP.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    userId: {
      type: DataTypes.STRING(50),
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    code: {
      type: DataTypes.STRING(20),
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    purpose: {
      type: DataTypes.ENUM(
        "password_reset",
        "email_verification",
        "2fa",
        "phone_verification",
      ),
      allowNull: false,
    },
    expiresAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    used: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    deletedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: "otps",
    timestamps: true,
    paranoid: true,
    underscored: true, // This will convert camelCase to snake_case in DB
    indexes: [
      {
        name: "otps_user_id_idx",
        fields: ["user_id"],
      },
      {
        name: "otps_purpose_idx",
        fields: ["purpose"],
      },
      {
        name: "otps_used_idx",
        fields: ["used"],
      },
      {
        name: "otps_expires_at_idx",
        fields: ["expires_at"],
      },
      {
        name: "otps_code_idx",
        fields: ["code"],
      },
      {
        name: "otps_verification_idx",
        fields: ["user_id", "purpose", "used", "expires_at"],
      },
    ],
  },
);

// Define associations
OTP.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

User.hasMany(OTP, {
  foreignKey: "userId",
  as: "otps",
});

export default OTP;
