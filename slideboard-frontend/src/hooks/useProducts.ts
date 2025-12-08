import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { productsService, Product } from '@/services/products.client';

import { useRealtimeSubscription } from './useRealtimeSubscription'

export function useProducts() {
    const queryClient = useQueryClient();
    const queryKey = ['products'];

    // Fetch Products
    const query = useQuery({
        queryKey,
        queryFn: () => productsService.getAllProducts(),
        staleTime: 60 * 1000, // 1 minute
        gcTime: 5 * 60 * 1000, // 5 minutes
    });

    useRealtimeSubscription({
        table: 'products',
        event: '*',
        channelName: 'products:list',
        handler: () => {
            queryClient.invalidateQueries({ queryKey })
        }
    })

    // Create Product
    const createMutation = useMutation({
        mutationFn: (data: Partial<Product>) => productsService.createProduct(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey });
        },
    });

    // Update Product
    const updateMutation = useMutation({
        mutationFn: ({ id, data }: { id: string; data: Partial<Product> }) =>
            productsService.updateProduct(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey });
        },
    });

    // Delete Product
    const deleteMutation = useMutation({
        mutationFn: (id: string) => productsService.deleteProduct(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey });
        },
    });

    return {
        ...query,
        products: query.data || [],
        createProduct: createMutation.mutateAsync,
        updateProduct: updateMutation.mutateAsync,
        deleteProduct: deleteMutation.mutateAsync,
        isCreating: createMutation.isPending,
        isUpdating: updateMutation.isPending,
        isDeleting: deleteMutation.isPending,
    };
}

export function useProduct(id: string) {
    // const queryClient = useQueryClient();
    const queryKey = ['product', id];

    const query = useQuery({
        queryKey,
        queryFn: () => productsService.getProductById(id),
        enabled: !!id,
        staleTime: 30 * 60 * 1000, // 30 minutes for product details
        gcTime: 60 * 60 * 1000, // 1 hour
    });

    const queryClient = useQueryClient();
    useRealtimeSubscription({
        table: 'products',
        event: '*',
        filter: id ? `id=eq.${id}` : undefined,
        channelName: id ? `products:${id}` : 'products:detail',
        handler: () => {
            queryClient.invalidateQueries({ queryKey })
        }
    })

    return {
        ...query,
        product: query.data,
    };
}

export function useProductCategories() {
    return useQuery({
        queryKey: ['productCategories'],
        queryFn: () => productsService.getProductCategories(),
        staleTime: Infinity, // Categories rarely change
    });
}
