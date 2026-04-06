// hooks/usePaginatedData.ts
import { useState, useEffect, useCallback } from 'react';
import { authFetch, AuthFetchError } from '../api/apiAuth'; // Ajuste o caminho conforme necessário
// import { useTranslation } from 'react-i18next'; // REMOVIDO

export interface PageableResponse<T> {
    content: T[];
    pageable: {
        page_number: number;
        page_size: number;
        sort: {
            sorted: boolean;
            unsorted: boolean;
            empty: boolean;
        };
        offset: number;
        paged: boolean;
        unpaged: boolean;
    };
    total_elements: number;
    total_pages: number;
    last: boolean;
    size: number;
    number: number;
    sort: {
        sorted: boolean;
        unsorted: boolean;
        empty: boolean;
    };
    first: boolean;
    number_of_elements: number;
    empty: boolean;
}

interface UsePaginatedDataOptions {
    initialPage?: number;
    initialPageSize?: number;
}

interface UsePaginatedDataResult<T> {
    data: T[];
    loading: boolean;
    error: string | null;
    currentPage: number;
    pageSize: number;
    totalElements: number;
    totalPages: number;
    setCurrentPage: (page: number) => void;
    setPageSize: (size: number) => void;
    refetch: () => void;
}

export function usePaginatedData<T>(
    endpoint: string,
    dependencies: React.DependencyList = [],
    options?: UsePaginatedDataOptions
): UsePaginatedDataResult<T> {
    // const { t } = useTranslation(); // REMOVIDO
    const [data, setData] = useState<T[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [currentPage, setCurrentPage] = useState(options?.initialPage ?? 0);
    const [pageSize, setPageSize] = useState(options?.initialPageSize ?? 10);
    const [totalElements, setTotalElements] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const fetchData = useCallback(async () => {
        if (!endpoint) {
            console.warn("usePaginatedData: Endpoint URL is empty. Skipping data fetch.");
            setData([]);
            setTotalElements(0);
            setTotalPages(0);
            return;
        }

        setLoading(true);
        setError(null);
        try {
            const url = `${endpoint}?page=${currentPage}&size=${pageSize}`;

            const response = await authFetch<PageableResponse<T>>(url);

            if (response && Array.isArray(response.content)) {
                setData(response.content);
                setTotalElements(response.total_elements);
                setTotalPages(response.total_pages);
                setCurrentPage(response.number);
                setPageSize(response.size);
            } else {
                console.warn(`usePaginatedData: API response for ${endpoint} did not contain an array 'content':`, response);
                setData([]);
                setTotalElements(0);
                setTotalPages(0);
            }
        } catch (err: any) {
            console.error(`usePaginatedData: Error fetching data from ${endpoint}:`, err);
            if (err instanceof AuthFetchError) {
                setError(err.message || 'Failed to fetch data.'); // String literal
            } else {
                setError('An unexpected error occurred.'); // String literal
            }
            setData([]);
            setTotalElements(0);
            setTotalPages(0);
        } finally {
            setLoading(false);
        }
    }, [endpoint, currentPage, pageSize, ...dependencies]); // 't' REMOVIDO das dependências

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const refetch = useCallback(() => {
        fetchData();
    }, [fetchData]);

    return {
        data,
        loading,
        error,
        currentPage,
        pageSize,
        totalElements,
        totalPages,
        setCurrentPage,
        setPageSize,
        refetch,
    };
}