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