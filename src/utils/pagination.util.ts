export interface PaginationParams {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
}

export interface PaginatedResponse<T> {
    data: T[];
    meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasNext: boolean;
        hasPrevious: boolean;
    };
}

export function createPaginatedResponse<T>(
    data: T[],
    total: number,
    params: PaginationParams
): PaginatedResponse<T> {
    const page = params.page || 1;
    const limit = params.limit || 10;
    const totalPages = Math.ceil(total / limit);

    return {
        data,
        meta: {
            total,
            page,
            limit,
            totalPages,
            hasNext: page < totalPages,
            hasPrevious: page > 1,
        },
    };
}
