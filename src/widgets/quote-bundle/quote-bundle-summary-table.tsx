'use client';

import { Card, CardContent } from "../../shared/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../shared/ui/table";
import { formatCurrency } from "../../shared/utils";

interface QuoteBundleSummaryTableProps {
    bundle: any; // Using any for now to bypass type strictness in emergency mode
    mode?: "BY_ROOM" | "BY_CATEGORY";
}

export function QuoteBundleSummaryTable({ bundle, mode = "BY_ROOM" }: QuoteBundleSummaryTableProps) {
    // Mock summary data structure extraction
    // In real implementation, we would aggregate `bundle.quotes.items`
    
    return (
        <Card className="glass-liquid border-white/40 shadow-sm mt-6">
            <CardContent className="p-0">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>{mode === "BY_ROOM" ? "Room" : "Category"}</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead className="text-right">Count</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                         <TableRow>
                            <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">
                                Summary data not available in recovery mode.
                            </TableCell>
                         </TableRow>
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
