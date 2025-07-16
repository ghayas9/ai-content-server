import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../config/database";
import bcrypt from "bcryptjs";
import { Op } from "sequelize";

// Define user roles type
export type TUserRole = "user" | "admin";

// Define user status type
export type TUserStatus = "active" | "inactive" | "blocked";

// User attributes interface
interface UserAttributes {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  emailVerified: boolean;
  password: string;
  phone: string | null;
  profileImage: string | null;
  coverImage: string | null;
  status: TUserStatus;
  role: TUserRole;
  referralCode: string | null;
  referredBy: string | null;
  credits: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

// Attributes for user creation - ID is now optional since it's auto-generated
interface UserCreationAttributes
  extends Optional<
    UserAttributes,
    | "id"
    | "emailVerified"
    | "phone"
    | "profileImage"
    | "coverImage"
    | "status"
    | "role"
    | "referralCode"
    | "referredBy"
    | "credits"
    | "createdAt"
    | "updatedAt"
    | "deletedAt"
  > {}

export class User
  extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes
{
  public id!: string;
  public firstName!: string;
  public lastName!: string;
  public email!: string;
  public emailVerified!: boolean;
  public password!: string;
  public phone!: string | null;
  public profileImage!: string | null;
  public coverImage!: string | null;
  public status!: TUserStatus;
  public role!: TUserRole;
  public referralCode!: string | null;
  public referredBy!: string | null;
  public credits!: number;
  public createdAt!: Date;
  public updatedAt!: Date;
  public deletedAt!: Date | null;

  // Instance methods
  public async verifyPassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }

  public toJSON(): object {
    const values = { ...this.get() } as any;
    delete values.password;
    return values;
  }

  // Get full name
  public getFullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  // Add credits to user
  public async addCredits(amount: number): Promise<User> {
    this.credits += amount;
    return this.save();
  }

  // Deduct credits from user
  public async deductCredits(amount: number): Promise<User> {
    if (this.credits < amount) {
      throw new Error("Insufficient credits");
    }
    this.credits -= amount;
    return this.save();
  }

  // Check if user has sufficient credits
  public hasSufficientCredits(amount: number): boolean {
    return this.credits >= amount;
  }

  // Generate referral code
  public generateReferralCode(): string {
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${this.firstName.substring(0, 3).toUpperCase()}-${random}`;
  }

  // Static method to generate unique ID
  public static generateUserId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `USR-${timestamp}-${random}`.toUpperCase();
  }

  // Verify email
  public async verifyEmail(): Promise<User> {
    this.emailVerified = true;
    return this.save();
  }

  // Check if user is active
  public isActive(): boolean {
    return this.status === "active";
  }

  // Check if user is admin
  public isAdmin(): boolean {
    return this.role === "admin";
  }
}

User.init(
  {
    id: {
      type: DataTypes.STRING(50),
      primaryKey: true,
      allowNull: false,
      // Set default value to auto-generate ID
      defaultValue: () => User.generateUserId(),
    },
    firstName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        len: [1, 100],
        notEmpty: true,
      },
    },
    lastName: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        len: [1, 100],
        notEmpty: true,
      },
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    emailVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        len: [6, 255],
      },
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
      validate: {
        is: /^[+]?[\d\s\-\(\)]+$/,
      },
    },
    profileImage: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    coverImage: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("active", "inactive", "blocked"),
      allowNull: false,
      defaultValue: "active",
    },
    role: {
      type: DataTypes.ENUM("user", "admin"),
      allowNull: false,
      defaultValue: "user",
    },
    referralCode: {
      type: DataTypes.STRING(20),
      allowNull: true,
      unique: true,
    },
    referredBy: {
      type: DataTypes.STRING(50),
      allowNull: true,
      references: {
        model: "users",
        key: "id",
      },
    },
    credits: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 100, // Give new users 100 credits by default
      validate: {
        min: 0,
      },
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
    tableName: "users",
    timestamps: true,
    paranoid: true, // Enables soft deletes
    underscored: true, // This will convert camelCase to snake_case in DB
    hooks: {
      beforeValidate: async (user: User) => {
        // Generate ID if not provided (this runs before validation)
        if (!user.id) {
          user.id = User.generateUserId();
        }

        // Generate referral code if not provided
        if (!user.referralCode && user.firstName) {
          user.referralCode = user.generateReferralCode();
        }
      },
      beforeCreate: async (user: User) => {
        // Hash password before creating user
        if (user.password) {
          const salt = await bcrypt.genSalt(12); // Increased salt rounds for better security
          user.password = await bcrypt.hash(user.password, salt);
        }

        // Ensure ID exists (backup check)
        if (!user.id) {
          user.id = User.generateUserId();
        }

        // Ensure referral code exists (backup check)
        if (!user.referralCode && user.firstName) {
          user.referralCode = user.generateReferralCode();
        }
      },
      beforeUpdate: async (user: User) => {
        // Hash password if it has been modified
        if (user.changed("password") && user.password) {
          const salt = await bcrypt.genSalt(12);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeBulkCreate: async (users: User[]) => {
        // Handle bulk creation
        for (const user of users) {
          if (!user.id) {
            user.id = User.generateUserId();
          }
          if (!user.referralCode && user.firstName) {
            user.referralCode = user.generateReferralCode();
          }
          if (user.password) {
            const salt = await bcrypt.genSalt(12);
            user.password = await bcrypt.hash(user.password, salt);
          }
        }
      },
    },
    indexes: [
      {
        name: "users_id_idx",
        fields: ["id"],
        unique: true,
      },
      {
        name: "users_email_idx",
        fields: ["email"],
        unique: true,
      },
      {
        name: "users_status_idx",
        fields: ["status"],
      },
      {
        name: "users_referral_code_idx",
        fields: ["referral_code"],
        unique: true,
        where: {
          referral_code: {
            [Op.ne]: null,
          },
        },
      },
      {
        name: "users_credits_idx",
        fields: ["credits"],
      },
      {
        name: "users_email_verified_idx",
        fields: ["email_verified"],
      },
    ],
  },
);

export default User;
