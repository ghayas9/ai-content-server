import { Model, DataTypes, Optional } from "sequelize";
import sequelize from "../config/database";
import User from "./user.models";
import { Op } from "sequelize";

// Define content types
export type TContentType = "generated" | "upload";
export type TMediaType = "image" | "video" | "audio";
export type TContentStatus = "pending" | "processing" | "completed" | "failed";

// Content attributes interface
interface ContentAttributes {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  type: TContentType;
  contentType: TMediaType;
  userId: string;
  prompt: string;
  url: string;
  thumbnailUrl: string | null;
  status: TContentStatus;
  isPrivate: boolean;
  metaTitle: string | null;
  metaDescription: string | null;
  metaKeywords: string | null;
  ogTitle: string | null;
  ogDescription: string | null;
  ogImage: string | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

// Attributes for content creation
interface ContentCreationAttributes
  extends Optional<
    ContentAttributes,
    | "id"
    | "slug"
    | "description"
    | "thumbnailUrl"
    | "status"
    | "isPrivate"
    | "metaTitle"
    | "metaDescription"
    | "metaKeywords"
    | "ogTitle"
    | "ogDescription"
    | "ogImage"
    | "createdAt"
    | "updatedAt"
    | "deletedAt"
  > {}

export class Content
  extends Model<ContentAttributes, ContentCreationAttributes>
  implements ContentAttributes
{
  public id!: string;
  public title!: string;
  public slug!: string;
  public description!: string | null;
  public type!: TContentType;
  public contentType!: TMediaType;
  public userId!: string;
  public prompt!: string;
  public url!: string;
  public thumbnailUrl!: string | null;
  public status!: TContentStatus;
  public isPrivate!: boolean;
  public metaTitle!: string | null;
  public metaDescription!: string | null;
  public metaKeywords!: string | null;
  public ogTitle!: string | null;
  public ogDescription!: string | null;
  public ogImage!: string | null;
  public createdAt!: Date;
  public updatedAt!: Date;
  public deletedAt!: Date | null;

  // Instance methods
  public generateSlug(): string {
    return this.title
      ?.toLowerCase()
      .replace(/[^a-z0-9 -]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  }

  public isPublic(): boolean {
    return !this.isPrivate;
  }

  public isCompleted(): boolean {
    return this.status === "completed";
  }

  public isProcessing(): boolean {
    return this.status === "processing";
  }

  public isFailed(): boolean {
    return this.status === "failed";
  }

  public isGenerated(): boolean {
    return this.type === "generated";
  }

  public isUpload(): boolean {
    return this.type === "upload";
  }

  public async markAsCompleted(): Promise<Content> {
    this.status = "completed";
    return this.save();
  }

  public async markAsProcessing(): Promise<Content> {
    this.status = "processing";
    return this.save();
  }

  public async markAsFailed(): Promise<Content> {
    this.status = "failed";
    return this.save();
  }

  public async makePublic(): Promise<Content> {
    this.isPrivate = false;
    return this.save();
  }

  public async makePrivate(): Promise<Content> {
    this.isPrivate = true;
    return this.save();
  }

  // Get SEO meta tags as object
  public getSEOTags(): object {
    return {
      title: this.metaTitle || this.title,
      description: this.metaDescription || this.description,
      keywords: this.metaKeywords,
      ogTitle: this.ogTitle || this.title,
      ogDescription: this.ogDescription || this.description,
      ogImage: this.ogImage || this.thumbnailUrl,
    };
  }

  // Generate custom ID
  public generateCustomId(): string {
    const typePrefix = this.contentType.toUpperCase().substring(0, 3);
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 6);
    return `${typePrefix}-${timestamp}-${random}`.toUpperCase();
  }
}

Content.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        len: [1, 255],
        notEmpty: true,
      },
    },
    slug: {
      type: DataTypes.STRING(300),
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    type: {
      type: DataTypes.ENUM("generated", "upload"),
      allowNull: false,
    },
    contentType: {
      type: DataTypes.ENUM("image", "video", "audio"),
      allowNull: false,
    },
    userId: {
      type: DataTypes.STRING(50),
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
    prompt: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    url: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notEmpty: true,
      },
    },
    thumbnailUrl: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("pending", "processing", "completed", "failed"),
      allowNull: false,
      defaultValue: "pending",
    },
    isPrivate: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    metaTitle: {
      type: DataTypes.STRING(60),
      allowNull: true,
      validate: {
        len: [0, 60],
      },
    },
    metaDescription: {
      type: DataTypes.STRING(160),
      allowNull: true,
      validate: {
        len: [0, 160],
      },
    },
    metaKeywords: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    ogTitle: {
      type: DataTypes.STRING(60),
      allowNull: true,
      validate: {
        len: [0, 60],
      },
    },
    ogDescription: {
      type: DataTypes.STRING(160),
      allowNull: true,
      validate: {
        len: [0, 160],
      },
    },
    ogImage: {
      type: DataTypes.TEXT,
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
    tableName: "contents",
    timestamps: true,
    paranoid: true, // Enables soft deletes
    underscored: true, // This will convert camelCase to snake_case in DB
    hooks: {
      beforeValidate: async (content: Content) => {
        // Generate slug if not provided
        if (!content.slug) {
          content.slug = content.generateSlug();

          // Ensure slug is unique
          let counter = 1;
          let originalSlug = content.slug;
          while (await Content.findOne({ where: { slug: content.slug } })) {
            content.slug = `${originalSlug}-${counter}`;
            counter++;
          }
        }

        // Set default meta tags if not provided
        if (!content.metaTitle) {
          content.metaTitle = content.title;
        }
        if (!content.metaDescription && content.description) {
          content.metaDescription = content.description.substring(0, 160);
        }
        if (!content.ogTitle) {
          content.ogTitle = content.title;
        }
        if (!content.ogDescription && content.description) {
          content.ogDescription = content.description.substring(0, 160);
        }
      },
      beforeUpdate: async (content: Content) => {
        // Update slug if title changed
        if (content.changed("title") && !content.changed("slug")) {
          content.slug = content.generateSlug();

          // Ensure slug is unique
          let counter = 1;
          let originalSlug = content.slug;
          while (
            await Content.findOne({
              where: {
                slug: content.slug,
                id: { [Op.ne]: content.id },
              },
            })
          ) {
            content.slug = `${originalSlug}-${counter}`;
            counter++;
          }
        }
      },
    },
    indexes: [
      {
        name: "contents_slug_idx",
        fields: ["slug"],
        unique: true,
      },
      {
        name: "contents_user_id_idx",
        fields: ["user_id"],
      },
      {
        name: "contents_type_idx",
        fields: ["type"],
      },
      {
        name: "contents_content_type_idx",
        fields: ["content_type"],
      },
      {
        name: "contents_status_idx",
        fields: ["status"],
      },
      {
        name: "contents_is_private_idx",
        fields: ["is_private"],
      },
      {
        name: "contents_created_at_idx",
        fields: ["created_at"],
      },
    ],
  },
);

// Define associations
Content.belongsTo(User, {
  foreignKey: "userId",
  as: "user",
});

User.hasMany(Content, {
  foreignKey: "userId",
  as: "contents",
});

export default Content;
