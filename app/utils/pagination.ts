// Pagination related interfaces and utilities

/**
 * Pagination parameters interface
 */
export interface PaginationParams {
  page?: number | string;
  pageSize?: number | string;
  maxPageSize?: number;
}

/**
 * Pagination result metadata interface
 */
export interface PaginationMeta {
  totalItems: number;
  itemsPerPage: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/**
 * Calculate limit and offset for database queries
 * @param params Pagination parameters
 * @returns Object with limit and offset
 */
export const getPagination = ({
  page = 1,
  pageSize = 10,
  maxPageSize = 100,
}: PaginationParams): { limit: number; offset: number } => {
  // Ensure values are numbers
  const currentPage = Number(page) || 1;
  let size = Number(pageSize) || 10;

  // Ensure page size doesn't exceed maximum
  if (size > maxPageSize) {
    size = maxPageSize;
  }

  // Calculate limit and offset
  const limit = size;
  const offset = (currentPage - 1) * size;

  return { limit, offset };
};

/**
 * Generate pagination metadata
 * @param params Pagination parameters
 * @param totalItems Total number of items
 * @returns Pagination metadata
 */
export const getPaginationMetadata = (
  { page = 1, pageSize = 10 }: PaginationParams,
  totalItems: number,
): PaginationMeta => {
  const currentPage = Number(page);
  const itemsPerPage = Number(pageSize);
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  return {
    totalItems,
    itemsPerPage,
    currentPage,
    totalPages,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1,
  };
};

/**
 * Generate pagination links
 * @param baseUrl Base URL for links
 * @param pagination Pagination metadata
 * @param queryParams Additional query parameters
 * @returns Object with pagination links
 */
export const getPaginationLinks = (
  baseUrl: string,
  pagination: PaginationMeta,
  queryParams: Record<string, string | number> = {},
): Record<string, string> => {
  const { currentPage, totalPages } = pagination;
  const links: Record<string, string> = {};

  // Convert query params to URL query string
  const queryString = Object.entries(queryParams)
    .filter(([key]) => key !== "page" && key !== "pageSize")
    .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
    .join("&");

  // Base query with provided params
  const baseQuery = queryString ? `&${queryString}` : "";

  // Add pagination links
  links.self = `${baseUrl}?page=${currentPage}&pageSize=${pagination.itemsPerPage}${baseQuery}`;

  if (pagination.hasPrevPage) {
    links.prev = `${baseUrl}?page=${currentPage - 1}&pageSize=${pagination.itemsPerPage}${baseQuery}`;
  }

  if (pagination.hasNextPage) {
    links.next = `${baseUrl}?page=${currentPage + 1}&pageSize=${pagination.itemsPerPage}${baseQuery}`;
  }

  links.first = `${baseUrl}?page=1&pageSize=${pagination.itemsPerPage}${baseQuery}`;
  links.last = `${baseUrl}?page=${totalPages}&pageSize=${pagination.itemsPerPage}${baseQuery}`;

  return links;
};

/**
 * Validate and normalize pagination parameters
 * @param params Input pagination parameters
 * @param defaultPageSize Default page size
 * @param maxPageSize Maximum page size
 * @returns Normalized pagination parameters
 */
export const normalizePaginationParams = (
  params: PaginationParams,
  defaultPageSize: number = 10,
  maxPageSize: number = 100,
): { page: number; pageSize: number } => {
  let page = Number(params.page) || 1;
  let pageSize = Number(params.pageSize) || defaultPageSize;

  // Ensure positive values
  if (page < 1) page = 1;
  if (pageSize < 1) pageSize = defaultPageSize;

  // Cap page size to maximum
  if (pageSize > maxPageSize) pageSize = maxPageSize;

  return { page, pageSize };
};

export default {
  getPagination,
  getPaginationMetadata,
  getPaginationLinks,
  normalizePaginationParams,
};
