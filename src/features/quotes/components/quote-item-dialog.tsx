'use client';

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Label } from '@/shared/ui/label';
import { Input } from '@/shared/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/shared/ui/tabs'; // Using Tabs for Category? Or just Select.
import { getProducts } from '@/features/products/actions/queries';
import { createQuoteItem } from '@/features/quotes/actions/mutations';
import { toast } from 'sonner';
import { Check, ChevronsUpDown, Search } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/shared/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";

interface QuoteItemDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    quoteId: string;
    roomId?: string | null;
    onSuccess?: () => void;
}

export function QuoteItemDialog({ open, onOpenChange, quoteId, roomId, onSuccess }: QuoteItemDialogProps) {
    const [category, setCategory] = useState<string>('CURTAIN');
    const [selectedProduct, setSelectedProduct] = useState<any>(null);
    const [productOpen, setProductOpen] = useState(false);
    const [products, setProducts] = useState<any[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loadingProducts, setLoadingProducts] = useState(false);

    // Form State
    const [quantity, setQuantity] = useState<number>(1);
    const [width, setWidth] = useState<number>(0);
    const [height, setHeight] = useState<number>(0);
    const [foldRatio, setFoldRatio] = useState<number>(2.0);
    const [remark, setRemark] = useState('');

    // Load products on search or category change
    useEffect(() => {
        if (!open) return;
        const fetchProducts = async () => {
            setLoadingProducts(true);
            try {
                const res = await getProducts({
                    page: 1,
                    pageSize: 20,
                    category: category as any,
                    search: searchQuery,
                    isActive: true
                });
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                setProducts((res?.data ?? []) as any[]);
            } catch (err) {
                console.error(err);
                toast.error("Failed to load products");
            } finally {
                setLoadingProducts(false);
            }
        };

        const timeout = setTimeout(fetchProducts, 300);
        return () => clearTimeout(timeout);
    }, [searchQuery, category, open]);

    const handleSubmit = async () => {
        if (!selectedProduct) {
            toast.error("Please select a product");
            return;
        }

        try {
            await createQuoteItem({
                quoteId,
                roomId: roomId || undefined,
                category: category as any,
                productId: selectedProduct.id,
                productName: selectedProduct.name,
                unitPrice: Number(selectedProduct.retailPrice || selectedProduct.unitPrice || 0),
                quantity,
                width,
                height,
                foldRatio: category === 'CURTAIN' ? foldRatio : undefined,
                remark,
                attributes: {
                    ...selectedProduct.specs,
                    productImage: selectedProduct.images?.[0]
                }
            });
            toast.success("Item added successfully");
            onOpenChange(false);
            if (onSuccess) onSuccess();

            // Reset form
            setSelectedProduct(null);
            setWidth(0);
            setHeight(0);
            setQuantity(1);
        } catch (error) {
            console.error(error);
            toast.error("Failed to add item");
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>添加报价项 (Add Item)</DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {/* Category Selection */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="category" className="text-right">品类</Label>
                        <Select value={category} onValueChange={(val) => {
                            setCategory(val);
                            setSelectedProduct(null);
                        }}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select Category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="CURTAIN">窗帘 (Curtain)</SelectItem>
                                <SelectItem value="WALLPAPER">墙纸 (Wallpaper)</SelectItem>
                                <SelectItem value="WALLCLOTH">墙布 (Wallcloth)</SelectItem>
                                <SelectItem value="ACCESSORY">附件 (Accessory)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Product Selection (Combobox) */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">产品</Label>
                        <div className="col-span-3">
                            <Popover open={productOpen} onOpenChange={setProductOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        aria-expanded={productOpen}
                                        className="w-full justify-between"
                                    >
                                        {selectedProduct ? selectedProduct.name : "Select product..."}
                                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[400px] p-0" align="start">
                                    <Command shouldFilter={false}>
                                        <CommandInput
                                            placeholder="Search product..."
                                            value={searchQuery}
                                            onValueChange={setSearchQuery}
                                        />
                                        <CommandList>
                                            {loadingProducts && <CommandItem>Loading...</CommandItem>}
                                            {!loadingProducts && products.length === 0 && <CommandEmpty>No products found.</CommandEmpty>}
                                            {products.map((product) => (
                                                <CommandItem
                                                    key={product.id}
                                                    value={product.id}
                                                    onSelect={() => {
                                                        setSelectedProduct(product);
                                                        setProductOpen(false);
                                                        // Auto-fill defaults if any
                                                        if (product.defaultFoldRatio) setFoldRatio(Number(product.defaultFoldRatio));
                                                    }}
                                                >
                                                    <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            selectedProduct?.id === product.id ? "opacity-100" : "opacity-0"
                                                        )}
                                                    />
                                                    <div className="flex flex-col">
                                                        <span>{product.name}</span>
                                                        <span className="text-xs text-muted-foreground">{product.sku}</span>
                                                    </div>
                                                </CommandItem>
                                            ))}
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    {/* Dynamic Fields based on Category */}
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">宽度 (cm)</Label>
                        <Input
                            type="number"
                            className="col-span-3"
                            value={width}
                            onChange={(e) => setWidth(Number(e.target.value))}
                        />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">高度 (cm)</Label>
                        <Input
                            type="number"
                            className="col-span-3"
                            value={height}
                            onChange={(e) => setHeight(Number(e.target.value))}
                        />
                    </div>

                    {category === 'CURTAIN' && (
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">褶皱倍数</Label>
                            <Input
                                type="number"
                                className="col-span-3"
                                value={foldRatio}
                                step="0.1"
                                onChange={(e) => setFoldRatio(Number(e.target.value))}
                            />
                        </div>
                    )}

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">数量</Label>
                        <Input
                            type="number"
                            className="col-span-3"
                            value={quantity}
                            onChange={(e) => setQuantity(Number(e.target.value))}
                        />
                    </div>

                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">备注</Label>
                        <Input
                            className="col-span-3"
                            value={remark}
                            onChange={(e) => setRemark(e.target.value)}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSubmit}>Add Item</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
